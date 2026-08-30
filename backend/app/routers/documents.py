import time
import uuid
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from app.config import settings
from app.state import store
from app.schemas import IngestResponse, DocumentOut
from app.services.preprocessing import extract_pdf_text, clean_text
from app.services.workflow import tracer

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.post("/ingest", response_model=IngestResponse)
async def ingest(
    session_id: Optional[str] = Form(None),
    text_input: Optional[str] = Form(None),
    files: List[UploadFile] = File(default=[]),
):
    if files and len(files) > settings.MAX_FILES:
        raise HTTPException(400, f"Max {settings.MAX_FILES} files allowed")

    if not session_id:
        session_id = store.create()

    trace = tracer.start_trace("USER_ACTION", "Document Ingest")

    documents: list[DocumentOut] = []
    combined_raw = []
    doc_texts: dict[str, str] = {}

    for f in files:
        if f.content_type != "application/pdf" and not f.filename.lower().endswith(".pdf"):
            raise HTTPException(400, f"Only PDF files are supported, got: {f.filename}")
        t0 = time.perf_counter()
        content = await f.read()
        size_mb = len(content) / (1024 * 1024)
        if size_mb > settings.MAX_UPLOAD_MB:
            raise HTTPException(400, f"{f.filename} exceeds {settings.MAX_UPLOAD_MB}MB limit")
        raw = extract_pdf_text(content)
        cleaned = clean_text(raw)
        dt = int((time.perf_counter() - t0) * 1000)
        doc_id = str(uuid.uuid4())
        documents.append(DocumentOut(
            id=doc_id,
            name=f.filename,
            source_type="pdf",
            raw_char_count=len(raw),
            clean_char_count=len(cleaned),
            preview=cleaned[:400],
        ))
        combined_raw.append(cleaned)
        doc_texts[doc_id] = cleaned
        trace.step(
            "DOC_INGEST", name=f"Ingested {f.filename}", detail=f"PDF · {len(cleaned)} chars",
            duration_ms=dt, metadata={"source_type": "pdf", "chars": len(cleaned)},
        )

    if text_input and text_input.strip():
        t0 = time.perf_counter()
        raw = text_input.strip()
        cleaned = clean_text(raw)
        dt = int((time.perf_counter() - t0) * 1000)
        doc_id = str(uuid.uuid4())
        documents.append(DocumentOut(
            id=doc_id,
            name="Pasted text",
            source_type="text",
            raw_char_count=len(raw),
            clean_char_count=len(cleaned),
            preview=cleaned[:400],
        ))
        combined_raw.append(cleaned)
        doc_texts[doc_id] = cleaned
        trace.step(
            "DOC_INGEST", name="Ingested pasted text", detail=f"Text · {len(cleaned)} chars",
            duration_ms=dt, metadata={"source_type": "text", "chars": len(cleaned)},
        )

    if not documents:
        raise HTTPException(400, "Provide at least one PDF file or some text")

    cleaned_text = "\n\n".join(combined_raw)

    store.set(
        session_id,
        documents=[d.model_dump() for d in documents],
        doc_texts=doc_texts,
        cleaned_text=cleaned_text,
        chunks=[],
        embeddings=None,
        points_2d=None,
    )

    trace.step(
        "RESPONSE", name="Ingest complete", duration_ms=trace.elapsed_ms(),
        metadata={"documents": len(documents)},
    )

    return IngestResponse(session_id=session_id, documents=documents, cleaned_text=cleaned_text)
