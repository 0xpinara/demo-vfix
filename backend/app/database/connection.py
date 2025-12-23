"""
Database configuration with optimized connection pooling for scalability
"""
from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import QueuePool, NullPool
from sqlalchemy.exc import OperationalError
import os
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./vfix_db.sqlite")

# Connection pool configuration for scalability
connect_args = {}
engine_kwargs = {
    "connect_args": {},
    "echo": False,  # Set to True for SQL logging in development
}

if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
    engine_kwargs["poolclass"] = NullPool  # SQLite doesn't benefit from pooling
else:
    # PostgreSQL/MySQL pooling configuration
    engine_kwargs["poolclass"] = QueuePool
    engine_kwargs["pool_size"] = 20  # Base connections
    engine_kwargs["max_overflow"] = 40  # Additional connections when under load
    engine_kwargs["pool_pre_ping"] = True  # Verify connections before use
    engine_kwargs["pool_recycle"] = 3600  # Recycle connections after 1 hour

# Create engine with optimized settings
engine = create_engine(DATABASE_URL, **engine_kwargs)

# Add event listeners for PostgreSQL optimization
if DATABASE_URL.startswith("postgresql"):
    @event.listens_for(engine, "connect")
    def set_postgresql_options(dbapi_conn, connection_record):
        """Set PostgreSQL session parameters for better performance"""
        cursor = dbapi_conn.cursor()
        # Enable JIT compilation for complex queries (PostgreSQL 11+)
        cursor.execute("SET jit = on")
        # Set work_mem for sorts and hash tables
        cursor.execute("SET work_mem = '16MB'")
        cursor.close()

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False  # Prevents lazy loading issues after commit
)

Base = declarative_base()

def get_db():
    """
    Dependency for getting database sessions.
    Automatically handles connection lifecycle.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables_safely():
    """
    Create database tables and indexes safely.
    Handles existing indexes gracefully (SQLite doesn't support IF NOT EXISTS for indexes).
    """
    try:
        Base.metadata.create_all(bind=engine, checkfirst=True)
    except OperationalError as e:
        # SQLite throws errors for existing indexes, which is safe to ignore
        error_msg = str(e).lower()
        if "already exists" in error_msg and "index" in error_msg:
            logger.warning(f"Ignoring existing index error: {e}")
        else:
            # Re-raise if it's a different error
            raise

