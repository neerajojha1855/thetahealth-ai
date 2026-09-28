from fastapi import APIRouter, HTTPException, Depends
from firebase_admin import auth, firestore
from app.schemas.auth import (
    ProfileUpdateRequest, 
    UserProfile, 
    RoleEnum
)
from app.security.rbac import get_current_user, ROLE_PERMISSIONS
from app.security.firebase import get_firebase_app

router = APIRouter()

@router.get("/", response_model=UserProfile, summary="Get User Profile")
async def get_profile(current_user: UserProfile = Depends(get_current_user)):
    # Try fetching extended profile from Firestore
    app = get_firebase_app()
    if app:
        try:
            db = firestore.client()
            doc_ref = db.collection("users").document(current_user.uid)
            doc = doc_ref.get()
            if doc.exists:
                data = doc.to_dict()
                current_user.profile_picture = data.get("profile_picture")
                current_user.designation = data.get("designation")
                current_user.organisation = data.get("organisation")
                current_user.work_location = data.get("work_location")
                if "role" in data:
                    try:
                        current_user.role = RoleEnum(data["role"])
                        current_user.permissions = ROLE_PERMISSIONS.get(current_user.role, [])
                    except ValueError:
                        pass
        except Exception as e:
            pass # fallback to token claims
            
    return current_user


@router.put("/", response_model=UserProfile, summary="Update User Profile")
async def update_profile(payload: ProfileUpdateRequest, current_user: UserProfile = Depends(get_current_user)):
    app = get_firebase_app()
    if not app:
        raise HTTPException(status_code=500, detail="Firestore not initialized")
        
    try:
        db = firestore.client()
        doc_ref = db.collection("users").document(current_user.uid)
        
        # Build update dict
        update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
        
        if not update_data:
            return current_user
            
        # Update Firebase Auth if name changes
        if "name" in update_data:
            try:
                auth.update_user(current_user.uid, display_name=update_data["name"])
            except Exception as auth_err:
                print(f"Warning: Failed to update Firebase Auth display name: {auth_err}")
            current_user.name = update_data["name"]
            
        # Update Firestore
        doc = doc_ref.get()
        if doc.exists:
            doc_ref.update(update_data)
        else:
            base_doc = {
                "uid": current_user.uid,
                "email": current_user.email,
                "name": current_user.name,
                "role": current_user.role.value,
                "scope_level": current_user.scope_level.value,
            }
            base_doc.update(update_data)
            doc_ref.set(base_doc)
            
        # Reflect updates in response
        for k, v in update_data.items():
            if hasattr(current_user, k):
                setattr(current_user, k, v)
                
        return current_user
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to update profile: {str(e)}")
