from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from models import RoleEnum, PriorityEnum, StatusEnum

# --- User Schemas ---
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[RoleEnum] = RoleEnum.customer

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: RoleEnum
    created_at: datetime
    class Config:
        from_attributes = True

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

# --- Category Schemas ---
class CategoryCreate(BaseModel):
    name: str

class CategoryOut(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True

# --- Complaint Schemas ---
class ComplaintCreate(BaseModel):
    title: str
    description: str
    category_id: int
    priority: Optional[PriorityEnum] = PriorityEnum.medium

class ComplaintUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    priority: Optional[PriorityEnum] = None
    status: Optional[StatusEnum] = None
    assigned_to: Optional[int] = None
    resolution_note: Optional[str] = None

class ComplaintOut(BaseModel):
    id: int
    complaint_number: str
    title: str
    description: str
    priority: PriorityEnum
    status: StatusEnum
    created_at: datetime
    updated_at: datetime
    assigned_to: Optional[int] = None
    customer: Optional[UserOut]
    category: Optional[CategoryOut]
    agent: Optional[UserOut] = None
    class Config:
        from_attributes = True

# --- History Schemas ---
class HistoryOut(BaseModel):
    id:              int
    old_status:      str
    new_status:      str
    comment:         Optional[str]
    resolution_note: Optional[str] = None
    updated_at:      datetime
    class Config:
        from_attributes = True

# --- Feedback Schemas ---
class FeedbackCreate(BaseModel):
    rating: int
    comments: Optional[str] = None

class FeedbackOut(BaseModel):
    id: int
    rating: int
    comments: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True

# --- Dashboard Schemas ---
class DashboardStats(BaseModel):
    total: int
    open: int
    in_progress: int
    resolved: int
    closed: int
    escalated: int