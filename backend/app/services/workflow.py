import asyncio
import json
import time
import uuid
from typing import Optional


class WorkflowEmitter:
    """In-process pub-sub that fans WORKFLOW_STEP/TRACE_START events out to
    every connected SSE client (see app/routers/workflow.py)."""

    def __init__(self):
        self._queues: list[asyncio.Queue] = []

    def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue(maxsize=200)
        self._queues.append(q)
        return q

    def unsubscribe(self, q: asyncio.Queue):
        if q in self._queues:
            self._queues.remove(q)

    def _put(self, event_name: str, data: dict):
        payload = json.dumps(data)
        dead = []
        for q in self._queues:
            try:
                q.put_nowait((event_name, payload))
            except asyncio.QueueFull:
                dead.append(q)
        for q in dead:
            self.unsubscribe(q)

    def broadcast_trace_start(self, trace_id: str, trace_type: str, label: str):
        self._put("trace-start", {
            "traceId": trace_id,
            "traceType": trace_type,
            "label": label,
            "timestamp": int(time.time() * 1000),
        })

    def broadcast_step(self, step: dict):
        self._put("workflow-step", step)

    @property
    def client_count(self) -> int:
        return len(self._queues)


emitter = WorkflowEmitter()


class Trace:
    def __init__(self, trace_id: str, trace_type: str, label: str, emitter: WorkflowEmitter):
        self.trace_id = trace_id
        self.trace_type = trace_type
        self.label = label
        self._emitter = emitter
        self._step_no = 0
        self._start = time.perf_counter()

    def elapsed_ms(self) -> int:
        return int((time.perf_counter() - self._start) * 1000)

    def step(
        self,
        step_type: str,
        name: str,
        detail: str = "",
        duration_ms: Optional[int] = None,
        metadata: Optional[dict] = None,
    ):
        self._step_no += 1
        self._emitter.broadcast_step({
            "traceId": self.trace_id,
            "traceType": self.trace_type,
            "traceLabel": self.label,
            "type": step_type,
            "stepNumber": self._step_no,
            "name": name,
            "detail": detail,
            "durationMs": duration_ms if duration_ms is not None else 0,
            "metadata": metadata or {},
            "timestamp": int(time.time() * 1000),
        })


class WorkflowTracer:
    def __init__(self, emitter: WorkflowEmitter):
        self._emitter = emitter

    def start_trace(self, trace_type: str, label: str) -> Trace:
        trace_id = f"{trace_type.lower()}-{uuid.uuid4().hex[:8]}"
        self._emitter.broadcast_trace_start(trace_id, trace_type, label)
        return Trace(trace_id, trace_type, label, self._emitter)


tracer = WorkflowTracer(emitter)
