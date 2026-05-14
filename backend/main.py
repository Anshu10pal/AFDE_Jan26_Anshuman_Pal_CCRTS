from routes import auth_routes, complaint_routes, user_routes, dashboard_routes, category_routes, feedback_routes, report_routes
from scheduler import start_scheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models
from routes import auth_routes, complaint_routes, user_routes, dashboard_routes, category_routes


# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Customer Complaint & Resolution Tracking System",
    description="REST API for managing customer complaints",
    version="1.0.0"
)

# CORS - allows React frontend to talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routes
app.include_router(auth_routes.router)
app.include_router(complaint_routes.router)
app.include_router(user_routes.router)
app.include_router(dashboard_routes.router)
app.include_router(category_routes.router)
app.include_router(feedback_routes.router)
app.include_router(report_routes.router)

@app.get("/")
def root():
    return {"message": "CCRTS API is running!", "docs": "/docs"}

scheduler = start_scheduler()