from fastapi import FastAPI
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# لو عندك قوالب HTML
templates = Jinja2Templates(directory="app/templates")

# لو عندك ملفات static
app.mount("/static", StaticFiles(directory="app/static"), name="static")


@app.get("/")
def home():
    return {"message": "Hello FastAPI"}
