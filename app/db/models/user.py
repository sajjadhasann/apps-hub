from sqlalchemy import Column, Integer, String, Enum, DateTime
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum
from sqlalchemy.sql import func


class UserRole(str, enum.Enum):
    admin = "Admin"
    user = "User"


class User(Base):
    __tablename__ = "users"
    __table_args__ = {'schema': 'public'}
    
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.user)
    
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())


    app_accesses = relationship("UserApplicationAccess", back_populates="user", cascade="all, delete-orphan")
    created_tickets = relationship("Ticket", back_populates="creator")