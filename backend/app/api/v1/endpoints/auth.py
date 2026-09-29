from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.schemas.auth import (
    UserProfile, TokenVerifyRequest, RoleMetadata, RoleEnum, ScopeLevel,
    UserLoginRequest, UserRegisterRequest, ForgotPasswordRequest, ResetPasswordRequest, VerifyResetCodeRequest
)
from app.security.rbac import get_current_user, ROLE_PERMISSIONS
from app.security.firebase import verify_firebase_token, get_firebase_app
from app.api.v1.endpoints.users import login_user, register_user
from app.utils.config import settings
import random
from datetime import datetime, timedelta, timezone
from firebase_admin import auth, firestore
from app.services.email import send_verification_email

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

@router.post("/forgot-password", summary="Request password reset code")
async def forgot_password(payload: ForgotPasswordRequest):
    try:
        user = auth.get_user_by_email(payload.email)
    except Exception:
        # Don't reveal if user exists to avoid enumeration
        return {"message": "If an account with that email exists, a reset code has been sent."}

    code = f"{random.randint(100000, 999999)}"
    
    app = get_firebase_app()
    if app:
        db = firestore.client()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
        db.collection("password_resets").document(user.uid).set({
            "code": code,
            "expires_at": expires_at,
            "email": payload.email
        })

    # Send email
    send_success = send_verification_email(payload.email, code)
    if not send_success:
        print(f"Error: Failed to send password reset email to {payload.email}")
    
    return {"message": "If an account with that email exists, a reset code has been sent."}

@router.post("/verify-reset-code", summary="Verify reset password code")
async def verify_reset_code(payload: VerifyResetCodeRequest):
    try:
        user = auth.get_user_by_email(payload.email)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid request")

    app = get_firebase_app()
    if not app:
        raise HTTPException(status_code=500, detail="Firebase not initialized")
        
    db = firestore.client()
    doc_ref = db.collection("password_resets").document(user.uid)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=400, detail="No pending password reset request found.")

    data = doc.to_dict()
    if data.get("code") != payload.code:
        raise HTTPException(status_code=400, detail="Invalid verification code.")

    # Check expiry
    expires_at = data.get("expires_at")
    if expires_at and datetime.now(timezone.utc) > expires_at:
        doc_ref.delete()
        raise HTTPException(status_code=400, detail="Verification code has expired.")

    return {"message": "Code verified successfully"}

@router.post("/reset-password", summary="Reset password using code")
async def reset_password(payload: ResetPasswordRequest):
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")

    try:
        user = auth.get_user_by_email(payload.email)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid request")

    app = get_firebase_app()
    if not app:
        raise HTTPException(status_code=500, detail="Firebase not initialized")
        
    db = firestore.client()
    doc_ref = db.collection("password_resets").document(user.uid)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=400, detail="No pending password reset request found.")

    data = doc.to_dict()
    if data.get("code") != payload.code:
        raise HTTPException(status_code=400, detail="Invalid verification code.")

    # Check expiry
    expires_at = data.get("expires_at")
    if expires_at and datetime.now(timezone.utc) > expires_at:
        doc_ref.delete()
        raise HTTPException(status_code=400, detail="Verification code has expired.")

    try:
        auth.update_user(user.uid, password=payload.new_password)
        doc_ref.delete()
        return {"message": "Password reset successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))