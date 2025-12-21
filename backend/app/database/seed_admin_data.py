"""
Seed script to populate the database with dummy data for admin dashboard testing.
Run this script to create sample users, chat sessions, feedback, and improvement data.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from datetime import datetime, timedelta
import random
import uuid

from app.database.connection import SessionLocal, engine, Base
from app.models.user import User
from app.models.chat_session import ChatFeedback
from app.models.chat_session import ChatSession
from app.models.admin import TechnicianFeedback, ImprovementData
from app.core.security import get_password_hash


def seed_database():
    """Seed the database with dummy data"""
    db = SessionLocal()
    
    try:
        # Create tables if they don't exist
        Base.metadata.create_all(bind=engine)
        
        print("🌱 Starting database seeding...")
        
        # Check if admin user exists
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            admin_user = User(
                email="admin@vfix.local",
                username="admin",
                hashed_password=get_password_hash("admin"),
                full_name="System Administrator",
                role="admin",
                is_active=True,
                gdpr_consent=True,
                age_verified=True
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            print("✅ Admin user created (username: admin, password: admin)")
        else:
            print("ℹ️ Admin user already exists")
        
        # Create sample regular users
        sample_users = []
        user_names = [
            ("Ahmet Yılmaz", "ahmet.yilmaz"),
            ("Ayşe Demir", "ayse.demir"),
            ("Mehmet Kaya", "mehmet.kaya"),
            ("Fatma Öztürk", "fatma.ozturk"),
            ("Ali Çelik", "ali.celik"),
            ("Zeynep Arslan", "zeynep.arslan"),
            ("Mustafa Şahin", "mustafa.sahin"),
            ("Elif Yıldız", "elif.yildiz"),
        ]
        
        for full_name, username in user_names:
            existing = db.query(User).filter(User.username == username).first()
            if not existing:
                user = User(
                    email=f"{username}@example.com",
                    username=username,
                    hashed_password=get_password_hash("password123"),
                    full_name=full_name,
                    role="user",
                    is_active=True,
                    gdpr_consent=True,
                    age_verified=True
                )
                db.add(user)
                sample_users.append(user)
        
        db.commit()
        print(f"✅ Created {len(sample_users)} sample users")
        
        # Get all users for reference
        all_users = db.query(User).filter(User.role == "user").all()
        
        # Create sample technicians
        technicians = []
        tech_names = [
            ("Hasan Usta", "hasan.usta"),
            ("Osman Tekniker", "osman.tekniker"),
            ("İbrahim Tamirci", "ibrahim.tamirci"),
        ]
        
        for full_name, username in tech_names:
            existing = db.query(User).filter(User.username == username).first()
            if not existing:
                tech = User(
                    email=f"{username}@vfix-tech.com",
                    username=username,
                    hashed_password=get_password_hash("tech123"),
                    full_name=full_name,
                    role="technician",
                    is_active=True,
                    gdpr_consent=True,
                    age_verified=True
                )
                db.add(tech)
                technicians.append(tech)
        
        db.commit()
        print(f"✅ Created {len(technicians)} sample technicians")
        
        # Get all technicians
        all_technicians = db.query(User).filter(User.role == "technician").all()
        
        # Create sample chat sessions
        session_titles = [
            "Buzdolabı soğutmuyor",
            "Çamaşır makinesi sıkma yapmıyor",
            "Bulaşık makinesi su almıyor",
            "Fırın ısınmıyor",
            "Klima soğuk üflemiyor",
            "Televizyon açılmıyor",
            "Mikrodalga çalışmıyor",
            "Kurutma makinesi kurutmuyor",
            "Kahve makinesi su ısıtmıyor",
            "Elektrik süpürgesi emmiyor",
            "Buzdolabı çok ses yapıyor",
            "Çamaşır makinesi su kaçırıyor",
            "Fırın kapağı kapanmıyor",
            "Bulaşık makinesi kötü kokuyor",
            "Klima su damlatıyor",
        ]
        
        chat_sessions = []
        for i, title in enumerate(session_titles):
            if all_users:
                user = random.choice(all_users)
                session = ChatSession(
                    user_id=user.id,
                    session_key=f"session_{uuid.uuid4().hex[:12]}",
                    title=title,
                    message_count=random.randint(3, 15),
                    problem_solved=random.random() > 0.25,  # 75% solved
                    technician_dispatched=random.random() > 0.7,  # 30% dispatched
                    created_at=datetime.utcnow() - timedelta(days=random.randint(0, 30))
                )
                db.add(session)
                chat_sessions.append(session)
        
        db.commit()
        print(f"✅ Created {len(chat_sessions)} sample chat sessions")
        
        # Create sample user feedback (ChatFeedback)
        user_comments = [
            "Çok hızlı ve etkili bir çözüm sunuldu, teşekkürler!",
            "Yapay zeka tam olarak sorunu tespit etti, harika!",
            "Biraz karmaşık bir süreçti ama sonunda çözüldü.",
            "Maalesef çözüm işe yaramadı, teknisyen çağırmak zorunda kaldım.",
            "Gayet iyi bir deneyimdi, tavsiye ederim.",
            "Hızlı cevap aldım, çok memnunum.",
            "Açıklamalar biraz karışıktı ama sonunda anladım.",
            "Mükemmel! Sorunu 5 dakikada çözdük.",
            "İyi bir başlangıç noktası oldu, teşekkürler.",
            "Beklediğimden daha iyi bir deneyimdi.",
            "Yardımcı oldu ama daha detaylı açıklama yapılabilirdi.",
            "Süper! Artık her sorunumda buraya danışacağım.",
        ]
        
        feedback_count = 0
        for session in chat_sessions[:12]:  # Create feedback for first 12 sessions
            if all_users:
                user = db.query(User).filter(User.id == session.user_id).first()
                if user:
                    feedback = ChatFeedback(
                        user_id=user.id,
                        session_id=session.session_key,
                        session_title=session.title,
                        rating=random.choices([3, 4, 5], weights=[1, 3, 6])[0],  # Weighted towards higher ratings
                        comment=random.choice(user_comments),
                        created_at=session.created_at + timedelta(hours=random.randint(1, 24))
                    )
                    db.add(feedback)
                    feedback_count += 1
        
        db.commit()
        print(f"✅ Created {feedback_count} sample user feedback entries")
        
        # Create sample technician feedback
        ai_problems = [
            "Kompresör arızası tespit edildi",
            "Motor kayışı kopuk",
            "Su giriş valfi tıkalı",
            "Termostat arızalı",
            "Fan motoru çalışmıyor",
            "Elektrik kartı yanık",
        ]
        
        ai_parts = [
            "Kompresör, Freon gazı",
            "Motor kayışı",
            "Su giriş valfi",
            "Termostat",
            "Fan motoru",
            "Ana kart",
        ]
        
        tech_comments = [
            "Yapay zeka doğru teşhis koydu, parçalar yeterliydi.",
            "Teşhis doğruydu ama ek parça gerekti.",
            "Farklı bir sorun vardı, ikinci ziyaret gerekti.",
            "Mükemmel teşhis, hızlıca çözdük.",
            "Parçalar tam olarak ihtiyacımız olan şeylerdi.",
            "Biraz farklı bir yaklaşım gerekti ama temel teşhis doğruydu.",
        ]
        
        tech_feedback_count = 0
        dispatched_sessions = [s for s in chat_sessions if s.technician_dispatched]
        
        # Create richer technician feedback dataset so UI has meaningful stats
        for session in dispatched_sessions[:12]:  # up to 12 dispatched sessions
            if all_technicians:
                technician = random.choice(all_technicians)
                
                # Weight toward correct diagnosis but still include misses
                diagnosis_correct = random.random() > 0.22  # ~78% correct
                # Parts sufficiency slightly lower when diagnosis wrong
                parts_sufficient = random.random() > (0.25 if diagnosis_correct else 0.55)
                
                tech_fb = TechnicianFeedback(
                    technician_id=technician.id,
                    chat_session_id=session.id,
                    rating=random.choices(
                        [3, 4, 5] if diagnosis_correct else [2, 3, 4],
                        weights=[1, 3, 5] if diagnosis_correct else [2, 3, 1]
                    )[0],
                    comment=random.choice(tech_comments),
                    diagnosis_correct=diagnosis_correct,
                    parts_sufficient=parts_sufficient,
                    second_trip_required=not parts_sufficient,
                    ai_diagnosed_problem=random.choice(ai_problems),
                    ai_recommended_parts=random.choice(ai_parts),
                    ai_solution_strategy="Arızalı parçanın değiştirilmesi önerildi.",
                    created_at=session.created_at + timedelta(days=random.randint(1, 3))
                )
                db.add(tech_fb)
                tech_feedback_count += 1
        
        db.commit()
        print(f"✅ Created {tech_feedback_count} sample technician feedback entries")
        
        # Create sample improvement data (from incorrect diagnoses)
        improvement_entries = [
            {
                "problem_description": "Buzdolabı sürekli çalışıyor ve aşırı enerji tüketiyor",
                "reason": "Kapı contası deforme olmuş, soğuk hava kaçağı var",
                "solution": "Kapı contası değiştirildi",
                "field_trip_required": True,
                "parts_required": "Buzdolabı kapı contası",
                "appliance_type": "Buzdolabı",
                "appliance_brand": "Arçelik",
                "appliance_model": "NoFrost 5088"
            },
            {
                "problem_description": "Çamaşır makinesi programa başlamıyor",
                "reason": "Kapak kilidi sensörü arızalı",
                "solution": "Kapak kilidi mekanizması değiştirildi",
                "field_trip_required": True,
                "parts_required": "Kapak kilidi, sensör kablosu",
                "appliance_type": "Çamaşır Makinesi",
                "appliance_brand": "Bosch",
                "appliance_model": "Serie 6"
            },
            {
                "problem_description": "Bulaşık makinesi bulaşıkları temizlemiyor",
                "reason": "Püskürtme kolları kireçten tıkalı",
                "solution": "Püskürtme kolları sökülüp temizlendi, kireç çözücü uygulandı",
                "field_trip_required": True,
                "parts_required": "Gerekli değil - temizlik yeterli",
                "appliance_type": "Bulaşık Makinesi",
                "appliance_brand": "Siemens",
                "appliance_model": "iQ500"
            },
            {
                "problem_description": "Fırın eşit pişirmiyor",
                "reason": "Fan motoru yavaş dönüyor",
                "solution": "Fan motoru değiştirildi",
                "field_trip_required": True,
                "parts_required": "Fırın fan motoru",
                "appliance_type": "Fırın",
                "appliance_brand": "Beko",
                "appliance_model": "BIM25300X"
            },
            {
                "problem_description": "Klima uzaktan kumandaya tepki vermiyor",
                "reason": "IR alıcı devresi arızalı",
                "solution": "IR alıcı kartı değiştirildi",
                "field_trip_required": True,
                "parts_required": "IR alıcı modülü",
                "appliance_type": "Klima",
                "appliance_brand": "Vestel",
                "appliance_model": "Bio Plus"
            },
        ]
        
        improvement_count = 0
        for entry in improvement_entries:
            imp_data = ImprovementData(
                problem_description=entry["problem_description"],
                reason=entry["reason"],
                solution=entry["solution"],
                field_trip_required=entry["field_trip_required"],
                parts_required=entry["parts_required"],
                appliance_type=entry["appliance_type"],
                appliance_brand=entry["appliance_brand"],
                appliance_model=entry["appliance_model"],
                used_for_training=random.random() > 0.6,  # 40% used
                created_at=datetime.utcnow() - timedelta(days=random.randint(1, 20))
            )
            db.add(imp_data)
            improvement_count += 1
        
        db.commit()
        print(f"✅ Created {improvement_count} sample improvement data entries")
        
        print("\n🎉 Database seeding completed successfully!")
        print("\n📋 Summary:")
        print(f"   - Admin user: admin / admin")
        print(f"   - Sample users: {len(all_users)}")
        print(f"   - Technicians: {len(all_technicians)}")
        print(f"   - Chat sessions: {len(chat_sessions)}")
        print(f"   - User feedback: {feedback_count}")
        print(f"   - Technician feedback: {tech_feedback_count}")
        print(f"   - Improvement data: {improvement_count}")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()

