import time
from fastapi import APIRouter, HTTPException

from app.state import store
from app.schemas import IndexRequest, IndexResponse, VectorPoint
from app.services.embedding_client import embed_texts, embedding_model_name
from app.services.dim_reduction import project_2d
from app.services.workflow import tracer

router = APIRouter(prefix="/api/index", tags=["indexing"])


@router.post("", response_model=IndexResponse)
async def build_index(req: IndexRequest):
    session = store.get(req.session_id)
    chunks = session["chunks"]
    if not chunks:
        raise HTTPException(400, "No chunks available. Run the chunking step first.")

    trace = tracer.start_trace("USER_ACTION", "Indexing")

    texts = [c["text"] for c in chunks]
    embeddings = await embed_texts(texts, trace=trace)

    t0 = time.perf_counter()
    coords = project_2d(embeddings)
    dt = int((time.perf_counter() - t0) * 1000)
    trace.step(
        "VECTOR_INDEX", name="Projected to 2D", detail="PCA",
        duration_ms=dt, metadata={"vectors": len(embeddings)},
    )

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

    trace.step(
        "RESPONSE", name="Indexing complete", duration_ms=trace.elapsed_ms(),
        metadata={"vector_dim": int(embeddings.shape[1])},
    )

    return IndexResponse(
        session_id=req.session_id,
        embedding_model=embedding_model_name(),
        vector_dim=int(embeddings.shape[1]),
        points=points,
    )
