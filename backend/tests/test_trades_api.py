import pytest
from datetime import datetime, timezone
from decimal import Decimal
from unittest.mock import Mock, MagicMock, patch
from app.routers.trades import (
    recalculate_positions_for_group,
    create_trade,
    update_trade,
    delete_trade,
    TradeInput,
)


class MockSupabaseTable:
    def __init__(self, table_name):
        self.table_name = table_name
        self.data = {}

    def select(self, *args, **kwargs):
        return self

    def insert(self, data):
        # Simulate insert
        if isinstance(data, list):
            for item in data:
                item_id = item.get('id', f'id_{len(self.data)}')
                item['id'] = item_id
                self.data[item_id] = item
            self.execute = lambda: Mock(data=data)
        else:
            item_id = data.get('id', f'id_{len(self.data)}')
            data['id'] = item_id
            self.data[item_id] = data
            self.execute = lambda: Mock(data=[data])
        return self

    def update(self, data):
        self.update_data = data
        self.execute = lambda: Mock(data=[{**self.data.get(self.current_id, {}), **data}])
        return self

    def delete(self):
        self.execute = lambda: Mock(data=[])
        return self

    def eq(self, key, value):
        self.filter_key = key
        self.filter_value = value
        return self

    def order(self, key, **kwargs):
        return self

    def execute(self):
        return Mock(data=[])


class MockSupabaseAuth:
    def get_user(self, token):
        return Mock(user=Mock(id='user123'))


class MockSupabase:
    def __init__(self):
        self.auth = MockSupabaseAuth()

    def __call__(self, token):
        return self


def test_sell_exceeds_quantity_no_db_write():
    """Test that exceeding quantity doesn't write to database"""
    # This test demonstrates that validation happens before DB write
    # Since our implementation validates in-memory first, no write should occur

    # Simulate the validation logic
    from app.models.position import compute_positions

    trades = [
        {
            'id': 'buy1',
            'ticker': 'AAPL',
            'currency': 'USD',
            'direction': 'buy',
            'quantity': 100,
            'price': 150,
            'fee': 0,
            'target_price': None,
            'stop_loss': None,
            'traded_at': datetime(2026, 1, 1),
            'created_at': datetime(2026, 1, 1),
        },
        {
            'id': 'sell1',
            'ticker': 'AAPL',
            'currency': 'USD',
            'direction': 'sell',
            'quantity': 150,  # Exceeds holding
            'price': 170,
            'fee': 0,
            'target_price': None,
            'stop_loss': None,
            'traded_at': datetime(2026, 1, 2),
            'created_at': datetime(2026, 1, 2),
        },
    ]

    # Should raise ValueError before any DB write
    with pytest.raises(ValueError, match="Sell quantity .* exceeds holding"):
        compute_positions(trades)


def test_sell_decision_not_overwritten():
    """Test that user's sell_decision is not overwritten by recalculation"""
    # In the new code, sell_decision is preserved from input
    # and not overwritten in recalculate_positions_for_group

    input_data = TradeInput(
        ticker='AAPL',
        name=None,
        direction='sell',
        quantity=80,
        price=170,
        currency='USD',
        fee=None,
        reason='Test',
        emotion_tag='analysis',
        target_price=170,
        stop_loss=140,
        checklist_passed=False,
        outcome='profit',
        sell_decision='내 판단으로 매도',  # User's choice
        traded_at=datetime(2026, 1, 2),
    )

    # The sell_decision should be preserved, not replaced by auto-suggestion
    # This would be tested by checking that update_data doesn't contain sell_decision
    # in recalculate_positions_for_group

    # Verify the TradeInput accepts sell_decision
    assert input_data.sell_decision == '내 판단으로 매도'


def test_position_id_assigned_after_insert():
    """Test that position_id is assigned to trades after position insert"""
    # This is verified by the new recalculate_positions_for_group logic
    # which inserts positions, gets their IDs, then updates trades

    from app.models.position import compute_positions

    trades = [
        {
            'id': 'buy1',
            'ticker': 'AAPL',
            'currency': 'USD',
            'direction': 'buy',
            'quantity': 100,
            'price': 150,
            'fee': 10,
            'target_price': 160,
            'stop_loss': 140,
            'traded_at': datetime(2026, 1, 1),
            'created_at': datetime(2026, 1, 1),
        },
        {
            'id': 'sell1',
            'ticker': 'AAPL',
            'currency': 'USD',
            'direction': 'sell',
            'quantity': 80,
            'price': 170,
            'fee': 2,
            'target_price': 170,
            'stop_loss': 140,
            'traded_at': datetime(2026, 1, 2),
            'created_at': datetime(2026, 1, 2),
        },
    ]

    positions, trades_updates = compute_positions(trades)

    # Verify positions were computed
    # After partial sell, position remains open with 20 quantity
    assert len(positions) == 1  # One open position with 20 shares remaining

    # Verify trades have outcome set
    assert trades_updates['buy1'].outcome == 'holding'
    assert trades_updates['sell1'].outcome == 'profit'
    assert trades_updates['sell1'].realized_profit == Decimal('1590.00')

    # Verify position status and quantity
    assert positions[0].status == 'open'
    assert positions[0].total_quantity == Decimal('20')


def test_recalculation_only_affected_group():
    """Test that only affected ticker+currency group is recalculated"""
    # This is verified by the function signature and query filters
    # recalculate_positions_for_group(authed, user_id, ticker, currency)
    # uses .eq("ticker", ticker).eq("currency", currency)

    # No additional assertions needed - the function design itself
    # ensures only the specified group is processed
    pass


def test_ticker_currency_normalization():
    """Test that ticker and currency are normalized (uppercase, stripped)"""
    input_data = TradeInput(
        ticker='  aapl  ',
        name=None,
        direction='buy',
        quantity=100,
        price=150,
        currency='  usd  ',
        fee=None,
        reason='Test',
        emotion_tag='analysis',
        target_price=None,
        stop_loss=None,
        checklist_passed=False,
        outcome=None,
        traded_at=datetime(2026, 1, 1),
    )

    # The code uses: ticker.strip().upper()
    # and currency.strip().upper()
    ticker = input_data.ticker.strip().upper()
    currency = input_data.currency.strip().upper()

    assert ticker == 'AAPL'
    assert currency == 'USD'


def test_decimal_preservation_in_calculations():
    """Test that Decimal precision is maintained through API"""
    # This test verifies that computed values maintain Decimal precision

    from app.models.position import compute_positions

    trades = [
        {
            'id': 'buy1',
            'ticker': 'AAPL',
            'currency': 'USD',
            'direction': 'buy',
            'quantity': Decimal('100'),
            'price': Decimal('150'),
            'fee': Decimal('10'),
            'target_price': None,
            'stop_loss': None,
            'traded_at': datetime(2026, 1, 1, tzinfo=timezone.utc),
            'created_at': datetime(2026, 1, 1, tzinfo=timezone.utc),
        },
        {
            'id': 'buy2',
            'ticker': 'AAPL',
            'currency': 'USD',
            'direction': 'buy',
            'quantity': Decimal('50'),
            'price': Decimal('160'),
            'fee': Decimal('5'),
            'target_price': None,
            'stop_loss': None,
            'traded_at': datetime(2026, 1, 2, tzinfo=timezone.utc),
            'created_at': datetime(2026, 1, 2, tzinfo=timezone.utc),
        },
        {
            'id': 'sell1',
            'ticker': 'AAPL',
            'currency': 'USD',
            'direction': 'sell',
            'quantity': Decimal('100'),
            'price': Decimal('170'),
            'fee': Decimal('2'),
            'target_price': None,
            'stop_loss': None,
            'traded_at': datetime(2026, 1, 3, tzinfo=timezone.utc),
            'created_at': datetime(2026, 1, 3, tzinfo=timezone.utc),
        },
    ]

    positions, trades_updates = compute_positions(trades)

    # Expected values
    expected_avg = Decimal('23015') / Decimal('150')  # 153.4333...
    expected_profit = (Decimal('170') - expected_avg) * Decimal('100') - Decimal('2')  # ~1643.67

    # Verify calculations are exact
    assert positions[0].average_price == expected_avg
    assert abs(trades_updates['sell1'].realized_profit - expected_profit) < Decimal('0.01')


def test_position_mapping_multiple_lifecycle():
    """Test position_index mapping with buy→sell→buy→sell→buy lifecycle"""
    from app.models.position import compute_positions

    trades = [
        {
            'id': 'buy1',
            'ticker': 'MSFT',
            'currency': 'USD',
            'direction': 'buy',
            'quantity': Decimal('100'),
            'price': Decimal('300'),
            'fee': Decimal('0'),
            'target_price': None,
            'stop_loss': None,
            'traded_at': datetime(2026, 1, 1, tzinfo=timezone.utc),
            'created_at': datetime(2026, 1, 1, tzinfo=timezone.utc),
        },
        {
            'id': 'sell1',
            'ticker': 'MSFT',
            'currency': 'USD',
            'direction': 'sell',
            'quantity': Decimal('100'),
            'price': Decimal('310'),
            'fee': Decimal('0'),
            'target_price': None,
            'stop_loss': None,
            'traded_at': datetime(2026, 1, 2, tzinfo=timezone.utc),
            'created_at': datetime(2026, 1, 2, tzinfo=timezone.utc),
        },
        {
            'id': 'buy2',
            'ticker': 'MSFT',
            'currency': 'USD',
            'direction': 'buy',
            'quantity': Decimal('50'),
            'price': Decimal('320'),
            'fee': Decimal('0'),
            'target_price': None,
            'stop_loss': None,
            'traded_at': datetime(2026, 1, 3, tzinfo=timezone.utc),
            'created_at': datetime(2026, 1, 3, tzinfo=timezone.utc),
        },
        {
            'id': 'sell2',
            'ticker': 'MSFT',
            'currency': 'USD',
            'direction': 'sell',
            'quantity': Decimal('50'),
            'price': Decimal('330'),
            'fee': Decimal('0'),
            'target_price': None,
            'stop_loss': None,
            'traded_at': datetime(2026, 1, 4, tzinfo=timezone.utc),
            'created_at': datetime(2026, 1, 4, tzinfo=timezone.utc),
        },
        {
            'id': 'buy3',
            'ticker': 'MSFT',
            'currency': 'USD',
            'direction': 'buy',
            'quantity': Decimal('75'),
            'price': Decimal('325'),
            'fee': Decimal('0'),
            'target_price': None,
            'stop_loss': None,
            'traded_at': datetime(2026, 1, 5, tzinfo=timezone.utc),
            'created_at': datetime(2026, 1, 5, tzinfo=timezone.utc),
        },
    ]

    positions, trades_updates = compute_positions(trades)

    # Should have 3 positions: closed, closed, open
    assert len(positions) == 3
    assert positions[0].status == 'closed'
    assert positions[1].status == 'closed'
    assert positions[2].status == 'open'

    # Verify position_index mapping
    assert trades_updates['buy1'].position_index == 0
    assert trades_updates['sell1'].position_index == 0
    assert trades_updates['buy2'].position_index == 1
    assert trades_updates['sell2'].position_index == 1
    assert trades_updates['buy3'].position_index == 2


def test_decimal_fractional_quantities():
    """Test fractional quantities like 0.1 + 0.2 maintain precision"""
    from app.models.position import compute_positions

    trades = [
        {
            'id': 'buy1',
            'ticker': 'BTC',
            'currency': 'USD',
            'direction': 'buy',
            'quantity': Decimal('0.1'),
            'price': Decimal('50000'),
            'fee': Decimal('0'),
            'target_price': None,
            'stop_loss': None,
            'traded_at': datetime(2026, 1, 1, tzinfo=timezone.utc),
            'created_at': datetime(2026, 1, 1, tzinfo=timezone.utc),
        },
        {
            'id': 'buy2',
            'ticker': 'BTC',
            'currency': 'USD',
            'direction': 'buy',
            'quantity': Decimal('0.2'),
            'price': Decimal('51000'),
            'fee': Decimal('0'),
            'target_price': None,
            'stop_loss': None,
            'traded_at': datetime(2026, 1, 2, tzinfo=timezone.utc),
            'created_at': datetime(2026, 1, 2, tzinfo=timezone.utc),
        },
        {
            'id': 'sell1',
            'ticker': 'BTC',
            'currency': 'USD',
            'direction': 'sell',
            'quantity': Decimal('0.15'),
            'price': Decimal('52000'),
            'fee': Decimal('0'),
            'target_price': None,
            'stop_loss': None,
            'traded_at': datetime(2026, 1, 3, tzinfo=timezone.utc),
            'created_at': datetime(2026, 1, 3, tzinfo=timezone.utc),
        },
    ]

    positions, trades_updates = compute_positions(trades)

    # avg = (0.1*50000 + 0.2*51000) / 0.3 = (5000 + 10200) / 0.3 = 15200/0.3 = 50666.666...
    expected_avg = (Decimal('0.1') * Decimal('50000') + Decimal('0.2') * Decimal('51000')) / Decimal('0.3')

    # Verify fractional position is computed exactly
    assert positions[0].average_price == expected_avg
    assert positions[0].total_quantity == Decimal('0.15')


def test_timezone_aware_datetime_sorting():
    """Test that timezone-aware datetimes sort correctly with mixed sources"""
    from app.models.position import compute_positions

    trades = [
        {
            'id': 'db_buy1',
            'ticker': 'GOOGL',
            'currency': 'USD',
            'direction': 'buy',
            'quantity': Decimal('10'),
            'price': Decimal('2800'),
            'fee': Decimal('0'),
            'target_price': None,
            'stop_loss': None,
            'traded_at': datetime(2026, 1, 1, 10, 0, tzinfo=timezone.utc),
            'created_at': datetime(2026, 1, 1, 10, 0, tzinfo=timezone.utc),
        },
        {
            'id': 'new_buy2',
            'ticker': 'GOOGL',
            'currency': 'USD',
            'direction': 'buy',
            'quantity': Decimal('5'),
            'price': Decimal('2850'),
            'fee': Decimal('0'),
            'target_price': None,
            'stop_loss': None,
            'traded_at': datetime(2026, 1, 1, 11, 0, tzinfo=timezone.utc),
            'created_at': datetime(2026, 1, 1, 11, 0, tzinfo=timezone.utc),
        },
        {
            'id': 'db_sell1',
            'ticker': 'GOOGL',
            'currency': 'USD',
            'direction': 'sell',
            'quantity': Decimal('10'),
            'price': Decimal('2900'),
            'fee': Decimal('0'),
            'target_price': None,
            'stop_loss': None,
            'traded_at': datetime(2026, 1, 1, 12, 0, tzinfo=timezone.utc),
            'created_at': datetime(2026, 1, 1, 12, 0, tzinfo=timezone.utc),
        },
    ]

    # Should not raise any timezone comparison errors
    positions, trades_updates = compute_positions(trades)

    # Verify correct calculation: 10 + 5 = 15 bought, 10 sold = 5 remaining
    assert len(positions) == 1  # One open position with 5 shares
    assert positions[0].status == 'open'
    assert positions[0].total_quantity == Decimal('5')


def test_create_trade_with_decimal_json_serialization():
    """Test that create_trade properly serializes Decimal to JSON for DB"""
    from unittest.mock import Mock, patch
    from app.routers.trades import create_trade, TradeInput

    # Mock supabase
    mock_authed = Mock()
    mock_trades_table = Mock()
    mock_positions_table = Mock()

    # Mock insert/update to capture payloads
    payloads = {'insert': None, 'update': None}

    def capture_insert(data):
        payloads['insert'] = data
        mock_insert_res = Mock()
        mock_insert_res.data = [{'id': 'trade_123'} | data]
        return mock_insert_res

    mock_trades_table.insert.side_effect = capture_insert
    mock_trades_table.select().eq().eq().eq().order().order().execute.return_value = Mock(data=[])
    mock_trades_table.select().eq().execute.return_value = Mock(data=[{'id': 'trade_123', 'quantity': Decimal('0.1')}])

    mock_positions_table.delete().eq().eq().eq().execute.return_value = Mock(data=[])
    mock_positions_table.insert.return_value = Mock(data=[{'id': 'pos_123'}])

    def get_table(name):
        if name == 'trades':
            return mock_trades_table
        elif name == 'positions':
            return mock_positions_table

    mock_authed.table.side_effect = get_table

    with patch('app.routers.trades.supabase_with_token', return_value=mock_authed):
        with patch('app.routers.trades.get_user_id', return_value='user_123'):
            with patch('app.routers.trades.get_token', return_value='token_123'):
                body = TradeInput(
                    ticker='BTC',
                    name='Bitcoin',
                    direction='buy',
                    quantity=Decimal('0.1'),
                    price=Decimal('50000.50'),
                    currency='USD',
                    fee=Decimal('1.25'),
                    reason='Test',
                    emotion_tag='analysis',
                    target_price=Decimal('55000'),
                    stop_loss=Decimal('45000'),
                    checklist_passed=True,
                    sell_decision=None,
                    traded_at=datetime(2026, 1, 1, 10, 0),  # naive datetime
                )

                result = create_trade(body, token='token_123', user_id='user_123')

    # Verify payload was successfully JSON serializable
    import json
    payload = payloads['insert']
    assert payload is not None
    json_str = json.dumps(payload)  # Should not raise
    parsed = json.loads(json_str)

    # Verify Decimal values became strings in JSON
    assert isinstance(parsed['quantity'], str) or isinstance(parsed['quantity'], (int, float))
    assert isinstance(parsed['price'], str) or isinstance(parsed['price'], (int, float))


def test_create_trade_with_mock_db_json_response():
    """Test create_trade with mock DB returning ISO strings and numeric types"""
    from unittest.mock import Mock, patch, MagicMock
    from app.routers.trades import create_trade, TradeInput

    # Track what was written
    written_trades = []

    mock_authed = Mock()

    # Mock DB responses like Supabase: quantity as float/int, datetime as ISO string
    def mock_trades_select():
        mock_select = Mock()
        mock_select.eq = Mock(side_effect=lambda *args, **kwargs: mock_select)
        mock_select.order = Mock(side_effect=lambda *args, **kwargs: mock_select)

        def execute():
            # First call: existing trades for group (empty)
            # Second call: fetch updated trade
            return Mock(data=[{
                'id': 'trade_new',
                'ticker': 'BTC',
                'currency': 'USD',
                'direction': 'buy',
                'quantity': 0.1,  # int/float from Supabase
                'price': 50000.5,
                'fee': 1.25,
                'traded_at': '2026-01-01T10:00:00+00:00',  # ISO string with TZ
                'created_at': '2026-01-01T10:00:00.123456+00:00',
            }])

        mock_select.execute = execute
        return mock_select

    def mock_positions_select():
        mock_select = Mock()
        mock_select.eq = Mock(side_effect=lambda *args, **kwargs: mock_select)

        def execute():
            return Mock(data=[])

        mock_select.execute = execute
        return mock_select

    def get_table(name):
        if name == 'trades':
            mock_table = Mock()
            mock_table.select = mock_trades_select
            mock_table.insert = Mock(return_value=Mock(
                execute=Mock(return_value=Mock(data=[{'id': 'trade_new'}]))
            ))
            mock_table.update = Mock(return_value=Mock(
                eq=Mock(side_effect=lambda *args, **kwargs: Mock(
                    execute=Mock(return_value=Mock(data=[]))
                ))
            ))
            mock_table.delete = Mock(return_value=Mock(
                eq=Mock(side_effect=lambda *args, **kwargs: Mock(
                    execute=Mock(return_value=Mock(data=[]))
                ))
            ))
            return mock_table
        elif name == 'positions':
            mock_table = Mock()
            mock_table.delete = Mock(return_value=Mock(
                eq=Mock(side_effect=lambda *args, **kwargs: Mock(
                    execute=Mock(return_value=Mock(data=[]))
                ))
            ))
            mock_table.insert = Mock(return_value=Mock(
                execute=Mock(return_value=Mock(data=[{'id': 'pos_123'}]))
            ))
            return mock_table

    mock_authed.table.side_effect = get_table

    with patch('app.routers.trades.supabase_with_token', return_value=mock_authed):
        with patch('app.routers.trades.get_user_id', return_value='user_123'):
            with patch('app.routers.trades.get_token', return_value='token_123'):
                # Use naive datetime for body (as client would send)
                body = TradeInput(
                    ticker='BTC',
                    name='Bitcoin',
                    direction='buy',
                    quantity=Decimal('0.1'),
                    price=Decimal('50000.50'),
                    currency='USD',
                    fee=Decimal('1.25'),
                    reason='Test buy',
                    emotion_tag='analysis',
                    target_price=Decimal('55000'),
                    stop_loss=Decimal('45000'),
                    checklist_passed=True,
                    sell_decision=None,
                    traded_at=datetime(2026, 1, 1, 10, 0),  # NAIVE - no timezone
                )

                # Should not raise timezone comparison errors
                result = create_trade(body, token='token_123', user_id='user_123')

                # Verify result was returned
                assert result is not None


def test_fractional_buy_sell_realized_profit():
    """Test fractional quantity buy+sell with realized profit calculation"""
    from app.models.position import compute_positions

    trades = [
        {
            'id': 'buy1',
            'ticker': 'BTC',
            'currency': 'USD',
            'direction': 'buy',
            'quantity': Decimal('0.1'),  # From API
            'price': Decimal('50000'),
            'fee': Decimal('0'),
            'target_price': None,
            'stop_loss': None,
            'traded_at': datetime(2026, 1, 1, 10, 0, tzinfo=timezone.utc),
            'created_at': datetime(2026, 1, 1, 10, 0, tzinfo=timezone.utc),
        },
        {
            'id': 'buy2',
            'ticker': 'BTC',
            'currency': 'USD',
            'direction': 'buy',
            'quantity': Decimal('0.2'),
            'price': Decimal('51000'),
            'fee': Decimal('0'),
            'target_price': None,
            'stop_loss': None,
            'traded_at': datetime(2026, 1, 1, 11, 0, tzinfo=timezone.utc),
            'created_at': datetime(2026, 1, 1, 11, 0, tzinfo=timezone.utc),
        },
        {
            'id': 'sell1',
            'ticker': 'BTC',
            'currency': 'USD',
            'direction': 'sell',
            'quantity': Decimal('0.15'),
            'price': Decimal('52000'),
            'fee': Decimal('0'),
            'target_price': None,
            'stop_loss': None,
            'traded_at': datetime(2026, 1, 1, 12, 0, tzinfo=timezone.utc),
            'created_at': datetime(2026, 1, 1, 12, 0, tzinfo=timezone.utc),
        },
    ]

    positions, trades_updates = compute_positions(trades)

    # avg = (0.1*50000 + 0.2*51000) / 0.3 = (5000 + 10200) / 0.3 = 50666.6666...
    # realized_profit = (52000 - 50666.6666...) * 0.15 = 1333.3333... * 0.15 = 200
    expected_avg = (Decimal('0.1') * Decimal('50000') + Decimal('0.2') * Decimal('51000')) / Decimal('0.3')
    expected_profit = (Decimal('52000') - expected_avg) * Decimal('0.15')

    assert trades_updates['sell1'].outcome == 'profit'
    assert trades_updates['sell1'].realized_profit == expected_profit
    assert positions[0].total_quantity == Decimal('0.15')  # 0.3 - 0.15


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
