import json

from fastapi import APIRouter, Depends

from auth.dependencies import get_current_user
from config import settings
from schemas.ai import AIRequest, AIResponse
from services.claude_service import ask_claude
from services.ollama_service import ask_ollama

router = APIRouter(prefix="/ai", tags=["ai"], dependencies=[Depends(get_current_user)])


@router.post("/suggest", response_model=AIResponse)
async def suggest(payload: AIRequest):
    context = {
        "conflicts": payload.schedule_context.get("conflicts", []),
        "teacher_workload_summary": payload.schedule_context.get("teacher_workload_summary", {}),
        "specific_slot": payload.schedule_context.get("specific_slot"),
        **payload.schedule_context,
    }
    if settings.use_claude and settings.anthropic_api_key:
        return {"response": await ask_claude(payload.prompt, context), "model_used": "claude-sonnet-4-20250514"}
    prompt = (
        "You are a scheduling assistant for a Moroccan high school. Respond in the user's language. "
        "Always include conflicts, teacher workload, and the specific slot in your reasoning.\n"
        f"Context: {json.dumps(context, ensure_ascii=False)}\nRequest: {payload.prompt}"
    )
    return {"response": await ask_ollama(prompt, settings.ollama_model), "model_used": settings.ollama_model}


@router.post("/explain", response_model=AIResponse)
async def explain(payload: AIRequest):
    return await suggest(payload)
