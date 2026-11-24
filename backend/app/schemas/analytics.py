from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import date

class MemberSpendingStat(BaseModel):
    user_id: int
    user_name: str
    email: str
    avatar_color: str
    total_spent: float
    percentage: float
    transaction_count: int

class CategoryStat(BaseModel):
    category: str
    amount: float
    percentage: float

class MonthlyTrendStat(BaseModel):
    month: str  # e.g. "Jan 2026"
    amount: float
    count: int

class DailyTrendStat(BaseModel):
    date: str   # e.g. "2026-11-20"
    amount: float
    count: int

class DashboardAnalyticsResponse(BaseModel):
    # Overall summary metrics
    total_individual_expenses: float
    common_fund_balance: float
    common_fund_spent: float
    total_transactions: int
    member_count: int
    
    # Member contribution breakdown
    member_contributions: List[MemberSpendingStat]
    highest_spender: Optional[MemberSpendingStat] = None
    average_spending_per_member: float
    
    # Charts data
    category_distribution: List[CategoryStat]
    monthly_trends: List[MonthlyTrendStat]
    daily_trends: List[DailyTrendStat]
    
    # Filter metadata
    from_date: Optional[str] = None
    to_date: Optional[str] = None
