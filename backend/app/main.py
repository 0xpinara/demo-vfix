"""
V-Fix Web App Backend API
Production-ready FastAPI application with scalability features:
- Repository pattern for data access
- Service layer for business logic
- Redis caching for performance
- Logging
- Rate limiting
- Database connection pooling
- Authentication with login/register from v-fix-web
"""
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from sqlalchemy.orm import Session
import os
import logging
from dotenv import load_dotenv

from app.database import get_db, engine, Base, create_tables_safely
from app.core.security import get_rate_limit_handler
from app.core.logger import setup_logging
from app.api.v1.routes import chat, admin, appointments, auth, users, system, enterprise, branch_manager, technicians

load_dotenv()

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

# Create tables (in production, use Alembic migrations)
# Skip if in testing mode - tests manage their own database
if not os.environ.get("TESTING"):
    create_tables_safely()

app = FastAPI(
    title="V-Fix Web App API",
    version="1.0.0",
    description="Home Appliance VLM Platform API with Authentication",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Initialize rate limiting
app = get_rate_limit_handler(app)

# GZip compression disabled - causes I/O errors with Python 3.13 when connections close early
# TODO: Re-enable when upgrading to a fixed version of Python/uvicorn
# if not os.environ.get("TESTING"):
#     app.add_middleware(GZipMiddleware, minimum_size=1000)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"]
)

# System endpoints (health, metrics)
app.include_router(system.router, prefix="", tags=["System"])

# Authentication and user endpoints
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])

# Chat and feedback endpoints
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])

# Appointment and Technician endpoints
app.include_router(appointments.router, prefix="/api/appointments", tags=["Appointments"])

# Admin dashboard endpoints
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])

# Enterprise endpoints
app.include_router(enterprise.router, prefix="/api/enterprise", tags=["Enterprise"])

# Branch Manager endpoints
app.include_router(branch_manager.router, prefix="/api/branch-manager", tags=["Branch Manager"])

# Technicians endpoints
app.include_router(technicians.router, prefix="/api/technicians", tags=["Technicians"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
