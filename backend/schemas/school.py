from pydantic import ConfigDict

from models.school import RoomType
from schemas.common import ORMModel


class SubjectBase(ORMModel):
    code: str
    name: str
    requires_lab: bool = False
    requires_gym: bool = False
    coefficient: int = 1


class SubjectCreate(SubjectBase):
    pass


class SubjectRead(SubjectBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class RoomBase(ORMModel):
    name: str
    capacity: int
    room_type: RoomType = RoomType.normal
    max_daily_uses: int = 99


class RoomCreate(RoomBase):
    pass


class RoomRead(RoomBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
