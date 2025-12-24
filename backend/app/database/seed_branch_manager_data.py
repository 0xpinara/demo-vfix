"""
Seed script to populate the database with dummy data for branch manager dashboard testing.
Creates manager user, branch, technicians, appointments, vacations, and feedback.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from datetime import datetime, timedelta, timezone
import random
import uuid

from app.database.connection import SessionLocal, engine, Base
from app.models.user import User
from app.models.appointment import Appointment, AppointmentStatus
from app.models.chat_session import ChatSession
from app.models.admin import TechnicianFeedback
from app.models.enterprise import Enterprise, Branch
from app.models.vacation import Vacation, VacationType, VacationStatus
from app.core.security import get_password_hash


def seed_branch_manager_data():
    """Seed the database with branch manager test data"""
    db = SessionLocal()
    
    try:
        # Create tables if they don't exist
        from app.database.connection import create_tables_safely
        create_tables_safely()
        
        print("🌱 Şube yöneticisi test verileri oluşturuluyor...")
        
        # Check if enterprise exists, or create one
        enterprise = db.query(Enterprise).filter(Enterprise.name == "V-Fix Türkiye").first()
        if not enterprise:
            enterprise = Enterprise(
                name="V-Fix Türkiye",
                registration_number="TR12345678901",
                contact_email="info@vfix.com.tr",
                is_active=True
            )
            enterprise.contact_phone = "+90 212 555 0000"
            db.add(enterprise)
            db.commit()
            db.refresh(enterprise)
            print("✅ V-Fix Türkiye şirketi oluşturuldu")
        else:
            print("ℹ️ V-Fix Türkiye şirketi zaten mevcut")
        
        # Check if branch exists, or create one
        branch = db.query(Branch).filter(Branch.name == "İstanbul Kadıköy Şubesi").first()
        if not branch:
            branch = Branch(
                enterprise_id=enterprise.id,
                name="İstanbul Kadıköy Şubesi",
                is_active=True
            )
            branch.address = "Kadıköy, İstanbul"
            branch.phone = "+90 216 555 0001"
            db.add(branch)
            db.commit()
            db.refresh(branch)
            print("✅ İstanbul Kadıköy Şubesi oluşturuldu")
        else:
            print("ℹ️ İstanbul Kadıköy Şubesi zaten mevcut")
        
        # Create branch manager user
        manager = db.query(User).filter(User.email == "manager@vfix.local").first()
        if not manager:
            manager = User(
                email="manager@vfix.local",
                username="manager",
                hashed_password=get_password_hash("manager"),
                full_name="Serkan Yılmaz",
                role="user",  # Base role
                enterprise_id=enterprise.id,
                branch_id=branch.id,
                enterprise_role="branch_manager",
                employee_id="MGR001",
                is_active=True,
                gdpr_consent=True,
                age_verified=True
            )
            db.add(manager)
            db.commit()
            db.refresh(manager)
            print("✅ Şube yöneticisi oluşturuldu (email: manager@vfix.local, şifre: manager)")
        else:
            # Update existing manager to have correct branch
            manager.branch_id = branch.id
            manager.enterprise_id = enterprise.id
            manager.enterprise_role = "branch_manager"
            db.commit()
            print("ℹ️ Şube yöneticisi zaten mevcut, güncellendi")
        
        # Update branch manager_id
        branch.manager_id = manager.id
        db.commit()
        
        # Create technicians for the branch
        technician_data = [
            ("Ahmet Ustaoğlu", "ahmet.ustaoglu", "TECH001"),
            ("Mehmet Tamirci", "mehmet.tamirci", "TECH002"),
            ("Hasan Elektrikçi", "hasan.elektrikci", "TECH003"),
            ("Ali Soğutmacı", "ali.sogutmaci", "TECH004"),
            ("Osman Beyaz Eşya", "osman.beyaz", "TECH005"),
        ]
        
        technicians = []
        for full_name, username, emp_id in technician_data:
            tech = db.query(User).filter(User.username == username).first()
            if not tech:
                tech = User(
                    email=f"{username}@vfix-tech.local",
                    username=username,
                    hashed_password=get_password_hash("tech123"),
                    full_name=full_name,
                    role="technician",
                    enterprise_id=enterprise.id,
                    branch_id=branch.id,
                    enterprise_role="technician",
                    employee_id=emp_id,
                    is_active=True,
                    gdpr_consent=True,
                    age_verified=True
                )
                db.add(tech)
                db.flush()  # Flush to get the ID
                technicians.append(tech)
            else:
                tech.branch_id = branch.id
                tech.enterprise_id = enterprise.id
                tech.enterprise_role = "technician"
                technicians.append(tech)
        
        db.commit()
        print(f"✅ {len(technicians)} teknisyen oluşturuldu/güncellendi")
        
        # Get all branch technicians for reference
        all_technicians = db.query(User).filter(
            User.branch_id == branch.id,
            User.enterprise_role.in_(["technician", "senior_technician"])
        ).all()
        
        # Create sample customers
        customer_data = [
            ("Zeynep Müşteri", "zeynep.musteri"),
            ("Elif Hanım", "elif.hanim"),
            ("Fatma Teyze", "fatma.teyze"),
            ("Ayşe Kaya", "ayse.kaya"),
            ("Derya Demir", "derya.demir"),
            ("Gül Yıldız", "gul.yildiz"),
        ]
        
        customers = []
        for full_name, username in customer_data:
            cust = db.query(User).filter(User.username == username).first()
            if not cust:
                cust = User(
                    email=f"{username}@example.com",
                    username=username,
                    hashed_password=get_password_hash("customer123"),
                    full_name=full_name,
                    role="user",
                    is_active=True,
                    gdpr_consent=True,
                    age_verified=True
                )
                db.add(cust)
                db.flush()  # Flush to get the ID
                customers.append(cust)
            else:
                customers.append(cust)
        
        db.commit()
        print(f"✅ {len(customers)} müşteri oluşturuldu")
        
        # Get all customers
        all_customers = db.query(User).filter(User.role == "user", User.enterprise_role.is_(None)).all()
        
        # Create sample vacations for technicians
        vacation_types = list(VacationType)
        vacation_data = []
        
        # Current/upcoming vacations
        today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Technician 1 - on vacation now (conflict scenario)
        if len(all_technicians) > 0:
            vacation_data.append({
                "employee": all_technicians[0],
                "type": VacationType.ANNUAL,
                "start": today - timedelta(days=2),
                "end": today + timedelta(days=5),
                "reason": "Yıllık izin - aile tatili"
            })
        
        # Technician 2 - upcoming vacation
        if len(all_technicians) > 1:
            vacation_data.append({
                "employee": all_technicians[1],
                "type": VacationType.PERSONAL,
                "start": today + timedelta(days=10),
                "end": today + timedelta(days=12),
                "reason": "Kişisel işler"
            })
        
        # Technician 3 - past vacation
        if len(all_technicians) > 2:
            vacation_data.append({
                "employee": all_technicians[2],
                "type": VacationType.SICK,
                "start": today - timedelta(days=15),
                "end": today - timedelta(days=12),
                "reason": "Hastalık izni"
            })
        
        # Technician 4 - vacation next week
        if len(all_technicians) > 3:
            vacation_data.append({
                "employee": all_technicians[3],
                "type": VacationType.ANNUAL,
                "start": today + timedelta(days=7),
                "end": today + timedelta(days=14),
                "reason": "Yaz tatili"
            })
        
        vacations_created = 0
        for vac_info in vacation_data:
            # Check if vacation already exists
            existing = db.query(Vacation).filter(
                Vacation.employee_id == vac_info["employee"].id,
                Vacation.start_date == vac_info["start"]
            ).first()
            
            if not existing:
                vacation = Vacation(
                    employee_id=vac_info["employee"].id,
                    branch_id=branch.id,
                    vacation_type=vac_info["type"],
                    status=VacationStatus.APPROVED,
                    start_date=vac_info["start"],
                    end_date=vac_info["end"],
                    reason=vac_info["reason"],
                    approved_by=manager.id,
                    approved_at=datetime.now(timezone.utc) - timedelta(days=30)
                )
                db.add(vacation)
                vacations_created += 1
        
        db.commit()
        print(f"✅ {vacations_created} izin kaydı oluşturuldu")
        
        # Create sample appointments
        appointment_issues = [
            ("Arçelik", "NoFrost 5088", "Buzdolabı soğutmuyor"),
            ("Bosch", "Serie 6", "Çamaşır makinesi sıkma yapmıyor"),
            ("Siemens", "iQ500", "Bulaşık makinesi su almıyor"),
            ("Beko", "BIM25300X", "Fırın ısınmıyor"),
            ("Vestel", "Bio Plus", "Klima soğuk üflemiyor"),
            ("Samsung", "WW90T", "Çamaşır makinesi su kaçırıyor"),
            ("LG", "DoorCooling", "Buzdolabı çok ses yapıyor"),
            ("Arçelik", "Telve K3300", "Kahve makinesi çalışmıyor"),
        ]
        
        locations = [
            "Kadıköy, Moda Mah.",
            "Kadıköy, Fenerbahçe",
            "Üsküdar, Altunizade",
            "Beşiktaş, Levent",
            "Ataşehir, İçerenköy",
            "Maltepe, Bağlarbaşı",
        ]
        
        appointments_created = 0
        
        # Create appointments for various scenarios
        for i in range(15):
            if not all_customers or not all_technicians:
                break
                
            customer = random.choice(all_customers)
            brand, model, issue = random.choice(appointment_issues)
            location = random.choice(locations)
            
            # Vary the scheduled dates
            if i < 3:
                # Past completed appointments
                scheduled = today - timedelta(days=random.randint(5, 20))
                status = AppointmentStatus.COMPLETED
                tech = random.choice(all_technicians)
            elif i < 6:
                # Today or tomorrow appointments
                scheduled = today + timedelta(days=random.randint(0, 2), hours=random.randint(9, 17))
                status = AppointmentStatus.SCHEDULED
                tech = random.choice(all_technicians)
            elif i < 10:
                # Upcoming appointments
                scheduled = today + timedelta(days=random.randint(3, 14), hours=random.randint(9, 17))
                status = AppointmentStatus.SCHEDULED
                tech = random.choice(all_technicians)
            else:
                # Pending appointments (no technician assigned)
                scheduled = today + timedelta(days=random.randint(1, 7), hours=random.randint(9, 17))
                status = AppointmentStatus.PENDING
                tech = None
            
            # Special case: create conflict (appointment when technician is on vacation)
            if i == 6 and len(all_technicians) > 0:
                tech = all_technicians[0]  # The one on vacation
                scheduled = today + timedelta(days=1, hours=10)  # Tomorrow, during vacation
                status = AppointmentStatus.SCHEDULED
            
            appointment = Appointment(
                customer_id=customer.id,
                technician_id=tech.id if tech else None,
                product_brand=brand,
                product_model=model,
                product_issue=issue,
                location=location,
                scheduled_for=scheduled,
                status=status
            )
            db.add(appointment)
            appointments_created += 1
        
        db.commit()
        print(f"✅ {appointments_created} randevu oluşturuldu")
        
        # Create sample chat sessions for technician feedback
        chat_sessions = []
        for i in range(10):
            if not all_customers:
                break
            customer = random.choice(all_customers)
            session = ChatSession(
                user_id=customer.id,
                session_key=f"branch_session_{uuid.uuid4().hex[:12]}",
                title=random.choice([issue for _, _, issue in appointment_issues]),
                message_count=random.randint(3, 12),
                problem_solved=random.random() > 0.3,
                technician_dispatched=True,
                created_at=today - timedelta(days=random.randint(1, 30))
            )
            db.add(session)
            chat_sessions.append(session)
        
        db.commit()
        print(f"✅ {len(chat_sessions)} sohbet oturumu oluşturuldu")
        
        # Create technician feedback for AI model evaluation
        ai_problems = [
            "Kompresör arızası tespit edildi",
            "Motor kayışı kopuk",
            "Su giriş valfi tıkalı",
            "Termostat arızalı",
            "Fan motoru çalışmıyor",
            "Elektrik kartı yanık",
            "Pompa arızası",
            "Sensör hatası",
        ]
        
        ai_parts = [
            "Kompresör, Freon gazı",
            "Motor kayışı",
            "Su giriş valfi",
            "Termostat",
            "Fan motoru",
            "Ana kart",
            "Pompa",
            "Sensör",
        ]
        
        tech_comments = [
            "AI teşhisi doğruydu, hızlıca çözdük.",
            "Parçalar yeterliydi, müşteri memnun kaldı.",
            "Farklı bir sorun vardı ama çözdük.",
            "Mükemmel teşhis, önerilen parçalar tam ihtiyacımız olan şeylerdi.",
            "Biraz farklı bir yaklaşım gerekti ama temel teşhis doğruydu.",
            "Teşhis doğruydu ancak ek parça gerekti.",
            "İkinci ziyaret gerekti, daha detaylı analiz lazımdı.",
            "AI önerisi sayesinde sorunu hemen bulduk.",
        ]
        
        feedback_created = 0
        for i, session in enumerate(chat_sessions):
            if not all_technicians:
                break
            
            tech = all_technicians[i % len(all_technicians)]
            
            # Vary the feedback quality
            diagnosis_correct = random.random() > 0.2  # 80% correct
            parts_sufficient = random.random() > 0.25 if diagnosis_correct else random.random() > 0.5
            
            feedback = TechnicianFeedback(
                technician_id=tech.id,
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
                actual_problem=None if diagnosis_correct else random.choice(ai_problems),
                actual_solution=None if diagnosis_correct else "Farklı parça değiştirildi.",
                created_at=session.created_at + timedelta(days=random.randint(1, 3))
            )
            db.add(feedback)
            feedback_created += 1
        
        db.commit()
        print(f"✅ {feedback_created} teknisyen geri bildirimi oluşturuldu")
        
        print("\n🎉 Şube yöneticisi test verileri başarıyla oluşturuldu!")
        print("\n📋 Özet:")
        print(f"   - Şirket: {enterprise.name}")
        print(f"   - Şube: {branch.name}")
        print(f"   - Şube Yöneticisi: manager@vfix.local / manager")
        print(f"   - Teknisyenler: {len(all_technicians)}")
        print(f"   - İzinler: {vacations_created}")
        print(f"   - Randevular: {appointments_created}")
        print(f"   - Geri Bildirimler: {feedback_created}")
        
    except Exception as e:
        print(f"❌ Hata: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_branch_manager_data()

