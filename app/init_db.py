from db.database import Base, engine
from db.models import User, Application, Ticket, user_application_access 

def init_db():
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    init_db()
