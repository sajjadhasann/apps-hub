from fastapi import Depends
from jose import jwt, JWTError
from app.core.config import settings

def get_current_user(token: str, db: Session):
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.ALGORITHM])
        email = payload.get("sub")
        return db.query(User).filter(User.email == email).first()
    except:
        raise HTTPException(status_code=401, detail="Invalid token")
