from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# 1. engine
engine = create_engine(
    settings.DATABASE_URL,
    echo=True       # Print in Consol
)

# 2. SessionLocal
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 3. Base class  
Base = declarative_base()

# 4. Dependency in FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
