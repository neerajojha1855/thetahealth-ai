import os
import requests
from fastapi import APIRouter, HTTPException, Depends
from firebase_admin import auth, firestore
from app.utils.config import settings
from app.schemas.auth import (
    UserRegisterRequest, 
    UserLoginRequest, 
    RoleEnum, 
    ScopeLevel
)
from app.security.firebase import get_firebase_app

router = APIRouter()

@router.post("/register", summary="Register a new user")
async def register_user(payload: UserRegisterRequest):
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")
    
    # Password criteria
    if len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")

    try:
        # Create user in Firebase Auth
        user_record = auth.create_user(
            email=payload.email,
            password=payload.password,
            display_name=payload.name
        )
        
        uid = user_record.uid
        
        # Initialize default user profile in Firestore
        app = get_firebase_app()
        if app:
            db = firestore.client()
            user_doc = {
                "uid": uid,
                "email": payload.email,
                "name": payload.name,
                "role": payload.role.value if payload.role else RoleEnum.PHC_WORKER.value,
                "scope_level": ScopeLevel.FACILITY.value,
                "profile_picture": None,
                "designation": payload.designation,
                "organisation": payload.organisation,
                "work_location": payload.work_location
            }
            db.collection("users").document(uid).set(user_doc)
            
        return {"message": "User registered successfully", "uid": uid}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", summary="Login with Email and Password")
def login_user(payload: UserLoginRequest):
    firebase_web_api_key = settings.FIREBASE_API_KEY
    if not firebase_web_api_key:
        raise HTTPException(status_code=500, detail="Firebase Web API Key not configured on backend.")
        
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={firebase_web_api_key}"
    response = requests.post(url, json={
        "email": payload.email,
        "password": payload.password,
        "returnSecureToken": True
    })
    
    if response.status_code != 200:
        error_msg = response.json().get("error", {}).get("message", "Login failed")
        raise HTTPException(status_code=401, detail=error_msg)
        
    data = response.json()
    return {
        "access_token": data["idToken"],
        "refresh_token": data["refreshToken"],
        "expires_in": data["expiresIn"],
        "uid": data["localId"]
    }