import uuid
from fastapi import APIRouter, HTTPException

from app.state import store
from app.schemas import ChunkConfig, ChunkResponse, ChunkOut
from app.services.chunking import split_text

router = APIRouter(prefix="/api/chunks", tags=["chunks"])


@router.post("", response_model=ChunkResponse)
async def create_chunks(config: ChunkConfig):
    session = store.get(config.session_id)
    if not session["cleaned_text"]:
        raise HTTPException(400, "No document ingested yet for this session")

    documents = session["documents"]
    doc_texts = session.get("doc_texts", {})
    all_chunks: list[ChunkOut] = []

    for doc in documents:
        text = doc_texts.get(doc["id"], "")
        if not text:
            continue
        pieces = split_text(text, config.chunk_size, config.chunk_overlap, config.strategy)
        for i, piece in enumerate(pieces):
            all_chunks.append(ChunkOut(
                id=str(uuid.uuid4()), doc_id=doc["id"], doc_name=doc["name"],
                index=i, text=piece, char_count=len(piece),
            ))

    store.set(config.session_id, chunks=[c.model_dump() for c in all_chunks], embeddings=None, points_2d=None)

    return ChunkResponse(session_id=config.session_id, config=config, chunks=all_chunks)
