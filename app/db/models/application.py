from sqlalchemy import Column, Integer, String, Enum
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum


class ApplicationCategory(str, enum.Enum):
    erp = "ERP"
    ticketing = "Ticketing"
    hr = "HR"
    dms = "DMS"
    other = "Other"

class ApplicationStatus(str, enum.Enum):
    active = "Active"
    inactive = "Inactive"


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    category = Column(Enum(ApplicationCategory))
    owner = Column(String)
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.active)

    accesses = relationship("UserApplicationAccess", back_populates="application")
