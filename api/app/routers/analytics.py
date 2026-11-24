from typing import Optional, List
from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.group import GroupMember
from app.models.activity import ActivityLog
from app.schemas.analytics import DashboardAnalyticsResponse
from app.services.analytics_service import get_dashboard_analytics
from app.utils.dependencies import get_group_member

router = APIRouter(prefix="/groups/{group_id}", tags=["Analytics & Activity"])

@router.get("/analytics", response_model=DashboardAnalyticsResponse)
def get_analytics(
    group_id: int,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    membership: GroupMember = Depends(get_group_member),
    db: Session = Depends(get_db)
):
    return get_dashboard_analytics(db, group_id, from_date, to_date)

@router.get("/activities")
def get_recent_activities(
    group_id: int,
    limit: int = Query(20, le=100),
    membership: GroupMember = Depends(get_group_member),
    db: Session = Depends(get_db)
):
    logs = db.query(ActivityLog)\
        .filter(ActivityLog.group_id == group_id)\
        .order_by(ActivityLog.created_at.desc())\
        .limit(limit).all()
        
    return [
        {
            "id": l.id,
            "action_type": l.action_type,
            "description": l.description,
            "user_name": l.user.full_name if l.user else "System",
            "created_at": l.created_at.isoformat()
        }
        for l in logs
    ]
