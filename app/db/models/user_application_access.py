from sqlalchemy import Column, Integer, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from app.schemas.application import PermissionLevel
from app.db.database import Base
from pydantic import BaseModel
import enum

class PermissionLevel(enum.Enum):
    read = "read"
    write = "write"
    admin = "admin"

class UserApplicationAccess(Base):
    __tablename__ = "user_application_access"
    __table_args__ = (UniqueConstraint("user_id", "application_id", name="uix_user_app"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    permission_level = Column(Enum(PermissionLevel), default=PermissionLevel.read, nullable=False)

    user = relationship("User", back_populates="app_accesses")
    application = relationship("Application", back_populates="accesses")

class UserAppAccessUpdate(BaseModel):
    permission_level: PermissionLevel