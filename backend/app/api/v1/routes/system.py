"""
System endpoints for V-Fix API
Includes health checks, metrics, and system monitoring
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
import logging
from datetime import datetime, timedelta

from app.database import get_db
from app.services.repositories import UserRepository

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """
    Comprehensive health check endpoint.
    
    Checks:
    - API availability
    - Database connectivity
    - Cache availability
    """
    from app.core.cache import cache
    
    health_status = {
        "status": "ok",
        "service": "V-Fix Web App API",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "checks": {}
    }
    
    # Database check
    try:
        db.execute(text("SELECT 1"))
        health_status["checks"]["database"] = "healthy"
    except Exception as e:
        health_status["checks"]["database"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"
        logger.error(f"Database health check failed: {e}")
    
    # Cache check
    try:
        test_key = "_health_check"
        cache.set(test_key, "test", ttl=10)
        result = cache.get(test_key)
        cache.delete(test_key)
        health_status["checks"]["cache"] = "healthy" if result else "unavailable"
    except Exception as e:
        health_status["checks"]["cache"] = "unavailable"
        logger.warning(f"Cache health check failed: {e}")
    
    return health_status


@router.get("/metrics")
async def metrics(db: Session = Depends(get_db)):
    """
    Basic metrics endpoint for monitoring.
    
    Returns application metrics for observability.
    """
    user_repo = UserRepository(db)
    
    # Calculate metrics
    try:
        active_users_count = len(user_repo.get_active_users(limit=10000))
        
        # Last 24 hours user registrations
        # This is a simplified version - in production, add proper indexes and queries
        recent_users = user_repo.get_active_users(limit=1000)
        day_ago = datetime.utcnow() - timedelta(days=1)
        new_users_24h = len([u for u in recent_users if u.created_at and u.created_at > day_ago])
        
        metrics_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "metrics": {
                "active_users": active_users_count,
                "new_users_24h": new_users_24h
            }
        }
        
        return metrics_data
    except Exception as e:
        logger.error(f"Metrics collection failed: {e}")
        return {"error": "Failed to collect metrics"}

