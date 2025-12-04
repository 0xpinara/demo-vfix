"""
Field-level encryption for sensitive data (address, phone, etc.)
Uses Fernet (AES-128) for fast, secure symmetric encryption
"""
from cryptography.fernet import Fernet
import os
import base64
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Get encryption key from environment or generate one
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")

if not ENCRYPTION_KEY:
    # Generate a key for development (in production, set this in .env)
    ENCRYPTION_KEY = Fernet.generate_key().decode()
    logger.warning("No ENCRYPTION_KEY in .env, using auto-generated key (data will be lost on restart)")

# Initialize Fernet cipher
try:
    cipher = Fernet(ENCRYPTION_KEY.encode() if isinstance(ENCRYPTION_KEY, str) else ENCRYPTION_KEY)
except Exception as e:
    logger.error(f"Failed to initialize encryption cipher: {e}")
    raise


def encrypt_field(plaintext: str) -> str:
    """
    Encrypt sensitive field data.
    
    Args:
        plaintext: The data to encrypt
    
    Returns:
        Encrypted string (base64 encoded)
    """
    if not plaintext:
        return None
    
    try:
        encrypted = cipher.encrypt(plaintext.encode('utf-8'))
        return encrypted.decode('utf-8')
    except Exception as e:
        logger.error(f"Encryption failed: {e}")
        raise


def decrypt_field(encrypted: str) -> str:
    """
    Decrypt sensitive field data.
    
    Args:
        encrypted: The encrypted data
    
    Returns:
        Decrypted plaintext string
    """
    if not encrypted:
        return None
    
    try:
        decrypted = cipher.decrypt(encrypted.encode('utf-8'))
        return decrypted.decode('utf-8')
    except Exception as e:
        logger.error(f"Decryption failed: {e}")
        # Return None or raise depending on requirements
        return None

