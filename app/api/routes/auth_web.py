# from fastapi import APIRouter, Request, Form, Depends
# from fastapi.responses import RedirectResponse
# from fastapi.templating import Jinja2Templates
# from sqlalchemy.orm import Session

# from app.db.database import SessionLocal
# from app.db.models.user import User
# from app.core.security import hash_password, verify_password

# router = APIRouter(tags=["Auth Web"])

# templates = Jinja2Templates(directory="app/templates")

# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

# @router.get("/register")
# def register_page(request: Request):
#     return templates.TemplateResponse("register.html", {"request": request})

# @router.post("/register")
# def register_user(
#     request: Request,
#     full_name: str = Form(...),
#     email: str = Form(...),
#     password: str = Form(...),
#     db: Session = Depends(get_db)
# ):
#     user = db.query(User).filter(User.email == email).first()
#     if user:
#         return templates.TemplateResponse(
#             "register.html",
#             {"request": request, "error": "Email already exists"}
#         )

#     new_user = User(
#         full_name=full_name,
#         email=email,
#         hashed_password=hash_password(password)
#     )
#     db.add(new_user)
#     db.commit()
#     return RedirectResponse("/login", status_code=302)
