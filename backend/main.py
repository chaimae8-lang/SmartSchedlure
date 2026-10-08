from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from database import Base, engine
import models  # noqa: F401
from routers import ai, auth, classes, filieres, rooms, schedule, subjects, teachers


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(title="Al-Farabi School Scheduler", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception(_: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": str(exc)})


app.include_router(auth.router)
app.include_router(teachers.router)
app.include_router(classes.router)
app.include_router(rooms.router)
app.include_router(subjects.router)
app.include_router(filieres.router)
app.include_router(schedule.router)
app.include_router(ai.router)
