from pydantic import BaseModel, ConfigDict


class Message(BaseModel):
    detail: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)
