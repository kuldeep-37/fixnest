from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    unit_no = Column(String)
    community_id = Column(Integer, ForeignKey("communities.id"))
    phone = Column(String)
    role = Column(String, default="resident")

class Community(Base):
    __tablename__ = "communities"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    city = Column(String)
    city_tier = Column(Integer)
    address = Column(String)

class Vendor(Base):
    __tablename__ = "vendors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    categories = Column(String) # JSON string of categories
    city_tier = Column(Integer)
    network_type = Column(String) # "api_partner" or "local_network"
    verification_status = Column(String)
    rating_avg = Column(Float, default=0.0)
    jobs_completed = Column(Integer, default=0)

class Ticket(Base):
    __tablename__ = "tickets"
    id = Column(Integer, primary_key=True, index=True)
    resident_id = Column(Integer, ForeignKey("users.id"))
    community_id = Column(Integer, ForeignKey("communities.id"))
    category = Column(String)
    description = Column(String)
    photo_url = Column(String, nullable=True)
    video_url = Column(String, nullable=True)
    intake_lat = Column(Float, nullable=True)
    intake_lng = Column(Float, nullable=True)
    unit_no = Column(String)
    priority = Column(String, default="Normal") # Normal, High, Critical
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String, default="Pending") # Pending, Assigned, In Progress, Completed, Closed, Reopened
    embedding = Column(String, nullable=True) # JSON string of embedding floats
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    triage_result = relationship("AITriageResult", back_populates="ticket", uselist=False, foreign_keys="[AITriageResult.ticket_id]")
    assignment = relationship("Assignment", back_populates="ticket", uselist=False)
    job_completion = relationship("JobCompletion", back_populates="ticket", uselist=False)
    comments = relationship("Comment", back_populates="ticket")
    assignee = relationship("User", foreign_keys=[assigned_to])

class AITriageResult(Base):
    __tablename__ = "ai_triage_results"
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"))
    predicted_category = Column(String)
    category_confidence = Column(Float)
    severity_tier = Column(String)
    duplicate_flag = Column(Boolean, default=False)
    duplicate_of_ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=True)
    
    # AI New Requirements
    classification = Column(String, nullable=True) # Genuine, Duplicate, Invalid
    reason = Column(String, nullable=True)
    
    # Advanced AI fields
    duplicate_match_pct = Column(Float, default=0.0)
    genuineness_pct = Column(Float, default=100.0)
    category_match_pct = Column(Float, default=0.0)
    spam_flag = Column(Boolean, default=False)
    
    # Relationships
    ticket = relationship("Ticket", back_populates="triage_result", foreign_keys=[ticket_id])

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    ticket = relationship("Ticket", back_populates="comments")
    author = relationship("User")

class Assignment(Base):
    __tablename__ = "assignments"
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"))
    vendor_id = Column(Integer, ForeignKey("vendors.id"))
    routing_tier = Column(Integer)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    sla_deadline = Column(DateTime(timezone=True), nullable=True)
    status = Column(String, default="Assigned") # Assigned, Accepted, Declined
    
    ticket = relationship("Ticket", back_populates="assignment")

class JobCompletion(Base):
    __tablename__ = "job_completions"
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"))
    vendor_id = Column(Integer, ForeignKey("vendors.id"))
    after_photo_url = Column(String, nullable=True)
    completion_lat = Column(Float, nullable=True)
    completion_lng = Column(Float, nullable=True)
    geo_match_result = Column(Boolean, nullable=True)
    geo_distance_meters = Column(Float, nullable=True)
    completed_at = Column(DateTime(timezone=True), server_default=func.now())
    
    ticket = relationship("Ticket", back_populates="job_completion")

class Rating(Base):
    __tablename__ = "ratings"
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"))
    resident_id = Column(Integer, ForeignKey("users.id"))
    stars = Column(Integer)
    comment = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    reopened = Column(Boolean, default=False)
