"""
Migration script to add enterprise tables and fields to existing database
Run this once to upgrade your database schema
"""
from sqlalchemy import text, inspect
import logging
from app.database import engine, SessionLocal
from app.models import Base, Enterprise, Branch

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column exists in a table"""
    inspector = inspect(engine)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns


def table_exists(table_name: str) -> bool:
    """Check if a table exists"""
    inspector = inspect(engine)
    return table_name in inspector.get_table_names()


def migrate():
    """Run migration to add enterprise functionality"""
    with engine.begin() as connection:
        logger.info("Starting enterprise migration...")
        
        # Create enterprises table if it doesn't exist
        if not table_exists('enterprises'):
            logger.info("Creating enterprises table...")
            Enterprise.__table__.create(bind=engine, checkfirst=True)
            logger.info("✓ enterprises table created")
        else:
            logger.info("✓ enterprises table already exists")
        
        # Create branches table if it doesn't exist
        if not table_exists('branches'):
            logger.info("Creating branches table...")
            Branch.__table__.create(bind=engine, checkfirst=True)
            logger.info("✓ branches table created")
        else:
            logger.info("✓ branches table already exists")
        
        # Add enterprise fields to users table
        users_columns = [
            ('enterprise_id', 'VARCHAR(36)'),
            ('branch_id', 'VARCHAR(36)'),
            ('enterprise_role', 'VARCHAR(50)'),
            ('employee_id', 'VARCHAR(100)')
        ]
        
        for column_name, column_type in users_columns:
            if not column_exists('users', column_name):
                logger.info(f"Adding {column_name} to users table...")
                try:
                    # SQLite syntax for adding column
                    connection.execute(text(f"ALTER TABLE users ADD COLUMN {column_name} {column_type}"))
                    logger.info(f"✓ {column_name} added to users table")
                except Exception as e:
                    logger.error(f"Error adding {column_name}: {e}")
            else:
                logger.info(f"✓ {column_name} already exists in users table")
        
        # Create indexes if they don't exist
        try:
            # Check if index exists (different for SQLite vs PostgreSQL)
            inspector = inspect(engine)
            existing_indexes = [idx['name'] for idx in inspector.get_indexes('users')]
            
            indexes_to_create = [
                ('ix_users_enterprise_id', 'CREATE INDEX IF NOT EXISTS ix_users_enterprise_id ON users (enterprise_id)'),
                ('ix_users_branch_id', 'CREATE INDEX IF NOT EXISTS ix_users_branch_id ON users (branch_id)'),
                ('ix_users_enterprise_role', 'CREATE INDEX IF NOT EXISTS ix_users_enterprise_role ON users (enterprise_role)'),
                ('ix_users_enterprise_branch', 'CREATE INDEX IF NOT EXISTS ix_users_enterprise_branch ON users (enterprise_id, branch_id)'),
            ]
            
            for index_name, create_sql in indexes_to_create:
                if index_name not in existing_indexes:
                    logger.info(f"Creating index {index_name}...")
                    connection.execute(text(create_sql))
                    logger.info(f"✓ Index {index_name} created")
                else:
                    logger.info(f"✓ Index {index_name} already exists")
        except Exception as e:
            logger.warning(f"Error creating indexes (non-critical): {e}")
        
        logger.info("Migration completed successfully!")
        logger.info("Enterprise functionality is now available.")


if __name__ == "__main__":
    migrate()


