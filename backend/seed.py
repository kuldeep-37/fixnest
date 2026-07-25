import os
import sys

# Add the parent directory to sys.path to allow relative imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend import database, models
from datetime import datetime, timedelta

def seed_db():
    print("Creating tables...")
    models.Base.metadata.create_all(bind=database.engine)
    
    db = database.SessionLocal()
    
    print("Clearing existing data...")
    db.query(models.Rating).delete()
    db.query(models.JobCompletion).delete()
    db.query(models.Assignment).delete()
    db.query(models.AITriageResult).delete()
    db.query(models.Ticket).delete()
    db.query(models.Vendor).delete()
    db.query(models.User).delete()
    db.query(models.Community).delete()
    
    print("Seeding communities...")
    c1 = models.Community(name="Sunrise Valley", city="Bangalore", city_tier=1, address="HSR Layout")
    c2 = models.Community(name="Green Park", city="Mysore", city_tier=2, address="Gokulam")
    db.add_all([c1, c2])
    db.commit()
    
    print("Seeding users...")
    u1 = models.User(name="Rajesh Sharma", unit_no="402-B", community_id=c1.id, phone="9876543210")
    u2 = models.User(name="Priya Iyer", unit_no="112-A", community_id=c1.id, phone="9876543211")
    admin = models.User(name="Admin", community_id=c1.id, role="admin")
    db.add_all([u1, u2, admin])
    db.commit()
    
    print("Seeding vendors...")
    v1 = models.Vendor(name="Urban Company (API)", categories="['Electrical', 'Plumbing']", city_tier=1, network_type="api_partner", rating_avg=4.9, jobs_completed=142)
    v2 = models.Vendor(name="Ravi Electricals", categories="['Electrical']", city_tier=2, network_type="local_network", rating_avg=4.8, jobs_completed=89)
    db.add_all([v1, v2])
    db.commit()
    
    print("Seeding tickets...")
    t1 = models.Ticket(
        resident_id=u1.id, community_id=c1.id, category="Electrical",
        description="Spark from the kitchen socket", unit_no="402-B",
        status="AI Reviewed", intake_lat=12.9121, intake_lng=77.6446,
        created_at=datetime.now() - timedelta(minutes=15)
    )
    t2 = models.Ticket(
        resident_id=u2.id, community_id=c1.id, category="Plumbing",
        description="Tap dripping slightly", unit_no="112-A",
        status="Approved", intake_lat=12.9122, intake_lng=77.6447,
        created_at=datetime.now() - timedelta(hours=1)
    )
    db.add_all([t1, t2])
    db.commit()
    
    print("Seeding AI Triage results...")
    tr1 = models.AITriageResult(
        ticket_id=t1.id, predicted_category="electrical fault",
        category_confidence=0.94, severity_tier="Critical"
    )
    tr2 = models.AITriageResult(
        ticket_id=t2.id, predicted_category="water leak plumbing",
        category_confidence=0.89, severity_tier="Routine"
    )
    db.add_all([tr1, tr2])
    db.commit()
    
    print("Database seeded successfully!")
    db.close()

if __name__ == "__main__":
    seed_db()
