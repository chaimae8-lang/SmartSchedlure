import json

from anthropic import AsyncAnthropic

from config import settings

SYSTEM_PROMPT = (
    "You are a scheduling assistant for a Moroccan high school. Help the admin resolve scheduling "
    "conflicts and optimize the timetable. Always respond in the same language the user writes in "
    "(French, Arabic, or English). Be concise and practical. When suggesting a fix, always specify: "
    "which slot to move, which day/period to move it to, and why it works."
)


async def ask_claude(prompt: str, context: dict) -> str:
    client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    context_text = json.dumps(
        {
            "current_conflicts": context.get("conflicts", []),
            "teacher_workload_summary": context.get("teacher_workload_summary", {}),
            "specific_slot": context.get("specific_slot"),
            "schedule_context": context,
        },
        ensure_ascii=False,
    )
    message = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=700,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": f"Context:\n{context_text}\n\nAdmin request:\n{prompt}"}],
    )
    return "\n".join(block.text for block in message.content if getattr(block, "type", "") == "text")
