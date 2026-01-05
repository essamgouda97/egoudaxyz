"""
ORM models for the monitoring system.
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class MonitorReport(Base):
    """Main monitoring report - created each time the monitor agent runs."""

    __tablename__ = "monitor_reports"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Report metadata
    report_type: Mapped[str] = mapped_column(
        String(50), nullable=False, default="scheduled"
    )  # 'scheduled' | 'manual'
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending"
    )  # 'pending' | 'running' | 'completed' | 'failed'

    # Synthesized content
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    full_report: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Error tracking
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    sections: Mapped[list["ReportSection"]] = relationship(
        "ReportSection", back_populates="report", cascade="all, delete-orphan"
    )


class ReportSection(Base):
    """Topic section within a report (news, markets, social)."""

    __tablename__ = "report_sections"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    report_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("monitor_reports.id", ondelete="CASCADE")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )

    # Section identification
    topic: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # 'news' | 'markets' | 'social'

    # Section content
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    items: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)

    # Metadata
    sources_count: Mapped[int] = mapped_column(Integer, default=0)
    sentiment_score: Mapped[float | None] = mapped_column(Numeric(3, 2), nullable=True)

    # Relationships
    report: Mapped["MonitorReport"] = relationship(
        "MonitorReport", back_populates="sections"
    )
    monitor_items: Mapped[list["MonitorItem"]] = relationship(
        "MonitorItem", back_populates="section", cascade="all, delete-orphan"
    )


class MonitorItem(Base):
    """Individual data item for granular querying."""

    __tablename__ = "monitor_items"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    section_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("report_sections.id", ondelete="CASCADE")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )

    # Item content
    source: Mapped[str] = mapped_column(String(100), nullable=False)
    source_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    title: Mapped[str | None] = mapped_column(String(500), nullable=True)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Analysis
    sentiment: Mapped[str | None] = mapped_column(
        String(20), nullable=True
    )  # 'positive' | 'negative' | 'neutral'
    relevance_score: Mapped[float | None] = mapped_column(Numeric(3, 2), nullable=True)
    tags: Mapped[list[str] | None] = mapped_column(ARRAY(Text), nullable=True)

    # Raw data
    raw_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Relationships
    section: Mapped["ReportSection"] = relationship(
        "ReportSection", back_populates="monitor_items"
    )
