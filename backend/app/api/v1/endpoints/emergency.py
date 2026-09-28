from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from app.schemas.emergency import EmergencyDeclaration, EmergencyAction
from app.services.emergency_service import emergency_service
from app.schemas.auth import UserProfile, RoleEnum
from app.security.rbac import get_current_user, require_roles

router = APIRouter()

@router.get("/active", response_model=Optional[EmergencyDeclaration])
async def get_active_emergency():
    """Get the currently active emergency outbreak declaration and containment status."""
    return emergency_service.get_active_emergency()

@router.post("/actions/{action_id}/execute", response_model=EmergencyAction)
async def execute_emergency_action(
    action_id: str,
    current_user: UserProfile = Depends(require_roles([RoleEnum.EMERGENCY_OFFICER, RoleEnum.NATIONAL_ADMIN]))
):
    """Execute and approve an emergency surge action. Requires EMERGENCY_OFFICER or NATIONAL_ADMIN role."""
    action = emergency_service.execute_action(action_id)
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
    return action
