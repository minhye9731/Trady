from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal
from app.db import supabase, supabase_with_token
from app.models.position import compute_positions

router = APIRouter(prefix="/trades", tags=["trades"])
security = HTTPBearer()

def get_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        user = supabase.auth.get_user(token)
        return str(user.user.id)
    except:
        raise HTTPException(status_code=401, detail="인증이 필요합니다")

def get_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    return credentials.credentials

def recalculate_positions(authed, user_id: str):
    """Recalculate positions for user and update database"""
    # Fetch all trades in chronological order
    res = authed.table("trades").select("*").eq("user_id", user_id).order("traded_at", desc=False).order("created_at", desc=False).execute()
    trades = res.data

    if not trades:
        return

    # Prepare trades for compute_positions
    trades_data = []
    for t in trades:
        trades_data.append({
            'id': t['id'],
            'ticker': t['ticker'],
            'currency': t.get('currency') or 'USD',
            'direction': t['direction'],
            'quantity': float(t['quantity']),
            'price': float(t['price']),
            'fee': float(t.get('fee') or 0),
            'target_price': t.get('target_price'),
            'stop_loss': t.get('stop_loss'),
            'traded_at': datetime.fromisoformat(t['traded_at']) if isinstance(t['traded_at'], str) else t['traded_at'],
            'created_at': datetime.fromisoformat(t['created_at']) if isinstance(t['created_at'], str) else t['created_at'],
        })

    # Compute positions
    positions, trades_updates = compute_positions(trades_data)

    # Update trades with computed values
    for trade_id, update in trades_updates.items():
        update_data = {
            'outcome': update.outcome,
        }
        if update.realized_profit is not None:
            update_data['realized_profit'] = float(update.realized_profit)
        if update.realized_return_pct is not None:
            update_data['realized_return_pct'] = float(update.realized_return_pct)
        if update.sell_decision_suggestion is not None:
            update_data['sell_decision'] = update.sell_decision_suggestion

        authed.table("trades").update(update_data).eq("id", trade_id).execute()

    # Upsert positions
    # First clear old positions for this user
    authed.table("positions").delete().eq("user_id", user_id).execute()

    # Insert new positions
    for pos in positions:
        pos_data = {
            'user_id': user_id,
            'ticker': pos.ticker,
            'currency': pos.currency,
            'total_quantity': float(pos.total_quantity),
            'average_price': float(pos.average_price),
            'total_cost': float(pos.total_cost),
            'status': pos.status,
            'opened_at': pos.opened_at.isoformat(),
            'closed_at': pos.closed_at.isoformat() if pos.closed_at else None,
        }
        authed.table("positions").insert(pos_data).execute()

class TradeInput(BaseModel):
    ticker: str
    name: Optional[str] = None
    direction: str
    quantity: float
    price: float
    currency: str = "USD"
    fee: Optional[float] = None
    reason: Optional[str] = None
    emotion_tag: Optional[str] = None
    target_price: Optional[float] = None
    stop_loss: Optional[float] = None
    checklist_passed: bool = False
    outcome: Optional[str] = None
    traded_at: datetime

@router.post("/")
def create_trade(body: TradeInput, token: str = Depends(get_token), user_id: str = Depends(get_user_id)):
    authed = supabase_with_token(token)
    data = body.model_dump()
    data["user_id"] = user_id
    data["traded_at"] = data["traded_at"].isoformat()

    try:
        res = authed.table("trades").insert(data).execute()
        trade = res.data[0]

        # Recalculate positions
        recalculate_positions(authed, user_id)

        # Fetch updated trade with computed values
        updated = authed.table("trades").select("*").eq("id", trade['id']).execute()
        return updated.data[0]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/")
def get_trades(token: str = Depends(get_token), user_id: str = Depends(get_user_id)):
    authed = supabase_with_token(token)
    res = authed.table("trades").select("*").eq("user_id", user_id).order("traded_at", desc=True).execute()
    return res.data

@router.get("/{trade_id}")
def get_trade(trade_id: str, token: str = Depends(get_token), user_id: str = Depends(get_user_id)):
    authed = supabase_with_token(token)
    res = authed.table("trades").select("*").eq("id", trade_id).eq("user_id", user_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="매매일지를 찾을 수 없습니다")
    return res.data[0]

@router.put("/{trade_id}")
def update_trade(trade_id: str, body: TradeInput, token: str = Depends(get_token), user_id: str = Depends(get_user_id)):
    authed = supabase_with_token(token)

    # Verify trade exists
    check = authed.table("trades").select("*").eq("id", trade_id).eq("user_id", user_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail="매매일지를 찾을 수 없습니다")

    data = body.model_dump()
    data["traded_at"] = data["traded_at"].isoformat()

    try:
        authed.table("trades").update(data).eq("id", trade_id).eq("user_id", user_id).execute()

        # Recalculate positions
        recalculate_positions(authed, user_id)

        # Fetch updated trade
        res = authed.table("trades").select("*").eq("id", trade_id).execute()
        return res.data[0]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{trade_id}")
def delete_trade(trade_id: str, token: str = Depends(get_token), user_id: str = Depends(get_user_id)):
    authed = supabase_with_token(token)

    try:
        authed.table("trades").delete().eq("id", trade_id).eq("user_id", user_id).execute()

        # Recalculate positions
        recalculate_positions(authed, user_id)

        return {"message": "삭제 완료"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))