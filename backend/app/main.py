from fastapi import FastAPI
from dotenv import load_dotenv
import os
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI(title="Trady API")

@app.get("/")
def root():
    return {"message": "Trady API is running!"}

@app.get("/health")
def health():
    return {"supabase": "connected", "url": SUPABASE_URL}