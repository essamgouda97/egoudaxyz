"""
FastAPI application for the World monitoring system.
"""

import logging
from contextlib import asynccontextmanager

import logfire
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.chat.routes import router as chat_router
from app.core.config import settings
from app.core.database import init_db
from app.routes.arabifier import router as arabifier_router
from app.routes.reports import router as reports_router
from app.routes.websocket import router as websocket_router
from app.scheduler.tasks import setup_scheduler, shutdown_scheduler

# Configure Logfire for observability (pydantic-ai only)
if settings.LOGFIRE_TOKEN:
    logfire.configure(token=settings.LOGFIRE_TOKEN, service_name="egoudaxyz-backend")
    logfire.instrument_pydantic_ai()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - startup and shutdown events."""
    # Startup
    logger.info("Starting up...")

    # Initialize database tables
    await init_db()
    logger.info("Database initialized")

    # Start the scheduler
    setup_scheduler()
    logger.info("Scheduler started")

    yield

    # Shutdown
    logger.info("Shutting down...")
    shutdown_scheduler()


app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(chat_router, prefix=settings.API_V1_STR, tags=["chat"])
app.include_router(reports_router, prefix=settings.API_V1_STR, tags=["reports"])
app.include_router(arabifier_router, prefix=settings.API_V1_STR, tags=["arabifier"])
# WebSocket at root level (no /api/v1 prefix) for easier Caddy proxying
app.include_router(websocket_router, tags=["websocket"])


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "project": settings.PROJECT_NAME}


@app.get("/")
def root():
    """Root endpoint."""
    return {"message": "World Monitoring System", "status": "running"}
