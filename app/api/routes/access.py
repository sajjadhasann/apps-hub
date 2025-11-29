from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.models.user_application_access import UserApplicationAccess, UserAppAccessUpdate
from app.db.models.user import User 
from app.db.models.application import Application
from app.schemas.application import UserAppAccessCreate, UserAppAccessOut, PermissionLevel 
from app.api.deps import get_db, get_current_user, require_admin


router = APIRouter(prefix="/api/access", tags=["Access"])

@router.get("/", response_model=List[UserAppAccessOut], dependencies=[Depends(require_admin)])
def list_accesses(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Admins see all, normal users see only their accesses
    if current_user.role == "Admin":
        return db.query(UserApplicationAccess).all()
    
    return db.query(UserApplicationAccess).filter(UserApplicationAccess.user_id == current_user.id).all()


@router.post("/", response_model=UserAppAccessOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
def grant_access(payload: UserAppAccessCreate, db: Session = Depends(get_db)):
    if not db.query(User).filter(User.id == payload.user_id).first():
        raise HTTPException(status_code=404, detail=f"User with ID {payload.user_id} not found")

    if not db.query(Application).filter(Application.id == payload.application_id).first():
        raise HTTPException(status_code=404, detail=f"Application with ID {payload.application_id} not found")
    
    exists = db.query(UserApplicationAccess).filter(
        UserApplicationAccess.user_id == payload.user_id,
        UserApplicationAccess.application_id == payload.application_id
    ).first()
    if exists:
        raise HTTPException(status_code=400, detail="Access already exists")
    
    obj = UserApplicationAccess(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    
    return obj


@router.put("/{access_id}", response_model=UserAppAccessOut, dependencies=[Depends(require_admin)])
def update_access(access_id: int, payload: UserAppAccessUpdate, db: Session = Depends(get_db)):
    obj = db.query(UserApplicationAccess).get(access_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Access record not found")
        
    obj.permission_level = payload.permission_level
    
    db.add(obj) 
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{access_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
def delete_access(access_id: int, db: Session = Depends(get_db)):
    obj = db.query(UserApplicationAccess).get(access_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Access not found")
    db.delete(obj)
    db.commit()
    return None
