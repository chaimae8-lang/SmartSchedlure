from schemas.common import ORMModel


class AIRequest(ORMModel):
    prompt: str
    schedule_context: dict = {}


class AIResponse(ORMModel):
    response: str
    model_used: str
