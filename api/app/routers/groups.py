import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User
from app.models.group import Group, GroupMember, GroupInvitation
from app.models.common_fund import CommonFund
from app.models.activity import ActivityLog
from app.schemas.group import (
    GroupCreate, GroupUpdate, GroupJoin, GroupResponse, GroupMemberResponse, InviteMemberRequest
)
from app.utils.dependencies import get_current_user, get_group_member, require_group_admin

router = APIRouter(prefix="/groups", tags=["Groups & Workspaces"])

@router.get("", response_model=List[GroupResponse])
def get_user_groups(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    memberships = db.query(GroupMember).filter(GroupMember.user_id == current_user.id).all()
    results = []
    
    for m in memberships:
        g = m.group
        member_cnt = db.query(func.count(GroupMember.id)).filter(GroupMember.group_id == g.id).scalar() or 0
        results.append(
            GroupResponse(
                id=g.id,
                name=g.name,
                description=g.description,
                currency=g.currency,
                invite_code=g.invite_code,
                user_role=m.role,
                member_count=member_cnt,
                created_at=g.created_at
            )
        )
    return results

@router.post("", response_model=GroupResponse)
def create_group(req: GroupCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 1. Create Group
    group = Group(
        name=req.name.strip(),
        description=req.description.strip() if req.description else None,
        currency=req.currency or "INR",
        created_by_id=current_user.id
    )
    db.add(group)
    db.commit()
    db.refresh(group)
    
    # 2. Add creator as Admin
    admin_member = GroupMember(
        group_id=group.id,
        user_id=current_user.id,
        role="admin"
    )
    db.add(admin_member)
    
    # 3. Initialize dedicated Common Fund for this group
    fund = CommonFund(
        group_id=group.id,
        is_active=True
    )
    db.add(fund)
    
    # 4. Activity log
    activity = ActivityLog(
        group_id=group.id,
        user_id=current_user.id,
        action_type="group_created",
        description=f"{current_user.full_name} created the group '{group.name}'"
    )
    db.add(activity)
    
    db.commit()
    
    return GroupResponse(
        id=group.id,
        name=group.name,
        description=group.description,
        currency=group.currency,
        invite_code=group.invite_code,
        user_role="admin",
        member_count=1,
        created_at=group.created_at
    )

@router.post("/join", response_model=GroupResponse)
def join_group(req: GroupJoin, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    code = req.invite_code.strip().upper()
    group = db.query(Group).filter(func.upper(Group.invite_code) == code).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid invite code. Group not found."
        )
        
    # Check if already a member
    existing = db.query(GroupMember).filter(
        GroupMember.group_id == group.id,
        GroupMember.user_id == current_user.id
    ).first()
    
    if existing:
        member_cnt = db.query(func.count(GroupMember.id)).filter(GroupMember.group_id == group.id).scalar() or 0
        return GroupResponse(
            id=group.id,
            name=group.name,
            description=group.description,
            currency=group.currency,
            invite_code=group.invite_code,
            user_role=existing.role,
            member_count=member_cnt,
            created_at=group.created_at
        )
        
    # Add as member
    membership = GroupMember(
        group_id=group.id,
        user_id=current_user.id,
        role="member"
    )
    db.add(membership)
    
    activity = ActivityLog(
        group_id=group.id,
        user_id=current_user.id,
        action_type="member_joined",
        description=f"{current_user.full_name} joined the group via invite code"
    )
    db.add(activity)
    db.commit()
    
    member_cnt = db.query(func.count(GroupMember.id)).filter(GroupMember.group_id == group.id).scalar() or 0
    return GroupResponse(
        id=group.id,
        name=group.name,
        description=group.description,
        currency=group.currency,
        invite_code=group.invite_code,
        user_role="member",
        member_count=member_cnt,
        created_at=group.created_at
    )

@router.get("/{group_id}", response_model=GroupResponse)
def get_group(
    group_id: int,
    membership: GroupMember = Depends(get_group_member),
    db: Session = Depends(get_db)
):
    group = membership.group
    member_cnt = db.query(func.count(GroupMember.id)).filter(GroupMember.group_id == group.id).scalar() or 0
    return GroupResponse(
        id=group.id,
        name=group.name,
        description=group.description,
        currency=group.currency,
        invite_code=group.invite_code,
        user_role=membership.role,
        member_count=member_cnt,
        created_at=group.created_at
    )

@router.put("/{group_id}", response_model=GroupResponse)
def update_group(
    group_id: int,
    req: GroupUpdate,
    admin_member: GroupMember = Depends(require_group_admin),
    db: Session = Depends(get_db)
):
    group = admin_member.group
    if req.name is not None:
        group.name = req.name.strip()
    if req.description is not None:
        group.description = req.description.strip()
    if req.currency is not None:
        group.currency = req.currency.strip().upper()
        
    db.commit()
    db.refresh(group)
    
    member_cnt = db.query(func.count(GroupMember.id)).filter(GroupMember.group_id == group.id).scalar() or 0
    return GroupResponse(
        id=group.id,
        name=group.name,
        description=group.description,
        currency=group.currency,
        invite_code=group.invite_code,
        user_role=admin_member.role,
        member_count=member_cnt,
        created_at=group.created_at
    )

@router.get("/{group_id}/members", response_model=List[GroupMemberResponse])
def get_group_members(
    group_id: int,
    membership: GroupMember = Depends(get_group_member),
    db: Session = Depends(get_db)
):
    members = db.query(GroupMember).filter(GroupMember.group_id == group_id).all()
    return [
        GroupMemberResponse(
            id=m.id,
            user_id=m.user_id,
            full_name=m.user.full_name,
            email=m.user.email,
            role=m.role,
            avatar_color=m.user.avatar_color,
            joined_at=m.joined_at
        )
        for m in members
    ]

@router.post("/{group_id}/members/invite")
def invite_member(
    group_id: int,
    req: InviteMemberRequest,
    admin_member: GroupMember = Depends(require_group_admin),
    db: Session = Depends(get_db)
):
    target_email = req.email.lower().strip()
    
    # Check if target is already a registered user
    target_user = db.query(User).filter(User.email == target_email).first()
    
    if target_user:
        # Check if already a member
        existing_member = db.query(GroupMember).filter(
            GroupMember.group_id == group_id,
            GroupMember.user_id == target_user.id
        ).first()
        if existing_member:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{target_user.full_name} ({target_email}) is already a member of this group."
            )
        # Directly add existing user
        new_member = GroupMember(
            group_id=group_id,
            user_id=target_user.id,
            role=req.role or "member"
        )
        db.add(new_member)
        activity = ActivityLog(
            group_id=group_id,
            user_id=admin_member.user_id,
            action_type="member_added",
            description=f"{target_user.full_name} was added to the group by {admin_member.user.full_name}"
        )
        db.add(activity)
        db.commit()
        return {
            "message": f"Successfully added {target_user.full_name} to the group!",
            "user_id": target_user.id,
            "status": "added"
        }
    else:
        # User not registered yet, create invitation
        inv = GroupInvitation(
            group_id=group_id,
            email=target_email,
            invited_by_id=admin_member.user_id,
            token=admin_member.group.invite_code,
            role=req.role or "member",
            status="pending",
            expires_at=datetime.datetime.utcnow() + datetime.timedelta(days=7)
        )
        db.add(inv)
        db.commit()
        return {
            "message": f"Invitation prepared for {target_email}. They can join using group invite code: {admin_member.group.invite_code}",
            "invite_code": admin_member.group.invite_code,
            "status": "invited"
        }

@router.delete("/{group_id}/members/{user_id}")
def remove_member(
    group_id: int,
    user_id: int,
    admin_member: GroupMember = Depends(require_group_admin),
    db: Session = Depends(get_db)
):
    if user_id == admin_member.group.created_by_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove the group creator."
        )
        
    target_member = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == user_id
    ).first()
    
    if not target_member:
        raise HTTPException(status_code=404, detail="Member not found in group.")
        
    db.delete(target_member)
    db.commit()
    return {"message": "Member removed successfully."}

@router.put("/{group_id}/members/{user_id}/role")
def change_member_role(
    group_id: int,
    user_id: int,
    role: str,
    admin_member: GroupMember = Depends(require_group_admin),
    db: Session = Depends(get_db)
):
    if role not in ("admin", "co-admin", "member"):
        raise HTTPException(status_code=400, detail="Invalid role specified.")
        
    target = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == user_id
    ).first()
    
    if not target:
        raise HTTPException(status_code=404, detail="Member not found.")
        
    target.role = role
    db.commit()
    return {"message": f"Role updated to {role}."}
