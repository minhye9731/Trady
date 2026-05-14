from fastapi import FastAPI
from app.db import SUPABASE_URL
from app.routers import auth, trades, principles

app = FastAPI(title="Trady API")

app.include_router(auth.router)
app.include_router(trades.router)
app.include_router(principles.router)

@app.get("/")
def root():
    return {"message": "Trady API is running!"}

@app.get("/health")
def health():
    return {"supabase": "connected", "url": SUPABASE_URL}