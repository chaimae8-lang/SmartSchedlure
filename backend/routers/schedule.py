from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from auth.dependencies import get_current_user
from database import get_db
from models import Class, Room, ScheduleSlot, Teacher, TeacherUnavailability
from schemas.schedule import GenerateRequest, GenerateResult, MoveSlotRequest, ScheduleSlotRead
from services.conflict import conflicts_for_move, list_conflicts
from services.scheduler import generate_schedule

router = APIRouter(prefix="/schedule", tags=["schedule"], dependencies=[Depends(get_current_user)])
last_status: dict = {"status": "idle"}


def _slot_options():
    return [
        selectinload(ScheduleSlot.subject),
        selectinload(ScheduleSlot.room),
        selectinload(ScheduleSlot.teacher)
    ]


import time

@router.post("/generate", response_model=GenerateResult)
async def generate(payload: GenerateRequest, db: AsyncSession = Depends(get_db)):
    global last_status

    console_start = time.time()

    last_status = {"status": "running"}

    print("\n========== GENERATION START ==========")

    # =========================
    # GENERATOR
    # =========================
    start = time.time()

    result = await generate_schedule(db, payload.academic_year_id)

    print(f"[DEBUG] generate_schedule(): {time.time() - start:.2f}s")

    # =========================
    # DELETE OLD SLOTS
    # =========================
    start = time.time()

    if result.get("status") == "OPTIMAL" and result.get("slots"):

        await db.execute(
            delete(ScheduleSlot).where(
                ScheduleSlot.academic_year_id == payload.academic_year_id
            )
        )

        await db.commit()

        print(f"[DEBUG] delete old slots: {time.time() - start:.2f}s")

        # =========================
        # CREATE OBJECTS
        # =========================
        start = time.time()

        new_slots = [
            ScheduleSlot(
                academic_year_id=payload.academic_year_id,
                class_id=slot_data["class_id"],
                subject_id=slot_data["subject_id"],
                teacher_id=slot_data["teacher_id"],
                room_id=slot_data["room_id"],
                day=slot_data["day"],
                period=slot_data["period"],
            )
            for slot_data in result["slots"]
        ]

        print(f"[DEBUG] create slot objects: {time.time() - start:.2f}s")

        # =========================
        # SAVE DATABASE
        # =========================
        start = time.time()

        db.add_all(new_slots)

        try:
            await db.commit()

            print(f"[DEBUG] database save: {time.time() - start:.2f}s")
            print(f"✅ SUCCESS: Saved {len(new_slots)} slots")

        except Exception as exc:
            await db.rollback()
            print("❌ Save error:", exc)
            raise HTTPException(
                status_code=500,
                detail="Failed to save schedule"
            ) from exc

    print(f"[DEBUG] TOTAL: {time.time() - console_start:.2f}s")
    print("========== GENERATION END ==========\n")

    last_status = result

    return result


@router.get("/status")
async def status():
    return last_status


@router.get("/{year_id}")
async def by_year(year_id: int, db: AsyncSession = Depends(get_db)):
    slots = (await db.scalars(
        select(ScheduleSlot)
        .options(*_slot_options())
        .where(ScheduleSlot.academic_year_id == year_id)
    )).all()

    grouped = defaultdict(list)
    for slot in slots:
        # Extract names safely
        subject_code = getattr(slot.subject, 'code', None) or getattr(slot.subject, 'name', None) if slot.subject else None
        teacher_last_name = getattr(slot.teacher, 'last_name', None) or getattr(slot.teacher, 'name', None) if slot.teacher else None
        room_name = getattr(slot.room, 'name', None) if slot.room else None

        slot_data = {
            "id": slot.id,
            "class_id": slot.class_id,
            "subject_id": slot.subject_id,
            "teacher_id": slot.teacher_id,
            "room_id": slot.room_id,
            "day": slot.day,
            "period": slot.period,

            # Fields expected by CalendarView
            "subject": {
                "id": slot.subject_id,
                "code": subject_code,
                "name": subject_code
            } if subject_code else None,

            "teacher": {
                "id": slot.teacher_id,
                "last_name": teacher_last_name,
                "name": teacher_last_name,
                "full_name": teacher_last_name
            } if teacher_last_name else None,

            "room": {
                "id": slot.room_id,
                "name": room_name
            } if room_name else None,
        }
        grouped[str(slot.class_id)].append(slot_data)

    return grouped


@router.get("/{year_id}/class/{class_id}", response_model=list[ScheduleSlotRead])
async def by_class(year_id: int, class_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(ScheduleSlot).options(*_slot_options()).where(
        ScheduleSlot.academic_year_id == year_id, ScheduleSlot.class_id == class_id
    )
    return (await db.scalars(stmt)).all()


@router.get("/{year_id}/teacher/{teacher_id}", response_model=list[ScheduleSlotRead])
async def by_teacher(year_id: int, teacher_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(ScheduleSlot).options(*_slot_options()).where(
        ScheduleSlot.academic_year_id == year_id, ScheduleSlot.teacher_id == teacher_id
    )
    return (await db.scalars(stmt)).all()


@router.patch("/slot/{slot_id}", response_model=ScheduleSlotRead)
async def move_slot(slot_id: int, payload: MoveSlotRequest, db: AsyncSession = Depends(get_db)):
    slot = await db.scalar(select(ScheduleSlot).options(*_slot_options()).where(ScheduleSlot.id == slot_id))
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    if getattr(slot, 'is_locked', False):
        raise HTTPException(status_code=409, detail="Slot is locked")

    room = await db.get(Room, payload.room_id)
    klass = await db.get(Class, slot.class_id)

    if not room or not klass:
        raise HTTPException(status_code=404, detail="Room or class not found")
    if room.capacity < klass.student_count:
        raise HTTPException(status_code=409, detail="Room capacity is insufficient")

    blocked = await db.scalar(select(TeacherUnavailability).where(
        TeacherUnavailability.teacher_id == slot.teacher_id,
        TeacherUnavailability.day == payload.day,
        TeacherUnavailability.period_start <= payload.period,
        TeacherUnavailability.period_end >= payload.period
    ))
    if blocked:
        raise HTTPException(status_code=409, detail="Teacher is unavailable for this slot")

    conflicts = await conflicts_for_move(db, slot, payload.day, payload.period, payload.room_id)
    if conflicts:
        raise HTTPException(status_code=409, detail=str(conflicts))

    slot.day = payload.day
    slot.period = payload.period
    slot.room_id = payload.room_id
    await db.commit()
    return await db.scalar(select(ScheduleSlot).options(*_slot_options()).where(ScheduleSlot.id == slot_id))


@router.delete("/{year_id}")
async def clear_schedule(year_id: int, db: AsyncSession = Depends(get_db)):
    await db.execute(delete(ScheduleSlot).where(ScheduleSlot.academic_year_id == year_id))
    await db.commit()
    return {"detail": "Schedule cleared"}


@router.get("/{year_id}/conflicts")
async def conflicts(year_id: int, db: AsyncSession = Depends(get_db)):
    return await list_conflicts(db, year_id)