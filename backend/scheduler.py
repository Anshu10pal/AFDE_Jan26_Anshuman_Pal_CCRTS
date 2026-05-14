from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from database import SessionLocal
import models
from datetime import datetime

sla_hours = {
    models.PriorityEnum.critical: 4,
    models.PriorityEnum.high:     24,
    models.PriorityEnum.medium:   48,
    models.PriorityEnum.low:      72,
}

def auto_escalate():
    db: Session = SessionLocal()
    try:
        now = datetime.now()
        open_statuses = [
            models.StatusEnum.open,
            models.StatusEnum.assigned,
            models.StatusEnum.in_progress,
        ]
        complaints = db.query(models.Complaint).filter(
            models.Complaint.status.in_(open_statuses)
        ).all()

        escalated_count = 0
        for c in complaints:
            limit     = sla_hours.get(c.priority, 72)
            age_hours = (now - c.created_at).total_seconds() / 3600
            if age_hours > limit:
                old_status  = c.status.value if hasattr(c.status, 'value') else str(c.status)
                c.status    = models.StatusEnum.escalated
                db.add(models.ComplaintHistory(
                    complaint_id=c.id,
                    updated_by=1,  # System user (admin id=1)
                    old_status=old_status,
                    new_status="Escalated",
                    comment=f"Auto-escalated: SLA breached ({round(age_hours, 1)}h > {limit}h limit)"
                ))
                escalated_count += 1

        if escalated_count > 0:
            db.commit()
            print(f"[Scheduler] Auto-escalated {escalated_count} complaints at {now}")
        else:
            print(f"[Scheduler] No escalations needed at {now}")
    except Exception as e:
        print(f"[Scheduler] Error: {e}")
        db.rollback()
    finally:
        db.close()

def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(auto_escalate, 'interval', minutes=30, id='auto_escalate')
    scheduler.start()
    print("[Scheduler] Auto-escalation scheduler started — runs every 30 minutes")
    return scheduler