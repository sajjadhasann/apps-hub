from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError, ExpiredSignatureError
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.db.models.user import User
from app.core.config import settings

SECRET_KEY = settings.JWT_SECRET_KEY
ALGORITHM = settings.ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    
    except ExpiredSignatureError as e:
        raise HTTPException(status_code=401, detail="Token expired:  {e}")
    
    except JWTError as e: 
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user


def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role.value != "Admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return current_user
