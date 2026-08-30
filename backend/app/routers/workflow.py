import asyncio

from fastapi import APIRouter, Request
from starlette.responses import StreamingResponse

from app.services.workflow import emitter

router = APIRouter(prefix="/api/workflow", tags=["workflow"])


@router.get("/stream")
async def stream(request: Request):
    queue = emitter.subscribe()

    async def event_generator():
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    event_name, payload = await asyncio.wait_for(queue.get(), timeout=15)
                    yield f"event: {event_name}\ndata: {payload}\n\n"
                except asyncio.TimeoutError:
                    yield ": keep-alive\n\n"
        finally:
            emitter.unsubscribe(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
