from fastapi import APIRouter, Depends, Form, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.db.models.user import User, UserRole
from app.core.security import hash_password, verify_password, create_access_token
from app.api.deps import get_current_user
from app.core.config import settings 

router = APIRouter(prefix="/api/auth")

ADMIN_SECRET_KEY = settings.ADMIN_CREATION_SECRET

@router.post("/register")
def register(
    full_name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    admin_key: Optional[str] = Query(
        None,
        description="Secret Key of rigester user with ADMIN permissions."
    ),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == email).first()
    if user:
        raise HTTPException(status_code=400, detail="Email already registered!")

    user_role = UserRole.user

    if admin_key and admin_key == ADMIN_SECRET_KEY:
        user_role = UserRole.admin
        message = "Account rigestered successfully with ADMIN permissions."
    else:
        message = "Account rigestered successfully with USER permissions."

    new_user = User(
        full_name=full_name,
        email=email,
        hashed_password=hash_password(password),
        role=user_role
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": message, "role": new_user.role.value, "user_email": new_user.email}


@router.post("/login")
def login(
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me")
def get_user_info(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role
    }