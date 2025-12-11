from fastapi import FastAPI, Request, Form, Depends, Query
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from app.api.routes.auth import router as auth_router
from app.api.routes.applications import router as applications_router
from app.api.routes.access import router as access_router
from app.api.routes.users import router as users_router
from app.api.routes.tickets import router as tickets_router
from app.api.routes.chatbot import router as chatbot_router
from starlette.middleware.cors import CORSMiddleware

# --- FastAPI App Setup ---
app = FastAPI(title="Enterprise Application Hub")


# --- 1. HEALTH CHECK (MUST BE PRESENT) ---
# This is what Render checks to ensure service is alive.
@app.get("/health", include_in_schema=False)
def health_check():
    return {"status": "ok"}


# --- 2. MIDDLEWARE (Configure CORS) & ROUTERS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],    # Allow all origins for simplicity 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(applications_router)
app.include_router(access_router)
app.include_router(users_router)
app.include_router(tickets_router)
app.include_router(chatbot_router)


# --- 3. SERVE STATIC FILES (ADJUST PATHS) ---
app.mount("/static", StaticFiles(directory="app/static"), name="static")

templates = Jinja2Templates(directory="app/templates")


# --- 4. ROUTERS ---

@app.get("/")
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

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

@app.get("/applications/app")
def application(request: Request, id: int = Query(..., alias="id")):
    return templates.TemplateResponse("applications/app.html", {"request": request, "app_id": id})

@app.get("/applications/create")
def createApplication(request: Request):
    return templates.TemplateResponse("applications/create.html", {"request": request})

@app.get("/applications/edit")
def editApplication(request: Request, id: int = Query(..., alias="id")):
    return templates.TemplateResponse("applications/edit.html", {"request": request, "app_id": id})

@app.get("/access")
def access(request: Request):
    return templates.TemplateResponse("access.html", {"request": request})


@app.get("/tickets")
def tickets(request: Request):
    return templates.TemplateResponse("tickets/index.html", {"request": request})

@app.get("/tickets/ticket")
def ticket(request: Request, id: int = Query(..., alias="id")):
    return templates.TemplateResponse("tickets/ticket.html", {"request": request, "ticket_id": id})

@app.get("/tickets/create")
def createTicket(request: Request):
    return templates.TemplateResponse("tickets/create.html", {"request": request})

@app.get("/tickets/edit")
def editTicket(request: Request, id: int = Query(..., alias="id")):
    return templates.TemplateResponse("tickets/edit.html", {"request": request, "ticket_id": id})
