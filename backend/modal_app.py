"""
Deploy the FastAPI backend itself on Modal, next to your embedding/LLM
endpoints, so everything lives on the same low-latency network.

    modal deploy modal_app.py

This exposes the API at a URL like:
    https://<your-workspace>--rag-sim-api.modal.run
Point VITE_API_BASE_URL at that URL from your Vercel frontend.
"""

import modal

image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install_from_requirements("requirements.txt")
    .add_local_dir("app", remote_path="/root/app")
)

app = modal.App("rag-sim-api", image=image)


@app.function(
    min_containers=1,
    timeout=120,
    # Create with:
    # modal secret create rag-sim-secrets \
    #   EMBEDDING_URL=... EMBEDDING_API_KEY=... MODAL_LLM_URL_GEMMA2=... \
    #   MODAL_TOKEN_ID=wk-... MODAL_TOKEN_SECRET=ws-...
    secrets=[modal.Secret.from_name("rag-sim-secrets")],
)
@modal.asgi_app()
def fastapi_app():
    from app.main import app as web_app
    return web_app
