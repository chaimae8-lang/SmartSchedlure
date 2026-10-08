import enum

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Niveau(str, enum.Enum):
    tronc_commun = "tronc_commun"
    premiere_bac = "premiere_bac"
    deuxieme_bac = "deuxieme_bac"


class AcademicYear(Base):
    __tablename__ = "academic_years"

    id: Mapped[int] = mapped_column(primary_key=True)
    label: Mapped[str] = mapped_column(String(20), unique=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)


class Filiere(Base):
    __tablename__ = "filieres"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(20), unique=True)
    name: Mapped[str] = mapped_column(String(120))
    niveau: Mapped[Niveau] = mapped_column(Enum(Niveau))

    class_subjects: Mapped[list["ClassSubject"]] = relationship(back_populates="filiere", cascade="all, delete-orphan")
    classes: Mapped[list["Class"]] = relationship(back_populates="filiere", cascade="all, delete-orphan")


class ClassSubject(Base):
    __tablename__ = "class_subjects"
    __table_args__ = (UniqueConstraint("filiere_id", "subject_id", name="uq_filiere_subject"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    filiere_id: Mapped[int] = mapped_column(ForeignKey("filieres.id", ondelete="CASCADE"))
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id", ondelete="CASCADE"))
    hours_per_week: Mapped[int] = mapped_column(Integer)

    filiere: Mapped[Filiere] = relationship(back_populates="class_subjects")
    subject: Mapped["Subject"] = relationship(back_populates="class_subjects")
