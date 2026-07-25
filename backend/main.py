from fastapi import FastAPI, Depends, HTTPException, Request, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
import models, database
from typing import List
from fastapi.responses import HTMLResponse
import asyncio
from sse_starlette.sse import EventSourceResponse

# Global event queue for SSE
active_connections = []

def broadcast_event(event_type: str, data: dict):
    # Convert datetime objects to string in data if needed, simplified for now
    for queue in active_connections:
        queue.put_nowait({"event": event_type, "data": json.dumps(data, default=str)})

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
import json
from datetime import datetime, timedelta

@app.post("/verify-upload", response_model=schemas.VerifyUploadResponse)
def verify_upload(request: schemas.VerifyUploadRequest, db: Session = Depends(get_db)):
    base64_str = request.photo_base64.split(",")[1] if "," in request.photo_base64 else request.photo_base64
    match_pct = 0.0
    try:
        image_bytes = base64.b64decode(base64_str)
        match_pct = ai_triage.verify_image_text_match(image_bytes, request.description)
    except Exception as e:
        print(f"Verify image error: {e}")
        
    duplicate_match_pct = 0.0
    try:
        description_embedding = ai_triage.get_embedding(request.description)
        recent_tickets = db.query(models.Ticket).order_by(models.Ticket.id.desc()).limit(100).all()
        for t in recent_tickets:
            if t.embedding:
                try:
                    emb2 = json.loads(t.embedding)
                    sim = ai_triage.compute_similarity(description_embedding, emb2)
                    if sim > duplicate_match_pct:
                        duplicate_match_pct = sim
                except:
                    pass
    except Exception as e:
        print(f"Verify duplicate error: {e}")
        
    return {"match_percentage": match_pct, "duplicate_match_pct": round(duplicate_match_pct, 2)}

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
    
    # Broadcast ticket created event
    broadcast_event("ticket_created", {"id": db_ticket.id})
    
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
    
    # Calculate new ML metrics
    gen_pct = ai_triage.calculate_genuineness(ticket.description)
    cat_pct = ai_triage.calculate_category_match(ticket.category, ticket.description)
    
    # Embedding and duplicate match
    emb = ai_triage.get_embedding(ticket.description)
    ticket.embedding = json.dumps(emb) if emb else None
    
    time_threshold = datetime.now() - timedelta(hours=72)
    recent_tickets = db.query(models.Ticket).filter(
        models.Ticket.id != ticket.id,
        models.Ticket.community_id == ticket.community_id,
        models.Ticket.created_at >= time_threshold
    ).all()
    
    max_dup_pct = 0.0
    duplicate_of_id = None
    
    if emb:
        for rt in recent_tickets:
            if rt.embedding:
                rt_emb = json.loads(rt.embedding)
                sim = ai_triage.compute_similarity(emb, rt_emb)
                if sim > max_dup_pct:
                    max_dup_pct = sim
                    duplicate_of_id = rt.id
                    
    is_duplicate = max_dup_pct > 85.0
    
    classification_label, reason = ai_triage.determine_classification(gen_pct, max_dup_pct)
    
    # Save triage result
    triage = models.AITriageResult(
        ticket_id=ticket.id,
        predicted_category=predicted_category,
        category_confidence=confidence,
        severity_tier=severity,
        duplicate_flag=is_duplicate,
        duplicate_of_ticket_id=duplicate_of_id,
        duplicate_match_pct=max_dup_pct,
        genuineness_pct=gen_pct,
        category_match_pct=cat_pct,
        spam_flag=(gen_pct < 50.0),
        classification=classification_label,
        reason=reason
    )
    db.add(triage)
    
    # Update ticket status
    ticket.status = "Pending"
    
    # Auto-approval logic
    if severity == "Routine" and confidence > 0.8 and not is_duplicate:
        ticket.status = "Approved"
        
    db.commit()
    
    # Broadcast ticket updated event
    broadcast_event("ticket_updated", {"id": ticket.id, "status": ticket.status})
    
    return {"status": "success", "triage_id": triage.id}

@app.get("/stream")
async def stream_events(request: Request):
    queue = asyncio.Queue()
    active_connections.append(queue)
    
    async def event_generator():
        try:
            while True:
                if await request.is_disconnected():
                    break
                event = await queue.get()
                yield event
        finally:
            active_connections.remove(queue)
            
    return EventSourceResponse(event_generator())

@app.patch("/tickets/{ticket_id}")
async def update_ticket(ticket_id: int, request: Request, db: Session = Depends(get_db)):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    body = await request.json()
    if "status" in body:
        ticket.status = body["status"]
    if "priority" in body:
        ticket.priority = body["priority"]
    if "assigned_to" in body:
        ticket.assigned_to = body["assigned_to"]
        
    db.commit()
    broadcast_event("ticket_updated", {"id": ticket.id, "status": ticket.status})
    return {"status": "success"}

@app.post("/tickets/{ticket_id}/comments", response_model=schemas.CommentResponse)
def add_comment(ticket_id: int, comment: schemas.CommentCreate, db: Session = Depends(get_db)):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    db_comment = models.Comment(
        ticket_id=ticket.id,
        user_id=comment.user_id,
        content=comment.content
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    
    broadcast_event("ticket_updated", {"id": ticket.id})
    return db_comment

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

