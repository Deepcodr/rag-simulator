# RAG Simulation Lab

An interactive playground that visualizes Retrieval-Augmented Generation
end to end: document ingestion, chunking, embedding/indexing, semantic
search, and generation — each step tweakable and independently runnable.

## Architecture

```
frontend/                  Vite + React + Tailwind + Framer Motion + Zustand
backend/                   FastAPI orchestrator, deployable standalone or on Modal
render-embedding-service/  bge-small embedding API cluster, deployable on Render
modal-llm-service/         3 small instruct LLMs, deployable on Modal
```

The backend never runs the actual ML models — it orchestrates: cleans and
chunks text, calls **Render-hosted embedding endpoint** to get
vectors, does PCA to project them to 2D for visualization, runs
cosine-similarity search, and calls your **Modal-hosted LLM endpoints**
to generate the final answer. If neither is configured, it falls back to
deterministic local mocks so the whole flow is demoable out of the box
(`USE_LOCAL_FALLBACK=true`). See `render-embedding-service/README.md`
and `modal-llm-service/README.md` for deploy steps.

## Backend setup

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in your Modal endpoint URLs when ready
uvicorn app.main:app --reload --port 8000
```

### Your embedding + LLM endpoints — expected contracts

**Embedding endpoint** (`EMBEDDING_URL`, hosted on Render — see
`render-embedding-service/`)
- `POST /embed { "texts": string[] }`
- `→ { "embeddings": number[][] }`
- Auth: `X-API-Key` header

**LLM endpoints** (`MODAL_LLM_URL_GEMMA2` / `_LLAMA32_1B` / `_LLAMA32_3B ` / `_QWEN2` ,
hosted on Modal — see `modal-llm-service/`)
- `POST /v1/chat/completions` — standard vLLM/OpenAI-compatible body
- Auth: `Modal-Key` / `Modal-Secret` headers (Modal's proxy auth token
  pair, not a bearer token)

### Deploying the backend on Modal

Keeping the FastAPI orchestrator on Modal too (next to your models) avoids
cross-cloud latency:

```bash
cd backend
modal secret create rag-sim-secrets \
  EMBEDDING_URL=https://your-embed-service.onrender.com \
  EMBEDDING_API_KEY=... \
  MODAL_LLM_URL_GEMMA2=https://... \
  MODAL_LLM_URL_LLAMA32_1B=https://... \
  MODAL_LLM_URL_LLAMA32_3B=https://... \
  MODAL_LLM_URL_QWEN2=https://... \
  MODAL_TOKEN_ID=wk-... \
  MODAL_TOKEN_SECRET=ws-... \
  USE_LOCAL_FALLBACK=false
modal deploy modal_app.py
```

Modal secures Web Functions with a **proxy token pair**, not a bearer
token — create one at `https://modal.com/settings/proxy-auth-tokens`
(or `modal token new` / the proxy-auth CLI) and you'll get a Token ID
(`wk-...`) and Token Secret (`ws-...`). The backend sends these as the
`Modal-Key` / `Modal-Secret` headers on every request to your embedding
and LLM endpoints.

This publishes a URL like `https://<workspace>--rag-sim-api.modal.run` —
point the frontend's `VITE_API_BASE_URL` at it.

## Frontend setup

```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_BASE_URL
npm run dev
```

### Deploying on Vercel

```bash
cd frontend
vercel
```

Set the `VITE_API_BASE_URL` environment variable in the Vercel project
settings to Modal (or other) backend URL, and set `ALLOWED_ORIGINS`
in the backend to your Vercel domain.

## Notes on state

Session state (documents, chunks, vectors) lives in an in-process
dictionary (`app/state.py`) keyed by a `session_id` the frontend keeps in
memory. That's fine for a single backend container. If you deploy Modal
with more than one container, swap it for a `modal.Dict`, Redis, or a
lightweight table in Postgres so all containers see the same session.

## License

MIT
