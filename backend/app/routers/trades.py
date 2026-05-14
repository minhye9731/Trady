from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.db import supabase

router = APIRouter(prefix="/trades", tags=["trades"])
security = HTTPBearer()

def get_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        user = supabase.auth.get_user(token)
        return str(user.user.id)
    except:
        raise HTTPException(status_code=401, detail="인증이 필요합니다")

class TradeInput(BaseModel):
    ticker: str
    name: Optional[str] = None
    direction: str
    quantity: float
    price: float
    reason: Optional[str] = None
    emotion_tag: Optional[str] = None
    target_price: Optional[float] = None
    stop_loss: Optional[float] = None
    checklist_passed: bool = False
    outcome: Optional[str] = None
    traded_at: datetime

@router.post("/")
def create_trade(body: TradeInput, user_id: str = Depends(get_user_id)):
    data = body.model_dump()
    data["user_id"] = user_id
    data["traded_at"] = data["traded_at"].isoformat()
    res = supabase.table("trades").insert(data).execute()
    return res.data[0]

@router.get("/")
def get_trades(user_id: str = Depends(get_user_id)):
    res = supabase.table("trades").select("*").eq("user_id", user_id).order("traded_at", desc=True).execute()
    return res.data

@router.get("/{trade_id}")
def get_trade(trade_id: str, user_id: str = Depends(get_user_id)):
    res = supabase.table("trades").select("*").eq("id", trade_id).eq("user_id", user_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="매매일지를 찾을 수 없습니다")
    return res.data[0]

@router.put("/{trade_id}")
def update_trade(trade_id: str, body: TradeInput, user_id: str = Depends(get_user_id)):
    data = body.model_dump()
    data["traded_at"] = data["traded_at"].isoformat()
    res = supabase.table("trades").update(data).eq("id", trade_id).eq("user_id", user_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="매매일지를 찾을 수 없습니다")
    return res.data[0]

@router.delete("/{trade_id}")
def delete_trade(trade_id: str, user_id: str = Depends(get_user_id)):
    supabase.table("trades").delete().eq("id", trade_id).eq("user_id", user_id).execute()
    return {"message": "삭제 완료"}