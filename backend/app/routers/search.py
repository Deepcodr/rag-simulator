import time
import numpy as np
from fastapi import APIRouter, HTTPException

from app.state import store
from app.schemas import SearchRequest, SearchResponse, SearchResult, VectorPoint
from app.services.embedding_client import embed_texts
from app.services.vector_store import cosine_similarity, top_k_indices
from app.services.dim_reduction import project_query_2d
from app.services.workflow import tracer

router = APIRouter(prefix="/api/search", tags=["search"])


async def run_search(session_id: str, query: str, top_k: int, trace=None):
    session = store.get(session_id)
    embeddings = session.get("embeddings")
    chunks = session["chunks"]
    coords = session.get("points_2d")

    if embeddings is None or not chunks:
        raise HTTPException(400, "No index built yet. Run the indexing step first.")

    own_trace = trace is None
    if own_trace:
        trace = tracer.start_trace("USER_ACTION", "Semantic Search")

    query_vec = (await embed_texts([query], trace=trace))[0]

    t0 = time.perf_counter()
    scores = cosine_similarity(query_vec, embeddings)
    idxs = top_k_indices(scores, top_k)
    dt = int((time.perf_counter() - t0) * 1000)
    trace.step(
        "VECTOR_SEARCH", name=f"Top-{top_k} cosine search",
        detail=f"best score {float(scores[idxs[0]]):.3f}" if len(idxs) else "no matches",
        duration_ms=dt, metadata={"top_k": top_k, "candidates": len(chunks)},
    )

    results = [
        SearchResult(
            chunk_id=chunks[i]["id"],
            doc_name=chunks[i]["doc_name"],
            text=chunks[i]["text"],
            score=float(scores[i]),
        )
        for i in idxs
    ]

    query_xy = project_query_2d(np.array(embeddings), np.array(coords), query_vec)
    query_point = VectorPoint(id="query", label="Your query", x=float(query_xy[0]), y=float(query_xy[1]), chunk_preview=query)

    all_points = [
        VectorPoint(
            id=c["id"],
            label=f"{c['doc_name']} #{c['index']}",
            x=float(coords[i][0]),
            y=float(coords[i][1]),
            chunk_preview=c["text"][:160],
        )
        for i, c in enumerate(chunks)
    ]

    if own_trace:
        trace.step(
            "RESPONSE", name="Search complete", duration_ms=trace.elapsed_ms(),
            metadata={"results": len(results)},
        )

    return results, query_point, all_points


@router.post("", response_model=SearchResponse)
async def semantic_search(req: SearchRequest):
    results, query_point, all_points = await run_search(req.session_id, req.query, req.top_k)
    return SearchResponse(query=req.query, query_point=query_point, all_points=all_points, results=results)
