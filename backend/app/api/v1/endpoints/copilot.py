from fastapi import APIRouter, HTTPException, Depends
from app.schemas.copilot import CopilotQueryRequest, CopilotQueryResponse
from app.ai.copilot_engine import copilot_engine
from app.schemas.auth import UserProfile
from app.security.rbac import get_current_user

router = APIRouter()

@router.post("/query", response_model=CopilotQueryResponse)
async def query_copilot(
    req: CopilotQueryRequest,
    current_user: UserProfile = Depends(get_current_user)
):
    """Query Ask Theta AI copilot for natural language grounded operational insights."""
    return copilot_engine.process_query(req)
