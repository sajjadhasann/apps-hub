from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from typing import List, Optional
from app.db.models.ticket import Ticket, TicketStatus
from app.db.models.user import User 
from app.schemas.ticket import TicketCreate, TicketOut, TicketUpdate
from app.api.deps import get_db, get_current_user, require_admin

router = APIRouter(prefix="/api/tickets", tags=["Tickets"])

# ====================================================================
# [GET] LIST: Retrieve a list of tickets (filtered by user role)
# ====================================================================
@router.get("/", response_model=List[TicketOut])
def list_tickets(
    dashboard: bool = Query(False, description="Set to true to filter only tickets owned by the current user"),
    appId: Optional[int] = Query(None, description="Get all tickets of app"),
    search: Optional[str] = Query(None, description="Search by ticket title"),
    status: Optional[TicketStatus] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lists all tickets for Admins.
    Lists only tickets created by the current user for regular Users.
    """
    query = db.query(Ticket)

    if current_user.role != "Admin":
        # Regular user filtering: only show tickets created by them
        query = query.filter(Ticket.created_by == current_user.id)
    
    if dashboard is True:
        query = query.filter(Ticket.created_by == current_user.id)

    if appId:
        query = query.filter(Ticket.application_id == appId)

    if status:
        query = query.filter(Ticket.status == status)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Ticket.id.ilike(search_pattern),
                Ticket.title.ilike(search_pattern),
                Ticket.description.ilike(search_pattern),
                Ticket.application_id.ilike(search_pattern),
                Ticket.created_by.ilike(search_pattern)
            )
        )

    tickets = query.order_by(
        desc(Ticket.created_at),  # Order by created_at, newest first
        desc(Ticket.updated_at)   # Then by updated_at, newest first
    ).all()
    return tickets

# ====================================================================
# [POST] CREATE: Create a new ticket
# ====================================================================
@router.post("/create", response_model=TicketOut, status_code=status.HTTP_201_CREATED)
def create_ticket(
    payload: TicketCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Creates a new support ticket. Available to all users (Admin/User).
    """
    # Application ID existence check can be added here if needed
    
    ticket_data = payload.dict()
    ticket_data["created_by"] = current_user.id
    ticket_obj = Ticket(**ticket_data)
    
    db.add(ticket_obj)
    db.commit()
    db.refresh(ticket_obj)

    return ticket_obj

# ====================================================================
# [GET] RETRIEVE: Get a single ticket
# ====================================================================
@router.get("/{ticket_id}", response_model=TicketOut)
def get_ticket(
    ticket_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves a ticket by its ID. Requires user to be the creator or an Admin.
    """
    ticket_obj = db.query(Ticket).get(ticket_id)
    if not ticket_obj:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Authorization Check: Deny access if not Admin AND not the creator
    if current_user.role != "Admin" and ticket_obj.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this ticket"
        )
    
    return ticket_obj

# ====================================================================
# [PUT] UPDATE: Update the ticket
# ====================================================================
@router.put("/{ticket_id}", response_model=TicketOut)
def update_ticket(
    ticket_id: int, 
    payload: TicketUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    ticket_obj = db.query(Ticket).get(ticket_id)
    if not ticket_obj:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if current_user.role != "Admin":
        # Regular User restrictions
        # Must be the creator AND ticket must not be resolved
        if ticket_obj.created_by != current_user.id or ticket_obj.status == TicketStatus.resolved:
             raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot update this ticket")
        
        # Prevent regular users from trying to change the status
        if payload.status is not None:
             raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Users cannot change ticket status")
        
        # Allow only title and description updates for regular users
        update_data = payload.dict(exclude_unset=True)
        if "status" in update_data:
             del update_data["status"]
    else:
        # Admin can update all fields
        update_data = payload.dict(exclude_unset=True)

    for k, v in update_data.items():
        setattr(ticket_obj, k, v)
    
    db.add(ticket_obj)
    db.commit()
    db.refresh(ticket_obj)

    return ticket_obj

# ====================================================================
# [DELETE] DELETE: Delete the ticket (Admins only)
# ====================================================================
@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
def delete_ticket(ticket_id: int, db: Session = Depends(get_db)):
    """
    Deletes a ticket. Restricted to Admin role.
    """
    ticket_obj = db.query(Ticket).get(ticket_id)
    if not ticket_obj:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    db.delete(ticket_obj)
    db.commit()
    # Return 204 No Content on successful deletion
    return Response(status_code=status.HTTP_204_NO_CONTENT)
