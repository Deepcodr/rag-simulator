import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # bge-small embedding, hosted on Render, sharded across up to 3
    # identical instances to stay under ram limits.
    # Comma-separated, e.g. "https://embed-1...,https://embed-2...,https://embed-3..."
    EMBEDDING_URLS: list = [u.strip() for u in os.getenv("EMBEDDING_URLS", "").split(",") if u.strip()]
    EMBEDDING_API_KEY: str = os.getenv("EMBEDDING_API_KEY", "")
    EMBEDDING_MODEL_NAME: str = os.getenv("EMBEDDING_MODEL_NAME", "bge-small-en-v1.5")

    # Modal-hosted LLM endpoints, one per model id. Each accepts {"prompt": str, "max_tokens": int}
    MODAL_LLM_URLS: dict = {
        "gemma-2-2b-it": os.getenv("MODAL_LLM_URL_GEMMA2", ""),
        "llama-3.2-1b-instruct": os.getenv("MODAL_LLM_URL_LLAMA32_1B", ""),
        "qwen2": os.getenv("MODAL_LLM_URL_QWEN2", ""),
        # "llama-3.2-3b-instruct": os.getenv("MODAL_LLM_URL_LLAMA32_3B", ""),
    }

    MODAL_TOKEN_ID: str = os.getenv("MODAL_TOKEN_ID", "")
    MODAL_TOKEN_SECRET: str = os.getenv("MODAL_TOKEN_SECRET", "")

    MAX_UPLOAD_MB: int = int(os.getenv("MAX_UPLOAD_MB", "10"))
    MAX_FILES: int = int(os.getenv("MAX_FILES", "5"))

    ALLOWED_ORIGINS: list = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

    # When True and no Modal URL is configured, services fall back to local
    # deterministic mocks so the whole pipeline is demoable without Modal.
    USE_LOCAL_FALLBACK: bool = os.getenv("USE_LOCAL_FALLBACK", "true").lower() == "true"

    def modal_auth_headers(self) -> dict:
        """Modal secures Web Functions with a proxy token pair, sent as the
        Modal-Key / Modal-Secret headers (not a bearer token)."""
        if self.MODAL_TOKEN_ID and self.MODAL_TOKEN_SECRET:
            return {"Modal-Key": self.MODAL_TOKEN_ID, "Modal-Secret": self.MODAL_TOKEN_SECRET}
        return {}

    def render_auth_headers(self) -> dict:
        if self.EMBEDDING_API_KEY:
            return {"X-API-Key": self.EMBEDDING_API_KEY}
        return {}


settings = Settings()
