from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime

class FundContributionCreate(BaseModel):
    amount: float = Field(..., gt=0)
    contribution_date: Optional[date] = None
    notes: Optional[str] = "Fund Contribution"

class FundContributionUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0)
    contribution_date: Optional[date] = None
    notes: Optional[str] = None

class FundExpenseCreate(BaseModel):
    amount: float = Field(..., gt=0)
    description: str = Field(..., min_length=1, max_length=255)
    category: str = Field("Groceries", max_length=100)
    payment_method: Optional[str] = "Online"
    expense_date: Optional[date] = None

class FundExpenseUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0)
    description: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = Field(None, max_length=100)
    payment_method: Optional[str] = None
    expense_date: Optional[date] = None

class FundTransactionItem(BaseModel):
    id: int
    transaction_type: str  # "contribution" or "expense"
    amount: float
    description: str
    category: Optional[str] = None
    payment_method: Optional[str] = "Online"
    user_id: int
    user_name: str
    date: date
    running_balance: float
    created_at: datetime
    can_edit: bool = False

class MemberContributionStat(BaseModel):
    user_id: int
    user_name: str
    avatar_color: str
    total_contributed: float
    percentage: float

class FundSummaryResponse(BaseModel):
    fund_id: int
    group_id: int
    is_active: bool
    total_contributed: float
    total_spent: float
    available_balance: float
    utilization_percentage: float
    member_contributions: List[MemberContributionStat]
