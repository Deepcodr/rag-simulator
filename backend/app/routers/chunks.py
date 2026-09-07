import time
import uuid
from fastapi import APIRouter, HTTPException

from app.state import store
from app.schemas import ChunkConfig, ChunkResponse, ChunkOut
from app.services.chunking import split_text
from app.services.workflow import tracer

router = APIRouter(prefix="/api/chunks", tags=["chunks"])


@router.post("", response_model=ChunkResponse)
async def create_chunks(config: ChunkConfig):
    session = store.get(config.session_id)
    if not session["cleaned_text"]:
        raise HTTPException(400, "No document ingested yet for this session")

    trace = tracer.start_trace("USER_ACTION", "Chunking")

    documents = session["documents"]
    doc_texts = session.get("doc_texts", {})
    all_chunks: list[ChunkOut] = []

    for doc in documents:
        text = doc_texts.get(doc["id"], "")
        if not text:
            continue
        t0 = time.perf_counter()
        pieces = split_text(text, config.chunk_size, config.chunk_overlap, config.strategy)
        dt = int((time.perf_counter() - t0) * 1000)
        for i, piece in enumerate(pieces):
            all_chunks.append(ChunkOut(
                id=str(uuid.uuid4()), doc_id=doc["id"], doc_name=doc["name"],
                index=i, text=piece, char_count=len(piece),
            ))
        trace.step(
            "CHUNK_SPLIT", name=f"Split {doc['name']}",
            detail=f"{config.strategy} · size {config.chunk_size} / overlap {config.chunk_overlap}",
            duration_ms=dt, metadata={"chunks": len(pieces), "strategy": config.strategy},
        )

    store.set(config.session_id, chunks=[c.model_dump() for c in all_chunks], embeddings=None, points_2d=None)

    trace.step(
        "RESPONSE", name="Chunking complete", duration_ms=trace.elapsed_ms(),
        metadata={"total_chunks": len(all_chunks)},
    )

    return ChunkResponse(session_id=config.session_id, config=config, chunks=all_chunks)
