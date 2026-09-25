import os
from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "ThetaHealth AI"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # GCP / Firebase
    GCP_PROJECT_ID: str = "thetahealth001"
    FIREBASE_PROJECT_ID: str = "thetahealth001"
    FIREBASE_STORAGE_BUCKET: str = "thetahealth001.firebasestorage.app"
    BIGQUERY_DATASET: str = "thetahealth_analytics"

    # AI / ML
    GEMINI_API_KEY: Optional[str] = None
    VERTEX_LOCATION: str = "us-central1"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "https://thetahealth001.firebaseapp.com",
        "https://thetahealth001.web.app",
    ]

    model_config = {
        "env_file": ".env",
        "extra": "allow",
        "case_sensitive": True,
    }


settings = Settings()
