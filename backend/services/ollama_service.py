import httpx

from config import settings


async def ask_ollama(prompt: str, model: str = "mistral") -> str:
    async with httpx.AsyncClient(timeout=45) as client:
        response = await client.post(
            f"{settings.ollama_url}/api/chat",
            json={"model": model, "stream": False, "messages": [{"role": "user", "content": prompt}]},
        )
        response.raise_for_status()
        data = response.json()
        return data.get("message", {}).get("content", "")
