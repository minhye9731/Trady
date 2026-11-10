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

def recalculate_positions_for_group(authed, user_id: str, ticker: str, currency: str):
    """Recalculate positions for specific ticker+currency group only"""
    # Fetch all trades for this group in chronological order
    res = authed.table("trades").select("*").eq("user_id", user_id).eq("ticker", ticker).eq("currency", currency).order("traded_at", desc=False).order("created_at", desc=False).execute()
    trades = res.data

    if not trades:
        # Delete any existing positions for this group
        authed.table("positions").delete().eq("user_id", user_id).eq("ticker", ticker).eq("currency", currency).execute()
        return

    # Prepare trades for compute_positions
    trades_data = []
    for t in trades:
        trades_data.append({
            'id': t['id'],
            'ticker': t['ticker'],
            'currency': t['currency'],
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

    # Delete existing positions for this group
    authed.table("positions").delete().eq("user_id", user_id).eq("ticker", ticker).eq("currency", currency).execute()

    # Insert new positions and collect position IDs
    position_map = {}  # ticker -> position_id
    for pos in positions:
        pos_data = {
            'user_id': user_id,
            'ticker': pos.ticker,
            'currency': pos.currency,
            'total_quantity': str(pos.total_quantity),
            'average_price': str(pos.average_price),
            'total_cost': str(pos.total_cost),
            'status': pos.status,
            'opened_at': pos.opened_at.isoformat(),
            'closed_at': pos.closed_at.isoformat() if pos.closed_at else None,
        }
        pos_res = authed.table("positions").insert(pos_data).execute()
        if pos_res.data:
            # Map by (ticker, status) to track which position this is
            key = (pos.ticker, pos.status)
            position_map[key] = pos_res.data[0]['id']

    # Update trades with computed values
    for trade_id, update in trades_updates.items():
        update_data = {
            'outcome': update.outcome,
        }
        if update.realized_profit is not None:
            update_data['realized_profit'] = str(update.realized_profit)
        if update.realized_return_pct is not None:
            update_data['realized_return_pct'] = str(update.realized_return_pct)

        # Find the position for this trade
        trade_obj = next((t for t in trades if t['id'] == trade_id), None)
        if trade_obj:
            # Determine which position this trade belongs to
            if trade_obj['direction'] == 'buy':
                status = 'open'
            else:
                # Sell trade - check if position is closed after this trade
                remaining_qty = Decimal(0)
                for t in trades:
                    if t['ticker'] == ticker and t['currency'] == currency:
                        if t['traded_at'] < trade_obj['traded_at']:
                            if t['direction'] == 'buy':
                                remaining_qty += Decimal(str(t['quantity']))
                            else:
                                remaining_qty -= Decimal(str(t['quantity']))
                        elif t['traded_at'] == trade_obj['traded_at']:
                            if t['created_at'] < trade_obj['created_at']:
                                if t['direction'] == 'buy':
                                    remaining_qty += Decimal(str(t['quantity']))
                                else:
                                    remaining_qty -= Decimal(str(t['quantity']))
                status = 'closed' if remaining_qty == 0 else 'open'

            key = (ticker, status)
            if key in position_map:
                update_data['position_id'] = position_map[key]

        authed.table("trades").update(update_data).eq("id", trade_id).execute()

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
    sell_decision: Optional[str] = None
    traded_at: datetime

@router.post("/")
def create_trade(body: TradeInput, token: str = Depends(get_token), user_id: str = Depends(get_user_id)):
    authed = supabase_with_token(token)

    # Normalize and prepare data
    ticker = body.ticker.strip().upper()
    currency = body.currency.strip().upper()
    data = body.model_dump(exclude_unset=True)
    data["ticker"] = ticker
    data["currency"] = currency
    data["user_id"] = user_id
    data["traded_at"] = body.traded_at.isoformat()

    # Build in-memory trade list with new trade
    existing_res = authed.table("trades").select("*").eq("user_id", user_id).eq("ticker", ticker).eq("currency", currency).order("traded_at", desc=False).order("created_at", desc=False).execute()
    existing_trades = existing_res.data or []

    # Prepare all trades (existing + new) for validation
    trades_data = []
    for t in existing_trades:
        trades_data.append({
            'id': t['id'],
            'ticker': t['ticker'],
            'currency': t['currency'],
            'direction': t['direction'],
            'quantity': float(t['quantity']),
            'price': float(t['price']),
            'fee': float(t.get('fee') or 0),
            'target_price': t.get('target_price'),
            'stop_loss': t.get('stop_loss'),
            'traded_at': datetime.fromisoformat(t['traded_at']) if isinstance(t['traded_at'], str) else t['traded_at'],
            'created_at': datetime.fromisoformat(t['created_at']) if isinstance(t['created_at'], str) else t['created_at'],
        })

    # Add the new trade (use current timestamp for created_at)
    new_trade_id = f"_new_{len(trades_data)}"
    trades_data.append({
        'id': new_trade_id,
        'ticker': ticker,
        'currency': currency,
        'direction': body.direction,
        'quantity': float(body.quantity),
        'price': float(body.price),
        'fee': float(body.fee or 0),
        'target_price': body.target_price,
        'stop_loss': body.stop_loss,
        'traded_at': body.traded_at,
        'created_at': datetime.now(),
    })

    # Validate with compute_positions
    try:
        positions, trades_updates = compute_positions(trades_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Only after validation passes: write to database
    res = authed.table("trades").insert(data).execute()
    trade = res.data[0]

    # Recalculate positions for this group
    recalculate_positions_for_group(authed, user_id, ticker, currency)

    # Fetch updated trade with computed values
    updated = authed.table("trades").select("*").eq("id", trade['id']).execute()
    return updated.data[0]

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

    # Verify trade exists and get old values
    check = authed.table("trades").select("*").eq("id", trade_id).eq("user_id", user_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail="매매일지를 찾을 수 없습니다")

    old_trade = check.data[0]
    old_ticker = old_trade['ticker']
    old_currency = old_trade['currency']

    # Normalize new data
    ticker = body.ticker.strip().upper()
    currency = body.currency.strip().upper()

    # If ticker or currency changed, need to recalculate both groups
    groups_to_recalc = set()
    if old_ticker != ticker or old_currency != currency:
        groups_to_recalc.add((old_ticker, old_currency))
        groups_to_recalc.add((ticker, currency))
    else:
        groups_to_recalc.add((ticker, currency))

    # Build in-memory trade list with updated trade
    all_trades_for_validation = {}
    for group in groups_to_recalc:
        group_ticker, group_currency = group
        existing_res = authed.table("trades").select("*").eq("user_id", user_id).eq("ticker", group_ticker).eq("currency", group_currency).order("traded_at", desc=False).order("created_at", desc=False).execute()
        existing_trades = existing_res.data or []

        trades_data = []
        for t in existing_trades:
            if t['id'] == trade_id:
                # Skip the old version
                continue
            trades_data.append({
                'id': t['id'],
                'ticker': t['ticker'],
                'currency': t['currency'],
                'direction': t['direction'],
                'quantity': float(t['quantity']),
                'price': float(t['price']),
                'fee': float(t.get('fee') or 0),
                'target_price': t.get('target_price'),
                'stop_loss': t.get('stop_loss'),
                'traded_at': datetime.fromisoformat(t['traded_at']) if isinstance(t['traded_at'], str) else t['traded_at'],
                'created_at': datetime.fromisoformat(t['created_at']) if isinstance(t['created_at'], str) else t['created_at'],
            })

        # Add the updated trade
        trades_data.append({
            'id': trade_id,
            'ticker': ticker,
            'currency': currency,
            'direction': body.direction,
            'quantity': float(body.quantity),
            'price': float(body.price),
            'fee': float(body.fee or 0),
            'target_price': body.target_price,
            'stop_loss': body.stop_loss,
            'traded_at': body.traded_at,
            'created_at': datetime.fromisoformat(old_trade['created_at']) if isinstance(old_trade['created_at'], str) else old_trade['created_at'],
        })

        all_trades_for_validation[group] = trades_data

    # Validate all affected groups
    try:
        for trades_data in all_trades_for_validation.values():
            if trades_data:
                compute_positions(trades_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Only after validation passes: write to database
    data = body.model_dump(exclude_unset=True)
    data["ticker"] = ticker
    data["currency"] = currency
    data["traded_at"] = body.traded_at.isoformat()

    authed.table("trades").update(data).eq("id", trade_id).eq("user_id", user_id).execute()

    # Recalculate positions for affected groups
    for group_ticker, group_currency in groups_to_recalc:
        recalculate_positions_for_group(authed, user_id, group_ticker, group_currency)

    # Fetch updated trade
    res = authed.table("trades").select("*").eq("id", trade_id).execute()
    return res.data[0]

@router.delete("/{trade_id}")
def delete_trade(trade_id: str, token: str = Depends(get_token), user_id: str = Depends(get_user_id)):
    authed = supabase_with_token(token)

    # Verify trade exists and get its ticker+currency
    check = authed.table("trades").select("*").eq("id", trade_id).eq("user_id", user_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail="매매일지를 찾을 수 없습니다")

    trade = check.data[0]
    ticker = trade['ticker']
    currency = trade['currency']

    # Build in-memory trade list without the deleted trade
    existing_res = authed.table("trades").select("*").eq("user_id", user_id).eq("ticker", ticker).eq("currency", currency).order("traded_at", desc=False).order("created_at", desc=False).execute()
    existing_trades = existing_res.data or []

    trades_data = []
    for t in existing_trades:
        if t['id'] == trade_id:
            continue
        trades_data.append({
            'id': t['id'],
            'ticker': t['ticker'],
            'currency': t['currency'],
            'direction': t['direction'],
            'quantity': float(t['quantity']),
            'price': float(t['price']),
            'fee': float(t.get('fee') or 0),
            'target_price': t.get('target_price'),
            'stop_loss': t.get('stop_loss'),
            'traded_at': datetime.fromisoformat(t['traded_at']) if isinstance(t['traded_at'], str) else t['traded_at'],
            'created_at': datetime.fromisoformat(t['created_at']) if isinstance(t['created_at'], str) else t['created_at'],
        })

    # Validate remaining trades
    try:
        if trades_data:
            compute_positions(trades_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Only after validation passes: write to database
    authed.table("trades").delete().eq("id", trade_id).eq("user_id", user_id).execute()

    # Recalculate positions for this group
    recalculate_positions_for_group(authed, user_id, ticker, currency)

    return {"message": "삭제 완료"}
