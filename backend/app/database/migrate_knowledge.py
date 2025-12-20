"""
Migration script to add the 'knowledge' column to the 'appointments' table.
"""
import logging
from sqlalchemy import text, inspect
from app.database import engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column exists in a table."""
    try:
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns(table_name)]
        return column_name in columns
    except Exception as e:
        logger.error(f"Error checking for column {table_name}.{column_name}: {e}")
        return False

def migrate_knowledge():
    """Adds the knowledge column to the appointments table."""
    with engine.begin() as connection:
        logger.info("Starting knowledge migration...")

        if not column_exists('appointments', 'knowledge'):
            logger.info("Adding 'knowledge' column to 'appointments' table...")
            try:
                # Using TEXT for broader compatibility, which is what String often maps to.
                connection.execute(text('ALTER TABLE appointments ADD COLUMN knowledge TEXT'))
                logger.info("✓ 'knowledge' column added successfully.")
            except Exception as e:
                logger.error(f"Failed to add 'knowledge' column: {e}")
        else:
            logger.info("✓ 'knowledge' column already exists in 'appointments' table.")

        logger.info("Knowledge migration completed.")

if __name__ == "__main__":
    migrate_knowledge()
