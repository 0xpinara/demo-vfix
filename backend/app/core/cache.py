"""
Caching layer using Redis for performance at scale.
Falls back to in-memory cache if Redis is unavailable.
"""
import os
import json
import logging
from typing import Optional, Any
from datetime import timedelta
import hashlib

logger = logging.getLogger(__name__)

# Try to import Redis, fall back to fake redis for development
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    logger.warning("Redis not available, using in-memory cache")

# In-memory cache fallback
_memory_cache = {}


class CacheService:
    """
    Cache service with Redis support and in-memory fallback.
    Supports automatic serialization/deserialization.
    """
    
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self.redis_client = None
        self.use_redis = REDIS_AVAILABLE and os.getenv("USE_REDIS", "false").lower() == "true"
        
        if self.use_redis:
            try:
                self.redis_client = redis.from_url(
                    self.redis_url,
                    decode_responses=True,
                    socket_connect_timeout=2,
                    socket_timeout=2,
                    retry_on_timeout=True,
                    health_check_interval=30
                )
                # Test connection
                self.redis_client.ping()
                logger.info("Redis cache initialized successfully")
            except Exception as e:
                logger.error(f"Failed to connect to Redis: {e}. Falling back to memory cache.")
                self.redis_client = None
                self.use_redis = False
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        try:
            if self.use_redis and self.redis_client:
                value = self.redis_client.get(key)
                if value:
                    return json.loads(value)
            else:
                return _memory_cache.get(key)
        except Exception as e:
            logger.error(f"Cache get error for key {key}: {e}")
        return None
    
    def set(self, key: str, value: Any, ttl: int = 300) -> bool:
        """
        Set value in cache with TTL (Time To Live) in seconds.
        Default TTL is 5 minutes (300 seconds).
        """
        try:
            serialized = json.dumps(value)
            if self.use_redis and self.redis_client:
                self.redis_client.setex(key, ttl, serialized)
            else:
                _memory_cache[key] = serialized
            return True
        except Exception as e:
            logger.error(f"Cache set error for key {key}: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """Delete value from cache"""
        try:
            if self.use_redis and self.redis_client:
                self.redis_client.delete(key)
            else:
                _memory_cache.pop(key, None)
            return True
        except Exception as e:
            logger.error(f"Cache delete error for key {key}: {e}")
            return False
    
    def delete_pattern(self, pattern: str) -> int:
        """Delete all keys matching pattern (Redis only)"""
        try:
            if self.use_redis and self.redis_client:
                keys = self.redis_client.keys(pattern)
                if keys:
                    return self.redis_client.delete(*keys)
            else:
                # Memory cache pattern deletion
                keys_to_delete = [k for k in _memory_cache.keys() if pattern.replace("*", "") in k]
                for k in keys_to_delete:
                    del _memory_cache[k]
                return len(keys_to_delete)
        except Exception as e:
            logger.error(f"Cache pattern delete error for pattern {pattern}: {e}")
        return 0
    
    def clear(self) -> bool:
        """Clear all cache"""
        try:
            if self.use_redis and self.redis_client:
                self.redis_client.flushdb()
            else:
                _memory_cache.clear()
            return True
        except Exception as e:
            logger.error(f"Cache clear error: {e}")
            return False
    
    def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        try:
            if self.use_redis and self.redis_client:
                return self.redis_client.exists(key) > 0
            else:
                return key in _memory_cache
        except Exception as e:
            logger.error(f"Cache exists error for key {key}: {e}")
            return False


# Global cache instance
cache = CacheService()


def cache_key(*args, **kwargs) -> str:
    """Generate cache key from function arguments"""
    key_parts = [str(arg) for arg in args]
    key_parts.extend([f"{k}={v}" for k, v in sorted(kwargs.items())])
    key_string = ":".join(key_parts)
    return hashlib.md5(key_string.encode()).hexdigest()


def invalidate_cache(prefix: str):
    """Invalidate all cache entries with given prefix"""
    pattern = f"{prefix}:*"
    deleted = cache.delete_pattern(pattern)
    logger.info(f"Invalidated {deleted} cache entries with prefix: {prefix}")
    return deleted

