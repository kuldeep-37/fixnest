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

class TicketResponse(BaseModel):
    id: int
    category: str
    description: str
    status: str
    created_at: datetime
    
    class Config:
        orm_mode = True

class AITriageResultResponse(BaseModel):
    predicted_category: str
    category_confidence: float
    severity_tier: str
    duplicate_flag: bool
    spam_flag: bool

    class Config:
        orm_mode = True

class TicketDetailResponse(TicketResponse):
    triage_result: Optional[AITriageResultResponse] = None
