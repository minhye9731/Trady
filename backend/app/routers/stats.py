from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.db import supabase, supabase_with_token

router = APIRouter(prefix="/stats", tags=["stats"])
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

@router.get("/summary")
def get_summary(token: str = Depends(get_token), user_id: str = Depends(get_user_id)):
    authed = supabase_with_token(token)
    res = authed.table("trades").select("*").eq("user_id", user_id).execute()
    trades = res.data

    if not trades:
        return {
            "total_trades": 0,
            "buy_count": 0,
            "sell_count": 0,
            "total_amount": 0,
            "win_rate": 0,
            "emotion_stats": {},
            "ticker_stats": {},
        }

    total_trades = len(trades)
    buy_count = len([t for t in trades if t["direction"] == "buy"])
    sell_count = len([t for t in trades if t["direction"] == "sell"])
    total_amount = sum(t["quantity"] * t["price"] for t in trades)

    # 승률 (outcome 기록된 것만)
    closed = [t for t in trades if t["outcome"] in ["profit", "loss"]]
    win_rate = 0
    if closed:
        wins = len([t for t in closed if t["outcome"] == "profit"])
        win_rate = round(wins / len(closed) * 100, 1)

    # 감정 태그별 거래 수
    emotion_stats: dict = {}
    for t in trades:
        tag = t.get("emotion_tag") or "미기록"
        emotion_stats[tag] = emotion_stats.get(tag, 0) + 1

    # 종목별 거래 수
    ticker_stats: dict = {}
    for t in trades:
        ticker = t["ticker"]
        ticker_stats[ticker] = ticker_stats.get(ticker, 0) + 1

    return {
        "total_trades": total_trades,
        "buy_count": buy_count,
        "sell_count": sell_count,
        "total_amount": total_amount,
        "win_rate": win_rate,
        "emotion_stats": emotion_stats,
        "ticker_stats": ticker_stats,
    }