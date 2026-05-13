from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from database import get_db
from auth import get_current_user
import models, schemas
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=schemas.DashboardStats)
def get_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Complaint)
    if current_user.role == models.RoleEnum.customer:
        query = query.filter(models.Complaint.customer_id == current_user.id)
    total       = query.count()
    open_       = query.filter(models.Complaint.status == models.StatusEnum.open).count()
    in_progress = query.filter(models.Complaint.status == models.StatusEnum.in_progress).count()
    resolved    = query.filter(models.Complaint.status == models.StatusEnum.resolved).count()
    closed      = query.filter(models.Complaint.status == models.StatusEnum.closed).count()
    escalated   = query.filter(models.Complaint.status == models.StatusEnum.escalated).count()
    return {
        "total": total, "open": open_, "in_progress": in_progress,
        "resolved": resolved, "closed": closed, "escalated": escalated
    }

@router.get("/agent-leaderboard")
def get_agent_leaderboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    agents = db.query(models.User).filter(models.User.role == models.RoleEnum.agent).all()
    result = []
    for agent in agents:
        total    = db.query(models.Complaint).filter(models.Complaint.assigned_to == agent.id).count()
        resolved = db.query(models.Complaint).filter(
            models.Complaint.assigned_to == agent.id,
            models.Complaint.status == models.StatusEnum.resolved
        ).count()
        rate = round((resolved / total * 100)) if total > 0 else 0
        result.append({
            "id": agent.id,
            "name": agent.name,
            "total": total,
            "resolved": resolved,
            "rate": rate
        })
    result.sort(key=lambda x: x["resolved"], reverse=True)
    return result[:5]

@router.get("/monthly-trend")
def get_monthly_trend(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    result = []
    for i in range(5, -1, -1):
        date   = datetime.now() - timedelta(days=i * 30)
        month  = date.strftime("%b")
        count  = db.query(models.Complaint).filter(
            extract('month', models.Complaint.created_at) == date.month,
            extract('year',  models.Complaint.created_at) == date.year
        ).count()
        result.append({"month": month, "count": count})
    return result

@router.get("/sla-breaches")
def get_sla_breaches(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    now = datetime.now()
    sla_hours = {
        models.PriorityEnum.critical: 4,
        models.PriorityEnum.high:     24,
        models.PriorityEnum.medium:   48,
        models.PriorityEnum.low:      72,
    }
    open_statuses = [
        models.StatusEnum.open,
        models.StatusEnum.assigned,
        models.StatusEnum.in_progress,
        models.StatusEnum.escalated
    ]
    breaches = []
    complaints = db.query(models.Complaint).filter(
        models.Complaint.status.in_(open_statuses)
    ).all()
    for c in complaints:
        hours_limit = sla_hours.get(c.priority, 72)
        age_hours   = (now - c.created_at).total_seconds() / 3600
        if age_hours > hours_limit:
            breaches.append({
                "id": c.id,
                "complaint_number": c.complaint_number,
                "title": c.title,
                "priority": c.priority,
                "status": c.status,
                "age_hours": round(age_hours),
                "sla_hours": hours_limit
            })
    breaches.sort(key=lambda x: x["age_hours"], reverse=True)
    return {"count": len(breaches), "breaches": breaches[:10]}