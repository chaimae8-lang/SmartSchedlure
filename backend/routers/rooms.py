from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import get_current_user
from database import get_db
from models import Room
from schemas.school import RoomCreate, RoomRead

router = APIRouter(prefix="/rooms", tags=["rooms"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=list[RoomRead])
async def list_rooms(db: AsyncSession = Depends(get_db)):
    return (await db.scalars(select(Room).order_by(Room.name))).all()


@router.post("", response_model=RoomRead)
async def create_room(payload: RoomCreate, db: AsyncSession = Depends(get_db)):
    item = Room(**payload.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.put("/{room_id}", response_model=RoomRead)
async def update_room(room_id: int, payload: RoomCreate, db: AsyncSession = Depends(get_db)):
    item = await db.get(Room, room_id)
    if not item:
        raise HTTPException(status_code=404, detail="Room not found")
    for key, value in payload.model_dump().items():
        setattr(item, key, value)
    await db.commit()
    await db.refresh(item)
    return item


@router.delete("/{room_id}")
async def delete_room(room_id: int, db: AsyncSession = Depends(get_db)):
    item = await db.get(Room, room_id)
    if not item:
        raise HTTPException(status_code=404, detail="Room not found")
    await db.delete(item)
    await db.commit()
    return {"detail": "Room deleted"}
