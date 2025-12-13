from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Assuming your connection URL comes from Pydantic settings
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

# Check if the URL already has search_path set (optional, but clean)
if 'options' not in SQLALCHEMY_DATABASE_URL and 'search_path' not in SQLALCHEMY_DATABASE_URL:
    # Append the option to explicitly set the search path to public
    if '?' in SQLALCHEMY_DATABASE_URL:
        # If query params already exist, append with '&'
        SQLALCHEMY_DATABASE_URL += '&options=-csearch_path%3Dpublic'
    else:
        # If no query params, append with '?'
        # Note: We use URL encoding for special characters ('=' becomes '%3D')
        SQLALCHEMY_DATABASE_URL += '?options=-csearch_path%3Dpublic'
        
# Example of engine creation (using the modified URL):
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    # The pool_pre_ping is a common fix for cloud connection stability
    pool_pre_ping=True,
    echo=True
)

# # 1. engine
# engine = create_engine(
#     settings.DATABASE_URL,
#     echo=True       # Print in Consol
# )

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
