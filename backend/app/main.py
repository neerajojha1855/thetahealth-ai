from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
import logging
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from app.utils.config import settings
from app.api.v1.api import api_router

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Injects security response headers into every API response."""
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(self), geolocation=()"
        if settings.ENVIRONMENT == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
            response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com"
        return response

def create_application() -> FastAPI:
    # Disable Swagger/OpenAPI in production
    is_production = settings.ENVIRONMENT == "production" and not settings.DEBUG

    application = FastAPI(
        title=settings.PROJECT_NAME,
        openapi_url=None if is_production else f"{settings.API_V1_STR}/openapi.json",
        docs_url=None if is_production else f"{settings.API_V1_STR}/docs",
        redoc_url=None if is_production else f"{settings.API_V1_STR}/redoc",
        description="ThetaHealth AI — Healthcare Resource & Supply Chain Resilience Platform API"
    )

    # Security headers middleware
    application.add_middleware(SecurityHeadersMiddleware)

    # Set up CORS middleware
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-Demo-Role", "X-Facility-Id"],
    )

    # Include API Routers
    application.include_router(api_router, prefix=settings.API_V1_STR)

    @application.get("/", tags=["Root"])
    async def root():
        return {
            "message": "Welcome to ThetaHealth AI API",
            "docs": f"{settings.API_V1_STR}/docs" if not is_production else "disabled",
            "status": "operational"
        }

    @application.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logging.error(f"Unhandled Exception: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal Server Error" if not settings.DEBUG else str(exc)}
        )

    @application.exception_handler(HTTPException)
    async def global_http_exception_handler(request: Request, exc: HTTPException):
        # If it's a 500 error and we are not in debug mode, hide the detail
        if exc.status_code >= 500 and not settings.DEBUG:
            logging.error(f"HTTP {exc.status_code} Error: {exc.detail}")
            return JSONResponse(
                status_code=exc.status_code,
                content={"detail": "Internal Server Error"}
            )
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail}
        )

    return application

app = create_application()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
