from sqlalchemy import Column, Integer, String, Enum, DateTime
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum
from sqlalchemy.sql import func


class ApplicationCategory(str, enum.Enum):
    erp = "ERP"
    ticketing = "Ticketing"
    hr = "HR"
    dms = "DMS"
    other = "Other"

class ApplicationStatus(str, enum.Enum):
    active = "Active"
    pause = "Pause"
    cancel = "Cancel"


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    category = Column(Enum(ApplicationCategory))
    owner = Column(String)
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.active)
    
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())


    accesses = relationship("UserApplicationAccess", back_populates="application")
    tickets = relationship("Ticket", back_populates="application")
    