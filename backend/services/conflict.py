from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.schedule import ScheduleSlot


async def conflicts_for_move(db: AsyncSession, slot: ScheduleSlot, day, period: int, room_id: int) -> list[dict]:
    conflicts: list[dict] = []
    checks = [
        ("class", ScheduleSlot.class_id == slot.class_id),
        ("teacher", ScheduleSlot.teacher_id == slot.teacher_id),
        ("room", ScheduleSlot.room_id == room_id),
    ]
    for kind, predicate in checks:
        existing = await db.scalar(
            select(ScheduleSlot).where(
                and_(
                    ScheduleSlot.id != slot.id,
                    ScheduleSlot.academic_year_id == slot.academic_year_id,
                    ScheduleSlot.day == day,
                    ScheduleSlot.period == period,
                    predicate,
                )
            )
        )
        if existing:
            conflicts.append({"type": kind, "slot_id": existing.id, "message": f"{kind} already booked"})
    return conflicts


async def list_conflicts(db: AsyncSession, academic_year_id: int) -> list[dict]:
    slots = (await db.scalars(select(ScheduleSlot).where(ScheduleSlot.academic_year_id == academic_year_id))).all()
    conflicts: list[dict] = []
    seen: dict[tuple, int] = {}
    for slot in slots:
        for kind, value in [("class", slot.class_id), ("teacher", slot.teacher_id), ("room", slot.room_id)]:
            key = (kind, value, slot.day, slot.period)
            if key in seen:
                conflicts.append({"type": kind, "slot_ids": [seen[key], slot.id], "day": slot.day, "period": slot.period})
            else:
                seen[key] = slot.id
    return conflicts
