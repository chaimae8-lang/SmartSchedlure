import enum

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class DayOfWeek(str, enum.Enum):
    monday = "monday"
    tuesday = "tuesday"
    wednesday = "wednesday"
    thursday = "thursday"
    friday = "friday"
    saturday = "saturday"


class Class(Base):
    __tablename__ = "classes"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(unique=True, index=True)
    filiere_id: Mapped[int] = mapped_column(ForeignKey("filieres.id", ondelete="CASCADE"))
    student_count: Mapped[int] = mapped_column(Integer)

    filiere: Mapped["Filiere"] = relationship(back_populates="classes")


class ScheduleSlot(Base):
    __tablename__ = "schedule_slots"
    __table_args__ = (
        UniqueConstraint("academic_year_id", "class_id", "day", "period", name="uq_schedule_class_slot"),
        UniqueConstraint("academic_year_id", "teacher_id", "day", "period", name="uq_schedule_teacher_slot"),
        UniqueConstraint("academic_year_id", "room_id", "day", "period", name="uq_schedule_room_slot"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    academic_year_id: Mapped[int] = mapped_column(ForeignKey("academic_years.id", ondelete="CASCADE"))
    class_id: Mapped[int] = mapped_column(ForeignKey("classes.id", ondelete="CASCADE"))
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id", ondelete="CASCADE"))
    teacher_id: Mapped[int] = mapped_column(ForeignKey("teachers.id", ondelete="CASCADE"))
    room_id: Mapped[int] = mapped_column(ForeignKey("rooms.id", ondelete="CASCADE"))
    day: Mapped[DayOfWeek] = mapped_column(Enum(DayOfWeek))
    period: Mapped[int] = mapped_column(Integer)
    is_locked: Mapped[bool] = mapped_column(Boolean, default=False)

    academic_year: Mapped["AcademicYear"] = relationship()
    class_: Mapped[Class] = relationship()
    subject: Mapped["Subject"] = relationship()
    teacher: Mapped["Teacher"] = relationship()
    room: Mapped["Room"] = relationship()
