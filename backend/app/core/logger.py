"""
Logging configuration for production-ready application.
Supports structured logging with JSON format and multiple output handlers.
"""
import logging
import sys
import os
from pythonjsonlogger import jsonlogger

# Log levels
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

# Log format
DEFAULT_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"


def setup_logging():
    """
    Configure application logging with both console and JSON formats.
    
    - Development: Human-readable console output
    - Production: JSON-structured logs for log aggregation systems
    """
    # Root logger configuration
    root_logger = logging.getLogger()
    root_logger.setLevel(LOG_LEVEL)
    
    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Console handler for development
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(LOG_LEVEL)
    
    # Use JSON formatter for production, regular formatter for development
    if os.getenv("ENVIRONMENT", "development") == "production":
        # JSON formatter for production log aggregation
        json_formatter = jsonlogger.JsonFormatter(
            "%(asctime)s %(name)s %(levelname)s %(message)s %(pathname)s %(lineno)d"
        )
        console_handler.setFormatter(json_formatter)
    else:
        # Human-readable formatter for development
        formatter = logging.Formatter(
            DEFAULT_FORMAT,
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        console_handler.setFormatter(formatter)
    
    root_logger.addHandler(console_handler)
    
    # File handler for persistent logs (optional)
    log_file = os.getenv("LOG_FILE")
    if log_file:
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(LOG_LEVEL)
        json_formatter = jsonlogger.JsonFormatter(
            "%(asctime)s %(name)s %(levelname)s %(message)s %(pathname)s %(lineno)d"
        )
        file_handler.setFormatter(json_formatter)
        root_logger.addHandler(file_handler)
    
    # Reduce noise from third-party libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    
    # Log initialization
    logger = logging.getLogger(__name__)
    logger.info(f"Logging initialized at {LOG_LEVEL} level")
    logger.info(f"Environment: {os.getenv('ENVIRONMENT', 'development')}")



