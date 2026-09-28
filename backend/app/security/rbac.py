from fastapi import Depends, HTTPException, status, Header
from typing import Optional, List
from app.schemas.auth import UserProfile, RoleEnum, ScopeLevel
from app.security.firebase import verify_firebase_token
from app.utils.config import settings

ROLE_PERMISSIONS = {
    RoleEnum.NATIONAL_ADMIN: [
        "view:national_command",
        "view:all_facilities",
        "manage:facilities",
        "manage:users",
        "approve:reallocations",
        "trigger:emergency",
        "view:analytics",
        "view:pharmacy_all",
        "execute:simulator"
    ],
    RoleEnum.STATE_DISTRICT_ADMIN: [
        "view:district_command",
        "view:district_facilities",
        "approve:reallocations",
        "trigger:emergency",
        "view:analytics"
    ],
    RoleEnum.HOSPITAL_ADMIN: [
        "view:facility_operations",
        "manage:beds",
        "manage:staff",
        "request:supplies",
        "view:facility_inventory"
    ],
    RoleEnum.PHC_WORKER: [
        "submit:voice_report",
        "submit:inventory_update",
        "submit:attendance",
        "view:phc_dashboard"
    ],
    RoleEnum.DOCTOR_NURSE: [
        "view:patient_queue",
        "update:bed_status",
        "log:clinical_consumption",
        "view:facility_schedule"
    ],
    RoleEnum.PHARMACIST: [
        "view:inventory",
        "log:dispensation",
        "log:batch_receipt",
        "track:fefo",
        "report:expiry_risk"
    ],
    RoleEnum.SUPPLY_CHAIN_MANAGER: [
        "view:supply_tower",
        "manage:shipments",
        "propose:transfers",
        "approve:transfers",
        "track:supplier_sla"
    ],
    RoleEnum.EMERGENCY_OFFICER: [
        "view:emergency_command",
        "declare:emergency",
        "override:logistics",
        "allocate:surge_capacity"
    ],
    RoleEnum.ANALYST: [
        "view:analytics",
        "run:forecasts",
        "export:bigquery_reports",
        "view:model_metrics"
    ]
}

async def get_current_user(
    authorization: Optional[str] = Header(None),
    x_demo_role: Optional[str] = Header(None),
    x_facility_id: Optional[str] = Header(None)
) -> UserProfile:
    """
    Extracts and verifies user identity from Firebase Auth Authorization header.
    Supports X-Demo-Role header for rapid demonstration persona switching.
    """
    # Demo/Override mode — ONLY allowed in DEBUG mode
    if x_demo_role and settings.DEBUG:
        try:
            role = RoleEnum(x_demo_role)
            scope = ScopeLevel.FACILITY if role in [RoleEnum.PHC_WORKER, RoleEnum.HOSPITAL_ADMIN, RoleEnum.PHARMACIST, RoleEnum.DOCTOR_NURSE] else ScopeLevel.NATIONAL
            return UserProfile(
                uid=f"demo-{role.value.lower()}",
                email=f"{role.value.lower()}@thetahealth.gov",
                name=f"Demo {role.value.replace('_', ' ').title()}",
                role=role,
                scope_level=scope,
                state_id="ST-UP-01",
                district_id="DIST-MEERUT",
                facility_id=x_facility_id or "PHC-ANANDPUR-01",
                facility_name="PHC Anandpur",
                permissions=ROLE_PERMISSIONS.get(role, [])
            )
        except ValueError:
            pass

    if not authorization or not authorization.startswith("Bearer "):
        if settings.DEBUG:
            # Development fallback only — NEVER in production
            return UserProfile(
                uid="default-admin-001",
                email="admin@thetahealth.gov",
                name="Dr. National Admin",
                role=RoleEnum.NATIONAL_ADMIN,
                scope_level=ScopeLevel.NATIONAL,
                permissions=ROLE_PERMISSIONS[RoleEnum.NATIONAL_ADMIN]
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.split("Bearer ")[1]
    try:
        claims = verify_firebase_token(token)
        role = RoleEnum(claims.get("role", RoleEnum.NATIONAL_ADMIN.value))
        return UserProfile(
            uid=claims.get("uid", "user-unknown"),
            email=claims.get("email", "user@thetahealth.gov"),
            name=claims.get("name", "Healthcare Operator"),
            role=role,
            scope_level=ScopeLevel(claims.get("scope", ScopeLevel.NATIONAL.value)),
            state_id=claims.get("state_id"),
            district_id=claims.get("district_id"),
            facility_id=claims.get("facility_id"),
            facility_name=claims.get("facility_name"),
            permissions=ROLE_PERMISSIONS.get(role, [])
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired authentication token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

def require_roles(allowed_roles: List[RoleEnum]):
    """
    FastAPI dependency factory enforcing RBAC role memberships.
    """
    def role_checker(current_user: UserProfile = Depends(get_current_user)) -> UserProfile:
        if current_user.role == RoleEnum.NATIONAL_ADMIN:
            return current_user  # Super-admin bypass
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: User role '{current_user.role}' lacks required permissions."
            )
        return current_user
    return role_checker
