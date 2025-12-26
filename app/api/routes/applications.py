from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, aliased
from sqlalchemy import or_
from typing import List, Optional
from app.db.models.application import Application
from app.db.models.user import User
from app.db.models.user_application_access import UserApplicationAccess, PermissionLevel
from app.schemas.application import ApplicationCreate, ApplicationOut, ApplicationUpdate
from app.api.deps import get_db, get_current_user, require_admin

router = APIRouter(prefix="/api/applications", tags=["Applications"])

@router.get("/", response_model=List[ApplicationOut])
def list_applications(
    dashboard: bool = Query(False),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Alias the access table to look for the current user's entry
    Access = aliased(UserApplicationAccess)

    # We specifically select the Application model AND the permission_level column
    query = db.query(
        Application,
        Access.permission_level.label("permission_level")
    ).outerjoin(
        Access, 
        (Application.id == Access.application_id) & (Access.user_id == current_user.id)
    )

    # --- FILTERS ---
    if current_user.role != "Admin":
        query = query.filter(
            or_(
                Application.owner == current_user.email,
                Access.user_id == current_user.id
            )
        )

    if dashboard:
        query = query.filter(Application.owner == current_user.email)

    if search:
        query = query.filter(Application.name.ilike(f"%{search}%"))

    results = query.all()

    final_list = []
    for app_obj, perm_level in results:
        # Manually attach the permission level to the object before returning
        # If perm_level is None (outer join found nothing), but they are the owner,
        # you might want to default it to 'Owner' or 'Admin'
        if perm_level is None:
            if app_obj.owner == current_user.email or current_user.role == "Admin":
                perm_level = "admin"
        
        app_obj.permission_level = perm_level
        final_list.append(app_obj)

    return final_list


@router.post("/create", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
def create_application(payload: ApplicationCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    exists = db.query(Application).filter(Application.name==payload.name).first()
    if exists:
        raise HTTPException(status_code=400, detail="Application with same name exists")
    
    app_data = payload.dict()
    app_data["owner"] = current_user.email 
    app_obj = Application(**app_data)
    db.add(app_obj)
    db.commit()
    db.refresh(app_obj)

    owner_access = UserApplicationAccess(
        user_id=current_user.id,
        application_id=app_obj.id,
        permission_level=PermissionLevel.admin 
    )
    db.add(owner_access)
    db.commit()
    
    db.refresh(app_obj)
    return app_obj


@router.get("/{app_id}", response_model=ApplicationOut)
def get_application(
    app_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # 1. Alias the access table to look for the current user's entry
    Access = aliased(UserApplicationAccess)

    # 2. Query for both the Application and the permission level from the access table
    result = db.query(
        Application,
        Access.permission_level.label("permission_level")
    ).outerjoin(
        Access, 
        (Application.id == Access.application_id) & (Access.user_id == current_user.id)
    ).filter(
        Application.id == app_id
    ).first()

    # 3. Check if application exists
    if not result:
        raise HTTPException(status_code=404, detail="Application not found")

    app_obj, perm_level = result

    # 4. Security Check: Only Admin, Owner, or someone with explicit access can see it
    is_owner = app_obj.owner == current_user.email
    is_admin = current_user.role == "Admin"
    
    if not (is_admin or is_owner or perm_level is not None):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # 5. Logic to determine permission level if the join returned None
    if perm_level is None:
        if is_owner or is_admin:
            perm_level = "admin"

    # 6. Attach it to the object so Pydantic can pick it up
    app_obj.permission_level = perm_level
    
    return app_obj


@router.put("/{app_id}", response_model=ApplicationOut)
def update_application(
    app_id: int, 
    payload: ApplicationUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Alias the access table to check permissions for this specific user
    Access = aliased(UserApplicationAccess)

    # 2. Query for the app and the user's specific permission level
    result = db.query(
        Application,
        Access.permission_level.label("permission_level")
    ).outerjoin(
        Access, 
        (Application.id == Access.application_id) & (Access.user_id == current_user.id)
    ).filter(
        Application.id == app_id
    ).first()

    if not result:
        raise HTTPException(status_code=404, detail="Application not found")

    app_obj, perm_level = result

    # 3. Determine Ownership and Site Admin status
    is_owner = app_obj.owner == current_user.email
    is_site_admin = current_user.role == "Admin"
    
    # 4. Permission Validation Logic
    # We allow update if:
    # - User is Owner or Site Admin
    # - User has 'admin' or 'write' permission level in the Access table
    
    # Normalize perm_level to string if it's an Enum (PermissionLevel.write -> "write")
    perm_str = perm_level.value if hasattr(perm_level, 'value') else str(perm_level) if perm_level else None
    
    is_authorized = (
        is_owner or 
        is_site_admin or 
        perm_str in ["admin", "write"]
    )

    if not is_authorized:
        # Displaying the normalized string in the error for clarity
        current_level_display = "Admin/Owner" if (is_owner or is_site_admin) else (perm_str or "None")
        raise HTTPException(
            status_code=403, 
            detail=f"Insufficient permissions. Required: admin/write. Your level: {current_level_display}"
        )

    # 5. Perform the update
    update_data = payload.dict(exclude_unset=True)
    for k, v in update_data.items():
        setattr(app_obj, k, v)
    
    db.add(app_obj)
    db.commit()
    db.refresh(app_obj)

    # 6. Map the effective permission back for the response schema
    effective_level = "admin" if (is_owner or is_site_admin or perm_str == "admin") else perm_str
    app_obj.permission_level = effective_level

    return app_obj


@router.delete("/{app_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
def delete_application(app_id: int, db: Session = Depends(get_db)):
    app_obj = db.query(Application).get(app_id)
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")
    db.delete(app_obj)
    db.commit()
    return None
