import uuid
from typing import Dict, Any


class SessionStore:
    """Simple in-process store. On Modal, back this with a modal.Dict or
    a real database (e.g. Postgres / Chroma) for multi-container durability."""

    def __init__(self):
        self._sessions: Dict[str, Dict[str, Any]] = {}

    def create(self) -> str:
        sid = str(uuid.uuid4())
        self._sessions[sid] = {
            "documents": [],
            "doc_texts": {},
            "cleaned_text": "",
            "chunks": [],
            "embeddings": None,
            "points_2d": None,
            "embedding_model": None,
        }
        return sid

    def get(self, session_id: str) -> Dict[str, Any]:
        if session_id not in self._sessions:
            self._sessions[session_id] = {
                "documents": [],
                "doc_texts": {},
                "cleaned_text": "",
                "chunks": [],
                "embeddings": None,
                "points_2d": None,
                "embedding_model": None,
            }
        return self._sessions[session_id]

    def set(self, session_id: str, **kwargs):
        session = self.get(session_id)
        session.update(kwargs)


store = SessionStore()
