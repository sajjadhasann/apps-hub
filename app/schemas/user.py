from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from app.db.models.user import UserRole 

class UserBase(BaseModel):
    full_name: str = Field(..., min_length=3, max_length=100)
    email: EmailStr
    role: UserRole = UserRole.user
    
    class Config:
        use_enum_values = True 
        from_attributes = True 

class UserOut(UserBase):
    id: int
    full_name: str
    role: UserRole

class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=3, max_length=100)
    role: Optional[UserRole] = None
    
    class Config:
        use_enum_values = True
        from_attributes = True
