from sqlalchemy import Column, Integer, String, Enum
from app.db.database import Base
import enum


class ApplicationCategory(str, enum.Enum):
    erp = "ERP"
    ticketing = "Ticketing"
    hr = "HR"
    dms = "DMS"
    other = "Other"


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    category = Column(Enum(ApplicationCategory))
    owner = Column(String)
    status = Column(String, default="Active")
