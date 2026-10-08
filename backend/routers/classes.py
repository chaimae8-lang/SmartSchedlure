from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from auth.dependencies import get_current_user
from database import get_db
from models import Class, ClassSubject, Filiere
from schemas.class_schema import ClassCreate, ClassRead

router = APIRouter(prefix="/classes", tags=["classes"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=list[ClassRead])
async def list_classes(db: AsyncSession = Depends(get_db)):
    stmt = select(Class).options(selectinload(Class.filiere).selectinload(Filiere.class_subjects).selectinload(ClassSubject.subject)).order_by(Class.name)
    return (await db.scalars(stmt)).all()


@router.post("", response_model=ClassRead)
async def create_class(payload: ClassCreate, db: AsyncSession = Depends(get_db)):
    item = Class(**payload.model_dump())
    db.add(item)
    await db.commit()
    stmt = select(Class).options(selectinload(Class.filiere)).where(Class.id == item.id)
    return await db.scalar(stmt)


@router.put("/{class_id}", response_model=ClassRead)
async def update_class(class_id: int, payload: ClassCreate, db: AsyncSession = Depends(get_db)):
    item = await db.get(Class, class_id)
    if not item:
        raise HTTPException(status_code=404, detail="Class not found")
    for key, value in payload.model_dump().items():
        setattr(item, key, value)
    await db.commit()
    return await db.scalar(select(Class).options(selectinload(Class.filiere)).where(Class.id == class_id))


@router.delete("/{class_id}")
async def delete_class(class_id: int, db: AsyncSession = Depends(get_db)):
    item = await db.get(Class, class_id)
    if not item:
        raise HTTPException(status_code=404, detail="Class not found")
    await db.delete(item)
    await db.commit()
    return {"detail": "Class deleted"}
