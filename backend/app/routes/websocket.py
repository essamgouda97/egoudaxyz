"""
WebSocket route for live report updates.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.scheduler.tasks import connected_clients

router = APIRouter()


@router.websocket("/ws/reports")
async def reports_websocket(websocket: WebSocket):
    """
    WebSocket endpoint for live report updates.

    Clients connect here to receive notifications when new reports are available.
    """
    await websocket.accept()
    connected_clients.add(websocket)

    try:
        while True:
            # Keep connection alive, handle pings
            data = await websocket.receive_text()
            # Could handle commands like "ping" or subscriptions
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        connected_clients.discard(websocket)
    except Exception:
        connected_clients.discard(websocket)
