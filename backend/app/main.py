from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db import SUPABASE_URL
from app.routers import auth, trades, principles, stats

app = FastAPI(title="Trady API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(trades.router)
app.include_router(principles.router)
app.include_router(stats.router)


@app.get("/")
def root():
    return {"message": "Trady API is running!"}

@app.get("/health")
def health():
    return {"supabase": "connected", "url": SUPABASE_URL}