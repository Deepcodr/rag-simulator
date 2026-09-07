import hashlib
import asyncio
import time
import numpy as np
import httpx
from app.config import settings

LOCAL_DIM = 384

def _split_into_shards(texts: list[str], n_shards: int) -> list[list[str]]:
    n_shards = max(1, min(n_shards, len(texts)))
    shard_size = -(-len(texts) // n_shards)  # ceil division
    return [texts[i:i + shard_size] for i in range(0, len(texts), shard_size)]


async def _embed_shard(url: str, texts: list[str], headers: dict) -> list[list[float]]:
    async with httpx.AsyncClient(timeout=90) as client:
        resp = await client.post(
            f"{url.rstrip('/')}/embed",
            json={"texts": texts, "model": settings.EMBEDDING_MODEL_NAME},
            headers=headers,
        )
        resp.raise_for_status()
        return resp.json()["embeddings"]

def _local_mock_embed(texts: list[str]) -> np.ndarray:
    """Deterministic pseudo-embedding so the pipeline is demoable without
    the Render embedding service configured. Set EMBEDDING_URL to use it."""
    vectors = []
    for text in texts:
        seed = int(hashlib.sha256(text.encode("utf-8")).hexdigest(), 16) % (2**32)
        rng = np.random.default_rng(seed)
        vec = rng.normal(size=LOCAL_DIM)
        vec = vec / np.linalg.norm(vec)
        vectors.append(vec)
    return np.array(vectors)


async def embed_texts(texts: list[str], trace=None) -> np.ndarray:
    if settings.EMBEDDING_URLS and not settings.USE_LOCAL_FALLBACK:
        headers = settings.render_auth_headers()
        # Render's free tier spins down after ~15 min idle; the first
        # call after a nap can take 30-60s to cold start, hence the
        # generous timeout here.
        shards = _split_into_shards(texts, len(settings.EMBEDDING_URLS))
        urls = settings.EMBEDDING_URLS[:len(shards)]
        t0 = time.perf_counter()
        results = await asyncio.gather(
            *[_embed_shard(url, shard, headers) for url, shard in zip(urls, shards)]
        )
        dt = int((time.perf_counter() - t0) * 1000)
        embeddings = [vec for shard_result in results for vec in shard_result]
        if trace:
            trace.step(
                "EMBEDDING_CALL", name=f"Embedded {len(texts)} text(s)",
                detail=f"Render · {len(urls)} shard(s) · {settings.EMBEDDING_MODEL_NAME}",
                duration_ms=dt, metadata={"real": True, "shards": len(urls), "dim": len(embeddings[0]) if embeddings else 0},
            )
        return np.array(embeddings)

    t0 = time.perf_counter()
    result = _local_mock_embed(texts)
    dt = int((time.perf_counter() - t0) * 1000)
    if trace:
        trace.step(
            "EMBEDDING_CALL", name=f"Embedded {len(texts)} text(s)",
            detail="Local mock · hash-seeded",
            duration_ms=dt, metadata={"real": False, "dim": LOCAL_DIM},
        )
    return result


def embedding_model_name() -> str:
    return settings.EMBEDDING_MODEL_NAME
