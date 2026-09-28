from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.schemas.auth import (
    UserProfile, TokenVerifyRequest, RoleMetadata, RoleEnum, ScopeLevel,
    UserLoginRequest, UserRegisterRequest
)
from app.security.rbac import get_current_user, ROLE_PERMISSIONS
from app.security.firebase import verify_firebase_token, get_firebase_app
from app.api.v1.endpoints.users import login_user, register_user

router = APIRouter()

@router.get("/me", response_model=UserProfile, summary="Get Current Authenticated User")
async def get_me(current_user: UserProfile = Depends(get_current_user)):
    return current_user

@router.post("/verify-token", summary="Verify Firebase Token")
async def verify_token(payload: TokenVerifyRequest):
    try:
        decoded = verify_firebase_token(payload.id_token)
        return {
            "status": "valid",
            "uid": decoded.get("uid"),
            "email": decoded.get("email"),
            "name": decoded.get("name")
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Token verification failed: {str(e)}")

@router.post("/google", summary="Google SSO Authentication")
async def google_auth(payload: TokenVerifyRequest):
    try:
        decoded = verify_firebase_token(payload.id_token)
        uid = decoded.get("uid", "google-user-001")
        email = decoded.get("email", "")
        name = decoded.get("name", "Google User")
        picture = decoded.get("picture")

        user_role = RoleEnum.PHC_WORKER.value
        scope_level = ScopeLevel.FACILITY.value

        app = get_firebase_app()
        if app:
            try:
                from firebase_admin import firestore
                db = firestore.client()
                doc_ref = db.collection("users").document(uid)
                doc = doc_ref.get()
                if not doc.exists:
                    user_doc = {
                        "uid": uid,
                        "email": email,
                        "name": name,
                        "role": user_role,
                        "scope_level": scope_level,
                        "profile_picture": picture,
                        "designation": "Healthcare Officer",
                        "organisation": "National Health Mission",
                        "work_location": "Solapur District Hospital"
                    }
                    doc_ref.set(user_doc)
                else:
                    data = doc.to_dict() or {}
                    user_role = data.get("role", user_role)
                    scope_level = data.get("scope_level", scope_level)
            except Exception as firestore_error:
                print(f"Warning: Firestore sync failed, continuing with fallback values. Error: {firestore_error}")

        return {
            "access_token": payload.id_token,
            "token_type": "bearer",
            "user": {
                "uid": uid,
                "email": email,
                "name": name,
                "role": user_role,
                "scope_level": scope_level,
                "profile_picture": picture
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Google authentication failed: {str(e)}")

@router.post("/login", summary="Login with Email and Password")
def auth_login(payload: UserLoginRequest):
    return login_user(payload)

@router.post("/register", summary="Register a new user")
async def auth_register(payload: UserRegisterRequest):
    return await register_user(payload)