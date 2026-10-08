import enum

from sqlalchemy import Enum, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base
from models.schedule import DayOfWeek


class TeacherType(str, enum.Enum):
    titulaire = "titulaire"
    vacataire = "vacataire"


class Teacher(Base):
    __tablename__ = "teachers"

    id: Mapped[int] = mapped_column(primary_key=True)
    first_name: Mapped[str] = mapped_column(String(80))
    last_name: Mapped[str] = mapped_column(String(80))
    teacher_type: Mapped[TeacherType] = mapped_column(Enum(TeacherType))
    max_hours_week: Mapped[int] = mapped_column(Integer)
    max_hours_day: Mapped[int] = mapped_column(Integer, default=8)

    subjects: Mapped[list["TeacherSubject"]] = relationship(back_populates="teacher", cascade="all, delete-orphan")
    unavailability: Mapped[list["TeacherUnavailability"]] = relationship(back_populates="teacher", cascade="all, delete-orphan")


class TeacherSubject(Base):
    __tablename__ = "teacher_subjects"
    __table_args__ = (UniqueConstraint("teacher_id", "subject_id", name="uq_teacher_subject"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    teacher_id: Mapped[int] = mapped_column(ForeignKey("teachers.id", ondelete="CASCADE"))
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id", ondelete="CASCADE"))

    teacher: Mapped[Teacher] = relationship(back_populates="subjects")
    subject: Mapped["Subject"] = relationship(back_populates="teacher_subjects")


class TeacherUnavailability(Base):
    __tablename__ = "teacher_unavailability"

    id: Mapped[int] = mapped_column(primary_key=True)
    teacher_id: Mapped[int] = mapped_column(ForeignKey("teachers.id", ondelete="CASCADE"))
    day: Mapped[DayOfWeek] = mapped_column(Enum(DayOfWeek))
    period_start: Mapped[int] = mapped_column(Integer)
    period_end: Mapped[int] = mapped_column(Integer)
    reason: Mapped[str | None] = mapped_column(String(200), nullable=True)

    teacher: Mapped[Teacher] = relationship(back_populates="unavailability")
