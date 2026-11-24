from typing import Optional, List
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.models.individual_expense import IndividualExpense
from app.models.common_fund import CommonFund, FundContribution, FundExpense
from app.models.group import GroupMember
from app.schemas.analytics import (
    DashboardAnalyticsResponse, MemberSpendingStat, CategoryStat, MonthlyTrendStat, DailyTrendStat
)

def get_dashboard_analytics(
    db: Session,
    group_id: int,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None
) -> DashboardAnalyticsResponse:
    # Build filter conditions for individual expenses
    expense_filters = [IndividualExpense.group_id == group_id]
    if from_date:
        expense_filters.append(IndividualExpense.expense_date >= from_date)
    if to_date:
        expense_filters.append(IndividualExpense.expense_date <= to_date)
        
    # 1. Total individual expenses
    total_expenses = db.query(func.coalesce(func.sum(IndividualExpense.amount), 0.0))\
        .filter(and_(*expense_filters))\
        .scalar()
    total_expenses = round(float(total_expenses), 2)
    
    # Total count of individual transactions
    expense_count = db.query(func.count(IndividualExpense.id))\
        .filter(and_(*expense_filters))\
        .scalar() or 0
        
    # 2. Group members
    members = db.query(GroupMember).filter(GroupMember.group_id == group_id).all()
    member_count = len(members)
    
    # 3. Common fund metrics (isolated module)
    fund = db.query(CommonFund).filter(CommonFund.group_id == group_id).first()
    fund_balance = 0.0
    fund_spent = 0.0
    fund_tx_count = 0
    
    if fund:
        # Fund filter conditions if date range applied
        contrib_filters = [FundContribution.fund_id == fund.id]
        fund_exp_filters = [FundExpense.fund_id == fund.id]
        if from_date:
            contrib_filters.append(FundContribution.contribution_date >= from_date)
            fund_exp_filters.append(FundExpense.expense_date >= from_date)
        if to_date:
            contrib_filters.append(FundContribution.contribution_date <= to_date)
            fund_exp_filters.append(FundExpense.expense_date <= to_date)
            
        total_contrib = db.query(func.coalesce(func.sum(FundContribution.amount), 0.0))\
            .filter(and_(*contrib_filters)).scalar()
        fund_spent = db.query(func.coalesce(func.sum(FundExpense.amount), 0.0))\
            .filter(and_(*fund_exp_filters)).scalar()
        
        contrib_count = db.query(func.count(FundContribution.id))\
            .filter(and_(*contrib_filters)).scalar() or 0
        f_exp_count = db.query(func.count(FundExpense.id))\
            .filter(and_(*fund_exp_filters)).scalar() or 0
            
        fund_balance = round(float(total_contrib) - float(fund_spent), 2)
        fund_spent = round(float(fund_spent), 2)
        fund_tx_count = contrib_count + f_exp_count

    total_transactions = expense_count + fund_tx_count

    # 4. Member spending breakdown
    member_spend_rows = db.query(
        IndividualExpense.paid_by_id,
        func.coalesce(func.sum(IndividualExpense.amount), 0.0).label("total"),
        func.count(IndividualExpense.id).label("cnt")
    ).filter(and_(*expense_filters))\
     .group_by(IndividualExpense.paid_by_id).all()

    member_spend_dict = {
        row[0]: {"total": round(float(row[1]), 2), "cnt": int(row[2])}
        for row in member_spend_rows
    }

    member_contributions: List[MemberSpendingStat] = []
    highest_spender: Optional[MemberSpendingStat] = None
    max_spent = -1.0

    for m in members:
        u = m.user
        spent_info = member_spend_dict.get(u.id, {"total": 0.0, "cnt": 0})
        total_spent = spent_info["total"]
        pct = round((total_spent / total_expenses * 100), 1) if total_expenses > 0 else 0.0

        stat = MemberSpendingStat(
            user_id=u.id,
            user_name=u.full_name,
            email=u.email,
            avatar_color=u.avatar_color,
            total_spent=total_spent,
            percentage=pct,
            transaction_count=spent_info["cnt"]
        )
        member_contributions.append(stat)

        if total_spent > max_spent and total_spent > 0:
            max_spent = total_spent
            highest_spender = stat

    average_spending = round(total_expenses / member_count, 2) if member_count > 0 else 0.0

    # 5. Category breakdown
    cat_rows = db.query(
        IndividualExpense.category,
        func.coalesce(func.sum(IndividualExpense.amount), 0.0).label("cat_total")
    ).filter(and_(*expense_filters))\
     .group_by(IndividualExpense.category)\
     .order_by(func.sum(IndividualExpense.amount).desc()).all()

    category_distribution: List[CategoryStat] = []
    for cat_name, cat_tot in cat_rows:
        amount = round(float(cat_tot), 2)
        pct = round((amount / total_expenses * 100), 1) if total_expenses > 0 else 0.0
        category_distribution.append(
            CategoryStat(category=cat_name, amount=amount, percentage=pct)
        )

    # 6. Daily trends (for selected range or recent days)
    daily_rows = db.query(
        IndividualExpense.expense_date,
        func.coalesce(func.sum(IndividualExpense.amount), 0.0),
        func.count(IndividualExpense.id)
    ).filter(and_(*expense_filters))\
     .group_by(IndividualExpense.expense_date)\
     .order_by(IndividualExpense.expense_date.asc()).all()

    daily_trends = [
        DailyTrendStat(
            date=row[0].isoformat(),
            amount=round(float(row[1]), 2),
            count=int(row[2])
        )
        for row in daily_rows
    ]

    # 7. Monthly trends
    # Group by year-month
    # Note: SQLite / Postgres compatible string extraction or python aggregation
    all_expenses = db.query(IndividualExpense.expense_date, IndividualExpense.amount)\
        .filter(and_(*expense_filters))\
        .order_by(IndividualExpense.expense_date.asc()).all()
        
    monthly_dict = {}
    for exp_date, amt in all_expenses:
        m_key = exp_date.strftime("%b %Y")
        if m_key not in monthly_dict:
            monthly_dict[m_key] = {"amount": 0.0, "count": 0}
        monthly_dict[m_key]["amount"] += float(amt)
        monthly_dict[m_key]["count"] += 1
        
    monthly_trends = [
        MonthlyTrendStat(
            month=m_key,
            amount=round(val["amount"], 2),
            count=val["count"]
        )
        for m_key, val in monthly_dict.items()
    ]

    return DashboardAnalyticsResponse(
        total_individual_expenses=total_expenses,
        common_fund_balance=fund_balance,
        common_fund_spent=fund_spent,
        total_transactions=total_transactions,
        member_count=member_count,
        member_contributions=member_contributions,
        highest_spender=highest_spender,
        average_spending_per_member=average_spending,
        category_distribution=category_distribution,
        monthly_trends=monthly_trends,
        daily_trends=daily_trends,
        from_date=from_date.isoformat() if from_date else None,
        to_date=to_date.isoformat() if to_date else None
    )
