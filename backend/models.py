from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum

class RoleEnum(str, enum.Enum):
    admin = "admin"
    agent = "agent"
    supervisor = "supervisor"
    customer = "customer"

class PriorityEnum(str, enum.Enum):
    low = "Low"
    medium = "Medium"
    high = "High"
    critical = "Critical"

class StatusEnum(str, enum.Enum):
    open = "Open"
    assigned = "Assigned"
    in_progress = "In Progress"
    pending = "Pending Customer Response"
    escalated = "Escalated"
    resolved = "Resolved"
    closed = "Closed"

# class User(Base):
#     __tablename__ = "users"
#     id = Column(Integer, primary_key=True, index=True)
#     name = Column(String(100), nullable=False)
#     email = Column(String(100), unique=True, nullable=False)
#     password = Column(String(255), nullable=False)
#     role = Column(Enum(RoleEnum), default=RoleEnum.customer)
#     created_at = Column(DateTime, default=func.now())
#     complaints = relationship("Complaint", back_populates="customer")
#     assigned_complaints = relationship("Complaint", foreign_keys="Complaint.assigned_to", back_populates="agent")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.customer)
    created_at = Column(DateTime, default=func.now())
    complaints = relationship("Complaint", foreign_keys="[Complaint.customer_id]", back_populates="customer")
    assigned_complaints = relationship("Complaint", foreign_keys="[Complaint.assigned_to]", back_populates="agent")


class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    complaints = relationship("Complaint", back_populates="category")

class Complaint(Base):
    __tablename__ = "complaints"
    id = Column(Integer, primary_key=True, index=True)
    complaint_number = Column(String(20), unique=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("users.id"))
    category_id = Column(Integer, ForeignKey("categories.id"))
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(Enum(PriorityEnum), default=PriorityEnum.medium)
    status = Column(Enum(StatusEnum), default=StatusEnum.open)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    customer = relationship("User", foreign_keys=[customer_id], back_populates="complaints")
    agent = relationship("User", foreign_keys=[assigned_to], back_populates="assigned_complaints")
    category = relationship("Category", back_populates="complaints")
    history = relationship("ComplaintHistory", back_populates="complaint")
    feedback = relationship("Feedback", back_populates="complaint")

class ComplaintHistory(Base):
    __tablename__ = "complaint_history"
    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"))
    updated_by = Column(Integer, ForeignKey("users.id"))
    old_status = Column(String(50))
    new_status = Column(String(50))
    comment = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=func.now())
    complaint = relationship("Complaint", back_populates="history")

class Feedback(Base):
    __tablename__ = "feedback"
    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"))
    rating = Column(Integer)
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())
    complaint = relationship("Complaint", back_populates="feedback")