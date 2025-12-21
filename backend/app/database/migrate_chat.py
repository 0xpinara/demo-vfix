"""
Migration script to add chat database tables and columns
Run this once to upgrade your database schema for chat functionality
"""
from sqlalchemy import text, inspect
import logging
from app.database import engine
from app.models.chat_session import ChatSession, ChatMessage

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column exists in a table"""
    try:
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns(table_name)]
        return column_name in columns
    except Exception:
        return False


def table_exists(table_name: str) -> bool:
    """Check if a table exists"""
    try:
        inspector = inspect(engine)
        return table_name in inspector.get_table_names()
    except Exception:
        return False


def migrate():
    """Run migration to add chat functionality"""
    with engine.begin() as connection:
        logger.info("Starting chat database migration...")
        
        # Add updated_at column to chat_sessions if it doesn't exist
        if table_exists('chat_sessions'):
            if not column_exists('chat_sessions', 'updated_at'):
                logger.info("Adding updated_at column to chat_sessions table...")
                try:
                    connection.execute(text(
                        "ALTER TABLE chat_sessions ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP"
                    ))
                    logger.info("✓ updated_at column added to chat_sessions table")
                except Exception as e:
                    logger.error(f"Error adding updated_at column: {e}")
            else:
                logger.info("✓ updated_at column already exists in chat_sessions table")
            
            # Make session_key nullable - SQLite doesn't support ALTER COLUMN, so we need to recreate the table
            try:
                inspector = inspect(engine)
                session_key_col = next((c for c in inspector.get_columns('chat_sessions') if c['name'] == 'session_key'), None)
                if session_key_col and not session_key_col.get('nullable', False):
                    logger.info("Making session_key nullable (recreating table)...")
                    # SQLite workaround: create new table, copy data, drop old, rename new
                    connection.execute(text("""
                        CREATE TABLE chat_sessions_new (
                            id VARCHAR(36) PRIMARY KEY,
                            user_id VARCHAR(36) NOT NULL,
                            session_key VARCHAR(255),
                            title VARCHAR(255),
                            message_count INTEGER DEFAULT 0,
                            problem_solved BOOLEAN DEFAULT 0,
                            technician_dispatched BOOLEAN DEFAULT 0,
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            ended_at DATETIME,
                            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
                        )
                    """))
                    connection.execute(text("""
                        INSERT INTO chat_sessions_new 
                        SELECT id, user_id, session_key, title, message_count, problem_solved, 
                               technician_dispatched, created_at, updated_at, ended_at
                        FROM chat_sessions
                    """))
                    connection.execute(text("DROP TABLE chat_sessions"))
                    connection.execute(text("ALTER TABLE chat_sessions_new RENAME TO chat_sessions"))
                    # Recreate indexes
                    connection.execute(text("CREATE INDEX IF NOT EXISTS ix_chat_sessions_user_id ON chat_sessions(user_id)"))
                    connection.execute(text("CREATE INDEX IF NOT EXISTS ix_chat_sessions_session_key ON chat_sessions(session_key)"))
                    connection.execute(text("CREATE INDEX IF NOT EXISTS ix_chat_sessions_created_at ON chat_sessions(created_at)"))
                    connection.execute(text("CREATE INDEX IF NOT EXISTS ix_chat_sessions_user_created ON chat_sessions(user_id, created_at)"))
                    logger.info("✓ session_key is now nullable")
                else:
                    logger.info("✓ session_key is already nullable")
            except Exception as e:
                logger.warning(f"Could not modify session_key: {e}")
        else:
            logger.info("Creating chat_sessions table...")
            ChatSession.__table__.create(bind=engine, checkfirst=True)
            logger.info("✓ chat_sessions table created")
        
        # Create chat_messages table if it doesn't exist
        if not table_exists('chat_messages'):
            logger.info("Creating chat_messages table...")
            ChatMessage.__table__.create(bind=engine, checkfirst=True)
            logger.info("✓ chat_messages table created")
        else:
            logger.info("✓ chat_messages table already exists")
        
        logger.info("Chat database migration completed successfully!")


if __name__ == "__main__":
    migrate()

