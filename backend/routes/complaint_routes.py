from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from auth import get_current_user
import models, schemas
from datetime import datetime

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])

def generate_complaint_number():
    return f"CMP-{datetime.now().strftime('%Y%m%d%H%M%S')}"

@router.post("/", response_model=schemas.ComplaintOut)
def create_complaint(
    complaint: schemas.ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    new_complaint = models.Complaint(
        complaint_number=generate_complaint_number(),
        customer_id=current_user.id,
        title=complaint.title,
        description=complaint.description,
        category_id=complaint.category_id,
        priority=complaint.priority,
        status=models.StatusEnum.open
    )
    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)
    return new_complaint

@router.get("/", response_model=List[schemas.ComplaintOut])
def get_complaints(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Complaint)
    if current_user.role == models.RoleEnum.customer:
        query = query.filter(models.Complaint.customer_id == current_user.id)
    if status:
        query = query.filter(models.Complaint.status == status)
    if priority:
        query = query.filter(models.Complaint.priority == priority)
    if category_id:
        query = query.filter(models.Complaint.category_id == category_id)
    if search:
        query = query.filter(
            models.Complaint.title.contains(search) |
            models.Complaint.description.contains(search)
        )
    return query.order_by(models.Complaint.created_at.desc()).all()

@router.get("/{complaint_id}", response_model=schemas.ComplaintOut)
def get_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint

@router.put("/{complaint_id}", response_model=schemas.ComplaintOut)
def update_complaint(
    complaint_id: int,
    updates: schemas.ComplaintUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    old_status = complaint.status
    for field, value in updates.dict(exclude_unset=True).items():
        setattr(complaint, field, value)
    if updates.status and updates.status != old_status:
        history = models.ComplaintHistory(
            complaint_id=complaint_id,
            updated_by=current_user.id,
            old_status=old_status,
            new_status=updates.status,
            comment=f"Status updated by {current_user.name}"
        )
        db.add(history)
    db.commit()
    db.refresh(complaint)
    return complaint

@router.delete("/{complaint_id}")
def delete_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in [models.RoleEnum.admin, models.RoleEnum.supervisor]:
        raise HTTPException(status_code=403, detail="Not authorized")
    complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    db.delete(complaint)
    db.commit()
    return {"message": "Complaint deleted successfully"}

@router.get("/{complaint_id}/history", response_model=List[schemas.HistoryOut])
def get_complaint_history(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.ComplaintHistory).filter(
        models.ComplaintHistory.complaint_id == complaint_id
    ).order_by(models.ComplaintHistory.updated_at.desc()).all()