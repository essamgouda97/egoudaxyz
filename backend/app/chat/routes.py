"""
Chat routes with AG-UI compatible SSE streaming.

AG-UI Protocol events:
- RUN_STARTED: Agent run has started
- TEXT_MESSAGE_START: Text message streaming started
- TEXT_MESSAGE_CONTENT: Streaming text content chunk
- TEXT_MESSAGE_END: Text message streaming ended
- RUN_FINISHED: Agent run has finished
- RUN_ERROR: An error occurred
"""

import json
import uuid
from typing import AsyncGenerator

from fastapi import APIRouter
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from app.agent.core import AgentDeps, stream_agent_response

router = APIRouter()


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    thread_id: str | None = None


def ag_ui_event(event_type: str, data: dict) -> str:
    """Format an AG-UI protocol event."""
    return json.dumps({"type": event_type, **data})


async def generate_chat_stream(request: ChatRequest) -> AsyncGenerator[dict, None]:
    """Generate AG-UI compatible SSE stream."""
    run_id = str(uuid.uuid4())
    message_id = str(uuid.uuid4())

    # RUN_STARTED
    yield {"event": "message", "data": ag_ui_event("RUN_STARTED", {"runId": run_id})}

    # TEXT_MESSAGE_START
    yield {
        "event": "message",
        "data": ag_ui_event(
            "TEXT_MESSAGE_START", {"messageId": message_id, "role": "assistant"}
        ),
    }

    # Get the last user message
    last_message = request.messages[-1].content if request.messages else ""
    deps = AgentDeps()

    try:
        async for chunk in stream_agent_response(last_message, deps):
            # TEXT_MESSAGE_CONTENT
            yield {
                "event": "message",
                "data": ag_ui_event("TEXT_MESSAGE_CONTENT", {"messageId": message_id, "delta": chunk}),
            }

        # TEXT_MESSAGE_END
        yield {"event": "message", "data": ag_ui_event("TEXT_MESSAGE_END", {"messageId": message_id})}

        # RUN_FINISHED
        yield {"event": "message", "data": ag_ui_event("RUN_FINISHED", {"runId": run_id})}

    except Exception as e:
        # RUN_ERROR
        yield {
            "event": "message",
            "data": ag_ui_event("RUN_ERROR", {"runId": run_id, "error": str(e)}),
        }


@router.post("/chat")
async def chat(request: ChatRequest):
    """AG-UI compatible chat endpoint with SSE streaming."""
    return EventSourceResponse(generate_chat_stream(request))


@router.get("/chat/health")
def chat_health():
    """Chat service health check."""
    return {"status": "ok", "service": "chat"}
