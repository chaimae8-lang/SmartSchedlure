from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import get_current_user
from database import get_db
from models import Subject
from schemas.school import SubjectCreate, SubjectRead

router = APIRouter(prefix="/subjects", tags=["subjects"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=list[SubjectRead])
async def list_subjects(db: AsyncSession = Depends(get_db)):
    return (await db.scalars(select(Subject).order_by(Subject.code))).all()


@router.post("", response_model=SubjectRead)
async def create_subject(payload: SubjectCreate, db: AsyncSession = Depends(get_db)):
    item = Subject(**payload.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.put("/{subject_id}", response_model=SubjectRead)
async def update_subject(subject_id: int, payload: SubjectCreate, db: AsyncSession = Depends(get_db)):
    item = await db.get(Subject, subject_id)
    if not item:
        raise HTTPException(status_code=404, detail="Subject not found")
    for key, value in payload.model_dump().items():
        setattr(item, key, value)
    await db.commit()
    await db.refresh(item)
    return item


@router.delete("/{subject_id}")
async def delete_subject(subject_id: int, db: AsyncSession = Depends(get_db)):
    item = await db.get(Subject, subject_id)
    if not item:
        raise HTTPException(status_code=404, detail="Subject not found")
    await db.delete(item)
    await db.commit()
    return {"detail": "Subject deleted"}
