from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi import Request, Form, Depends
from sqlalchemy.orm import Session
from app.api.routes.auth import router as auth_router
# from app.api.routes.auth_api import router as api_auth_router
# from app.api.routes.auth_web import router as web_auth_router
from app.db.database import SessionLocal
from app.core.security import verify_password
from app.db.models.user import User

app = FastAPI()

templates = Jinja2Templates(directory="app/templates")

app.mount("/static", StaticFiles(directory="app/static"), name="static")

app.include_router(auth_router)


@app.get("/")
def home():
    return {"message": "FastAPI Day 1 Ready!"}

@app.get("/login")
def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.get("/dashboard")
def dashboard(request: Request):
    return templates.TemplateResponse("dashboard.html", {"request": request})

@app.get("/register")
def register(request: Request):
    return templates.TemplateResponse("register.html", {"request": request})
