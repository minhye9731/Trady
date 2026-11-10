from dataclasses import dataclass
from decimal import Decimal
from datetime import datetime
from typing import Optional


@dataclass
class ComputedPosition:
    """Position after recalculation"""
    ticker: str
    currency: str
    total_quantity: Decimal
    average_price: Decimal
    total_cost: Decimal
    status: str  # 'open' or 'closed'
    opened_at: datetime
    closed_at: Optional[datetime] = None


@dataclass
class ComputedTrade:
    """Trade with computed values (for sells)"""
    trade_id: str  # id from input
    position_id: Optional[str]  # Will be set by compute_positions
    outcome: Optional[str]  # 'holding', 'profit', 'loss'
    realized_profit: Optional[Decimal] = None
    realized_return_pct: Optional[Decimal] = None
    sell_decision_suggestion: Optional[str] = None


def compute_positions(trades_data: list[dict]) -> tuple[list[ComputedPosition], dict[str, ComputedTrade]]:
    """
    Pure function to compute positions and trade outcomes from trades.

    Args:
        trades_data: List of trades sorted by (traded_at, created_at)
        Example: [
            {'id': 'trade1', 'ticker': 'AAPL', 'currency': 'USD', 'direction': 'buy',
             'quantity': 100, 'price': 150, 'fee': 10, 'target_price': 160, 'stop_loss': 140, 'traded_at': ...},
            ...
        ]

    Returns:
        (positions, trades_updates)
        - positions: List of computed positions
        - trades_updates: Dict[trade_id] = ComputedTrade with computed values

    Raises:
        ValueError: If validation fails (e.g., sell quantity > holding)
    """

    # Group trades by (user_id, ticker, currency) - for now assume single user
    by_ticker_currency: dict[tuple[str, str], list[dict]] = {}
    for trade in trades_data:
        key = (trade['ticker'], trade['currency'])
        if key not in by_ticker_currency:
            by_ticker_currency[key] = []
        by_ticker_currency[key].append(trade)

    positions: list[ComputedPosition] = []
    trades_updates: dict[str, ComputedTrade] = {}

    # Process each ticker+currency
    for (ticker, currency), ticker_trades in by_ticker_currency.items():
        # Sort by (traded_at, created_at)
        ticker_trades = sorted(ticker_trades, key=lambda t: (t['traded_at'], t['created_at']))

        quantity = Decimal(0)
        avg_price = Decimal(0)
        total_cost = Decimal(0)
        position: Optional[ComputedPosition] = None
        opened_at = None

        for trade in ticker_trades:
            trade_id = trade['id']
            direction = trade['direction']

            if direction == 'buy':
                # Add to position
                qty = Decimal(str(trade['quantity']))
                price = Decimal(str(trade['price']))
                fee = Decimal(str(trade.get('fee') or 0))

                # Recalculate average price
                new_total_cost = total_cost + (qty * price) + fee
                quantity += qty
                avg_price = new_total_cost / quantity
                total_cost = new_total_cost

                # Create or update position
                if position is None:
                    opened_at = trade['traded_at']
                    position = ComputedPosition(
                        ticker=ticker,
                        currency=currency,
                        total_quantity=quantity,
                        average_price=avg_price,
                        total_cost=total_cost,
                        status='open',
                        opened_at=opened_at
                    )
                    positions.append(position)
                else:
                    position.total_quantity = quantity
                    position.average_price = avg_price
                    position.total_cost = total_cost

                # Trade update
                trades_updates[trade_id] = ComputedTrade(
                    trade_id=trade_id,
                    position_id=None,  # Will be filled by API
                    outcome='holding'
                )

            elif direction == 'sell':
                # Validate quantity
                sell_qty = Decimal(str(trade['quantity']))
                if quantity < sell_qty:
                    raise ValueError(
                        f"Sell quantity {sell_qty} exceeds holding {quantity} "
                        f"for {ticker} at trade {trade_id} ({trade['traded_at']})"
                    )

                # Calculate realized profit
                sell_price = Decimal(str(trade['price']))
                sell_fee = Decimal(str(trade.get('fee') or 0))

                realized_profit = (sell_price - avg_price) * sell_qty - sell_fee
                realized_return_pct = (realized_profit / (avg_price * sell_qty)) * Decimal(100) if sell_qty > 0 else Decimal(0)

                # Determine outcome
                outcome = 'profit' if realized_profit > 0 else 'loss'

                # Update sell decision suggestion
                sell_decision_suggestion = _suggest_sell_decision(
                    target_price=trade.get('target_price'),
                    stop_loss=trade.get('stop_loss'),
                    sell_price=sell_price
                )

                # Update quantity and cost
                quantity -= sell_qty
                total_cost -= avg_price * sell_qty

                # Update or close position
                if quantity == 0:
                    position.total_quantity = Decimal(0)
                    position.status = 'closed'
                    position.closed_at = trade['traded_at']
                    position = None
                else:
                    position.total_quantity = quantity

                # Trade update
                trades_updates[trade_id] = ComputedTrade(
                    trade_id=trade_id,
                    position_id=None,  # Will be filled by API
                    outcome=outcome,
                    realized_profit=realized_profit,
                    realized_return_pct=realized_return_pct,
                    sell_decision_suggestion=sell_decision_suggestion
                )

    return positions, trades_updates


def _suggest_sell_decision(target_price: Optional[float], stop_loss: Optional[float], sell_price: Decimal) -> str:
    """Suggest sell decision based on target/stop and actual sell price"""
    sell_price = Decimal(str(sell_price))

    if target_price is None and stop_loss is None:
        return "계획 없이 매도"

    target = Decimal(str(target_price)) if target_price else None
    stop = Decimal(str(stop_loss)) if stop_loss else None

    # Check target first
    if target and sell_price >= target:
        return "계획대로 목표가 매도"

    # Check stop loss
    if stop:
        if abs(sell_price - stop) <= stop * Decimal('0.02'):
            return "계획대로 손절"
        elif sell_price < stop * Decimal('0.98'):
            return "버티다 손절"

    # Default: early exit before target
    if target and sell_price < target:
        return "목표가 전 조기 매도"

    return "계획 없이 매도"
