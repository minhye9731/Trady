from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from datetime import datetime, timedelta
from app.db import supabase, supabase_with_token
from app.ai.report_generator import generate_report

router = APIRouter(prefix="/reports", tags=["reports"])
security = HTTPBearer()

def get_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    return credentials.credentials

def get_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        user = supabase.auth.get_user(token)
        return str(user.user.id)
    except:
        raise HTTPException(status_code=401, detail="인증이 필요합니다")

class ReportRequest(BaseModel):
    type: str = "weekly"  # weekly | monthly

@router.post("/generate")
def generate(body: ReportRequest, token: str = Depends(get_token), user_id: str = Depends(get_user_id)):
    authed = supabase_with_token(token)

    now = datetime.now()
    if body.type == "weekly":
        start = now - timedelta(days=7)
        period = f"{start.strftime('%Y.%m.%d')} ~ {now.strftime('%Y.%m.%d')} (주간)"
    else:
        start = now - timedelta(days=30)
        period = f"{start.strftime('%Y.%m.%d')} ~ {now.strftime('%Y.%m.%d')} (월간)"

    trades = authed.table("trades").select("*").eq("user_id", user_id).gte("traded_at", start.isoformat()).execute().data
    principles = authed.table("principles").select("*").eq("user_id", user_id).execute().data

    content = generate_report(trades, principles, period)

    res = authed.table("ai_reports").insert({
        "user_id": user_id,
        "type": body.type,
        "content": content,
        "period_start": start.isoformat(),
        "period_end": now.isoformat(),
    }).execute()

    return {"content": content, "id": res.data[0]["id"]}

@router.get("/")
def get_reports(token: str = Depends(get_token), user_id: str = Depends(get_user_id)):
    authed = supabase_with_token(token)
    res = authed.table("ai_reports").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return res.data