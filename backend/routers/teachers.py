from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from auth.dependencies import get_current_user
from database import get_db
from models import Teacher, TeacherSubject, TeacherUnavailability
from schemas.teacher import TeacherCreate, TeacherRead, TeacherUnavailabilityCreate, TeacherUnavailabilityRead

router = APIRouter(prefix="/teachers", tags=["teachers"], dependencies=[Depends(get_current_user)])


def _options():
    return [selectinload(Teacher.subjects).selectinload(TeacherSubject.subject), selectinload(Teacher.unavailability)]


@router.get("", response_model=list[TeacherRead])
async def list_teachers(db: AsyncSession = Depends(get_db)):
    return (await db.scalars(select(Teacher).options(*_options()).order_by(Teacher.last_name))).all()


@router.post("", response_model=TeacherRead)
async def create_teacher(payload: TeacherCreate, db: AsyncSession = Depends(get_db)):
    teacher = Teacher(**payload.model_dump(exclude={"subject_ids"}))
    teacher.subjects = [TeacherSubject(subject_id=sid) for sid in payload.subject_ids]
    db.add(teacher)
    await db.commit()
    return await db.scalar(select(Teacher).options(*_options()).where(Teacher.id == teacher.id))


@router.put("/{teacher_id}", response_model=TeacherRead)
async def update_teacher(teacher_id: int, payload: TeacherCreate, db: AsyncSession = Depends(get_db)):
    teacher = await db.scalar(select(Teacher).options(selectinload(Teacher.subjects)).where(Teacher.id == teacher_id))
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    for key, value in payload.model_dump(exclude={"subject_ids"}).items():
        setattr(teacher, key, value)
    teacher.subjects = [TeacherSubject(subject_id=sid) for sid in payload.subject_ids]
    await db.commit()
    return await db.scalar(select(Teacher).options(*_options()).where(Teacher.id == teacher_id))


@router.delete("/{teacher_id}")
async def delete_teacher(teacher_id: int, db: AsyncSession = Depends(get_db)):
    teacher = await db.get(Teacher, teacher_id)
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    await db.delete(teacher)
    await db.commit()
    return {"detail": "Teacher deleted"}


@router.post("/{teacher_id}/unavailability", response_model=TeacherUnavailabilityRead)
async def add_unavailability(teacher_id: int, payload: TeacherUnavailabilityCreate, db: AsyncSession = Depends(get_db)):
    if payload.period_end < payload.period_start:
        raise HTTPException(status_code=422, detail="period_end must be greater than or equal to period_start")
    if not await db.get(Teacher, teacher_id):
        raise HTTPException(status_code=404, detail="Teacher not found")
    item = TeacherUnavailability(teacher_id=teacher_id, **payload.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.delete("/{teacher_id}/unavailability/{uid}")
async def delete_unavailability(teacher_id: int, uid: int, db: AsyncSession = Depends(get_db)):
    item = await db.scalar(select(TeacherUnavailability).where(TeacherUnavailability.id == uid, TeacherUnavailability.teacher_id == teacher_id))
    if not item:
        raise HTTPException(status_code=404, detail="Unavailability not found")
    await db.delete(item)
    await db.commit()
    return {"detail": "Unavailability deleted"}
