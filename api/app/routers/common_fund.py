import datetime
from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User
from app.models.group import GroupMember
from app.models.common_fund import CommonFund, FundContribution, FundExpense
from app.models.activity import ActivityLog
from app.schemas.fund import (
    FundContributionCreate, FundContributionUpdate,
    FundExpenseCreate, FundExpenseUpdate,
    FundTransactionItem, FundSummaryResponse, MemberContributionStat
)
from app.utils.dependencies import get_current_user, get_group_member, require_group_admin

router = APIRouter(prefix="/groups/{group_id}/fund", tags=["Common Group Fund"])

def get_or_create_fund(db: Session, group_id: int) -> CommonFund:
    fund = db.query(CommonFund).filter(CommonFund.group_id == group_id).first()
    if not fund:
        fund = CommonFund(group_id=group_id, is_active=True)
        db.add(fund)
        db.commit()
        db.refresh(fund)
    return fund

def calculate_current_balance(db: Session, fund_id: int) -> float:
    total_contrib = db.query(func.coalesce(func.sum(FundContribution.amount), 0.0))\
        .filter(FundContribution.fund_id == fund_id).scalar()
    total_spent = db.query(func.coalesce(func.sum(FundExpense.amount), 0.0))\
        .filter(FundExpense.fund_id == fund_id).scalar()
    return round(float(total_contrib) - float(total_spent), 2)

@router.get("/summary", response_model=FundSummaryResponse)
def get_fund_summary(
    group_id: int,
    membership: GroupMember = Depends(get_group_member),
    db: Session = Depends(get_db)
):
    fund = get_or_create_fund(db, group_id)
    
    total_contrib = db.query(func.coalesce(func.sum(FundContribution.amount), 0.0))\
        .filter(FundContribution.fund_id == fund.id).scalar()
    total_spent = db.query(func.coalesce(func.sum(FundExpense.amount), 0.0))\
        .filter(FundExpense.fund_id == fund.id).scalar()
        
    total_contrib = round(float(total_contrib), 2)
    total_spent = round(float(total_spent), 2)
    available_balance = round(total_contrib - total_spent, 2)
    utilization_pct = round((total_spent / total_contrib * 100), 1) if total_contrib > 0 else 0.0
    
    # Member contribution breakdown
    members = db.query(GroupMember).filter(GroupMember.group_id == group_id).all()
    contrib_rows = db.query(
        FundContribution.user_id,
        func.coalesce(func.sum(FundContribution.amount), 0.0)
    ).filter(FundContribution.fund_id == fund.id)\
     .group_by(FundContribution.user_id).all()
     
    contrib_map = {row[0]: round(float(row[1]), 2) for row in contrib_rows}
    
    member_stats = []
    for m in members:
        amt = contrib_map.get(m.user_id, 0.0)
        pct = round((amt / total_contrib * 100), 1) if total_contrib > 0 else 0.0
        member_stats.append(
            MemberContributionStat(
                user_id=m.user_id,
                user_name=m.user.full_name,
                avatar_color=m.user.avatar_color,
                total_contributed=amt,
                percentage=pct
            )
        )
        
    return FundSummaryResponse(
        fund_id=fund.id,
        group_id=group_id,
        is_active=fund.is_active,
        total_contributed=total_contrib,
        total_spent=total_spent,
        available_balance=available_balance,
        utilization_percentage=utilization_pct,
        member_contributions=member_stats
    )

@router.get("/transactions", response_model=List[FundTransactionItem])
def get_fund_transactions(
    group_id: int,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    membership: GroupMember = Depends(get_group_member),
    db: Session = Depends(get_db)
):
    fund = get_or_create_fund(db, group_id)
    
    # Fetch all contributions and expenses ordered chronologically to build accurate running balance
    contributions = db.query(FundContribution).filter(FundContribution.fund_id == fund.id).all()
    expenses = db.query(FundExpense).filter(FundExpense.fund_id == fund.id).all()
    
    all_events = []
    for c in contributions:
        all_events.append({
            "id": c.id,
            "type": "contribution",
            "amount": c.amount,
            "description": c.notes or "Fund Contribution",
            "category": "Contribution",
            "payment_method": "Online",
            "user_id": c.user_id,
            "user_name": c.user.full_name if c.user else "Unknown",
            "date": c.contribution_date,
            "created_at": c.created_at
        })
        
    for e in expenses:
        all_events.append({
            "id": e.id,
            "type": "expense",
            "amount": e.amount,
            "description": e.description,
            "category": e.category,
            "payment_method": getattr(e, "payment_method", "Online") or "Online",
            "user_id": e.purchased_by_id,
            "user_name": e.purchased_by.full_name if e.purchased_by else "Unknown",
            "date": e.expense_date,
            "created_at": e.created_at
        })
        
    # Sort chronologically (oldest to newest) to calculate running balance
    all_events.sort(key=lambda x: (x["date"], x["created_at"], 0 if x["type"] == "contribution" else 1))
    
    running_balance = 0.0
    computed_ledger = []
    
    for ev in all_events:
        if ev["type"] == "contribution":
            running_balance += ev["amount"]
        else:
            running_balance -= ev["amount"]
        ev["running_balance"] = round(running_balance, 2)
        computed_ledger.append(ev)
        
    # Now sort newest first for display
    computed_ledger.reverse()
    
    # Filter by date if requested
    filtered = []
    for item in computed_ledger:
        if from_date and item["date"] < from_date:
            continue
        if to_date and item["date"] > to_date:
            continue
            
        can_edit = (membership.role in ("admin", "co-admin")) or (item["user_id"] == membership.user_id)
        filtered.append(
            FundTransactionItem(
                id=item["id"],
                transaction_type=item["type"],
                amount=item["amount"],
                description=item["description"],
                category=item["category"],
                payment_method=item.get("payment_method", "Online") or "Online",
                user_id=item["user_id"],
                user_name=item["user_name"],
                date=item["date"],
                running_balance=item["running_balance"],
                created_at=item["created_at"],
                can_edit=can_edit
            )
        )
    return filtered

@router.post("/contribute")
def add_contribution(
    group_id: int,
    req: FundContributionCreate,
    membership: GroupMember = Depends(get_group_member),
    db: Session = Depends(get_db)
):
    fund = get_or_create_fund(db, group_id)
    c_date = req.contribution_date if req.contribution_date else datetime.date.today()
    
    contrib = FundContribution(
        fund_id=fund.id,
        group_id=group_id,
        user_id=membership.user_id,
        amount=round(req.amount, 2),
        contribution_date=c_date,
        notes=req.notes.strip() if req.notes else "Fund Contribution"
    )
    db.add(contrib)
    
    activity = ActivityLog(
        group_id=group_id,
        user_id=membership.user_id,
        action_type="fund_contributed",
        description=f"{membership.user.full_name} contributed ₹{contrib.amount:,.2f} to Common Room Fund"
    )
    db.add(activity)
    db.commit()
    db.refresh(contrib)
    
    new_balance = calculate_current_balance(db, fund.id)
    return {
        "message": f"Successfully contributed ₹{contrib.amount:,.2f} to Common Fund.",
        "id": contrib.id,
        "available_balance": new_balance
    }

@router.post("/expense")
def add_fund_expense(
    group_id: int,
    req: FundExpenseCreate,
    membership: GroupMember = Depends(get_group_member),
    db: Session = Depends(get_db)
):
    fund = get_or_create_fund(db, group_id)
    expense_amount = round(req.amount, 2)
    
    # CRITICAL: Strict validation - never spend more than available balance!
    current_balance = calculate_current_balance(db, fund.id)
    if expense_amount > current_balance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot spend ₹{expense_amount:,.2f}. Current available fund balance is only ₹{current_balance:,.2f}."
        )
        
    e_date = req.expense_date if req.expense_date else datetime.date.today()
    
    expense = FundExpense(
        fund_id=fund.id,
        group_id=group_id,
        purchased_by_id=membership.user_id,
        amount=expense_amount,
        description=req.description.strip(),
        category=req.category.strip() if req.category else "Groceries",
        payment_method=req.payment_method.strip() if req.payment_method else "Online",
        expense_date=e_date
    )
    db.add(expense)
    
    activity = ActivityLog(
        group_id=group_id,
        user_id=membership.user_id,
        action_type="fund_spent",
        description=f"{membership.user.full_name} spent ₹{expense.amount:,.2f} from Common Fund for '{expense.description}'"
    )
    db.add(activity)
    db.commit()
    db.refresh(expense)
    
    new_balance = calculate_current_balance(db, fund.id)
    return {
        "message": f"Recorded Common Fund expense of ₹{expense.amount:,.2f}.",
        "id": expense.id,
        "available_balance": new_balance
    }

@router.put("/expense/{expense_id}")
def update_fund_expense(
    group_id: int,
    expense_id: int,
    req: FundExpenseUpdate,
    membership: GroupMember = Depends(get_group_member),
    db: Session = Depends(get_db)
):
    fund = get_or_create_fund(db, group_id)
    expense = db.query(FundExpense).filter(
        FundExpense.id == expense_id,
        FundExpense.fund_id == fund.id
    ).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Fund expense not found.")
        
    is_owner = expense.purchased_by_id == membership.user_id
    is_admin = membership.role in ("admin", "co-admin")
    if not (is_owner or is_admin):
        raise HTTPException(status_code=403, detail="Permission denied.")
        
    if req.amount is not None:
        new_amt = round(req.amount, 2)
        # Check balance if increasing amount
        diff = new_amt - expense.amount
        current_balance = calculate_current_balance(db, fund.id)
        if diff > current_balance:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot increase expense by ₹{diff:,.2f}. Exceeds available balance (₹{current_balance:,.2f})."
            )
        expense.amount = new_amt
        
    if req.description is not None:
        expense.description = req.description.strip()
    if req.category is not None:
        expense.category = req.category.strip()
    if req.payment_method is not None:
        expense.payment_method = req.payment_method.strip()
    if req.expense_date is not None:
        expense.expense_date = req.expense_date
        
    db.commit()
    new_balance = calculate_current_balance(db, fund.id)
    return {"message": "Fund expense updated.", "available_balance": new_balance}

@router.delete("/expense/{expense_id}")
def delete_fund_expense(
    group_id: int,
    expense_id: int,
    membership: GroupMember = Depends(get_group_member),
    db: Session = Depends(get_db)
):
    fund = get_or_create_fund(db, group_id)
    expense = db.query(FundExpense).filter(
        FundExpense.id == expense_id,
        FundExpense.fund_id == fund.id
    ).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Fund expense not found.")
        
    is_owner = expense.purchased_by_id == membership.user_id
    is_admin = membership.role in ("admin", "co-admin")
    if not (is_owner or is_admin):
        raise HTTPException(status_code=403, detail="Permission denied.")
        
    amt = expense.amount
    desc = expense.description
    db.delete(expense)
    
    activity = ActivityLog(
        group_id=group_id,
        user_id=membership.user_id,
        action_type="fund_expense_deleted",
        description=f"{membership.user.full_name} deleted fund expense '{desc}', refunding ₹{amt:,.2f} to Common Fund"
    )
    db.add(activity)
    db.commit()
    
    new_balance = calculate_current_balance(db, fund.id)
    return {
        "message": f"Fund expense deleted. ₹{amt:,.2f} has been refunded to the available balance.",
        "available_balance": new_balance
    }

@router.delete("/contribution/{contribution_id}")
def delete_fund_contribution(
    group_id: int,
    contribution_id: int,
    membership: GroupMember = Depends(get_group_member),
    db: Session = Depends(get_db)
):
    fund = get_or_create_fund(db, group_id)
    contrib = db.query(FundContribution).filter(
        FundContribution.id == contribution_id,
        FundContribution.fund_id == fund.id
    ).first()
    
    if not contrib:
        raise HTTPException(status_code=404, detail="Contribution not found.")
        
    is_owner = contrib.user_id == membership.user_id
    is_admin = membership.role in ("admin", "co-admin")
    if not (is_owner or is_admin):
        raise HTTPException(status_code=403, detail="Permission denied.")
        
    current_balance = calculate_current_balance(db, fund.id)
    if contrib.amount > current_balance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete contribution of ₹{contrib.amount:,.2f} because ₹{contrib.amount - current_balance:,.2f} of it has already been spent from the fund."
        )
        
    amt = contrib.amount
    db.delete(contrib)
    db.commit()
    
    new_balance = calculate_current_balance(db, fund.id)
    return {
        "message": f"Contribution of ₹{amt:,.2f} removed.",
        "available_balance": new_balance
    }
