"""API routes."""

from app.routes.reports import router as reports_router
from app.routes.websocket import router as websocket_router

__all__ = ["reports_router", "websocket_router"]
