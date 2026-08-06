from fastapi import APIRouter

from app.schemas import GenerateRequest, GenerateResponse
from app.services.llm_client import generate
from app.routers.search import run_search

router = APIRouter(prefix="/api/generate", tags=["generation"])

DEFAULT_SYSTEM_PROMPT = (
    "You are a helpful assistant. Answer the user's question using only the "
    "provided context. If the answer isn't in the context, say you don't know."
)


def build_prompt(system_prompt: str, context_chunks: list[str], query: str) -> str:
    context_block = "\n\n".join(f"[{i+1}] {c}" for i, c in enumerate(context_chunks))
    return (
        f"{system_prompt}\n\n"
        f"### Context\n{context_block}\n\n"
        f"### Question\n{query}\n\n"
        f"### Answer"
    )


@router.post("", response_model=GenerateResponse)
async def generate_answer(req: GenerateRequest):
    results, _, _ = await run_search(req.session_id, req.query, req.top_k)
    system_prompt = req.system_prompt or DEFAULT_SYSTEM_PROMPT
    prompt = build_prompt(system_prompt, [r.text for r in results], req.query)

    answer, latency_ms = await generate(prompt, req.model_id, req.max_tokens)

    return GenerateResponse(
        model_id=req.model_id,
        context_prompt=prompt,
        retrieved_chunks=results,
        answer=answer,
        latency_ms=latency_ms,
    )
