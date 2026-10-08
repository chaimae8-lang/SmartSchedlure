import asyncio

from sqlalchemy import delete

from auth.jwt import get_password_hash
from database import AsyncSessionLocal, Base, engine
from models import (
    AcademicYear,
    Class,
    ClassSubject,
    DayOfWeek,
    Filiere,
    Niveau,
    Room,
    RoomType,
    Subject,
    Teacher,
    TeacherSubject,
    TeacherType,
    TeacherUnavailability,
)
from models.user import User


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncSessionLocal() as db:
        for table in [
            TeacherUnavailability, TeacherSubject, ClassSubject,
            Class, Teacher, Room, Filiere, Subject, AcademicYear, User,
        ]:
            await db.execute(delete(table))

        # ── Academic year ─────────────────────────────────────────────────────
        year = AcademicYear(label="2025-2026", is_active=True)
        db.add(year)

        # ── Subjects ──────────────────────────────────────────────────────────
        subjects_data = [
            ("MATH", "Mathématiques",       False, False, 7),
            ("PHYS", "Physique-Chimie",      True,  False, 5),
            ("SVT",  "Sciences de la vie",   True,  False, 5),
            ("ARAB", "Langue Arabe",         False, False, 4),
            ("FR",   "Langue Française",     False, False, 3),
            ("ANG",  "Langue Anglaise",      False, False, 2),
            ("HIST", "Histoire-Géo",         False, False, 3),
            ("PHIL", "Philosophie",          False, False, 2),
            ("INFO", "Informatique",         True,  False, 2),
            ("ISL",  "Éducation Islamique",  False, False, 2),
            ("EPS",  "Éducation Physique",   False, True,  2),
        ]
        subjects = {
            code: Subject(
                code=code, name=name,
                requires_lab=lab, requires_gym=gym,
                coefficient=coeff,
            )
            for code, name, lab, gym, coeff in subjects_data
        }
        db.add_all(subjects.values())
        await db.flush()

        # ── Rooms ─────────────────────────────────────────────────────────────
        db.add_all([
            Room(name=f"S{i}", capacity=40, room_type=RoomType.normal, max_daily_uses=99)
            for i in range(101, 119)
        ])
        db.add_all([
            Room(name="LABO1",   capacity=24,  room_type=RoomType.lab,      max_daily_uses=4),
            Room(name="SINFO1",  capacity=30,  room_type=RoomType.computer, max_daily_uses=4),
            Room(name="SINFO2",  capacity=30,  room_type=RoomType.computer, max_daily_uses=4),
            Room(name="DESSIN",  capacity=35,  room_type=RoomType.drawing,  max_daily_uses=3),
            Room(name="TERRAIN", capacity=100, room_type=RoomType.gym,      max_daily_uses=6),
        ])

        # ── Filieres + hours per week ─────────────────────────────────────────
        # Hours reduced to be realistic and solvable
        # Total needed: ~172h/week across 10 classes
        filiere_hours = {
            "TC-S": ("Tronc Commun Sciences",    Niveau.tronc_commun, {
                "MATH": 4, "PHYS": 2, "ARAB": 4,
                "FR": 2,   "ANG": 2,  "HIST": 2,
                "ISL": 2,  "EPS": 2,
            }),
            "1SM": ("Sciences Mathématiques",    Niveau.premiere_bac, {
                "MATH": 4, "PHYS": 4, "ARAB": 4,
                "FR": 2,   "ANG": 2,  "PHIL": 2,
                "ISL": 2,  "EPS": 2,
            }),
            "1SVT": ("Sciences de la Vie",       Niveau.premiere_bac, {
                "MATH": 4, "PHYS": 2, "SVT": 4,
                "ARAB": 4, "FR": 2,   "ANG": 2,
                "PHIL": 2, "EPS": 2,
            }),
            "2SP": ("Sciences Physiques",        Niveau.deuxieme_bac, {
                "MATH": 4, "PHYS": 4, "SVT": 4,
                "ARAB": 2, "FR": 2,   "ANG": 2,
                "PHIL": 2, "EPS": 2,
            }),
            "2SM": ("Sciences Mathématiques B",  Niveau.deuxieme_bac, {
                "MATH": 6, "PHYS": 4, "ARAB": 2,
                "FR": 2,   "ANG": 2,  "PHIL": 2,
                "EPS": 2,
            }),
            "2LO": ("Lettres et Options",        Niveau.deuxieme_bac, {
                "ARAB": 6, "FR": 4,   "ANG": 4,
                "HIST": 4, "PHIL": 4, "ISL": 2,
                "EPS": 2,
            }),
        }

        filieres = {}
        for code, (name, niveau, hours) in filiere_hours.items():
            filiere = Filiere(code=code, name=name, niveau=niveau)
            filieres[code] = filiere
            db.add(filiere)
            await db.flush()
            db.add_all([
                ClassSubject(
                    filiere_id=filiere.id,
                    subject_id=subjects[subj].id,
                    hours_per_week=h,
                )
                for subj, h in hours.items()
            ])

        # ── Teachers ──────────────────────────────────────────────────────────
        #
        # Hours needed per subject (10 classes):
        #   MATH : 4×3 + 4×2 + 4×2 + 4 + 6 + 0  = 12+8+8+4+6   = 38h
        #   PHYS : 2×3 + 4×2 + 2×2 + 4 + 4 + 0  = 6+8+4+4+4    = 26h
        #   SVT  : 0   + 0   + 4×2 + 4 + 0 + 0  = 8+4           = 12h
        #   ARAB : 4×3 + 4×2 + 4×2 + 2 + 2 + 6  = 12+8+8+2+2+6 = 38h
        #   FR   : 2×3 + 2×2 + 2×2 + 2 + 2 + 4  = 6+4+4+2+2+4  = 22h
        #   ANG  : 2×3 + 2×2 + 2×2 + 2 + 2 + 4  = 6+4+4+2+2+4  = 22h
        #   HIST : 2×3 + 0   + 0   + 0 + 0 + 4  = 6+4           = 10h
        #   PHIL : 0   + 2×2 + 2×2 + 2 + 2 + 4  = 4+4+2+2+4    = 16h
        #   INFO : 0 (no filiere has INFO — assigned manually if needed)
        #   ISL  : 2×3 + 2×2 + 0   + 0 + 0 + 2  = 6+4+2         = 12h
        #   EPS  : 2×10 classes                                   = 20h
        #   TOTAL: 216h  →  need capacity >= 216h
        #
        # Teacher capacity below: ~270h  ✅

        teacher_specs = [
            # (first, last, type, max_h/week, subjects, unavailabilities)

            # MATH — needs 38h total
            ("Rachid",         "Ouali",      TeacherType.titulaire, 22, ["MATH"],
             [(DayOfWeek.wednesday, 0, 1, "Enfants école")]),
            ("Amina",          "Chraibi",    TeacherType.titulaire, 20, ["MATH", "INFO"],   []),
            ("Omar",           "Benali",     TeacherType.vacataire, 18, ["MATH"],            []),
            ("Karim",          "Ziani",      TeacherType.vacataire, 16, ["MATH"],            []),

            # PHYS — needs 26h total
            ("Khadija",        "Ait Said",   TeacherType.titulaire, 20, ["PHYS"],
             [(DayOfWeek.monday, 0, 0, "Réunion inspection")]),
            ("Fatima Ezzahra", "Idrissi",    TeacherType.titulaire, 20, ["PHYS", "SVT"],    []),
            ("Laila",          "Tazi",       TeacherType.vacataire, 16, ["PHYS"],            []),

            # SVT — needs 12h total (covered by Fatima + Youssef)
            ("Youssef",        "Tahiri",     TeacherType.titulaire, 18, ["SVT"],
             [(DayOfWeek.tuesday, 2, 2, None)]),
            ("Houda",          "Rmili",      TeacherType.vacataire, 14, ["SVT"],             []),

            # ARAB — needs 38h total
            ("Hassan",         "Filali",     TeacherType.titulaire, 24, ["ARAB"],            []),
            ("Maryam",         "Alaoui",     TeacherType.titulaire, 20, ["ISL", "ARAB"],     []),
            ("Ahmed",          "Sebti",      TeacherType.vacataire, 18, ["ARAB", "ISL"],     []),

            # FR + ANG — needs 22h each
            ("Nadia",          "Berrada",    TeacherType.vacataire, 20, ["FR", "ANG"],
             [(DayOfWeek.saturday, 2, 3, None)]),
            ("Souad",          "Chakir",     TeacherType.vacataire, 20, ["FR", "ANG"],       []),

            # HIST + PHIL — needs 10h + 16h
            ("Khalid",         "Mansouri",   TeacherType.titulaire, 24, ["HIST", "PHIL"],    []),
            ("Driss",          "Lamrani",    TeacherType.vacataire, 18, ["PHIL", "HIST"],    []),

            # EPS — needs 20h (10 classes × 2h)
            ("Mourad",         "Benjelloun", TeacherType.titulaire, 24, ["EPS"],             []),
        ]

        for first, last, ttype, maxh, subj_codes, unavailable in teacher_specs:
            teacher = Teacher(
                first_name=first,
                last_name=last,
                teacher_type=ttype,
                max_hours_week=maxh,
                max_hours_day=8,
            )
            db.add(teacher)
            await db.flush()
            db.add_all([
                TeacherSubject(
                    teacher_id=teacher.id,
                    subject_id=subjects[code].id,
                )
                for code in subj_codes
            ])
            db.add_all([
                TeacherUnavailability(
                    teacher_id=teacher.id,
                    day=day,
                    period_start=ps,
                    period_end=pe,
                    reason=reason,
                )
                for day, ps, pe, reason in unavailable
            ])

        # ── Classes ───────────────────────────────────────────────────────────
        classes = [
            ("TC-A",   "TC-S",  38),
            ("TC-B",   "TC-S",  38),
            ("TC-C",   "TC-S",  38),
            ("1SM-A",  "1SM",   35),
            ("1SM-B",  "1SM",   35),
            ("1SVT-A", "1SVT",  36),
            ("1SVT-B", "1SVT",  36),
            ("2SP-A",  "2SP",   33),
            ("2SM-A",  "2SM",   31),
            ("2LO-A",  "2LO",   37),
        ]
        db.add_all([
            Class(name=name, filiere_id=filieres[fil].id, student_count=count)
            for name, fil, count in classes
        ])

        # ── Admin user ────────────────────────────────────────────────────────
        db.add(User(
            username="admin",
            hashed_password=get_password_hash("alfarabi2025"),
            role="admin",
        ))

        await db.commit()

        # ── Summary ───────────────────────────────────────────────────────────
        total_capacity = sum(spec[3] for spec in teacher_specs)
        print("✅ Seed completed successfully!")
        print(f"   👨‍🏫 {len(teacher_specs)} teachers  ({total_capacity}h/week capacity)")
        print(f"   🏫 {len(classes)} classes    (~216h/week needed)")
        print(f"   🚪 23 rooms")
        print(f"   📚 11 subjects")
        print(f"   📊 Capacity buffer: {total_capacity - 216}h ({round((total_capacity-216)/216*100)}% headroom)")


if __name__ == "__main__":
    asyncio.run(seed())