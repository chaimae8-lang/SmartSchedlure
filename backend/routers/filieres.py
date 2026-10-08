from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from auth.dependencies import get_current_user
from database import get_db
from models import ClassSubject, Filiere
from schemas.academic import ClassSubjectCreate, ClassSubjectRead, FiliereCreate, FiliereRead

router = APIRouter(prefix="/filieres", tags=["filieres"], dependencies=[Depends(get_current_user)])


def _opts():
    return [selectinload(Filiere.class_subjects).selectinload(ClassSubject.subject)]


@router.get("", response_model=list[FiliereRead])
async def list_filieres(db: AsyncSession = Depends(get_db)):
    return (await db.scalars(select(Filiere).options(*_opts()).order_by(Filiere.code))).all()


@router.post("", response_model=FiliereRead)
async def create_filiere(payload: FiliereCreate, db: AsyncSession = Depends(get_db)):
    item = Filiere(**payload.model_dump())
    db.add(item)
    await db.commit()
    return await db.scalar(select(Filiere).options(*_opts()).where(Filiere.id == item.id))


@router.post("/{filiere_id}/subjects", response_model=ClassSubjectRead)
async def assign_subject(filiere_id: int, payload: ClassSubjectCreate, db: AsyncSession = Depends(get_db)):
    if not await db.get(Filiere, filiere_id):
        raise HTTPException(status_code=404, detail="Filiere not found")
    item = ClassSubject(filiere_id=filiere_id, **payload.model_dump())
    db.add(item)
    await db.commit()
    return await db.scalar(select(ClassSubject).options(selectinload(ClassSubject.subject)).where(ClassSubject.id == item.id))
