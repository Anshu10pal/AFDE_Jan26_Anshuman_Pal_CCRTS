from database import SessionLocal, engine, Base
import models
from datetime import datetime, timedelta
import random

def seed_complaints():
    db = SessionLocal()

    customers = db.query(models.User).filter(models.User.role == models.RoleEnum.customer).all()
    agents = db.query(models.User).filter(models.User.role == models.RoleEnum.agent).all()
    categories = db.query(models.Category).all()

    if not customers or not categories:
        print("❌ No customers or categories found. Run seed.py first!")
        return

    existing_count = db.query(models.Complaint).count()
    needed = 100 - existing_count

    if needed <= 0:
        print(f"✅ Already have {existing_count} complaints. Nothing to add.")
        db.close()
        return

    print(f"Adding {needed} complaints...")

    titles = [
        "Internet connection keeps dropping",
        "Wrong amount charged on monthly bill",
        "Product arrived with broken packaging",
        "Unable to login to my account",
        "Delivery delayed by more than 2 weeks",
        "Service outage since yesterday morning",
        "Received wrong product in my order",
        "Rude behavior from customer service rep",
        "Refund not processed after 30 days",
        "App crashes on every login attempt",
        "Double charged for single transaction",
        "Network speed extremely slow",
        "Account got locked without reason",
        "Email notifications not working",
        "Payment gateway keeps timing out",
        "Product quality does not match description",
        "Support team not responding to tickets",
        "Incorrect invoice details sent",
        "Service promised but not delivered",
        "Data loss after system update",
        "Subscription cancelled without consent",
        "Password reset link not received",
        "Wrong address used for delivery",
        "Damaged item received in shipment",
        "Overcharged for premium plan",
    ]

    descriptions = [
        "This issue has been affecting my work for several days and needs urgent attention.",
        "I have been trying to resolve this through normal channels but received no help.",
        "The problem started after the recent update and has not been fixed yet.",
        "Multiple attempts to contact support have gone unanswered.",
        "This is causing significant inconvenience and financial loss.",
        "I need this resolved as soon as possible as it affects my business operations.",
        "I have all evidence and screenshots ready to share if needed.",
        "This is the third time I am facing this same issue.",
        "The issue persists despite previous assurances that it was resolved.",
        "I am a long-time customer and expect better service quality.",
    ]

    statuses = list(models.StatusEnum)
    priorities = list(models.PriorityEnum)

    # Step 1 — Add all complaints first and commit to get real IDs
    new_complaints = []
    for i in range(needed):
        customer = random.choice(customers)
        category = random.choice(categories)
        agent = random.choice(agents) if agents else None
        status = random.choice(statuses)
        priority = random.choice(priorities)
        days_ago = random.randint(0, 60)
        created = datetime.now() - timedelta(days=days_ago)

        complaint = models.Complaint(
            complaint_number=f"CMP-{created.strftime('%Y%m%d')}-{str(existing_count + i + 1).zfill(4)}",
            customer_id=customer.id,
            category_id=category.id,
            assigned_to=agent.id if agent and status != models.StatusEnum.open else None,
            title=random.choice(titles),
            description=random.choice(descriptions),
            priority=priority,
            status=status,
            created_at=created,
            updated_at=created
        )
        db.add(complaint)
        new_complaints.append((complaint, agent, status, created))

    db.commit()  # Commit first so complaints get real IDs
    print(f"✅ {needed} complaints inserted.")

    # Step 2 — Now add history using real complaint IDs
    history_count = 0
    for complaint, agent, status, created in new_complaints:
        if status != models.StatusEnum.open and agent:
            db.add(models.ComplaintHistory(
                complaint_id=complaint.id,  # Now has a real ID
                updated_by=agent.id,
                old_status="Open",
                new_status=status.value,
                comment=f"Status updated by {agent.name}",
                updated_at=created + timedelta(hours=random.randint(1, 24))
            ))
            history_count += 1

    db.commit()
    db.close()

    total = existing_count + needed
    print(f"✅ {history_count} history records inserted.")
    print(f"🎉 Total complaints in DB: {total}")

if __name__ == "__main__":
    seed_complaints()