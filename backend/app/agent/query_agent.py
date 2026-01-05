"""
Query Agent - Chat agent with database tools.

Allows users to query and explore monitoring reports through conversation.
Has access to database tools to search and retrieve stored data.
"""

import logging
from datetime import datetime, timedelta

from pydantic import BaseModel
from pydantic_ai import Agent, RunContext
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.reports import MonitorReport, ReportSection

logger = logging.getLogger(__name__)


class QueryDeps(BaseModel):
    """Dependencies for the query agent - includes database session."""

    db: AsyncSession

    class Config:
        arbitrary_types_allowed = True


query_agent = Agent(
    settings.MONITOR_MODEL,
    deps_type=QueryDeps,
    system_prompt="""You are a monitoring intelligence assistant. You help users explore and understand the monitoring data that has been collected.

You have access to tools that let you:
1. Get the latest monitoring report
2. Search historical reports by topic or time range
3. Get statistics about monitoring activity

When answering questions:
- Use your tools to fetch relevant data before responding
- Be specific and cite data from reports when available
- If asked about trends, compare across multiple reports
- If no data is available, say so clearly

Be helpful, concise, and data-driven in your responses.""",
)


@query_agent.tool
async def get_latest_report(ctx: RunContext[QueryDeps]) -> dict:
    """Get the most recent completed monitoring report with all sections."""
    result = await ctx.deps.db.execute(
        select(MonitorReport)
        .where(MonitorReport.status == "completed")
        .order_by(MonitorReport.created_at.desc())
        .limit(1)
    )
    report = result.scalar_one_or_none()

    if not report:
        return {"error": "No completed reports available yet"}

    # Fetch sections
    sections_result = await ctx.deps.db.execute(
        select(ReportSection).where(ReportSection.report_id == report.id)
    )
    sections = sections_result.scalars().all()

    return {
        "id": str(report.id),
        "created_at": report.created_at.isoformat(),
        "summary": report.summary,
        "sections": {
            s.topic: {
                "title": s.title,
                "summary": s.summary,
                "items": s.items,
            }
            for s in sections
        },
    }


@query_agent.tool
async def search_reports(
    ctx: RunContext[QueryDeps],
    topic: str | None = None,
    days: int = 7,
    limit: int = 5,
) -> list[dict]:
    """
    Search reports by topic and time range.

    Args:
        topic: Filter by topic ('news', 'markets', 'social') or None for all
        days: Number of days to look back (default 7)
        limit: Maximum number of results (default 5)
    """
    since = datetime.utcnow() - timedelta(days=days)

    query = (
        select(ReportSection)
        .join(MonitorReport)
        .where(
            MonitorReport.created_at >= since,
            MonitorReport.status == "completed",
        )
    )

    if topic:
        query = query.where(ReportSection.topic == topic)

    query = query.order_by(MonitorReport.created_at.desc()).limit(limit)

    result = await ctx.deps.db.execute(query)
    sections = result.scalars().all()

    return [
        {
            "topic": s.topic,
            "title": s.title,
            "summary": s.summary,
            "created_at": s.created_at.isoformat(),
        }
        for s in sections
    ]


@query_agent.tool
async def get_monitoring_stats(ctx: RunContext[QueryDeps], days: int = 7) -> dict:
    """
    Get statistics about monitoring activity.

    Args:
        days: Number of days to analyze (default 7)
    """
    since = datetime.utcnow() - timedelta(days=days)

    # Count total reports
    total_result = await ctx.deps.db.execute(
        select(func.count(MonitorReport.id)).where(MonitorReport.created_at >= since)
    )
    total_reports = total_result.scalar() or 0

    # Count by status
    completed_result = await ctx.deps.db.execute(
        select(func.count(MonitorReport.id)).where(
            MonitorReport.created_at >= since,
            MonitorReport.status == "completed",
        )
    )
    completed_reports = completed_result.scalar() or 0

    failed_result = await ctx.deps.db.execute(
        select(func.count(MonitorReport.id)).where(
            MonitorReport.created_at >= since,
            MonitorReport.status == "failed",
        )
    )
    failed_reports = failed_result.scalar() or 0

    # Get latest report time
    latest_result = await ctx.deps.db.execute(
        select(MonitorReport.created_at)
        .where(MonitorReport.status == "completed")
        .order_by(MonitorReport.created_at.desc())
        .limit(1)
    )
    latest_time = latest_result.scalar()

    return {
        "period_days": days,
        "total_reports": total_reports,
        "completed_reports": completed_reports,
        "failed_reports": failed_reports,
        "success_rate": (
            f"{(completed_reports / total_reports * 100):.1f}%"
            if total_reports > 0
            else "N/A"
        ),
        "latest_report": latest_time.isoformat() if latest_time else None,
    }
