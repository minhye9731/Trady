from fastapi import FastAPI
from fastapi.security import HTTPBearer
from app.db import SUPABASE_URL
from app.routers import auth, trades

security = HTTPBearer()

app = FastAPI(title="Trady API")

app.include_router(auth.router)
app.include_router(trades.router)

@app.get("/")
def root():
    return {"message": "Trady API is running!"}

@app.get("/health")
def health():
    return {"supabase": "connected", "url": SUPABASE_URL}