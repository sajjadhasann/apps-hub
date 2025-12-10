# --- Pydantic Schemas ---
from pydantic import BaseModel
from typing import List

class ChatQuery(BaseModel):
    """Schema for the incoming request from the client."""
    query: str

class Source(BaseModel):
    """Schema for a single citation source."""
    uri: str
    title: str

class ChatResponse(BaseModel):
    """Schema for the structured response sent back to the client."""
    text: str
    sources: List[Source] = []