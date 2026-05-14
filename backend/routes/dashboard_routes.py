from fastapi import APIRouter, Depends, HTTPException
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
            "id": agent.id, "name": agent.name,
            "total": total, "resolved": resolved, "rate": rate
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
        date  = datetime.now() - timedelta(days=i * 30)
        month = date.strftime("%b")
        count = db.query(models.Complaint).filter(
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
    now       = datetime.now()
    sla_hours = {
        models.PriorityEnum.critical: 4,
        models.PriorityEnum.high:     24,
        models.PriorityEnum.medium:   48,
        models.PriorityEnum.low:      72,
    }
    open_statuses = [
        models.StatusEnum.open, models.StatusEnum.assigned,
        models.StatusEnum.in_progress, models.StatusEnum.escalated
    ]
    complaints = db.query(models.Complaint).filter(
        models.Complaint.status.in_(open_statuses)
    ).all()
    breaches = []
    for c in complaints:
        hours_limit = sla_hours.get(c.priority, 72)
        age_hours   = (now - c.created_at).total_seconds() / 3600
        if age_hours > hours_limit:
            breaches.append({
                "id":               c.id,
                "complaint_number": c.complaint_number,
                "title":            c.title,
                "priority":         c.priority.value if hasattr(c.priority, 'value') else c.priority,
                "status":           c.status.value   if hasattr(c.status,   'value') else c.status,
                "age_hours":        round(age_hours),
                "sla_hours":        hours_limit
            })
    breaches.sort(key=lambda x: x["age_hours"], reverse=True)
    return {"count": len(breaches), "breaches": breaches[:10]}


@router.get("/average-resolution-time")
def get_average_resolution_time(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    resolved = db.query(models.Complaint).filter(
        models.Complaint.status.in_([
            models.StatusEnum.resolved,
            models.StatusEnum.closed
        ])
    ).all()

    if not resolved:
        return {"average_hours": 0, "total_resolved": 0, "agent_wise": []}

    total_hours = sum(
        (c.updated_at - c.created_at).total_seconds() / 3600
        for c in resolved if c.updated_at and c.created_at
    )
    avg = round(total_hours / len(resolved), 1)

    agents     = db.query(models.User).filter(models.User.role == models.RoleEnum.agent).all()
    agent_wise = []
    for agent in agents:
        agent_resolved = [c for c in resolved if c.assigned_to == agent.id]
        if agent_resolved:
            agent_hours = sum(
                (c.updated_at - c.created_at).total_seconds() / 3600
                for c in agent_resolved if c.updated_at and c.created_at
            )
            agent_wise.append({
                "agent_id":   agent.id,
                "agent_name": agent.name,
                "avg_hours":  round(agent_hours / len(agent_resolved), 1),
                "total":      len(agent_resolved)
            })

    agent_wise.sort(key=lambda x: x["avg_hours"])
    return {"average_hours": avg, "total_resolved": len(resolved), "agent_wise": agent_wise}


@router.get("/sla-health")
def get_sla_health(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    sla_hours = {
        models.PriorityEnum.critical: 4,
        models.PriorityEnum.high:     24,
        models.PriorityEnum.medium:   48,
        models.PriorityEnum.low:      72,
    }
    open_statuses = [
        models.StatusEnum.open, models.StatusEnum.assigned,
        models.StatusEnum.in_progress, models.StatusEnum.escalated
    ]
    now        = datetime.now()
    complaints = db.query(models.Complaint).filter(
        models.Complaint.status.in_(open_statuses)
    ).all()

    buckets = {"critical": [], "warning": [], "moderate": [], "good": [], "safe": []}

    for c in complaints:
        limit    = sla_hours.get(c.priority, 72)
        age      = (now - c.created_at).total_seconds() / 3600
        pct_used = (age / limit) * 100
        item = {
            "id":               c.id,
            "complaint_number": c.complaint_number,
            "title":            c.title,
            "priority":         c.priority.value if hasattr(c.priority, 'value') else c.priority,
            "status":           c.status.value   if hasattr(c.status,   'value') else c.status,
            "pct_used":         round(pct_used, 1),
            "age_hours":        round(age, 1),
            "sla_hours":        limit,
        }
        if pct_used >= 100:  buckets["critical"].append(item)
        elif pct_used >= 75: buckets["warning"].append(item)
        elif pct_used >= 50: buckets["moderate"].append(item)
        elif pct_used >= 25: buckets["good"].append(item)
        else:                buckets["safe"].append(item)

    return {
        "critical": {"label": "SLA Crossed", "color": "#ef4444", "bg": "#fee2e2", "count": len(buckets["critical"]), "items": buckets["critical"]},
        "warning":  {"label": "75% Used",    "color": "#f97316", "bg": "#ffedd5", "count": len(buckets["warning"]),  "items": buckets["warning"]},
        "moderate": {"label": "50% Used",    "color": "#eab308", "bg": "#fef9c3", "count": len(buckets["moderate"]), "items": buckets["moderate"]},
        "good":     {"label": "25% Used",    "color": "#84cc16", "bg": "#f7fee7", "count": len(buckets["good"]),     "items": buckets["good"]},
        "safe":     {"label": "0–25% Used",  "color": "#10b981", "bg": "#d1fae5", "count": len(buckets["safe"]),     "items": buckets["safe"]},
    }


@router.get("/agent-workload")
def get_agent_workload(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in [models.RoleEnum.admin, models.RoleEnum.supervisor]:
        raise HTTPException(status_code=403, detail="Not authorized")

    agents = db.query(models.User).filter(models.User.role == models.RoleEnum.agent).all()

    active_statuses = [
        models.StatusEnum.open, models.StatusEnum.assigned,
        models.StatusEnum.in_progress, models.StatusEnum.escalated,
        models.StatusEnum.pending,
    ]
    sla_hours = {
        models.PriorityEnum.critical: 4,
        models.PriorityEnum.high:     24,
        models.PriorityEnum.medium:   48,
        models.PriorityEnum.low:      72,
    }
    now    = datetime.now()
    result = []

    for agent in agents:
        complaints = db.query(models.Complaint).filter(
            models.Complaint.assigned_to == agent.id,
            models.Complaint.status.in_(active_statuses)
        ).all()
        breached = sum(
            1 for c in complaints
            if (now - c.created_at).total_seconds() / 3600 > sla_hours.get(c.priority, 72)
        )
        result.append({
            "id": agent.id, "name": agent.name, "email": agent.email,
            "total": len(complaints), "breached": breached,
            "by_priority": {
                "Critical": sum(1 for c in complaints if c.priority == models.PriorityEnum.critical),
                "High":     sum(1 for c in complaints if c.priority == models.PriorityEnum.high),
                "Medium":   sum(1 for c in complaints if c.priority == models.PriorityEnum.medium),
                "Low":      sum(1 for c in complaints if c.priority == models.PriorityEnum.low),
            }
        })

    unassigned = db.query(models.Complaint).filter(
        models.Complaint.assigned_to == None,
        models.Complaint.status.in_(active_statuses)
    ).all()

    def sla_remaining(c):
        limit = sla_hours.get(c.priority, 72)
        age   = (now - c.created_at).total_seconds() / 3600
        return limit - age

    unassigned_sorted = sorted(unassigned, key=sla_remaining)
    unassigned_list   = []
    for c in unassigned_sorted:
        limit     = sla_hours.get(c.priority, 72)
        age       = (now - c.created_at).total_seconds() / 3600
        remaining = limit - age
        unassigned_list.append({
            "id":               c.id,
            "complaint_number": c.complaint_number,
            "title":            c.title,
            "priority":         c.priority.value if hasattr(c.priority, 'value') else c.priority,
            "status":           c.status.value   if hasattr(c.status,   'value') else c.status,
            "age_hours":        round(age, 1),
            "sla_hours":        limit,
            "sla_remaining":    round(remaining, 1),
            "breached":         remaining < 0,
            "created_at":       c.created_at.isoformat(),
            "category":         c.category.name if c.category else "—",
        })

    return {
        "agents":           result,
        "unassigned":       unassigned_list,
        "unassigned_count": len(unassigned_list),
    }