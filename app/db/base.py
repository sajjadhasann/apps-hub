from sqlalchemy.orm import declarative_base

Base = declarative_base()

# استورد جميع الموديلات هنا
from app.db.models.user import User
from app.db.models.application import Application
from app.db.models.user_application_access import UserApplicationAccess
from app.db.models.ticket import Ticket
