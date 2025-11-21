from passlib.context import CryptContext
import jwt
import os
import hashlib
from datetime import datetime, timedelta

SECRET_KEY = "YOUR_SECRET_KEY"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

MAX_BCRYPT_LENGTH = 72 

def hash_password(password: str, salt: str = None):
    if not salt:
        salt = os.urandom(16).hex()  
    pwd_salt = password + salt
    hashed = hashlib.sha256(pwd_salt.encode("utf-8")).hexdigest()
    return f"{salt}${hashed}" 

def verify_password(password: str, hashed_password: str):
    salt, hash_stored = hashed_password.split("$")
    pwd_salt = password + salt
    hash_check = hashlib.sha256(pwd_salt.encode("utf-8")).hexdigest()
    return hash_check == hash_stored

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
