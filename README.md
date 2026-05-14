# Customer Complaint & Resolution Tracking System (CCRTS)

A full-stack web application for managing, tracking, and resolving customer complaints. Built with React, FastAPI, and MySQL.

---

## Project Overview

The Customer Complaint & Resolution Tracking System is a centralized platform that enables organizations to efficiently manage customer complaints from registration to resolution. The system supports multiple user roles, SLA tracking, real-time dashboards, and complete complaint lifecycle management.

### Key Features

- Role-based access control (Admin, Supervisor, Agent, Customer)
- Complaint registration with auto-generated complaint numbers
- Real-time dashboard with charts and analytics
- SLA breach detection and alerts
- Status workflow management with full history tracking
- Agent performance leaderboard
- Search and filter across all complaints
- Paginated complaint listing (25 / 50 / 75 / 100 per page)
- Complaint detail with timeline-style status history
- Success popup with complaint number on ticket creation

---

## Technology Stack

| Layer      | Technology         |
|------------|--------------------|
| Frontend   | React.js (Vite)    |
| Styling    | Custom CSS         |
| Charts     | Recharts           |
| Backend    | Python + FastAPI   |
| Database   | MySQL 8.x          |
| ORM        | SQLAlchemy         |
| Auth       | JWT (python-jose)  |
| API Docs   | Swagger UI (auto)  |

---

## Project Structure

```
CCRTS/
│
├── backend/
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth_routes.py
│   │   ├── complaint_routes.py
│   │   ├── user_routes.py
│   │   ├── dashboard_routes.py
│   │   └── category_routes.py
│   ├── venv/
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── database.py
│   ├── auth.py
│   ├── seed.py
│   ├── seed_complaints.py
│   ├── .env
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Complaints.jsx
│   │   │   ├── NewComplaint.jsx
│   │   │   ├── ComplaintDetail.jsx
│   │   │   └── Users.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
│
├── database/
│   └── schema.sql
│
├── screenshots/
├── docs/
├── .gitignore
└── README.md
```

---

## Database Schema

| Table              | Description                          |
|--------------------|--------------------------------------|
| users              | All system users with roles          |
| roles              | Admin, Supervisor, Agent, Customer   |
| complaints         | Core complaint records               |
| complaint_history  | Status change audit trail            |
| categories         | Complaint categories                 |
| feedback           | Customer satisfaction ratings        |

### Complaint Status Flow

```
Open → Assigned → In Progress → Resolved → Closed
                      ↓
                  Escalated
                      ↓
              Pending Customer Response
```

### SLA Rules

| Priority | Resolution Time |
|----------|----------------|
| Critical | 4 Hours        |
| High     | 24 Hours       |
| Medium   | 48 Hours       |
| Low      | 72 Hours       |

---

## Setup Instructions

### Prerequisites

- Python 3.10+
- Node.js v18+
- MySQL 8.x
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Anshu10pal/AFDE_Jan26_Anshuman_Pal_CCRTS
cd AFDE_Jan26_Anshuman_Pal_CCRTS
```

### 2. Database Setup

Start MySQL and run:

```sql
CREATE DATABASE ccrts_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Backend Setup

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in the `backend/` folder:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ccrts_db
SECRET_KEY=ccrts_super_secret_key_2024
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

Seed the database:

```bash
python seed.py
python seed_complaints.py
```

Start the backend server:

```bash
uvicorn main:app --reload
```

Backend runs at: `http://127.0.0.1:8000`
API Docs at: `http://127.0.0.1:8000/docs`

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## API Endpoints

### Authentication

| Method | Endpoint              | Description        | Auth |
|--------|-----------------------|--------------------|------|
| POST   | /api/auth/register    | Register new user  | No   |
| POST   | /api/auth/login       | Login and get token| No   |

### Complaints

| Method | Endpoint                        | Description              | Auth |
|--------|---------------------------------|--------------------------|------|
| POST   | /api/complaints                 | Create complaint         | Yes  |
| GET    | /api/complaints                 | List all complaints      | Yes  |
| GET    | /api/complaints/{id}            | Get complaint by ID      | Yes  |
| PUT    | /api/complaints/{id}            | Update complaint         | Yes  |
| DELETE | /api/complaints/{id}            | Delete complaint         | Yes  |
| GET    | /api/complaints/{id}/history    | Get status history       | Yes  |

### Dashboard

| Method | Endpoint                          | Description              | Auth |
|--------|-----------------------------------|--------------------------|------|
| GET    | /api/dashboard/stats              | Complaint statistics     | Yes  |
| GET    | /api/dashboard/agent-leaderboard  | Agent performance        | Yes  |
| GET    | /api/dashboard/monthly-trend      | Monthly complaint trend  | Yes  |
| GET    | /api/dashboard/sla-breaches       | SLA breach alerts        | Yes  |

### Users

| Method | Endpoint                | Description        | Auth  |
|--------|-------------------------|--------------------|-------|
| GET    | /api/users              | List all users     | Admin |
| GET    | /api/users/me           | Get current user   | Yes   |
| PUT    | /api/users/{id}/role    | Update user role   | Admin |

### Categories

| Method | Endpoint          | Description          | Auth  |
|--------|-------------------|----------------------|-------|
| POST   | /api/categories   | Create category      | Admin |
| GET    | /api/categories   | List all categories  | No    |

---

## Default Login Credentials

| Role       | Email                  | Password     |
|------------|------------------------|--------------|
| Admin      | admin@ccrts.com        | Admin@123    |
| Supervisor | sarah@ccrts.com        | Super@123    |
| Agent      | john@ccrts.com         | Agent@123    |
| Customer   | alice@gmail.com        | Cust@123     |

---

## Complaint Categories

- Billing Issues
- Service Disruption
- Product Defects
- Technical Problems
- Delivery Delays
- Account Issues
- Customer Service Complaints

---

## User Roles and Permissions

| Feature                  | Admin | Supervisor | Agent | Customer |
|--------------------------|-------|------------|-------|----------|
| View all complaints      | ✅    | ✅         | ✅    | ❌       |
| View own complaints      | ✅    | ✅         | ✅    | ✅       |
| Create complaint         | ✅    | ✅         | ✅    | ✅       |
| Update complaint status  | ✅    | ✅         | ✅    | ❌       |
| Delete complaint         | ✅    | ✅         | ❌    | ❌       |
| View dashboard           | ✅    | ✅         | ✅    | ✅       |
| Manage users             | ✅    | ❌         | ❌    | ❌       |
| Manage categories        | ✅    | ❌         | ❌    | ❌       |

---

## Dashboard Features

- **Stat cards** — Total, Open, In Progress, Resolved, Escalated, Closed (clickable with modal)
- **SLA breach banner** — Real-time alert for overdue complaints
- **Bar chart** — Complaints grouped by category
- **Line chart** — Monthly complaint volume trend (last 6 months)
- **Agent leaderboard** — Top 5 agents by resolution rate with progress bars

---

## Requirements

```
fastapi
uvicorn
sqlalchemy
pymysql
cryptography
python-jose
passlib
pydantic[email]
python-dotenv
alembic
python-multipart
bcrypt==4.0.1
```

Generate `requirements.txt`:

```bash
pip freeze > requirements.txt
```

---

## Screenshots

| Screen              | Description                          |
|---------------------|--------------------------------------|
| Login               | JWT-based authentication             |
| Dashboard           | Stats, charts, leaderboard, SLA      |
| Complaints List     | Paginated with search and filters    |
| New Complaint       | Form with success popup              |
| Complaint Detail    | Full info card with timeline history |
| User Management     | Admin-only role management           |

---

## GitHub Commit Convention

```
Added complaint creation API
Implemented dashboard stats endpoint
Integrated React frontend with FastAPI backend
Fixed SLA breach calculation logic
Added agent leaderboard feature
Seeded 100 test complaints
```

---

## Future Enhancements

- AI-based complaint categorization
- Email notification system
- WhatsApp/SMS integration
- Mobile application
- Sentiment analysis on complaint descriptions
- Predictive SLA breach alerts
- Export complaints to PDF/Excel
- Multi-language support

---

## Author

**Name:** Your Name  
**Batch:** AFDE Jan 2026  
**Project Code:** CCRTS  
**GitHub:** https://github.com/YOUR_USERNAME/AFDE_Jan26_YourName_CCRTS

---

## License

This project is developed as part of the AFDE Capstone Program.
