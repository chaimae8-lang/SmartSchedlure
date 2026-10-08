from pydantic import ConfigDict

from models.academic import Niveau
from schemas.common import ORMModel
from schemas.school import SubjectRead


class AcademicYearRead(ORMModel):
    id: int
    label: str
    is_active: bool
    model_config = ConfigDict(from_attributes=True)


class FiliereBase(ORMModel):
    code: str
    name: str
    niveau: Niveau


class FiliereCreate(FiliereBase):
    pass


class ClassSubjectCreate(ORMModel):
    subject_id: int
    hours_per_week: int


class ClassSubjectRead(ORMModel):
    id: int
    subject_id: int
    hours_per_week: int
    subject: SubjectRead
    model_config = ConfigDict(from_attributes=True)


class FiliereRead(FiliereBase):
    id: int
    class_subjects: list[ClassSubjectRead] = []
    model_config = ConfigDict(from_attributes=True)
