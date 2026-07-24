from fastapi import FastAPI, Depends, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
import models, database
from typing import List

# Create DB tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="FixNest API")

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Welcome to FixNest API"}

import schemas, ai_triage
import base64
from datetime import datetime, timedelta

@app.post("/tickets", response_model=schemas.TicketResponse)
def create_ticket(ticket: schemas.TicketCreate, db: Session = Depends(get_db)):
    # Save the ticket
    db_ticket = models.Ticket(
        resident_id=ticket.resident_id,
        community_id=ticket.community_id,
        category=ticket.category,
        description=ticket.description,
        photo_url=ticket.photo_base64,
        intake_lat=ticket.intake_lat,
        intake_lng=ticket.intake_lng,
        unit_no=ticket.unit_no,
        status="Submitted"
    )
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    
    # Auto-trigger triage
    try:
        triage_ticket(db_ticket.id, db)
    except Exception as e:
        print(f"Auto-triage failed: {e}")
        
    return db_ticket

@app.post("/tickets/{ticket_id}/triage")
def triage_ticket(ticket_id: int, db: Session = Depends(get_db)):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    if ticket.photo_url and ticket.photo_url.startswith("data:image"):
        # Extract base64 part
        base64_str = ticket.photo_url.split(",")[1] if "," in ticket.photo_url else ticket.photo_url
        try:
            image_bytes = base64.b64decode(base64_str)
            # Classify image
            candidate_labels = ["electrical fault", "water leak plumbing", "unclean area garbage", "broken furniture structure"]
            classification = ai_triage.classify_image(image_bytes, candidate_labels)
            predicted_category = classification["label"]
            confidence = classification["score"]
        except Exception as e:
            print(f"Classification error: {e}")
            predicted_category = ticket.category
            confidence = 0.5
    else:
        predicted_category = ticket.category
        confidence = 0.5
        
    # Calculate severity
    severity = ai_triage.calculate_severity(ticket.category, ticket.description, confidence)
    
    # Check duplicates (same category, same community, within 24 hours)
    time_threshold = datetime.now() - timedelta(hours=24)
    duplicate_ticket = db.query(models.Ticket).filter(
        models.Ticket.id != ticket.id,
        models.Ticket.community_id == ticket.community_id,
        models.Ticket.category == ticket.category,
        models.Ticket.created_at >= time_threshold
    ).first()
    
    is_duplicate = duplicate_ticket is not None
    
    # Save triage result
    triage = models.AITriageResult(
        ticket_id=ticket.id,
        predicted_category=predicted_category,
        category_confidence=confidence,
        severity_tier=severity,
        duplicate_flag=is_duplicate,
        duplicate_of_ticket_id=duplicate_ticket.id if is_duplicate else None,
        spam_flag=False
    )
    db.add(triage)
    
    # Update ticket status
    ticket.status = "AI Reviewed"
    
    # Auto-approval logic
    if severity == "Routine" and confidence > 0.8 and not is_duplicate:
        ticket.status = "Approved"
        
    db.commit()
    return {"status": "success", "triage_id": triage.id}

@app.get("/admin/tickets", response_model=List[schemas.TicketDetailResponse])
def get_tickets(db: Session = Depends(get_db)):
    # Need to join with triage results
    tickets = db.query(models.Ticket).all()
    return tickets

@app.get("/resident/{resident_id}/tickets", response_model=List[schemas.TicketDetailResponse])
def get_resident_tickets(resident_id: int, db: Session = Depends(get_db)):
    tickets = db.query(models.Ticket).filter(models.Ticket.resident_id == resident_id).order_by(models.Ticket.created_at.desc()).all()
    return tickets

class JobCompleteRequest(BaseModel):
    vendor_id: int
    completion_lat: float
    completion_lng: float
    after_photo_base64: str

@app.post("/vendor/jobs/{ticket_id}/complete")
def complete_job(ticket_id: int, request: JobCompleteRequest, db: Session = Depends(get_db)):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    # Geo-tag verification
    distance = None
    geo_match = True
    if ticket.intake_lat and ticket.intake_lng and request.completion_lat and request.completion_lng:
        distance = ai_triage.haversine_distance(
            ticket.intake_lat, ticket.intake_lng, 
            request.completion_lat, request.completion_lng
        )
        geo_match = distance <= 50 # 50 meters threshold
        
    job_completion = models.JobCompletion(
        ticket_id=ticket.id,
        vendor_id=request.vendor_id,
        after_photo_url=request.after_photo_base64,
        completion_lat=request.completion_lat,
        completion_lng=request.completion_lng,
        geo_match_result=geo_match,
        geo_distance_meters=distance
    )
    db.add(job_completion)
    
    if geo_match:
        ticket.status = "Completed"
    else:
        ticket.status = "Review Required (Geo Mismatch)"
        
    db.commit()
    return {"status": "success", "geo_match": geo_match, "distance": distance}

class RateRequest(BaseModel):
    resident_id: int
    stars: int
    comment: str

@app.post("/tickets/{ticket_id}/rate")
def rate_job(ticket_id: int, request: RateRequest, db: Session = Depends(get_db)):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    
    rating = models.Rating(
        ticket_id=ticket.id,
        resident_id=request.resident_id,
        stars=request.stars,
        comment=request.comment
    )
    
    # Auto-reopen logic
    if request.stars <= 2:
        ticket.status = "Reopened"
        rating.reopened = True
    else:
        ticket.status = "Closed"
        
    db.add(rating)
    db.commit()
    return {"status": "success", "ticket_status": ticket.status}

