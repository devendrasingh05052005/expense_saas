import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db, Base, engine
from app.models.user import User
from app.models.group import Group, GroupMember
from app.models.individual_expense import IndividualExpense
from app.models.common_fund import CommonFund, FundContribution, FundExpense
from app.models.settlement import SettlementPayment
from app.models.activity import ActivityLog
from app.utils.security import get_password_hash

router = APIRouter(prefix="/demo", tags=["Demo Data"])

def seed_sample_data(db: Session):
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    
    # 1. Create or get 3 roommates
    demo_users_data = [
        {"email": "rahul@roommates.app", "name": "Rahul Sharma", "color": "#6366f1"},
        {"email": "aman@roommates.app", "name": "Aman Verma", "color": "#10b981"},
        {"email": "priya@roommates.app", "name": "Priya Patel", "color": "#f59e0b"}
    ]
    
    users = []
    pwd_hash = get_password_hash("Password123!")
    
    for udata in demo_users_data:
        user = db.query(User).filter(User.email == udata["email"]).first()
        if not user:
            user = User(
                email=udata["email"],
                full_name=udata["name"],
                hashed_password=pwd_hash,
                is_verified=True,
                avatar_color=udata["color"]
            )
            db.add(user)
            db.flush()
        users.append(user)
        
    rahul, aman, priya = users[0], users[1], users[2]
    
    # 2. Create demo group
    group = db.query(Group).filter(Group.name == "Flat 302 - Bhopal").first()
    if not group:
        group = Group(
            name="Flat 302 - Bhopal",
            description="Shared flat expenses for Rahul, Aman, and Priya",
            currency="INR",
            invite_code="FLAT302",
            created_by_id=rahul.id
        )
        db.add(group)
        db.flush()
        
        # Add members
        db.add(GroupMember(group_id=group.id, user_id=rahul.id, role="admin"))
        db.add(GroupMember(group_id=group.id, user_id=aman.id, role="member"))
        db.add(GroupMember(group_id=group.id, user_id=priya.id, role="member"))
        db.flush()
        
        # 3. Create Common Fund
        fund = CommonFund(group_id=group.id, is_active=True, target_monthly_contribution=6000.0)
        db.add(fund)
        db.flush()
        
        today = datetime.date.today()
        
        # Fund contributions: ₹2,000 each = ₹6,000 total
        db.add(FundContribution(fund_id=fund.id, group_id=group.id, user_id=rahul.id, amount=2000.0, contribution_date=today - datetime.timedelta(days=20), notes="Monthly Fund Contribution"))
        db.add(FundContribution(fund_id=fund.id, group_id=group.id, user_id=aman.id, amount=2000.0, contribution_date=today - datetime.timedelta(days=20), notes="Monthly Fund Contribution"))
        db.add(FundContribution(fund_id=fund.id, group_id=group.id, user_id=priya.id, amount=2000.0, contribution_date=today - datetime.timedelta(days=19), notes="Monthly Fund Contribution"))
        db.flush()
        
        # Fund expenses (Milk, Veggies, Gas, Cleaning)
        db.add(FundExpense(fund_id=fund.id, group_id=group.id, purchased_by_id=rahul.id, amount=120.0, description="Milk & Bread", category="Groceries", expense_date=today - datetime.timedelta(days=15)))
        db.add(FundExpense(fund_id=fund.id, group_id=group.id, purchased_by_id=aman.id, amount=350.0, description="Fresh Vegetables & Fruits", category="Groceries", expense_date=today - datetime.timedelta(days=10)))
        db.add(FundExpense(fund_id=fund.id, group_id=group.id, purchased_by_id=priya.id, amount=920.0, description="Indane Gas Cylinder Refill", category="Utilities", expense_date=today - datetime.timedelta(days=6)))
        db.add(FundExpense(fund_id=fund.id, group_id=group.id, purchased_by_id=rahul.id, amount=280.0, description="Detergent & Floor Cleaner", category="Household", expense_date=today - datetime.timedelta(days=2)))
        db.flush()
        
        # 4. Individual expenses paid personally
        expenses_data = [
            {"user": rahul, "amount": 1850.0, "desc": "Whole Wheat Atta & Basmati Rice (25kg)", "cat": "Groceries", "days_ago": 22},
            {"user": rahul, "amount": 800.0, "desc": "High Speed WiFi Broadband Bill", "cat": "Utilities", "days_ago": 18},
            {"user": aman, "amount": 1200.0, "desc": "Water Purifier Ro Filter Service", "cat": "Household", "days_ago": 14},
            {"user": aman, "amount": 450.0, "desc": "Electricity Board Maintenance Fee", "cat": "Utilities", "days_ago": 11},
            {"user": priya, "amount": 2400.0, "desc": "Monthly Vegetable & Dairy Bulk Supply", "cat": "Groceries", "days_ago": 8},
            {"user": priya, "amount": 650.0, "desc": "Kitchen Spice Rack & Cookware", "cat": "Household", "days_ago": 4},
            {"user": rahul, "amount": 320.0, "desc": "Tea Leaves & Sugar Refill", "cat": "Groceries", "days_ago": 1},
        ]
        
        for ed in expenses_data:
            db.add(IndividualExpense(
                group_id=group.id,
                paid_by_id=ed["user"].id,
                amount=ed["amount"],
                description=ed["desc"],
                category=ed["cat"],
                expense_date=today - datetime.timedelta(days=ed["days_ago"])
            ))
            
        # 5. Add an initial settlement record
        db.add(SettlementPayment(
            group_id=group.id,
            from_user_id=aman.id,
            to_user_id=priya.id,
            amount=500.0,
            payment_method="UPI",
            notes="Initial UPI Settlement",
            payment_date=today - datetime.timedelta(days=2)
        ))
        
        # 6. Activities
        db.add(ActivityLog(group_id=group.id, user_id=rahul.id, action_type="group_created", description="Rahul Sharma created the group 'Flat 302 - Bhopal'"))
        db.add(ActivityLog(group_id=group.id, user_id=rahul.id, action_type="fund_contributed", description="Rahul contributed ₹2,000.00 to Common Fund"))
        db.add(ActivityLog(group_id=group.id, user_id=aman.id, action_type="fund_contributed", description="Aman contributed ₹2,000.00 to Common Fund"))
        db.add(ActivityLog(group_id=group.id, user_id=priya.id, action_type="fund_contributed", description="Priya contributed ₹2,000.00 to Common Fund"))
        db.add(ActivityLog(group_id=group.id, user_id=priya.id, action_type="fund_spent", description="Priya spent ₹920.00 for Indane Gas Cylinder"))
        
        db.commit()
        return {"status": "seeded", "message": "Demo data initialized successfully with 3 roommates, expenses, and common fund."}
    
    return {"status": "exists", "message": "Demo group 'Flat 302 - Bhopal' already exists."}

@router.post("/seed")
def seed_demo_endpoint(db: Session = Depends(get_db)):
    return seed_sample_data(db)
