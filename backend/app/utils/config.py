import os
from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "ThetaHealth AI"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str
    DEBUG: bool

    # GCP / Firebase
    GCP_PROJECT_ID: str
    FIREBASE_PROJECT_ID: str
    FIREBASE_STORAGE_BUCKET: str
    BIGQUERY_DATASET: str
    FIREBASE_API_KEY: str

    # AI / ML
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL_NAME: str
    VERTEX_LOCATION: str
    OLLAMA_MODEL_NAME: str
    OLLAMA_BASE_URL: str

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "https://thetahealth001.firebaseapp.com",
        "https://thetahealth001.web.app",
        "https://thetahealth-ai.vercel.app",
    ]

    model_config = {
        "env_file": ".env",
        "extra": "allow",
        "case_sensitive": True,
    }


settings = Settings()
