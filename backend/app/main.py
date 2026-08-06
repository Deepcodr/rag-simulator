from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import documents, chunks, indexing, search, generation

app = FastAPI(title="RAG Simulation API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router)
app.include_router(chunks.router)
app.include_router(indexing.router)
app.include_router(search.router)
app.include_router(generation.router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "local_fallback": settings.USE_LOCAL_FALLBACK}


@app.get("/api/models")
async def available_models():
    return {
        "embedding_model": settings.EMBEDDING_MODEL_NAME,
        "embedding_host": "Render",
        "llm_models": [
            {"id": "gemma-2-2b-it", "label": "Gemma 2 2B Instruct"},
            {"id": "llama-3.2-1b-instruct", "label": "Llama 3.2 1B Instruct"},
            {"id": "llama-3.2-3b-instruct", "label": "Llama 3.2 3B Instruct"},
        ],
    }
