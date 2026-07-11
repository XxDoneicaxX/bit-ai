from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.models.chat_models import ChatRequest
from app.services.ollama_service import generate_response


router = APIRouter()


@router.post("/chat")
def chat(request: ChatRequest):
    return StreamingResponse(
        generate_response(request.messages),
        media_type="text/plain"
    )
