import datetime
from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, and_
from app.database import get_db
from app.models.user import User
from app.models.group import GroupMember
from app.models.individual_expense import IndividualExpense
from app.models.activity import ActivityLog
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse
from app.utils.dependencies import get_current_user, get_group_member

router = APIRouter(prefix="/groups/{group_id}/expenses", tags=["Individual Expenses"])

@router.get("", response_model=List[ExpenseResponse])
def get_expenses(
    group_id: int,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    member_id: Optional[int] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = Query("date_desc", regex="^(date_desc|date_asc|amount_desc|amount_asc)$"),
    skip: int = 0,
    limit: int = 100,
    membership: GroupMember = Depends(get_group_member),
    db: Session = Depends(get_db)
):
    query = db.query(IndividualExpense).filter(IndividualExpense.group_id == group_id)
    
    if from_date:
        query = query.filter(IndividualExpense.expense_date >= from_date)
    if to_date:
        query = query.filter(IndividualExpense.expense_date <= to_date)
    if member_id:
        query = query.filter(IndividualExpense.paid_by_id == member_id)
    if category and category.lower() != "all":
        query = query.filter(IndividualExpense.category == category)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(IndividualExpense.description.ilike(s))
        
    # Sorting
    if sort_by == "date_desc":
        query = query.order_by(desc(IndividualExpense.expense_date), desc(IndividualExpense.id))
    elif sort_by == "date_asc":
        query = query.order_by(asc(IndividualExpense.expense_date), asc(IndividualExpense.id))
    elif sort_by == "amount_desc":
        query = query.order_by(desc(IndividualExpense.amount), desc(IndividualExpense.id))
    elif sort_by == "amount_asc":
        query = query.order_by(asc(IndividualExpense.amount), asc(IndividualExpense.id))

    expenses = query.offset(skip).limit(limit).all()
    
    current_user_id = membership.user_id
    is_admin = membership.role in ("admin", "co-admin")
    
    results = []
    for exp in expenses:
        can_edit = is_admin or (exp.paid_by_id == current_user_id)
        results.append(
            ExpenseResponse(
                id=exp.id,
                group_id=exp.group_id,
                paid_by_id=exp.paid_by_id,
                paid_by_name=exp.paid_by.full_name if exp.paid_by else "Unknown",
                paid_by_email=exp.paid_by.email if exp.paid_by else "",
                amount=exp.amount,
                description=exp.description,
                category=exp.category,
                payment_method=getattr(exp, "payment_method", "Online") or "Online",
                expense_date=exp.expense_date,
                created_at=exp.created_at,
                can_edit=can_edit
            )
        )
    return results

@router.post("", response_model=ExpenseResponse)
def add_expense(
    group_id: int,
    req: ExpenseCreate,
    membership: GroupMember = Depends(get_group_member),
    db: Session = Depends(get_db)
):
    current_user = membership.user
    exp_date = req.expense_date if req.expense_date else datetime.date.today()
    
    expense = IndividualExpense(
        group_id=group_id,
        paid_by_id=current_user.id,
        amount=round(req.amount, 2),
        description=req.description.strip(),
        category=req.category.strip() if req.category else "General",
        payment_method=req.payment_method.strip() if req.payment_method else "Online",
        expense_date=exp_date
    )
    db.add(expense)
    
    # Audit log
    activity = ActivityLog(
        group_id=group_id,
        user_id=current_user.id,
        action_type="expense_added",
        description=f"{current_user.full_name} added an expense: '{expense.description}' for ₹{expense.amount:,.2f}"
    )
    db.add(activity)
    db.commit()
    db.refresh(expense)
    
    return ExpenseResponse(
        id=expense.id,
        group_id=expense.group_id,
        paid_by_id=expense.paid_by_id,
        paid_by_name=current_user.full_name,
        paid_by_email=current_user.email,
        amount=expense.amount,
        description=expense.description,
        category=expense.category,
        payment_method=getattr(expense, "payment_method", "Online") or "Online",
        expense_date=expense.expense_date,
        created_at=expense.created_at,
        can_edit=True
    )

@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    group_id: int,
    expense_id: int,
    req: ExpenseUpdate,
    membership: GroupMember = Depends(get_group_member),
    db: Session = Depends(get_db)
):
    expense = db.query(IndividualExpense).filter(
        IndividualExpense.id == expense_id,
        IndividualExpense.group_id == group_id
    ).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found.")
        
    # Permission check: owner or admin
    is_owner = expense.paid_by_id == membership.user_id
    is_admin = membership.role in ("admin", "co-admin")
    if not (is_owner or is_admin):
        raise HTTPException(status_code=403, detail="You can only edit your own expenses.")
        
    if req.amount is not None:
        expense.amount = round(req.amount, 2)
    if req.description is not None:
        expense.description = req.description.strip()
    if req.category is not None:
        expense.category = req.category.strip()
    if req.payment_method is not None:
        expense.payment_method = req.payment_method.strip()
    if req.expense_date is not None:
        expense.expense_date = req.expense_date
        
    db.commit()
    db.refresh(expense)
    
    return ExpenseResponse(
        id=expense.id,
        group_id=expense.group_id,
        paid_by_id=expense.paid_by_id,
        paid_by_name=expense.paid_by.full_name if expense.paid_by else "Unknown",
        paid_by_email=expense.paid_by.email if expense.paid_by else "",
        amount=expense.amount,
        description=expense.description,
        category=expense.category,
        payment_method=getattr(expense, "payment_method", "Online") or "Online",
        expense_date=expense.expense_date,
        created_at=expense.created_at,
        can_edit=True
    )

@router.delete("/{expense_id}")
def delete_expense(
    group_id: int,
    expense_id: int,
    membership: GroupMember = Depends(get_group_member),
    db: Session = Depends(get_db)
):
    expense = db.query(IndividualExpense).filter(
        IndividualExpense.id == expense_id,
        IndividualExpense.group_id == group_id
    ).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found.")
        
    is_owner = expense.paid_by_id == membership.user_id
    is_admin = membership.role in ("admin", "co-admin")
    if not (is_owner or is_admin):
        raise HTTPException(status_code=403, detail="You can only delete your own expenses.")
        
    desc = expense.description
    amt = expense.amount
    
    db.delete(expense)
    
    activity = ActivityLog(
        group_id=group_id,
        user_id=membership.user_id,
        action_type="expense_deleted",
        description=f"{membership.user.full_name} deleted expense '{desc}' of ₹{amt:,.2f}"
    )
    db.add(activity)
    db.commit()
    
    return {"message": "Expense successfully deleted."}
