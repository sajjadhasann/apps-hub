from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app.db.models.user import User
from app.db.models.user_application_access import UserApplicationAccess
from app.schemas.user import UserOut, UserUpdate 
from app.api.deps import get_db, get_current_user, require_admin


router = APIRouter(prefix="/api/users", tags=["Users"])

@router.get("/", response_model=List[UserOut], dependencies=[Depends(require_admin)])
def list_users(
    search: Optional[str] = Query(None, description="Search by user full name or email"), 
    db: Session = Depends(get_db)
):
    query = db.query(User)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                User.full_name.ilike(search_pattern),
                User.email.ilike(search_pattern)
            )
        )
    
    users = query.order_by(User.full_name).all()
    # print("\n\n",users[0].full_name,"\n\n")
    return users


@router.put("/{user_id}", response_model=UserOut, dependencies=[Depends(require_admin)])
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db)):

    user_obj = db.query(User).get(user_id)
    if not user_obj:
        raise HTTPException(status_code=404, detail="User not found")
    
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(user_obj, k, v)
    
    db.add(user_obj)
    db.commit()
    db.refresh(user_obj)

    return user_obj


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user_obj = db.query(User).get(user_id)
    if not user_obj:
        raise HTTPException(status_code=404, detail="User not found")
    
    try:
        db.query(UserApplicationAccess).filter(UserApplicationAccess.user_id == user_id).delete(synchronize_session=False)
        
        db.delete(user_obj)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error during user deletion: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Could not delete user due to database constraint or error."
        )

    return None
