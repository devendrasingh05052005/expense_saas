from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class GroupCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    currency: str = "INR"

class GroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    currency: Optional[str] = None

class GroupJoin(BaseModel):
    invite_code: str = Field(..., min_length=4, max_length=20)

class GroupMemberResponse(BaseModel):
    id: int
    user_id: int
    full_name: str
    email: str
    role: str
    avatar_color: str
    joined_at: datetime

    class Config:
        from_attributes = True

class GroupResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    currency: str = "INR"
    invite_code: str
    user_role: str
    member_count: int
    created_at: datetime

    class Config:
        from_attributes = True

class InviteMemberRequest(BaseModel):
    email: EmailStr
    role: str = "member"
