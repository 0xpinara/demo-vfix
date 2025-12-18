"""
Migration script to add vacations table to the database.
Run this once to add vacation/off-day tracking functionality.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy import inspect
import logging
from app.database import engine
from app.models.vacation import Vacation

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def table_exists(table_name: str) -> bool:
    """Check if a table exists"""
    inspector = inspect(engine)
    return table_name in inspector.get_table_names()


def migrate():
    """Run migration to add vacations table"""
    logger.info("Starting vacations table migration...")
    
    # Create vacations table if it doesn't exist
    if not table_exists('vacations'):
        logger.info("Creating vacations table...")
        Vacation.__table__.create(bind=engine, checkfirst=True)
        logger.info("✓ vacations table created")
    else:
        logger.info("✓ vacations table already exists")
    
    logger.info("Migration completed successfully!")
    logger.info("Vacation tracking functionality is now available.")


if __name__ == "__main__":
    migrate()

