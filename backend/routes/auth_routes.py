from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = models.User(
        name=user.name,
        email=user.email,
        password=hash_password(user.password),
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=schemas.Token)
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(data={"sub": db_user.email, "role": db_user.role})
    return {"access_token": token, "token_type": "bearer"}

import secrets
from datetime import datetime, timedelta

reset_tokens = {}  # In-memory store: token -> {email, expires}

@router.post("/forgot-password")
def forgot_password(email: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        # Don't reveal if email exists
        return {"message": "If this email exists, a reset token has been generated"}
    token = secrets.token_urlsafe(32)
    reset_tokens[token] = {
        "email":   email,
        "expires": datetime.utcnow() + timedelta(minutes=15)
    }
    # In production this would be emailed — for now return it directly
    return {
        "message": "Reset token generated",
        "reset_token": token,
        "note": "In production this would be sent via email"
    }

@router.post("/reset-password")
def reset_password(token: str, new_password: str, db: Session = Depends(get_db)):
    record = reset_tokens.get(token)
    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    if datetime.utcnow() > record["expires"]:
        del reset_tokens[token]
        raise HTTPException(status_code=400, detail="Reset token has expired")
    user = db.query(models.User).filter(models.User.email == record["email"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.password = hash_password(new_password)
    db.commit()
    del reset_tokens[token]
    return {"message": "Password reset successfully"}