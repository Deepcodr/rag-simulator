from fastapi import APIRouter

from app.config import settings
from app.schemas import GenerateRequest, GenerateResponse
from app.services.llm_client import generate
from app.routers.search import run_search
from app.services.workflow import tracer

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
    trace = tracer.start_trace("USER_ACTION", "Generation")

    results, _, _ = await run_search(req.session_id, req.query, req.top_k, trace=trace)
    system_prompt = req.system_prompt or DEFAULT_SYSTEM_PROMPT
    prompt = build_prompt(system_prompt, [r.text for r in results], req.query)
    trace.step(
        "PROMPT_BUILD", name="Built prompt", detail=f"{len(results)} chunk(s) as context",
        metadata={"prompt_chars": len(prompt)},
    )

    answer, latency_ms = await generate(prompt, req.model_id, req.max_tokens)
    is_real = bool(settings.MODAL_LLM_URLS.get(req.model_id)) and not settings.USE_LOCAL_FALLBACK
    trace.step(
        "LLM_INFERENCE", name=f"Generated with {req.model_id}",
        detail="Modal (real)" if is_real else "Local mock",
        duration_ms=latency_ms, metadata={"model": req.model_id, "real": is_real, "max_tokens": req.max_tokens},
    )
    trace.step(
        "RESPONSE", name="Generation complete", duration_ms=trace.elapsed_ms(),
        metadata={"answer_chars": len(answer)},
    )

    return GenerateResponse(
        model_id=req.model_id,
        context_prompt=prompt,
        retrieved_chunks=results,
        answer=answer,
        latency_ms=latency_ms,
    )
