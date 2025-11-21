from fastapi import Depends, HTTPException
import jwt, os
from app.db.database import SessionLocal
from models import User

SECRET_KEY = os.getenv("SECRET_KEY", "secret123")

def get_current_user(token: str):
    try:
        data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return data["user_id"]
    except:
        raise HTTPException(status_code=401, detail="Invalid token")
