from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app.db.models.application import Application, ApplicationCategory, ApplicationStatus
from app.db.models.user import User
from app.schemas.application import ApplicationCreate, ApplicationOut, ApplicationUpdate
from app.api.deps import get_db, get_current_user, require_admin

router = APIRouter(prefix="/api/applications", tags=["Applications"])

@router.get("/", response_model=List[ApplicationOut])
def list_applications(
    search: Optional[str] = Query(None, description="Search by application name or owner"), 
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(Application)

    if category:
        query = query.filter(Application.category == category)
        
    if status:
        query = query.filter(Application.status == status)

    if search:
        search_pattern = f"%{search}%"
        
        query = query.filter(
            or_(
                Application.name.ilike(search_pattern),  
                Application.owner.ilike(search_pattern) 
            )
        )
    
    apps = query.order_by(Application.name).all()
    return apps


# @router.get("/", response_model=List[ApplicationOut])
# def list_applications(
#     q: Optional[str] = Query(None, description="search by name"),
#     category: Optional[str] = Query(None),
#     db: Session = Depends(get_db),
#     current_user = Depends(get_current_user)   # any authenticated user can view
# ):
#     query = db.query(Application)
#     if q:
#         query = query.filter(Application.name.ilike(f"%{q}%"))
#     if category:
#         query = query.filter(Application.category == category)
#     apps = query.order_by(Application.name).all()
#     # print("\nAPPS: \n", apps[0].owner, "\n\n")
#     return apps


@router.post("/create", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
def create_application(payload: ApplicationCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    # print("PAYLOAD: ",payload)
    exists = db.query(Application).filter(Application.name==payload.name).first()
    if exists:
        raise HTTPException(status_code=400, detail="Application with same name exists")
    
    app_data = payload.dict()
    app_data["owner"] = current_user.email 
    app_obj = Application(**app_data)
    print("\napp_obj:  \n",app_obj)
    db.add(app_obj)
    db.commit()
    db.refresh(app_obj)
    
    return app_obj


@router.get("/{app_id}", response_model=ApplicationOut)
def get_application(app_id: int, db: Session = Depends(get_db)):        # , current_user = Depends(get_current_user)
    app_obj = db.query(Application).get(app_id)
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")

    return app_obj


@router.put("/{app_id}", response_model=ApplicationOut, dependencies=[Depends(require_admin)])
def update_application(app_id: int, payload: ApplicationUpdate, db: Session = Depends(get_db)):
    app_obj = db.query(Application).get(app_id)
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")
    
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(app_obj, k, v)
    
    db.add(app_obj)
    db.commit()
    db.refresh(app_obj)

    return app_obj


@router.delete("/{app_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
def delete_application(app_id: int, db: Session = Depends(get_db)):
    app_obj = db.query(Application).get(app_id)
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")
    db.delete(app_obj)
    db.commit()
    return None
