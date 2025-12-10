import os
import requests
from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any, List
from app.db.models.chatbot import ChatQuery, ChatResponse, Source
from app.core.config import settings

# --- API Configuration ---

router = APIRouter(prefix="/api/chat", tags=["AI Assistant"])

# 1. SECURITY CRITICAL: Load the API Key from the server's environment variables
# This ensures the key is never exposed in client-side code.
GEMINI_API_KEY = settings.GEMINI_API_KEY
GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025"
GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"


def parse_gemini_response(result: Dict[str, Any]) -> ChatResponse:
    """Parses the raw Gemini API response JSON into the structured ChatResponse schema."""
    candidate = result.get('candidates', [{}])[0]
    
    # Extract generated text
    text = candidate.get('content', {}).get('parts', [{}])[0].get('text', "Sorry, I couldn't process that query.")

    sources: List[Source] = []
    grounding_metadata = candidate.get('groundingMetadata')
    
    # Extract grounding sources/citations (if Google Search was used)
    if grounding_metadata and grounding_metadata.get('groundingAttributions'):
        for attribution in grounding_metadata['groundingAttributions']:
            web_info = attribution.get('web')
            if web_info and web_info.get('uri') and web_info.get('title'):
                sources.append(Source(
                    uri=web_info['uri'],
                    title=web_info['title']
                ))
    
    return ChatResponse(text=text, sources=sources)


@router.post("/", response_model=ChatResponse)
async def chat_proxy(payload: ChatQuery):
    """
    Acts as a secure server-side proxy for the Gemini API.
    
    It accepts a user query, adds the secret API key, calls the external
    Gemini endpoint, and returns a structured response (text + sources).
    """
    
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Server configuration error: Gemini API Key is missing."
        )

    # Full URL for the API call
    gemini_url = f"{GEMINI_BASE_URL}/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"

    # Construct the payload for the external Gemini API
    gemini_payload = {
        "contents": [{"parts": [{"text": payload.query}]}],
        # Enable Google Search grounding tool
        "tools": [{"google_search": {}}], 
    }

    try:
        # Make the secure server-to-server request
        # Note: In an async FastAPI app, using 'requests' (which is synchronous) 
        # inside an async route is generally discouraged for performance 
        # (it blocks the event loop). For small, quick proxies like this, 
        # it's often acceptable, but for high-load apps, consider 'httpx'.
        response = requests.post(
            gemini_url, 
            headers={"Content-Type": "application/json"},
            json=gemini_payload
        )
        response.raise_for_status() # Raise an exception for HTTP errors (4xx or 5xx)

        # Parse the JSON response from Gemini
        gemini_result = response.json()
        
        # Parse and validate the result against the Pydantic schema
        parsed_data = parse_gemini_response(gemini_result)

        # Return the structured data to the client
        return parsed_data

    except requests.exceptions.HTTPError as e:
        # Handle errors returned by the Gemini API (e.g., 400, 429)
        error_detail = response.text
        print(f"Gemini API Error: {e}, Detail: {error_detail}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, # Indicate failure with external service
            detail="External AI service failed to process request."
        )
    except Exception as e:
        # Handle general errors (network, parsing, etc.)
        print(f"Internal Server Error during chat proxy: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="An unexpected error occurred on the server."
        )