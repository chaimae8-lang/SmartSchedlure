from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import get_current_user
from auth.jwt import create_access_token, verify_password
from database import get_db
from models.user import User
from schemas.common import Token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=Token)
async def login(form: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.username == form.username))
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    return {"access_token": create_access_token({"sub": user.username, "role": user.role}), "token_type": "bearer"}


@router.post("/refresh", response_model=Token)
async def refresh(user: User = Depends(get_current_user)):
    return {"access_token": create_access_token({"sub": user.username, "role": user.role}), "token_type": "bearer"}
