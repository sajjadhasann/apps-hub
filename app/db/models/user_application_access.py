from sqlalchemy import Column, Integer, ForeignKey, Enum, UniqueConstraint, DateTime
from sqlalchemy.orm import relationship
from app.db.database import Base
from pydantic import BaseModel
import enum
from sqlalchemy.sql import func


class PermissionLevel(enum.Enum):
    read = "read"
    write = "write"
    admin = "admin"

class UserApplicationAccess(Base):
    __tablename__ = "user_application_access"
    __table_args__ = (
        UniqueConstraint("user_id", "application_id", name="uix_user_app"),
        {'schema': 'public'}
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("public.users.id", ondelete="CASCADE"), nullable=False)
    application_id = Column(Integer, ForeignKey("public.applications.id", ondelete="CASCADE"), nullable=False)
    permission_level = Column(Enum(PermissionLevel), default=PermissionLevel.read, nullable=False)
    
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())


    user = relationship("User", back_populates="app_accesses")
    application = relationship("Application", back_populates="accesses")

class UserAppAccessUpdate(BaseModel):
    permission_level: PermissionLevel