from pydantic import ConfigDict, Field

from models.schedule import DayOfWeek
from schemas.common import ORMModel
from schemas.school import RoomRead, SubjectRead
from schemas.teacher import TeacherRead


class GenerateRequest(ORMModel):
    academic_year_id: int


class MoveSlotRequest(ORMModel):
    day: DayOfWeek
    period: int = Field(ge=0, le=3)
    room_id: int


class ScheduleSlotRead(ORMModel):
    id: int
    academic_year_id: int
    class_id: int
    subject_id: int
    teacher_id: int
    room_id: int
    day: DayOfWeek
    period: int
    is_locked: bool
    subject: SubjectRead | None = None
    teacher: TeacherRead | None = None
    room: RoomRead | None = None
    model_config = ConfigDict(from_attributes=True)


class GenerateResult(ORMModel):
    status: str
    solve_time_seconds: float
    num_slots: int
    conflicts: list[dict]
    slots: list[dict] = []
