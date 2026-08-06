from fastapi import APIRouter, HTTPException

from app.state import store
from app.schemas import IndexRequest, IndexResponse, VectorPoint
from app.services.embedding_client import embed_texts, embedding_model_name
from app.services.dim_reduction import project_2d

router = APIRouter(prefix="/api/index", tags=["indexing"])


@router.post("", response_model=IndexResponse)
async def build_index(req: IndexRequest):
    session = store.get(req.session_id)
    chunks = session["chunks"]
    if not chunks:
        raise HTTPException(400, "No chunks available. Run the chunking step first.")

    texts = [c["text"] for c in chunks]
    embeddings = await embed_texts(texts)
    coords = project_2d(embeddings)

    points = [
        VectorPoint(
            id=c["id"],
            label=f"{c['doc_name']} #{c['index']}",
            x=float(coords[i][0]),
            y=float(coords[i][1]),
            chunk_preview=c["text"][:160],
        )
        for i, c in enumerate(chunks)
    ]

    store.set(
        req.session_id,
        embeddings=embeddings,
        points_2d=coords,
        embedding_model=embedding_model_name(),
    )

    return IndexResponse(
        session_id=req.session_id,
        embedding_model=embedding_model_name(),
        vector_dim=int(embeddings.shape[1]),
        points=points,
    )
