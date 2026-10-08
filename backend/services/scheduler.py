import time
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor

from ortools.sat.python import cp_model
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models import (
    Class,
    ClassSubject,
    DayOfWeek,
    Filiere,
    Room,
    RoomType,
    Subject,
    Teacher,
    TeacherSubject,
    TeacherUnavailability,
)

executor = ThreadPoolExecutor(max_workers=4)

DAYS = list(DayOfWeek)
PERIODS = range(4)


# =========================================================
# PUBLIC API
# =========================================================

async def generate_schedule(db: AsyncSession, academic_year_id: int) -> dict:

    data = await _load_data(db)

    import asyncio

    loop = asyncio.get_running_loop()

    return await loop.run_in_executor(
        executor,
        _solve_sync,
        data,
        academic_year_id,
    )


# =========================================================
# LOAD DATABASE
# =========================================================

async def _load_data(db: AsyncSession) -> dict:

    return {
        "classes": list((
            await db.scalars(
                select(Class).options(
                    selectinload(Class.filiere)
                    .selectinload(Filiere.class_subjects)
                )
            )
        ).all()),

        "class_subjects": list((
            await db.scalars(select(ClassSubject))
        ).all()),

        "subjects": list((
            await db.scalars(select(Subject))
        ).all()),

        "rooms": list((
            await db.scalars(select(Room))
        ).all()),

        "teachers": list((
            await db.scalars(select(Teacher))
        ).all()),

        "teacher_subjects": list((
            await db.scalars(select(TeacherSubject))
        ).all()),

        "unavailable": list((
            await db.scalars(select(TeacherUnavailability))
        ).all()),
    }


# =========================================================
# ROOM VALIDATION
# =========================================================

def _room_ok(room: Room, subject: Subject, klass: Class) -> bool:

    if room.capacity < klass.student_count:
        return False

    if subject.requires_gym:
        return room.room_type == RoomType.gym

    if subject.code == "INFO":
        return room.room_type == RoomType.computer

    if subject.requires_lab:
        return room.room_type in (RoomType.normal, RoomType.lab)

    return room.room_type == RoomType.normal


# =========================================================
# FIND ROOM AFTER SOLVING
# =========================================================

def _find_room(
    rooms,
    used_rooms,
    subject,
    klass,
    day,
    period,
):

    for room in rooms:

        if not _room_ok(room, subject, klass):
            continue

        if (room.id, day, period) in used_rooms:
            continue

        return room

    return None


# =========================================================
# SOLVER
# =========================================================

def _solve_sync(data: dict, academic_year_id: int) -> dict:

    total_start = time.perf_counter()

    print("\n========== SCHEDULER START ==========")

    # =====================================================
    # PREPARE DATA
    # =====================================================

    start = time.perf_counter()

    subjects_map = {
        s.id: s
        for s in data["subjects"]
    }

    teachers_by_subject: dict[int, list[int]] = {}

    for ts in data["teacher_subjects"]:

        teachers_by_subject.setdefault(
            ts.subject_id,
            []
        ).append(ts.teacher_id)

    blocked = {
        (u.teacher_id, u.day, p)
        for u in data["unavailable"]
        for p in range(u.period_start, u.period_end + 1)
    }

    cs_by_filiere: dict[int, list[ClassSubject]] = {}

    for cs in data["class_subjects"]:

        cs_by_filiere.setdefault(
            cs.filiere_id,
            []
        ).append(cs)

    print(f"[DEBUG] prepare data: {time.perf_counter() - start:.2f}s")

    # =====================================================
    # PRECHECK
    # =====================================================

    missing = sorted({
        subjects_map[cs.subject_id].code
        for klass in data["classes"]
        for cs in cs_by_filiere.get(klass.filiere_id, [])
        if not teachers_by_subject.get(cs.subject_id)
    })

    if missing:
        return {
            "status": "INFEASIBLE",
            "solve_time_seconds": round(time.perf_counter() - total_start, 3),
            "num_slots": 0,
            "conflicts": [
                {
                    "detail": f"No teacher for: {', '.join(missing)}"
                }
            ],
            "slots": [],
        }

    # =====================================================
    # MODEL
    # =====================================================

    model = cp_model.CpModel()

    # =====================================================
    # VARIABLES
    # =====================================================

    start = time.perf_counter()

    x = {}

    by_teacher = defaultdict(list)
    by_class = defaultdict(list)
    by_class_subject = defaultdict(list)
    by_teacher_week = defaultdict(list)

    variable_count = 0

    # IMPORTANT:
    # NO ROOM DIMENSION HERE
    # HUGE PERFORMANCE BOOST

    for klass in data["classes"]:

        for cs in cs_by_filiere.get(klass.filiere_id, []):

            subject = subjects_map[cs.subject_id]

            teachers = teachers_by_subject.get(subject.id, [])

            for teacher_id in teachers:

                for day in DAYS:

                    for period in PERIODS:

                        if (teacher_id, day, period) in blocked:
                            continue

                        key = (
                            klass.id,
                            subject.id,
                            teacher_id,
                            day,
                            period,
                        )

                        var = model.new_bool_var(
                            f"x_{klass.id}_{subject.id}_{teacher_id}_{day.value}_{period}"
                        )

                        x[key] = var

                        by_teacher[(teacher_id, day, period)].append(var)

                        by_class[(klass.id, day, period)].append(var)

                        by_class_subject[(klass.id, subject.id)].append(var)

                        by_teacher_week[teacher_id].append(var)

                        variable_count += 1

    print(f"[DEBUG] variables creation: {time.perf_counter() - start:.2f}s")

    print(f"[DEBUG] variables count: {variable_count}")

    if not x:

        return {
            "status": "INFEASIBLE",
            "solve_time_seconds": round(time.perf_counter() - total_start, 3),
            "num_slots": 0,
            "conflicts": [
                {
                    "detail": "No valid combinations"
                }
            ],
            "slots": [],
        }

    # =====================================================
    # CONSTRAINTS
    # =====================================================

    start = time.perf_counter()

    # -----------------------------------------------------
    # C1: exact slots
    # -----------------------------------------------------

    for klass in data["classes"]:

        for cs in cs_by_filiere.get(klass.filiere_id, []):

            needed = (cs.hours_per_week + 1) // 2

            vs = by_class_subject[(klass.id, cs.subject_id)]

            if vs:
                model.add(sum(vs) == needed)

    # -----------------------------------------------------
    # C2: teacher conflict
    # -----------------------------------------------------

    for teacher in data["teachers"]:

        for day in DAYS:

            for period in PERIODS:

                vs = by_teacher[(teacher.id, day, period)]

                if vs:
                    model.add(sum(vs) <= 1)

    # -----------------------------------------------------
    # C3: class conflict
    # -----------------------------------------------------

    for klass in data["classes"]:

        for day in DAYS:

            for period in PERIODS:

                vs = by_class[(klass.id, day, period)]

                if vs:
                    model.add(sum(vs) <= 1)

    # -----------------------------------------------------
    # C4: teacher max weekly load
    # -----------------------------------------------------

    for teacher in data["teachers"]:

        vs = by_teacher_week[teacher.id]

        if vs:
            model.add(sum(vs) * 2 <= teacher.max_hours_week + 4)

    print(f"[DEBUG] constraints: {time.perf_counter() - start:.2f}s")

    # =====================================================
    # SOLVER
    # =====================================================

    start = time.perf_counter()

    solver = cp_model.CpSolver()

    solver.parameters.max_time_in_seconds = 20

    solver.parameters.stop_after_first_solution = True

    solver.parameters.num_search_workers = 8

    solver.parameters.log_search_progress = False

    status = solver.solve(model)

    solve_time = time.perf_counter() - start

    elapsed = round(time.perf_counter() - total_start, 3)

    status_name = solver.status_name(status)

    print(f"[DEBUG] solve: {solve_time:.2f}s")

    print(f"[Scheduler] status={status_name} time={elapsed}s")

    # =====================================================
    # SUCCESS
    # =====================================================

    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):

        used_rooms = set()

        slots = []

        for k, v in x.items():

            if not solver.boolean_value(v):
                continue

            klass_id = k[0]
            subject_id = k[1]
            teacher_id = k[2]
            day = k[3]
            period = k[4]

            klass = next(
                c for c in data["classes"]
                if c.id == klass_id
            )

            subject = subjects_map[subject_id]

            room = _find_room(
                data["rooms"],
                used_rooms,
                subject,
                klass,
                day,
                period,
            )

            if room is None:
                continue

            used_rooms.add((room.id, day, period))

            slots.append({
                "class_id": klass_id,
                "subject_id": subject_id,
                "teacher_id": teacher_id,
                "room_id": room.id,
                "day": day.value,
                "period": period,
            })

        print(f"[DEBUG] TOTAL: {elapsed}s")

        print("========== SCHEDULER END ==========\n")

        return {
            "status": status_name,
            "solve_time_seconds": elapsed,
            "num_slots": len(slots),
            "conflicts": [],
            "slots": slots,
        }

    # =====================================================
    # FAILURE
    # =====================================================

    return {
        "status": status_name,
        "solve_time_seconds": elapsed,
        "num_slots": 0,
        "conflicts": [
            {
                "detail": "Solver timeout or infeasible"
            }
        ],
        "slots": [],
    }