import enum

from sqlalchemy import Boolean, Enum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class RoomType(str, enum.Enum):
    normal = "normal"
    lab = "lab"
    computer = "computer"
    drawing = "drawing"
    gym = "gym"


class Subject(Base):
    __tablename__ = "subjects"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    requires_lab: Mapped[bool] = mapped_column(Boolean, default=False)
    requires_gym: Mapped[bool] = mapped_column(Boolean, default=False)
    coefficient: Mapped[int] = mapped_column(Integer, default=1)

    teacher_subjects: Mapped[list["TeacherSubject"]] = relationship(back_populates="subject", cascade="all, delete-orphan")
    class_subjects: Mapped[list["ClassSubject"]] = relationship(back_populates="subject", cascade="all, delete-orphan")


class Room(Base):
    __tablename__ = "rooms"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    capacity: Mapped[int] = mapped_column(Integer)
    room_type: Mapped[RoomType] = mapped_column(Enum(RoomType), default=RoomType.normal)
    max_daily_uses: Mapped[int] = mapped_column(Integer, default=99)
