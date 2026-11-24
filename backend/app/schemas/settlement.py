from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime

class MemberBalance(BaseModel):
    user_id: int
    user_name: str
    email: str
    avatar_color: str
    total_paid: float
    fair_share: float
    net_balance: float  # positive: should receive, negative: owes

class SettlementTransfer(BaseModel):
    from_user_id: int
    from_user_name: str
    to_user_id: int
    to_user_name: str
    amount: float

class RecordPaymentRequest(BaseModel):
    to_user_id: int
    amount: float = Field(..., gt=0)
    payment_method: str = "UPI"
    notes: Optional[str] = "Settlement payment"
    payment_date: Optional[date] = None

class SettlementPaymentResponse(BaseModel):
    id: int
    group_id: int
    from_user_id: int
    from_user_name: str
    to_user_id: int
    to_user_name: str
    amount: float
    payment_method: str
    notes: Optional[str] = None
    payment_date: date
    created_at: datetime

    class Config:
        from_attributes = True

class SettlementSummaryResponse(BaseModel):
    total_individual_expenses: float
    member_count: int
    fair_share_per_member: float
    member_balances: List[MemberBalance]
    suggested_transfers: List[SettlementTransfer]
    settlement_history: List[SettlementPaymentResponse]
