from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum

class AppCategory(str, Enum):
    erp = "ERP"
    ticketing = "Ticketing"
    hr = "HR"
    dms = "DMS"
    other = "Other"

class AppStatus(str, Enum):
    active = "Active"
    inactive = "Inactive"
    # pause = "Pause"
    # cancel = "Cancel"

class PermissionLevel(str, Enum):
    read = "read"
    write = "write"
    admin = "admin"

class ApplicationCreate(BaseModel):
    name: str = Field(..., max_length=150)
    category: AppCategory = AppCategory.other

class ApplicationUpdate(BaseModel):
    name: Optional[str]
    category: Optional[AppCategory]
    status: Optional[AppStatus]

class ApplicationOut(BaseModel):
    id: int
    name: str
    category: AppCategory
    owner: str
    status: AppStatus
    permission_level: Optional[str] = None 

class UserAppAccessCreate(BaseModel):
    user_id: int
    application_id: int
    permission_level: PermissionLevel

class UserAppAccessOut(BaseModel):
    id: int
    user_id: int
    application_id: int
    permission_level: PermissionLevel

    class Config:
        orm_mode = True
        from_attributes = True
