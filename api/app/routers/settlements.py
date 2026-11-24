import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.group import GroupMember
from app.models.settlement import SettlementPayment
from app.models.activity import ActivityLog
from app.schemas.settlement import RecordPaymentRequest, SettlementSummaryResponse, SettlementPaymentResponse
from app.services.settlement_calculator import calculate_group_settlements
from app.utils.dependencies import get_current_user, get_group_member

router = APIRouter(prefix="/groups/{group_id}/settlements", tags=["Settlement Calculator"])

@router.get("", response_model=SettlementSummaryResponse)
def get_settlements(
    group_id: int,
    membership: GroupMember = Depends(get_group_member),
    db: Session = Depends(get_db)
):
    return calculate_group_settlements(db, group_id)

@router.post("/record-payment", response_model=SettlementPaymentResponse)
def record_settlement_payment(
    group_id: int,
    req: RecordPaymentRequest,
    membership: GroupMember = Depends(get_group_member),
    db: Session = Depends(get_db)
):
    current_user = membership.user
    
    if req.to_user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot record a payment to yourself."
        )
        
    # Verify recipient is in group
    target_member = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == req.to_user_id
    ).first()
    
    if not target_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recipient is not a member of this group."
        )
        
    p_date = req.payment_date if req.payment_date else datetime.date.today()
    
    payment = SettlementPayment(
        group_id=group_id,
        from_user_id=current_user.id,
        to_user_id=req.to_user_id,
        amount=round(req.amount, 2),
        payment_method=req.payment_method or "UPI",
        notes=req.notes or "Settlement payment",
        payment_date=p_date
    )
    db.add(payment)
    
    activity = ActivityLog(
        group_id=group_id,
        user_id=current_user.id,
        action_type="settlement_recorded",
        description=f"{current_user.full_name} recorded a settlement payment of ₹{payment.amount:,.2f} to {target_member.user.full_name}"
    )
    db.add(activity)
    db.commit()
    db.refresh(payment)
    
    return SettlementPaymentResponse(
        id=payment.id,
        group_id=payment.group_id,
        from_user_id=payment.from_user_id,
        from_user_name=current_user.full_name,
        to_user_id=payment.to_user_id,
        to_user_name=target_member.user.full_name,
        amount=payment.amount,
        payment_method=payment.payment_method,
        notes=payment.notes,
        payment_date=payment.payment_date,
        created_at=payment.created_at
    )

@router.delete("/{payment_id}")
def delete_settlement_payment(
    group_id: int,
    payment_id: int,
    membership: GroupMember = Depends(get_group_member),
    db: Session = Depends(get_db)
):
    payment = db.query(SettlementPayment).filter(
        SettlementPayment.id == payment_id,
        SettlementPayment.group_id == group_id
    ).first()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Settlement payment not found.")
        
    can_delete = (
        membership.role in ("admin", "co-admin") or
        payment.from_user_id == membership.user_id or
        payment.to_user_id == membership.user_id
    )
    if not can_delete:
        raise HTTPException(status_code=403, detail="Permission denied to delete this record.")
        
    db.delete(payment)
    db.commit()
    return {"message": "Settlement payment deleted."}
