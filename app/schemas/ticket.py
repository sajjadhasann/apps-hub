from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum as PyEnum

# Re-defining the status Enum for Pydantic schema validation
class TicketStatus(str, PyEnum):
    open = "Open"
    in_progress = "In Progress"
    resolved = "Resolved"

class TicketBase(BaseModel):
    title: str = Field(..., max_length=255)
    description: str
    application_id: int

class TicketCreate(TicketBase):
    pass

class TicketUpdate(BaseModel):
    # Regular users can typically update the title and description
    title: Optional[str] = None
    description: Optional[str] = None
    
    # Status change is usually restricted to Admin/Support roles
    status: Optional[TicketStatus] = None

class TicketOut(TicketBase):
    id: int
    created_by: int
    status: TicketStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        # Enable ORM mode for seamless conversion from SQLAlchemy model
        orm_mode = True
