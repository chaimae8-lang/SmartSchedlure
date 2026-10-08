from pydantic import ConfigDict

from schemas.academic import FiliereRead
from schemas.common import ORMModel


class ClassBase(ORMModel):
    name: str
    filiere_id: int
    student_count: int


class ClassCreate(ClassBase):
    pass


class ClassRead(ClassBase):
    id: int
    filiere: FiliereRead | None = None
    model_config = ConfigDict(from_attributes=True)
