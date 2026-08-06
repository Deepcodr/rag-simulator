import time
import httpx
from app.config import settings

MODEL_LABELS = {
    "gemma-2-2b-it": "Gemma 2 2B Instruct",
    "llama-3.2-1b-instruct": "Llama 3.2 1B Instruct",
    "llama-3.2-3b-instruct": "Llama 3.2 3B Instruct",
}


def _local_mock_generate(prompt: str, model_id: str) -> str:
    label = MODEL_LABELS.get(model_id, model_id)
    return (
        f"[Local mock response from {label}]\n\n"
        "Based on the retrieved context above, here is a synthesized answer. "
        "Configure MODAL_LLM_URL_* env vars and disable USE_LOCAL_FALLBACK to "
        "get real generations from your hosted Modal models."
    )


async def generate(prompt: str, model_id: str, max_tokens: int = 512) -> tuple[str, int]:
    start = time.time()
    url = settings.MODAL_LLM_URLS.get(model_id, "")
    if url and not settings.USE_LOCAL_FALLBACK:
        headers = settings.modal_auth_headers()
        # The Modal deployments in /modal-llm-service run vLLM's
        # OpenAI-compatible server, so we speak /v1/chat/completions
        # rather than a custom contract.
        async with httpx.AsyncClient(timeout=180) as client:
            resp = await client.post(
                f"{url.rstrip('/')}/v1/chat/completions",
                json={
                    "model": model_id,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": max_tokens,
                    "temperature": 0.3,
                },
                headers=headers,
            )
            resp.raise_for_status()
            data = resp.json()
            text = data["choices"][0]["message"]["content"]
            latency_ms = int((time.time() - start) * 1000)
            return text, latency_ms

    text = _local_mock_generate(prompt, model_id)
    latency_ms = int((time.time() - start) * 1000)
    return text, latency_ms
