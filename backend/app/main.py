from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import Base, engine, SessionLocal
from app.models import *  # import all models
from app.routers import (
    auth,
    groups,
    individual_expenses,
    common_fund,
    settlements,
    analytics,
    demo
)

# Create tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Multi-User Shared Expense Management SaaS for Roommates and Shared Living",
    version="2.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(groups.router, prefix=settings.API_V1_STR)
app.include_router(individual_expenses.router, prefix=settings.API_V1_STR)
app.include_router(common_fund.router, prefix=settings.API_V1_STR)
app.include_router(settlements.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(demo.router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def on_startup():
    print("🚀 RoomMates backend initialized with clean slate. Ready for user registrations.")

@app.get("/")
def root():
    return {
        "app": "RoomMates SaaS API",
        "version": "2.0.0",
        "docs": "/docs",
        "status": "online"
    }

@app.get("/health")
def health():
    return {"status": "healthy"}
