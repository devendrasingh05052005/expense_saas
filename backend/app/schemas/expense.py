from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime

class ExpenseCreate(BaseModel):
    amount: float = Field(..., gt=0, description="Amount in INR")
    description: str = Field(..., min_length=1, max_length=255)
    category: str = Field("General", max_length=100)
    payment_method: Optional[str] = "Online"
    expense_date: Optional[date] = None

class ExpenseUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0)
    description: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = Field(None, max_length=100)
    payment_method: Optional[str] = None
    expense_date: Optional[date] = None

class ExpenseResponse(BaseModel):
    id: int
    group_id: int
    paid_by_id: int
    paid_by_name: str
    paid_by_email: str
    amount: float
    description: str
    category: str
    payment_method: str = "Online"
    expense_date: date
    created_at: datetime
    can_edit: bool = False

    class Config:
        from_attributes = True
