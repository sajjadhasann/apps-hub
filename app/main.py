from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi import Request, Form, Depends
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.core.security import verify_password
from app.db.models.user import User
from app.api.routes.auth import router as auth_router
from app.api.routes.applications import router as applications_router
from app.api.routes.access import router as access_router

app = FastAPI()

templates = Jinja2Templates(directory="app/templates")

app.mount("/static", StaticFiles(directory="app/static"), name="static")

app.include_router(auth_router)
app.include_router(applications_router)
app.include_router(access_router)

@app.get("/")
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})
    # return {"message": "FastAPI Day 1 Ready!"}

@app.get("/login")
def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.get("/dashboard")
def dashboard(request: Request):
    return templates.TemplateResponse("dashboard.html", {"request": request})

@app.get("/register")
def register(request: Request):
    return templates.TemplateResponse("register.html", {"request": request})

@app.get("/applications")
def applications(request: Request):
    return templates.TemplateResponse("applications/index.html", {"request": request})

@app.get("/applications/create")
def createApplication(request: Request):
    return templates.TemplateResponse("applications/create.html", {"request": request})
