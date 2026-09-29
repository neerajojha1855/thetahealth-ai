from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
import datetime
from firebase_admin import storage
from app.security.rbac import get_current_user
from app.schemas.auth import UserProfile

router = APIRouter()

class UploadUrlRequest(BaseModel):
    file_name: str
    content_type: str

class SignedUrlResponse(BaseModel):
    url: str
    blob_name: str

@router.post("/generate-upload-url", response_model=SignedUrlResponse)
def generate_upload_url(
    req: UploadUrlRequest, 
    current_user: UserProfile = Depends(get_current_user)
):
    try:
        bucket = storage.bucket()
        # Scope the file path securely to the user's ID
        blob_name = f"users/{current_user.uid}/{req.file_name}"
        blob = bucket.blob(blob_name)

        # Generate a Signed URL valid for 15 minutes for uploading
        url = blob.generate_signed_url(
            version="v4",
            expiration=datetime.timedelta(minutes=15),
            method="PUT",
            content_type=req.content_type
        )
        return SignedUrlResponse(url=url, blob_name=blob_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating upload URL: {str(e)}")

@router.get("/generate-download-url", response_model=SignedUrlResponse)
def generate_download_url(
    blob_name: str = Query(..., description="The path of the file in the bucket"),
    current_user: UserProfile = Depends(get_current_user)
):
    try:
        # Enforce that users can only download files from their own directory
        if not blob_name.startswith(f"users/{current_user.uid}/"):
            raise HTTPException(status_code=403, detail="Not authorized to access this file")

        bucket = storage.bucket()
        blob = bucket.blob(blob_name)

        # Generate a Signed URL valid for 15 minutes for downloading
        url = blob.generate_signed_url(
            version="v4",
            expiration=datetime.timedelta(minutes=15),
            method="GET"
        )
        return SignedUrlResponse(url=url, blob_name=blob_name)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating download URL: {str(e)}")
