from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from auth import get_current_user
import models
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/feedback", tags=["Feedback"])

@router.post("/{complaint_id}")
def submit_feedback(
    complaint_id: int,
    rating: int,
    comments: str = "",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    complaint = db.query(models.Complaint).filter(
        models.Complaint.id == complaint_id
    ).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    if complaint.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your complaint")
    if complaint.status not in [models.StatusEnum.resolved, models.StatusEnum.closed]:
        raise HTTPException(status_code=400, detail="Can only rate resolved complaints")
    existing = db.query(models.Feedback).filter(
        models.Feedback.complaint_id == complaint_id
    ).first()
    if existing:
        existing.rating   = rating
        existing.comments = comments
        db.commit()
        return {"message": "Feedback updated"}
    feedback = models.Feedback(
        complaint_id=complaint_id,
        rating=rating,
        comments=comments
    )
    db.add(feedback)
    db.commit()
    return {"message": "Feedback submitted successfully"}

@router.get("/filtered")
def get_filtered_feedback(
    rating:   Optional[int] = Query(None),
    period:   Optional[str] = Query(None),
    agent_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in [models.RoleEnum.admin, models.RoleEnum.supervisor]:
        raise HTTPException(status_code=403, detail="Not authorized")

    query = db.query(models.Feedback)

    if rating:
        query = query.filter(models.Feedback.rating == rating)

    if period:
        now = datetime.now()
        if period == "weekly":
            query = query.filter(models.Feedback.created_at >= now - timedelta(days=7))
        elif period == "monthly":
            query = query.filter(models.Feedback.created_at >= now - timedelta(days=30))
        elif period == "yearly":
            query = query.filter(models.Feedback.created_at >= now - timedelta(days=365))

    feedbacks = query.all()

    results = []
    for f in feedbacks:
        complaint = db.query(models.Complaint).filter(
            models.Complaint.id == f.complaint_id
        ).first()
        if agent_id and complaint and complaint.assigned_to != agent_id:
            continue
        agent = None
        if complaint and complaint.assigned_to:
            agent = db.query(models.User).filter(
                models.User.id == complaint.assigned_to
            ).first()
        results.append({
            "id":               f.id,
            "complaint_number": complaint.complaint_number if complaint else "—",
            "complaint_title":  complaint.title            if complaint else "—",
            "rating":           f.rating,
            "comments":         f.comments,
            "created_at":       f.created_at.isoformat(),
            "agent_name":       agent.name if agent else "Unassigned",
        })

    avg = round(sum(r["rating"] for r in results) / len(results), 1) if results else 0
    return {
        "feedbacks":      results,
        "total":          len(results),
        "average_rating": avg,
    }

@router.get("/")
def get_all_feedback(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in [models.RoleEnum.admin, models.RoleEnum.supervisor]:
        raise HTTPException(status_code=403, detail="Not authorized")
    feedbacks = db.query(models.Feedback).all()
    total     = len(feedbacks)
    if total == 0:
        return {"average_rating": 0, "total": 0, "breakdown": {}}
    avg       = round(sum(f.rating for f in feedbacks) / total, 1)
    breakdown = {str(i): len([f for f in feedbacks if f.rating == i]) for i in range(1, 6)}
    return {"average_rating": avg, "total": total, "breakdown": breakdown}

@router.get("/{complaint_id}")
def get_feedback(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    feedback = db.query(models.Feedback).filter(
        models.Feedback.complaint_id == complaint_id
    ).first()
    if not feedback:
        return None
    return feedback