from database import SessionLocal, engine, Base
import models
from auth import hash_password

Base.metadata.create_all(bind=engine)

def seed():
    db = SessionLocal()

    # --- Categories ---
    categories = [
        "Billing Issues", "Service Disruption", "Product Defects",
        "Technical Problems", "Delivery Delays", "Account Issues",
        "Customer Service Complaints"
    ]
    for cat_name in categories:
        existing = db.query(models.Category).filter(models.Category.name == cat_name).first()
        if not existing:
            db.add(models.Category(name=cat_name))

    # --- Admin Users ---
    admins = [
        {"name": "Admin User",    "email": "admin@ccrts.com",   "password": "Admin@123"},
        {"name": "System Admin",  "email": "sysadmin@ccrts.com","password": "Admin@123"},
    ]
    for a in admins:
        if not db.query(models.User).filter(models.User.email == a["email"]).first():
            db.add(models.User(name=a["name"], email=a["email"],
                password=hash_password(a["password"]), role=models.RoleEnum.admin))

    # --- Supervisor Users ---
    supervisors = [
        {"name": "Sarah Mitchell",  "email": "sarah@ccrts.com",  "password": "Super@123"},
        {"name": "David Reynolds",  "email": "david@ccrts.com",  "password": "Super@123"},
    ]
    for s in supervisors:
        if not db.query(models.User).filter(models.User.email == s["email"]).first():
            db.add(models.User(name=s["name"], email=s["email"],
                password=hash_password(s["password"]), role=models.RoleEnum.supervisor))

    # --- Support Agents ---
    agents = [
        {"name": "John Carter",    "email": "john@ccrts.com",    "password": "Agent@123"},
        {"name": "Priya Sharma",   "email": "priya@ccrts.com",   "password": "Agent@123"},
        {"name": "Mike Johnson",   "email": "mike@ccrts.com",    "password": "Agent@123"},
        {"name": "Emily Davis",    "email": "emily@ccrts.com",   "password": "Agent@123"},
        {"name": "Ravi Kumar",     "email": "ravi@ccrts.com",    "password": "Agent@123"},
    ]
    for a in agents:
        if not db.query(models.User).filter(models.User.email == a["email"]).first():
            db.add(models.User(name=a["name"], email=a["email"],
                password=hash_password(a["password"]), role=models.RoleEnum.agent))

    # --- Customers ---
    customers = [
        {"name": "Alice Brown",    "email": "alice@gmail.com",   "password": "Cust@123"},
        {"name": "Bob Wilson",     "email": "bob@gmail.com",     "password": "Cust@123"},
        {"name": "Carol White",    "email": "carol@gmail.com",   "password": "Cust@123"},
        {"name": "Daniel Lee",     "email": "daniel@gmail.com",  "password": "Cust@123"},
        {"name": "Eva Martinez",   "email": "eva@gmail.com",     "password": "Cust@123"},
        {"name": "Frank Thomas",   "email": "frank@gmail.com",   "password": "Cust@123"},
        {"name": "Grace Kim",      "email": "grace@gmail.com",   "password": "Cust@123"},
        {"name": "Henry Scott",    "email": "henry@gmail.com",   "password": "Cust@123"},
        {"name": "Iris Chen",      "email": "iris@gmail.com",    "password": "Cust@123"},
        {"name": "James Walker",   "email": "james@gmail.com",   "password": "Cust@123"},
    ]
    for c in customers:
        if not db.query(models.User).filter(models.User.email == c["email"]).first():
            db.add(models.User(name=c["name"], email=c["email"],
                password=hash_password(c["password"]), role=models.RoleEnum.customer))

    db.commit()
    db.close()
    print("✅ All users seeded successfully!")
    print("\n👑 Admins:      admin@ccrts.com / sysadmin@ccrts.com  →  Admin@123")
    print("👔 Supervisors: sarah@ccrts.com / david@ccrts.com      →  Super@123")
    print("🎧 Agents:      john / priya / mike / emily / ravi @ccrts.com  →  Agent@123")
    print("👤 Customers:   alice / bob / carol / daniel ... @gmail.com    →  Cust@123")

if __name__ == "__main__":
    seed()