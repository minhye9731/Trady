from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
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
        # Parse datetime with timezone awareness
        traded_at_str = t['traded_at']
        if isinstance(traded_at_str, str):
            traded_at = datetime.fromisoformat(traded_at_str)
            if traded_at.tzinfo is None:
                traded_at = traded_at.replace(tzinfo=timezone.utc)
        else:
            traded_at = t['traded_at']

        created_at_str = t['created_at']
        if isinstance(created_at_str, str):
            created_at = datetime.fromisoformat(created_at_str)
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
        else:
            created_at = t['created_at']

        trades_data.append({
            'id': t['id'],
            'ticker': t['ticker'],
            'currency': t['currency'],
            'direction': t['direction'],
            'quantity': Decimal(str(t['quantity'])),
            'price': Decimal(str(t['price'])),
            'fee': Decimal(str(t.get('fee') or 0)),
            'target_price': Decimal(str(t['target_price'])) if t.get('target_price') else None,
            'stop_loss': Decimal(str(t['stop_loss'])) if t.get('stop_loss') else None,
            'traded_at': traded_at,
            'created_at': created_at,
        })

    # Compute positions
    positions, trades_updates = compute_positions(trades_data)

    # Delete existing positions for this group
    authed.table("positions").delete().eq("user_id", user_id).eq("ticker", ticker).eq("currency", currency).execute()

    # Insert new positions and collect position IDs by index
    position_ids = {}  # position_index -> position_id
    for idx, pos in enumerate(positions):
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
            position_ids[idx] = pos_res.data[0]['id']

    # Update trades with computed values and position_id
    for trade_id, update in trades_updates.items():
        update_data = {
            'outcome': update.outcome,
        }
        if update.realized_profit is not None:
            update_data['realized_profit'] = str(update.realized_profit)
        if update.realized_return_pct is not None:
            update_data['realized_return_pct'] = str(update.realized_return_pct)

        # Map position_index to position_id
        if update.position_index in position_ids:
            update_data['position_id'] = position_ids[update.position_index]

        authed.table("trades").update(update_data).eq("id", trade_id).execute()

class TradeInput(BaseModel):
    ticker: str
    name: Optional[str] = None
    direction: str
    quantity: Decimal
    price: Decimal
    currency: str = "USD"
    fee: Optional[Decimal] = None
    reason: Optional[str] = None
    emotion_tag: Optional[str] = None
    target_price: Optional[Decimal] = None
    stop_loss: Optional[Decimal] = None
    checklist_passed: bool = False
    sell_decision: Optional[str] = None
    traded_at: datetime

@router.post("/")
def create_trade(body: TradeInput, token: str = Depends(get_token), user_id: str = Depends(get_user_id)):
    authed = supabase_with_token(token)

    # Normalize and prepare data
    ticker = body.ticker.strip().upper()
    currency = body.currency.strip().upper()

    # Ensure traded_at is UTC aware
    traded_at = body.traded_at
    if traded_at.tzinfo is None:
        traded_at = traded_at.replace(tzinfo=timezone.utc)

    data = body.model_dump(exclude_unset=True)
    data["ticker"] = ticker
    data["currency"] = currency
    data["user_id"] = user_id
    data["traded_at"] = traded_at.isoformat()
    # Remove outcome field if present
    data.pop("outcome", None)

    # Build in-memory trade list with new trade
    existing_res = authed.table("trades").select("*").eq("user_id", user_id).eq("ticker", ticker).eq("currency", currency).order("traded_at", desc=False).order("created_at", desc=False).execute()
    existing_trades = existing_res.data or []

    # Prepare all trades (existing + new) for validation
    trades_data = []
    for t in existing_trades:
        # Parse datetime with timezone awareness
        t_traded_at = datetime.fromisoformat(t['traded_at'])
        if t_traded_at.tzinfo is None:
            t_traded_at = t_traded_at.replace(tzinfo=timezone.utc)

        t_created_at = datetime.fromisoformat(t['created_at'])
        if t_created_at.tzinfo is None:
            t_created_at = t_created_at.replace(tzinfo=timezone.utc)

        trades_data.append({
            'id': t['id'],
            'ticker': t['ticker'],
            'currency': t['currency'],
            'direction': t['direction'],
            'quantity': Decimal(str(t['quantity'])),
            'price': Decimal(str(t['price'])),
            'fee': Decimal(str(t.get('fee') or 0)),
            'target_price': Decimal(str(t['target_price'])) if t.get('target_price') else None,
            'stop_loss': Decimal(str(t['stop_loss'])) if t.get('stop_loss') else None,
            'traded_at': t_traded_at,
            'created_at': t_created_at,
        })

    # Add the new trade (use current UTC timestamp for created_at)
    new_trade_id = f"_new_{len(trades_data)}"
    trades_data.append({
        'id': new_trade_id,
        'ticker': ticker,
        'currency': currency,
        'direction': body.direction,
        'quantity': body.quantity,
        'price': body.price,
        'fee': body.fee or Decimal(0),
        'target_price': body.target_price,
        'stop_loss': body.stop_loss,
        'traded_at': traded_at,
        'created_at': datetime.now(timezone.utc),
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

    # Ensure traded_at is UTC aware
    traded_at = body.traded_at
    if traded_at.tzinfo is None:
        traded_at = traded_at.replace(tzinfo=timezone.utc)

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

            t_traded_at = datetime.fromisoformat(t['traded_at'])
            if t_traded_at.tzinfo is None:
                t_traded_at = t_traded_at.replace(tzinfo=timezone.utc)

            t_created_at = datetime.fromisoformat(t['created_at'])
            if t_created_at.tzinfo is None:
                t_created_at = t_created_at.replace(tzinfo=timezone.utc)

            trades_data.append({
                'id': t['id'],
                'ticker': t['ticker'],
                'currency': t['currency'],
                'direction': t['direction'],
                'quantity': Decimal(str(t['quantity'])),
                'price': Decimal(str(t['price'])),
                'fee': Decimal(str(t.get('fee') or 0)),
                'target_price': Decimal(str(t['target_price'])) if t.get('target_price') else None,
                'stop_loss': Decimal(str(t['stop_loss'])) if t.get('stop_loss') else None,
                'traded_at': t_traded_at,
                'created_at': t_created_at,
            })

        # Add the updated trade
        old_created_at = datetime.fromisoformat(old_trade['created_at'])
        if old_created_at.tzinfo is None:
            old_created_at = old_created_at.replace(tzinfo=timezone.utc)

        trades_data.append({
            'id': trade_id,
            'ticker': ticker,
            'currency': currency,
            'direction': body.direction,
            'quantity': body.quantity,
            'price': body.price,
            'fee': body.fee or Decimal(0),
            'target_price': body.target_price,
            'stop_loss': body.stop_loss,
            'traded_at': traded_at,
            'created_at': old_created_at,
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
    data["traded_at"] = traded_at.isoformat()
    # Remove outcome field if present
    data.pop("outcome", None)

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

        t_traded_at = datetime.fromisoformat(t['traded_at'])
        if t_traded_at.tzinfo is None:
            t_traded_at = t_traded_at.replace(tzinfo=timezone.utc)

        t_created_at = datetime.fromisoformat(t['created_at'])
        if t_created_at.tzinfo is None:
            t_created_at = t_created_at.replace(tzinfo=timezone.utc)

        trades_data.append({
            'id': t['id'],
            'ticker': t['ticker'],
            'currency': t['currency'],
            'direction': t['direction'],
            'quantity': Decimal(str(t['quantity'])),
            'price': Decimal(str(t['price'])),
            'fee': Decimal(str(t.get('fee') or 0)),
            'target_price': Decimal(str(t['target_price'])) if t.get('target_price') else None,
            'stop_loss': Decimal(str(t['stop_loss'])) if t.get('stop_loss') else None,
            'traded_at': t_traded_at,
            'created_at': t_created_at,
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
