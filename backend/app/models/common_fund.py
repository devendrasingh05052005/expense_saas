import datetime
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class CommonFund(Base):
    __tablename__ = "common_funds"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    target_monthly_contribution = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    group = relationship("Group", back_populates="fund")
    contributions = relationship("FundContribution", back_populates="fund", cascade="all, delete-orphan", order_by="FundContribution.contribution_date.desc(), FundContribution.id.desc()")
    expenses = relationship("FundExpense", back_populates="fund", cascade="all, delete-orphan", order_by="FundExpense.expense_date.desc(), FundExpense.id.desc()")

class FundContribution(Base):
    __tablename__ = "fund_contributions"

    id = Column(Integer, primary_key=True, index=True)
    fund_id = Column(Integer, ForeignKey("common_funds.id", ondelete="CASCADE"), nullable=False, index=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    contribution_date = Column(Date, default=datetime.date.today, nullable=False, index=True)
    notes = Column(String(255), default="Fund Contribution", nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    fund = relationship("CommonFund", back_populates="contributions")
    user = relationship("User", back_populates="fund_contributions")

class FundExpense(Base):
    __tablename__ = "fund_expenses"

    id = Column(Integer, primary_key=True, index=True)
    fund_id = Column(Integer, ForeignKey("common_funds.id", ondelete="CASCADE"), nullable=False, index=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"), nullable=False, index=True)
    purchased_by_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    description = Column(String(255), nullable=False)
    category = Column(String(100), default="Groceries", nullable=False)
    expense_date = Column(Date, default=datetime.date.today, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    fund = relationship("CommonFund", back_populates="expenses")
    purchased_by = relationship("User", back_populates="fund_expenses")
