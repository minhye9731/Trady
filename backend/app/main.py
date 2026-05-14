from fastapi import FastAPI
from app.db import SUPABASE_URL
from app.routers import auth

app = FastAPI(title="Trady API")

app.include_router(auth.router)


@app.get("/")
def root():
    return {"message": "Trady API is running!"}

@app.get("/health")
def health():
    return {"supabase": "connected", "url": SUPABASE_URL}