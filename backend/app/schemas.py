from typing import List, Optional, Literal
from pydantic import BaseModel, Field


class DocumentOut(BaseModel):
    id: str
    name: str
    source_type: Literal["pdf", "text"]
    raw_char_count: int
    clean_char_count: int
    preview: str


class IngestResponse(BaseModel):
    session_id: str
    documents: List[DocumentOut]
    cleaned_text: str


class ChunkConfig(BaseModel):
    session_id: str
    chunk_size: int = Field(500, ge=50, le=4000)
    chunk_overlap: int = Field(50, ge=0, le=1000)
    strategy: Literal["recursive", "fixed", "sentence"] = "recursive"


class ChunkOut(BaseModel):
    id: str
    doc_id: str
    doc_name: str
    index: int
    text: str
    char_count: int


class ChunkResponse(BaseModel):
    session_id: str
    config: ChunkConfig
    chunks: List[ChunkOut]


class IndexRequest(BaseModel):
    session_id: str


class VectorPoint(BaseModel):
    id: str
    label: str
    x: float
    y: float
    chunk_preview: str


class IndexResponse(BaseModel):
    session_id: str
    embedding_model: str
    vector_dim: int
    points: List[VectorPoint]


class SearchRequest(BaseModel):
    session_id: str
    query: str
    top_k: int = Field(3, ge=1, le=10)


class SearchResult(BaseModel):
    chunk_id: str
    doc_name: str
    text: str
    score: float


class SearchResponse(BaseModel):
    query: str
    query_point: VectorPoint
    all_points: List[VectorPoint]
    results: List[SearchResult]


class GenerateRequest(BaseModel):
    session_id: str
    query: str
    model_id: Literal["gemma-2-2b-it", "llama-3.2-1b-instruct", "qwen2"] = "qwen2"
    top_k: int = Field(3, ge=1, le=10)
    system_prompt: Optional[str] = None
    max_tokens: int = Field(512, ge=32, le=2048)


class GenerateResponse(BaseModel):
    model_id: str
    context_prompt: str
    retrieved_chunks: List[SearchResult]
    answer: str
    latency_ms: int
