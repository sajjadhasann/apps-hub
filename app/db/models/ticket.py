from sqlalchemy import Column, Integer, String, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum


class TicketStatus(str, enum.Enum):
    open = "Open"
    in_progress = "In Progress"
    resolved = "Resolved"


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)

    application_id = Column(Integer, ForeignKey("applications.id"))
    created_by = Column(Integer, ForeignKey("users.id"))
    status = Column(Enum(TicketStatus), default=TicketStatus.open)
