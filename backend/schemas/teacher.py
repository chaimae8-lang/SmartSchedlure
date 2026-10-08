from pydantic import ConfigDict, Field

from models.people import TeacherType
from models.schedule import DayOfWeek
from schemas.common import ORMModel
from schemas.school import SubjectRead


class TeacherUnavailabilityBase(ORMModel):
    day: DayOfWeek
    period_start: int = Field(ge=0, le=3)
    period_end: int = Field(ge=0, le=3)
    reason: str | None = None


class TeacherUnavailabilityCreate(TeacherUnavailabilityBase):
    pass


class TeacherUnavailabilityRead(TeacherUnavailabilityBase):
    id: int
    teacher_id: int
    model_config = ConfigDict(from_attributes=True)


class TeacherSubjectRead(ORMModel):
    id: int
    subject_id: int
    subject: SubjectRead
    model_config = ConfigDict(from_attributes=True)


class TeacherBase(ORMModel):
    first_name: str
    last_name: str
    teacher_type: TeacherType
    max_hours_week: int = Field(ge=1, le=30)
    max_hours_day: int = Field(default=8, ge=1, le=8)


class TeacherCreate(TeacherBase):
    subject_ids: list[int] = []


class TeacherRead(TeacherBase):
    id: int
    subjects: list[TeacherSubjectRead] = []
    unavailability: list[TeacherUnavailabilityRead] = []
    model_config = ConfigDict(from_attributes=True)
