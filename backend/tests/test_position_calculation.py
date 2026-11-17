import pytest
from decimal import Decimal
from datetime import datetime, timedelta
from app.models.position import compute_positions


def create_trade(
    trade_id: str,
    ticker: str = "AAPL",
    currency: str = "USD",
    direction: str = "buy",
    quantity: float = 100,
    price: float = 150,
    fee: float = 0,
    target_price: float = None,
    stop_loss: float = None,
    traded_at: datetime = None,
    created_at: datetime = None
) -> dict:
    """Helper to create trade dict"""
    if traded_at is None:
        traded_at = datetime.now()
    if created_at is None:
        created_at = traded_at

    return {
        'id': trade_id,
        'ticker': ticker,
        'currency': currency,
        'direction': direction,
        'quantity': quantity,
        'price': price,
        'fee': fee,
        'target_price': target_price,
        'stop_loss': stop_loss,
        'traded_at': traded_at,
        'created_at': created_at,
    }


class TestSingleBuy:
    def test_single_buy(self):
        """Single buy trade"""
        trades = [create_trade('buy1', quantity=100, price=150, fee=10)]
        positions, trades_updates = compute_positions(trades)

        assert len(positions) == 1
        pos = positions[0]
        assert pos.ticker == 'AAPL'
        assert pos.total_quantity == Decimal('100')
        # avg = (100*150 + 10) / 100 = 150.10
        assert pos.average_price == Decimal('15010') / Decimal('100')
        assert pos.total_cost == Decimal('15010')
        assert pos.status == 'open'

        # Trade should have outcome='holding'
        assert trades_updates['buy1'].outcome == 'holding'
        assert trades_updates['buy1'].realized_profit is None


class TestMultipleBuys:
    def test_multiple_buys(self):
        """Multiple buy trades - average price recalculation"""
        trades = [
            create_trade('buy1', quantity=100, price=150, fee=10,
                        traded_at=datetime(2026, 1, 1)),
            create_trade('buy2', quantity=50, price=160, fee=5,
                        traded_at=datetime(2026, 1, 2)),
        ]
        positions, trades_updates = compute_positions(trades)

        pos = positions[0]
        # total_cost = 100*150 + 10 + 50*160 + 5 = 15010 + 8005 = 23015
        # avg = 23015 / 150 = 153.4333...
        assert pos.total_quantity == Decimal('150')
        expected_avg = Decimal('23015') / Decimal('150')
        assert pos.average_price == expected_avg

        assert trades_updates['buy1'].outcome == 'holding'
        assert trades_updates['buy2'].outcome == 'holding'


class TestSellProfit:
    def test_sell_profit(self):
        """Sell with profit"""
        trades = [
            create_trade('buy1', quantity=100, price=150, fee=10,
                        traded_at=datetime(2026, 1, 1)),
            create_trade('sell1', direction='sell', quantity=80, price=170, fee=2,
                        target_price=170, stop_loss=140,
                        traded_at=datetime(2026, 1, 2)),
        ]
        positions, trades_updates = compute_positions(trades)

        # avg = (100*150 + 10) / 100 = 150.10
        # realized_profit = (170 - 150.10) * 80 - 2 = 1590
        sell_update = trades_updates['sell1']
        assert sell_update.outcome == 'profit'
        assert sell_update.realized_profit == Decimal('1590.00')

        # realized_return_pct = 1590 / (150.10 * 80) * 100 = 13.238...%
        expected_pct = Decimal('1590.00') / (Decimal('15010') / Decimal('100') * Decimal('80')) * Decimal('100')
        assert abs(sell_update.realized_return_pct - expected_pct) < Decimal('0.01')

        # Position should have 20 shares left
        pos = positions[0]
        assert pos.total_quantity == Decimal('20')
        assert pos.average_price == Decimal('15010') / Decimal('100')  # unchanged
        assert pos.status == 'open'


class TestSellLoss:
    def test_sell_loss(self):
        """Sell with loss"""
        trades = [
            create_trade('buy1', quantity=100, price=150, fee=10,
                        traded_at=datetime(2026, 1, 1)),
            create_trade('sell1', direction='sell', quantity=80, price=140, fee=2,
                        target_price=170, stop_loss=140,
                        traded_at=datetime(2026, 1, 2)),
        ]
        positions, trades_updates = compute_positions(trades)

        # avg = 150.10
        # realized_profit = (140 - 150.10) * 80 - 2 = -810.00
        sell_update = trades_updates['sell1']
        assert sell_update.outcome == 'loss'
        assert sell_update.realized_profit == Decimal('-810.00')

        pos = positions[0]
        assert pos.total_quantity == Decimal('20')
        assert pos.status == 'open'


class TestFullLiquidation:
    def test_full_liquidation(self):
        """Full liquidation closes position"""
        trades = [
            create_trade('buy1', quantity=100, price=150, fee=10,
                        traded_at=datetime(2026, 1, 1)),
            create_trade('sell1', direction='sell', quantity=100, price=170, fee=2,
                        traded_at=datetime(2026, 1, 2)),
        ]
        positions, trades_updates = compute_positions(trades)

        pos = positions[0]
        assert pos.total_quantity == Decimal('0')
        assert pos.status == 'closed'
        assert pos.closed_at == datetime(2026, 1, 2)


class TestRebuyAfterFullSell:
    def test_rebuy_creates_new_position(self):
        """Rebuy after full liquidation creates new position"""
        trades = [
            create_trade('buy1', quantity=100, price=150, fee=10,
                        traded_at=datetime(2026, 1, 1)),
            create_trade('sell1', direction='sell', quantity=100, price=170, fee=2,
                        traded_at=datetime(2026, 1, 2)),
            create_trade('buy2', quantity=50, price=160, fee=5,
                        traded_at=datetime(2026, 1, 3)),
        ]
        positions, trades_updates = compute_positions(trades)

        # Should have 2 positions (old closed, new open)
        assert len(positions) == 2

        closed_pos = positions[0]
        assert closed_pos.status == 'closed'
        assert closed_pos.total_quantity == Decimal('0')

        open_pos = positions[1]
        assert open_pos.status == 'open'
        assert open_pos.total_quantity == Decimal('50')
        # avg = (50*160 + 5) / 50 = 160.10
        assert open_pos.average_price == Decimal('8005') / Decimal('50')


class TestPartialLiquidationThenRebuy:
    def test_partial_then_rebuy(self):
        """Partial sell then rebuy - average price should be 150"""
        trades = [
            create_trade('buy1', quantity=100, price=150, fee=0,
                        traded_at=datetime(2026, 1, 1)),
            create_trade('sell1', direction='sell', quantity=50, price=150, fee=0,
                        traded_at=datetime(2026, 1, 2)),
            create_trade('buy2', quantity=50, price=150, fee=0,
                        traded_at=datetime(2026, 1, 3)),
        ]
        positions, trades_updates = compute_positions(trades)

        # After sell1, should have 50 shares @ 150
        # After buy2, should have 100 shares @ 150
        open_pos = positions[0]
        assert open_pos.total_quantity == Decimal('100')
        assert open_pos.average_price == Decimal('150')


class TestMiddleTradeDelete:
    def test_middle_trade_deletion_recalculates(self):
        """Deleting middle trade recalculates all subsequent trades"""
        # Simulate: buy1 -> buy2 -> sell -> delete buy2 -> recalculate
        trades = [
            create_trade('buy1', quantity=100, price=150, fee=10,
                        traded_at=datetime(2026, 1, 1)),
            # buy2 will be "deleted" by not including it
            create_trade('sell1', direction='sell', quantity=80, price=170, fee=2,
                        target_price=170, stop_loss=140,
                        traded_at=datetime(2026, 1, 2)),
        ]
        positions, trades_updates = compute_positions(trades)

        # Without buy2, avg = 150.10
        # realized_profit = (170 - 150.10) * 80 - 2 = 1590
        sell_update = trades_updates['sell1']
        assert sell_update.realized_profit == Decimal('1590.00')


class TestSellValidation:
    def test_sell_exceeds_quantity(self):
        """Selling more than holding raises ValueError"""
        trades = [
            create_trade('buy1', quantity=100, price=150, fee=10,
                        traded_at=datetime(2026, 1, 1)),
            create_trade('sell1', direction='sell', quantity=150, price=170, fee=2,
                        traded_at=datetime(2026, 1, 2)),
        ]

        with pytest.raises(ValueError, match="Sell quantity .* exceeds holding"):
            compute_positions(trades)


class TestSellDecisionSuggestion:
    def test_suggestion_target_hit(self):
        """Sell at or above target suggests target-based exit"""
        trades = [
            create_trade('buy1', quantity=100, price=150, fee=0,
                        target_price=170, stop_loss=140,
                        traded_at=datetime(2026, 1, 1)),
            create_trade('sell1', direction='sell', quantity=50, price=170, fee=0,
                        target_price=170, stop_loss=140,
                        traded_at=datetime(2026, 1, 2)),
        ]
        positions, trades_updates = compute_positions(trades)

        assert trades_updates['sell1'].sell_decision_suggestion == "계획대로 목표가 매도"

    def test_suggestion_stop_loss_hit(self):
        """Sell near stop loss suggests stop-based exit"""
        trades = [
            create_trade('buy1', quantity=100, price=150, fee=0,
                        target_price=170, stop_loss=140,
                        traded_at=datetime(2026, 1, 1)),
            create_trade('sell1', direction='sell', quantity=50, price=140.2, fee=0,
                        target_price=170, stop_loss=140,
                        traded_at=datetime(2026, 1, 2)),
        ]
        positions, trades_updates = compute_positions(trades)

        assert trades_updates['sell1'].sell_decision_suggestion == "계획대로 손절"

    def test_suggestion_stop_exceeded(self):
        """Sell below stop suggests holding too long"""
        trades = [
            create_trade('buy1', quantity=100, price=150, fee=0,
                        target_price=170, stop_loss=140,
                        traded_at=datetime(2026, 1, 1)),
            create_trade('sell1', direction='sell', quantity=50, price=137, fee=0,
                        target_price=170, stop_loss=140,
                        traded_at=datetime(2026, 1, 2)),
        ]
        positions, trades_updates = compute_positions(trades)

        assert trades_updates['sell1'].sell_decision_suggestion == "버티다 손절"

    def test_suggestion_no_plan(self):
        """Sell without target/stop suggests no plan"""
        trades = [
            create_trade('buy1', quantity=100, price=150, fee=0,
                        target_price=None, stop_loss=None,
                        traded_at=datetime(2026, 1, 1)),
            create_trade('sell1', direction='sell', quantity=50, price=160, fee=0,
                        target_price=None, stop_loss=None,
                        traded_at=datetime(2026, 1, 2)),
        ]
        positions, trades_updates = compute_positions(trades)

        assert trades_updates['sell1'].sell_decision_suggestion == "계획 없이 매도"

    def test_suggestion_early_exit(self):
        """Sell before target suggests early exit"""
        trades = [
            create_trade('buy1', quantity=100, price=150, fee=0,
                        target_price=170, stop_loss=140,
                        traded_at=datetime(2026, 1, 1)),
            create_trade('sell1', direction='sell', quantity=50, price=160, fee=0,
                        target_price=170, stop_loss=140,
                        traded_at=datetime(2026, 1, 2)),
        ]
        positions, trades_updates = compute_positions(trades)

        assert trades_updates['sell1'].sell_decision_suggestion == "목표가 전 조기 매도"


class TestSameDateOrdering:
    def test_same_date_trades_ordered_by_created_at(self):
        """Trades on same date ordered by created_at"""
        base_date = datetime(2026, 1, 1)
        trades = [
            create_trade('buy1', quantity=100, price=150, fee=0,
                        traded_at=base_date, created_at=base_date),
            create_trade('buy2', quantity=50, price=160, fee=0,
                        traded_at=base_date, created_at=base_date + timedelta(seconds=1)),
        ]
        positions, trades_updates = compute_positions(trades)

        pos = positions[0]
        # avg = (100*150 + 50*160) / 150 = 153.333...
        expected_avg = Decimal('23000') / Decimal('150')
        assert pos.average_price == expected_avg


class TestBackdatedBuyRecalculates:
    def test_backdated_buy_recalculates_future_sells(self):
        """Adding backdated buy recalculates subsequent sells"""
        # Simulate: sell -> then buy earlier -> reorder -> recalculate
        base_date = datetime(2026, 1, 1)
        trades = [
            create_trade('buy1', quantity=100, price=150, fee=10,
                        traded_at=base_date),
            create_trade('buy2', quantity=50, price=160, fee=5,
                        traded_at=base_date + timedelta(hours=1)),
            create_trade('sell1', direction='sell', quantity=100, price=170, fee=2,
                        traded_at=base_date + timedelta(hours=2)),
        ]
        positions, trades_updates = compute_positions(trades)

        # avg = (100*150 + 10 + 50*160 + 5) / 150 = 153.4333...
        # realized_profit = (170 - 153.4333) * 100 - 2 = 1643.67
        sell_update = trades_updates['sell1']
        expected_avg = Decimal('23015') / Decimal('150')
        expected_profit = (Decimal('170') - expected_avg) * Decimal('100') - Decimal('2')

        assert abs(sell_update.realized_profit - expected_profit) < Decimal('1')


class TestTotalCostUpdate:
    def test_partial_sell_updates_total_cost(self):
        """Partial sell should decrement position.total_cost correctly"""
        base_date = datetime(2026, 1, 1)
        trades = [
            create_trade('buy1', quantity=100, price=150, fee=10,
                        traded_at=base_date),
            create_trade('sell1', direction='sell', quantity=80, price=170, fee=2,
                        traded_at=base_date + timedelta(hours=1)),
        ]
        positions, trades_updates = compute_positions(trades)

        # buy: total_cost = 100*150 + 10 = 15010, avg_price = 150.10
        # sell 80: avg_price = 15010/100 = 150.10
        # remaining qty = 20, total_cost = 150.10 * 20 = 3002.00
        assert len(positions) == 1
        assert positions[0].status == 'open'
        assert positions[0].total_quantity == Decimal('20')
        assert positions[0].total_cost == Decimal('3002.00')

    def test_full_sell_total_cost_zero(self):
        """Full sell should close position with total_cost = 0"""
        base_date = datetime(2026, 1, 1)
        trades = [
            create_trade('buy1', quantity=100, price=150, fee=10,
                        traded_at=base_date),
            create_trade('sell1', direction='sell', quantity=100, price=170, fee=2,
                        traded_at=base_date + timedelta(hours=1)),
        ]
        positions, trades_updates = compute_positions(trades)

        # Full liquidation: position should be closed with total_cost = 0
        assert len(positions) == 1
        assert positions[0].status == 'closed'
        assert positions[0].total_quantity == Decimal(0)
        assert positions[0].total_cost == Decimal(0)


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
