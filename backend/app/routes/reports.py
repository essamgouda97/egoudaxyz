"""
REST API routes for monitoring reports.
"""

import asyncio

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.reports import MonitorReport, ReportSection

router = APIRouter()


@router.get("/reports")
async def list_reports(
    limit: int = 10,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    """List recent monitoring reports."""
    result = await db.execute(
        select(MonitorReport)
        .order_by(MonitorReport.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    reports = result.scalars().all()

    return [
        {
            "id": str(r.id),
            "created_at": r.created_at.isoformat(),
            "status": r.status,
            "summary": r.summary,
            "report_type": r.report_type,
        }
        for r in reports
    ]


@router.get("/reports/latest")
async def get_latest_report(db: AsyncSession = Depends(get_db)):
    """Get the most recent completed report with all sections."""
    result = await db.execute(
        select(MonitorReport)
        .where(MonitorReport.status == "completed")
        .order_by(MonitorReport.created_at.desc())
        .limit(1)
    )
    report = result.scalar_one_or_none()

    if not report:
        raise HTTPException(404, "No completed reports found")

    # Fetch sections
    sections_result = await db.execute(
        select(ReportSection).where(ReportSection.report_id == report.id)
    )
    sections = sections_result.scalars().all()

    return {
        "id": str(report.id),
        "created_at": report.created_at.isoformat(),
        "updated_at": report.updated_at.isoformat(),
        "summary": report.summary,
        "full_report": report.full_report,
        "sections": {
            s.topic: {
                "title": s.title,
                "summary": s.summary,
                "items": s.items,
                "sources_count": s.sources_count,
            }
            for s in sections
        },
    }


@router.get("/reports/{report_id}")
async def get_report(report_id: str, db: AsyncSession = Depends(get_db)):
    """Get a specific report by ID."""
    from uuid import UUID

    try:
        report_uuid = UUID(report_id)
    except ValueError:
        raise HTTPException(400, "Invalid report ID format")

    result = await db.execute(
        select(MonitorReport).where(MonitorReport.id == report_uuid)
    )
    report = result.scalar_one_or_none()

    if not report:
        raise HTTPException(404, "Report not found")

    # Fetch sections
    sections_result = await db.execute(
        select(ReportSection).where(ReportSection.report_id == report.id)
    )
    sections = sections_result.scalars().all()

    return {
        "id": str(report.id),
        "created_at": report.created_at.isoformat(),
        "updated_at": report.updated_at.isoformat(),
        "status": report.status,
        "summary": report.summary,
        "full_report": report.full_report,
        "error_message": report.error_message,
        "sections": {
            s.topic: {
                "title": s.title,
                "summary": s.summary,
                "items": s.items,
                "sources_count": s.sources_count,
            }
            for s in sections
        },
    }


@router.post("/reports/trigger")
async def trigger_report():
    """Manually trigger a new monitoring report."""
    from app.scheduler.tasks import run_monitoring_task

    # Run the monitoring task in the background
    asyncio.create_task(run_monitoring_task())

    return {"status": "triggered", "message": "Monitoring task started"}
