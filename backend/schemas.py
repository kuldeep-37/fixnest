from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class TicketCreate(BaseModel):
    resident_id: int
    community_id: int
    category: str
    description: str
    photo_base64: str
    intake_lat: Optional[float] = None
    intake_lng: Optional[float] = None
    unit_no: str

class VerifyUploadRequest(BaseModel):
    photo_base64: str
    description: str

class VerifyUploadResponse(BaseModel):
    match_percentage: float
    duplicate_match_pct: float = 0.0

class TicketResponse(BaseModel):
    id: int
    category: str
    description: str
    status: str
class CommentCreate(BaseModel):
    content: str
    user_id: int

class CommentResponse(BaseModel):
    id: int
    content: str
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class AITriageResultResponse(BaseModel):
    predicted_category: str
    category_confidence: float
    severity_tier: str
    duplicate_flag: bool
    duplicate_of_ticket_id: Optional[int] = None
    
    classification: Optional[str] = None
    reason: Optional[str] = None
    
    duplicate_match_pct: float
    genuineness_pct: float
    category_match_pct: float
    spam_flag: bool
    
    class Config:
        from_attributes = True

class TicketResponse(BaseModel):
    id: int
    category: str
    description: str
    status: str
    unit_no: Optional[str] = None
    priority: Optional[str] = None
    assigned_to: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class TicketDetailResponse(TicketResponse):
    photo_url: Optional[str] = None
    video_url: Optional[str] = None
    triage_result: Optional[AITriageResultResponse] = None
    comments: List[CommentResponse] = []
    
    class Config:
        from_attributes = True
