"""
Seed script to create fake enterprise users for testing
Creates 10 random enterprise users with different roles and companies
"""
import random
from faker import Faker
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models
from app.core.security import get_password_hash
from datetime import datetime, timedelta
import uuid
import unicodedata
import re

fake = Faker(['tr_TR'])  # Turkish locale for realistic Turkish names


def normalize_turkish_chars(text: str) -> str:
    """
    Normalize Turkish characters to ASCII equivalents for use in emails/usernames.
    ç -> c, ğ -> g, ı -> i, ö -> o, ş -> s, ü -> u
    """
    # Turkish character mappings
    turkish_map = {
        'ç': 'c', 'Ç': 'C',
        'ğ': 'g', 'Ğ': 'G',
        'ı': 'i', 'İ': 'I',
        'ö': 'o', 'Ö': 'O',
        'ş': 's', 'Ş': 'S',
        'ü': 'u', 'Ü': 'U'
    }
    
    # Replace Turkish characters
    for turkish_char, ascii_char in turkish_map.items():
        text = text.replace(turkish_char, ascii_char)
    
    # Remove any remaining non-ASCII characters and normalize
    text = unicodedata.normalize('NFKD', text)
    text = text.encode('ascii', 'ignore').decode('ascii')
    
    # Remove any special characters except alphanumeric and basic punctuation
    text = re.sub(r'[^a-zA-Z0-9]', '', text)
    
    return text.lower()


def create_enterprise_users():
    """Create 10 fake enterprise users"""
    db = SessionLocal()
    
    try:
        print("🏢 Creating fake enterprise users...")
        
        # Company names
        companies = [
            "Beyaz Eşya Teknik Servis",
            "Arçelik Yetkili Servis",
            "Bosch Teknik Hizmetler",
            "Samsung Tamir Merkezi",
            "LG Servis Noktası"
        ]
        
        # Branch cities
        cities = ["İstanbul", "Ankara", "İzmir", "Bursa", "Antalya"]
        
        # Specializations
        specializations_options = [
            ["Çamaşır Makinesi", "Kurutma Makinesi"],
            ["Buzdolabı", "Derin Dondurucu"],
            ["Bulaşık Makinesi"],
            ["Fırın", "Ocak"],
            ["Klima", "Havalandırma"]
        ]
        
        # Roles with distribution
        roles_pool = [
            "technician",
            "technician",
            "technician",
            "technician",
            "senior_technician",
            "senior_technician",
            "branch_manager",
            "branch_manager",
            "enterprise_admin",
            "enterprise_admin"
        ]
        
        created_users = []
        enterprises_map = {}
        branches_map = {}
        
        for i in range(10):
            # Select company (reuse some companies)
            company_name = random.choice(companies)
            
            # Get or create enterprise
            if company_name in enterprises_map:
                enterprise = enterprises_map[company_name]
            else:
                normalized_company_for_email = normalize_turkish_chars(company_name)
                enterprise = models.Enterprise(
                    id=uuid.uuid4(),
                    name=company_name,
                    registration_number=f"{random.randint(1000000000, 9999999999)}",
                    contact_email=f"info@{normalized_company_for_email}.com",
                    contact_phone=fake.phone_number(),
                    is_active=True
                )
                db.add(enterprise)
                db.flush()
                enterprises_map[company_name] = enterprise
                print(f"  ✓ Created enterprise: {enterprise.name}")
            
            # Create branch (unique for each user or reuse some)
            city = random.choice(cities)
            branch_key = f"{company_name}-{city}"
            
            if branch_key in branches_map:
                branch = branches_map[branch_key]
            else:
                branch = models.Branch(
                    id=uuid.uuid4(),
                    enterprise_id=enterprise.id,
                    name=f"{city} Şubesi",
                    address=f"{fake.street_address()}, {city}",
                    phone=fake.phone_number(),
                    is_active=True
                )
                db.add(branch)
                db.flush()
                branches_map[branch_key] = branch
                print(f"    ✓ Created branch: {branch.name}")
            
            # Create user
            first_name = fake.first_name()
            last_name = fake.last_name()
            # Normalize Turkish characters for username and email
            normalized_first = normalize_turkish_chars(first_name)
            normalized_company = normalize_turkish_chars(company_name)
            username = f"{normalized_first}{i+1}"
            email = f"{username}@{normalized_company}.com"
            
            role = roles_pool[i]
            
            user = models.User(
                id=uuid.uuid4(),
                email=email,
                username=username,
                hashed_password=get_password_hash("password123"),  # Same password for all test users
                full_name=f"{first_name} {last_name}",
                phone=fake.phone_number(),
                role="user",
                enterprise_id=enterprise.id,
                branch_id=branch.id,
                enterprise_role=role,
                employee_id=f"EMP{1000 + i}",
                gdpr_consent=True,
                age_verified=True,
                is_active=True
            )
            
            db.add(user)
            db.flush()
            
            # If branch_manager, set as branch manager
            if role == "branch_manager" and not branch.manager_id:
                branch.manager_id = user.id
                db.flush()
            
            # Create session
            from app.core.security import create_access_token
            access_token, jti = create_access_token(data={"sub": str(user.id)})
            
            session = models.UserSession(
                id=uuid.uuid4(),
                user_id=user.id,
                token_id=jti,
                device_name="Seed Script",
                user_agent="Python Seed",
                ip_address="127.0.0.1",
                is_active=True,
                expires_at=datetime.utcnow() + timedelta(days=30)
            )
            db.add(session)
            
            created_users.append({
                "email": email,
                "username": username,
                "password": "password123",
                "role": role,
                "company": company_name,
                "branch": branch.name
            })
            
            print(f"      ✓ User {i+1}/10: {username} ({role}) at {company_name}/{branch.name}")
        
        db.commit()
        
        print("\n✨ Successfully created 10 enterprise users!")
        print("\n📋 Login Credentials (all use password: password123):")
        print("=" * 80)
        for user in created_users:
            print(f"Email: {user['email']:<40} Role: {user['role']:<20}")
            print(f"  Company: {user['company']} / Branch: {user['branch']}")
        print("=" * 80)
        print("\n💡 You can login with any of these credentials at /login")
        print("   They will redirect to /chat (enterprise dashboard not implemented yet)\n")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating users: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    create_enterprise_users()

