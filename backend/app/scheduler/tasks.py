"""
APScheduler background tasks for the monitoring system.

Runs the monitor agent on a configurable interval.
"""

import logging
from datetime import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.core.config import settings
from app.core.database import async_session_maker
from app.models.reports import MonitorItem, MonitorReport, ReportSection

logger = logging.getLogger(__name__)

# Global scheduler instance
scheduler = AsyncIOScheduler()

# Connected WebSocket clients for live updates
connected_clients: set = set()


async def run_monitoring_task():
    """Execute the monitoring agent and save results to database."""
    logger.info("Starting scheduled monitoring task...")

    async with async_session_maker() as db:
        # Create pending report
        report = MonitorReport(report_type="scheduled", status="running")
        db.add(report)
        await db.commit()
        await db.refresh(report)

        try:
            # Import here to avoid circular imports
            from app.agent.monitor_agent import run_monitor

            # Run the monitor agent
            result = await run_monitor()

            # Update report with results
            report.status = "completed"
            report.summary = result.executive_summary
            report.full_report = result.model_dump()
            report.updated_at = datetime.utcnow()

            # Create sections
            for topic, section_data in [
                ("news", result.news),
                ("markets", result.markets),
                ("social", result.social),
            ]:
                section = ReportSection(
                    report_id=report.id,
                    topic=topic,
                    title=section_data.title,
                    summary=section_data.summary,
                    items=[{"key_points": section_data.key_points}],
                    sources_count=len(section_data.key_points),
                )
                db.add(section)

            await db.commit()
            logger.info(f"Monitoring task completed: report {report.id}")

            # Broadcast update to connected WebSocket clients
            await broadcast_report_update(str(report.id))

        except Exception as e:
            logger.error(f"Monitoring task failed: {e}", exc_info=True)
            report.status = "failed"
            report.error_message = str(e)
            report.updated_at = datetime.utcnow()
            await db.commit()


async def broadcast_report_update(report_id: str):
    """Broadcast new report notification to all connected WebSocket clients."""
    import json

    message = json.dumps({
        "type": "report_update",
        "report_id": report_id,
        "timestamp": datetime.utcnow().isoformat(),
    })

    disconnected = set()
    for websocket in connected_clients:
        try:
            await websocket.send_text(message)
        except Exception:
            disconnected.add(websocket)

    connected_clients.difference_update(disconnected)


def setup_scheduler():
    """Initialize and start the scheduler."""
    scheduler.add_job(
        run_monitoring_task,
        trigger=IntervalTrigger(minutes=settings.MONITOR_INTERVAL_MINUTES),
        id="monitoring_task",
        replace_existing=True,
        max_instances=1,  # Prevent overlapping runs
    )
    scheduler.start()
    logger.info(
        f"Scheduler started with {settings.MONITOR_INTERVAL_MINUTES} minute interval"
    )


def shutdown_scheduler():
    """Shutdown the scheduler gracefully."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler shutdown")
