from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.individual_expense import IndividualExpense
from app.models.settlement import SettlementPayment
from app.models.group import GroupMember
from app.schemas.settlement import MemberBalance, SettlementTransfer, SettlementSummaryResponse, SettlementPaymentResponse

def calculate_group_settlements(db: Session, group_id: int) -> SettlementSummaryResponse:
    # 1. Fetch all group members
    members = db.query(GroupMember).filter(GroupMember.group_id == group_id).all()
    member_count = len(members)
    
    if member_count == 0:
        return SettlementSummaryResponse(
            total_individual_expenses=0.0,
            member_count=0,
            fair_share_per_member=0.0,
            member_balances=[],
            suggested_transfers=[],
            settlement_history=[]
        )
    
    # 2. Fetch total individual expenses for the group
    total_expenses = db.query(func.coalesce(func.sum(IndividualExpense.amount), 0.0))\
        .filter(IndividualExpense.group_id == group_id)\
        .scalar()
    total_expenses = round(float(total_expenses), 2)
    
    fair_share = round(total_expenses / member_count, 2) if member_count > 0 else 0.0
    
    # 3. Fetch expenses paid by each member
    member_paid_map = {}
    expense_rows = db.query(
        IndividualExpense.paid_by_id,
        func.coalesce(func.sum(IndividualExpense.amount), 0.0)
    ).filter(IndividualExpense.group_id == group_id)\
     .group_by(IndividualExpense.paid_by_id).all()
    
    for user_id, amount in expense_rows:
        member_paid_map[user_id] = round(float(amount), 2)
        
    # 4. Fetch all settlement payments made in this group
    settlement_payments = db.query(SettlementPayment)\
        .filter(SettlementPayment.group_id == group_id)\
        .order_by(SettlementPayment.payment_date.desc(), SettlementPayment.id.desc())\
        .all()
        
    # Track settlement adjustments:
    # If user A paid user B ₹X: user A's net_balance increases by X, user B's decreases by X
    settlement_paid_map = {m.user_id: 0.0 for m in members}
    settlement_received_map = {m.user_id: 0.0 for m in members}
    
    for sp in settlement_payments:
        if sp.from_user_id in settlement_paid_map:
            settlement_paid_map[sp.from_user_id] += float(sp.amount)
        if sp.to_user_id in settlement_received_map:
            settlement_received_map[sp.to_user_id] += float(sp.amount)
            
    # 5. Compute net balances
    member_balances: List[MemberBalance] = []
    debtors = []   # list of [user_id, user_name, amount_owed]
    creditors = [] # list of [user_id, user_name, amount_to_receive]
    
    for m in members:
        u = m.user
        paid = member_paid_map.get(u.id, 0.0)
        # Base net balance from expenses
        base_net = round(paid - fair_share, 2)
        # Adjusted with recorded settlement payments
        net = round(base_net + settlement_paid_map.get(u.id, 0.0) - settlement_received_map.get(u.id, 0.0), 2)
        
        member_balances.append(
            MemberBalance(
                user_id=u.id,
                user_name=u.full_name,
                email=u.email,
                avatar_color=u.avatar_color,
                total_paid=paid,
                fair_share=fair_share,
                net_balance=net
            )
        )
        
        if net < -0.01:
            debtors.append({
                "user_id": u.id,
                "user_name": u.full_name,
                "amount": round(-net, 2)
            })
        elif net > 0.01:
            creditors.append({
                "user_id": u.id,
                "user_name": u.full_name,
                "amount": round(net, 2)
            })
            
    # 6. Optimized Debt Simplification (Min Cash Flow Algorithm)
    suggested_transfers: List[SettlementTransfer] = []
    
    # Sort debtors and creditors descending by amount
    debtors.sort(key=lambda x: x["amount"], reverse=True)
    creditors.sort(key=lambda x: x["amount"], reverse=True)
    
    d_idx = 0
    c_idx = 0
    while d_idx < len(debtors) and c_idx < len(creditors):
        debtor = debtors[d_idx]
        creditor = creditors[c_idx]
        
        transfer_amount = min(debtor["amount"], creditor["amount"])
        transfer_amount = round(transfer_amount, 2)
        
        if transfer_amount > 0.01:
            suggested_transfers.append(
                SettlementTransfer(
                    from_user_id=debtor["user_id"],
                    from_user_name=debtor["user_name"],
                    to_user_id=creditor["user_id"],
                    to_user_name=creditor["user_name"],
                    amount=transfer_amount
                )
            )
            
        debtor["amount"] = round(debtor["amount"] - transfer_amount, 2)
        creditor["amount"] = round(creditor["amount"] - transfer_amount, 2)
        
        if debtor["amount"] <= 0.01:
            d_idx += 1
        if creditor["amount"] <= 0.01:
            c_idx += 1
            
    # 7. Format settlement history
    history = [
        SettlementPaymentResponse(
            id=p.id,
            group_id=p.group_id,
            from_user_id=p.from_user_id,
            from_user_name=p.from_user.full_name if p.from_user else "Unknown",
            to_user_id=p.to_user_id,
            to_user_name=p.to_user.full_name if p.to_user else "Unknown",
            amount=p.amount,
            payment_method=p.payment_method,
            notes=p.notes,
            payment_date=p.payment_date,
            created_at=p.created_at
        )
        for p in settlement_payments
    ]
    
    return SettlementSummaryResponse(
        total_individual_expenses=total_expenses,
        member_count=member_count,
        fair_share_per_member=fair_share,
        member_balances=member_balances,
        suggested_transfers=suggested_transfers,
        settlement_history=history
    )
