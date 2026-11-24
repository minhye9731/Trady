import { Fragment } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { TradeRow } from '@/components/trade-row';
import { Button, IconButton } from '@/components/ui/controls';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Screen } from '@/components/ui/screen';
import { Card, Divider, EmptyState, ErrorBanner, LoadingState, SectionHeader } from '@/components/ui/surface';
import { palette, radius, space, toneColors, type } from '@/constants/theme';
import { useApi } from '@/hooks/use-api';
import { api, errorMessage } from '@/lib/api';
import { formatToday } from '@/lib/format';
import { indicatorInfo, indicatorOrder, marketSignal } from '@/lib/labels';
import type { Indicator, Summary, Trade } from '@/types';

export default function HomeScreen() {
  const router = useRouter();
  const trades = useApi<Trade[]>('/trades/');
  const summary = useApi<Summary>('/stats/summary');
  const market = useApi<Record<string, Indicator>>('/market/indicators');

  const refresh = () => Promise.all([trades.refresh(), summary.refresh(), market.refresh()]);

  const confirmDelete = (trade: Trade) => {
    Alert.alert(`Delete ${trade.ticker}?`, 'This trade will be removed permanently.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/trades/${trade.id}`);
            trades.setData((list) => list?.filter((t) => t.id !== trade.id) ?? null);
            summary.reload();
          } catch (e) {
            Alert.alert('Delete failed', errorMessage(e));
          }
        },
      },
    ]);
  };

  const closed = trades.data?.filter((t) => t.outcome === 'profit' || t.outcome === 'loss').length ?? 0;

  return (
    <Screen
      overline={formatToday()}
      title="Overview"
      refreshing={trades.refreshing}
      onRefresh={refresh}
      right={
        <IconButton
          icon="plus"
          variant="primary"
          accessibilityLabel="New trade"
          onPress={() => router.push('/trade/new')}
        />
      }>
      {trades.error ? <ErrorBanner message={trades.error} onRetry={refresh} /> : null}

      {summary.data ? (
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>Win rate</Text>
              <Text style={[styles.heroValue, type.number]}>
                {summary.data.win_rate}
                <Text style={styles.heroUnit}>%</Text>
              </Text>
              <Text style={styles.heroCaption}>
                {closed > 0 ? `${closed} closed trade${closed === 1 ? '' : 's'}` : 'Mark trades as profit / loss'}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.heroLabel}>Trades</Text>
              <Text style={[styles.heroSide, type.number]}>{summary.data.total_trades}</Text>
            </View>
          </View>
          <View style={styles.heroBottom}>
            <HeroStat label="Buy" value={summary.data.buy_count} color="#7BD3A0" />
            <View style={styles.heroDivider} />
            <HeroStat label="Sell" value={summary.data.sell_count} color="#F09A9A" />
          </View>
        </View>
      ) : null}

      <Card onPress={() => router.push('/market')}>
        <View style={styles.pulseHeader}>
          <IconSymbol name="chart.line.uptrend.xyaxis" size={16} color={palette.ink} weight="semibold" />
          <Text style={[type.headline, { flex: 1 }]}>Market pulse</Text>
          <IconSymbol name="chevron.right" size={13} color={palette.faint} weight="semibold" />
        </View>
        <View style={styles.pulseRow}>
          {indicatorOrder.map((kind) => {
            const ind = market.data?.[kind];
            const signal = ind ? marketSignal(kind, ind.value) : null;
            return (
              <View key={kind} style={styles.pulseItem}>
                <Text style={type.caption} numberOfLines={1}>
                  {indicatorInfo[kind].short}
                </Text>
                <Text style={[styles.pulseValue, type.number]}>{ind ? `${ind.value.toFixed(2)}%` : '—'}</Text>
                {signal ? (
                  <View style={styles.pulseSignal}>
                    <View style={[styles.dot, { backgroundColor: toneColors[signal.tone].fg }]} />
                    <Text style={[styles.pulseSignalText, { color: toneColors[signal.tone].fg }]}>{signal.label}</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </Card>

      <SectionHeader title="Trades" action={trades.data?.length ? 'New' : undefined} onAction={() => router.push('/trade/new')} />

      {trades.loading ? (
        <LoadingState />
      ) : !trades.data?.length ? (
        <EmptyState
          icon="square.and.pencil"
          title="No trades yet"
          message="Record your first trade — the reason and how you felt — so the AI can coach your habits.">
          <Button title="Record a trade" icon="plus" onPress={() => router.push('/trade/new')} />
        </EmptyState>
      ) : (
        <Card padded={false} style={styles.list}>
          {trades.data.map((t, i) => (
            <Fragment key={t.id}>
              {i > 0 ? <Divider inset={66} /> : null}
              <TradeRow trade={t} onPress={() => router.push(`/trade/${t.id}`)} onDelete={() => confirmDelete(t)} />
            </Fragment>
          ))}
        </Card>
      )}
      {trades.data?.length ? <Text style={styles.hint}>Swipe left on a trade to delete it</Text> : null}
    </Screen>
  );
}

function HeroStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.heroStat}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.heroStatLabel}>{label}</Text>
      <Text style={[styles.heroStatValue, type.number]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: palette.ink,
    borderRadius: radius.xl,
    padding: space.xl,
    gap: space.lg,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroLabel: { fontSize: 12, fontWeight: '600', color: '#8C97AE', letterSpacing: 0.6, textTransform: 'uppercase' },
  heroValue: { fontSize: 48, fontWeight: '700', color: palette.onInk, letterSpacing: -1.5, marginTop: 2 },
  heroUnit: { fontSize: 24, fontWeight: '600', color: '#8C97AE' },
  heroCaption: { fontSize: 13, color: '#8C97AE', marginTop: 2 },
  heroSide: { fontSize: 28, fontWeight: '700', color: palette.onInk, marginTop: 4 },
  heroBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.md,
    paddingVertical: 12,
  },
  heroDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.15)' },
  heroStat: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  heroStatLabel: { fontSize: 14, color: '#B4BDD0' },
  heroStatValue: { fontSize: 16, fontWeight: '700', color: palette.onInk },
  dot: { width: 7, height: 7, borderRadius: 4 },
  pulseHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pulseRow: { flexDirection: 'row', marginTop: space.md, gap: space.sm },
  pulseItem: { flex: 1, gap: 3 },
  pulseValue: { fontSize: 18, fontWeight: '700', color: palette.ink, letterSpacing: -0.3 },
  pulseSignal: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  pulseSignalText: { fontSize: 12, fontWeight: '600' },
  list: { overflow: 'hidden' },
  hint: { ...type.caption, textAlign: 'center', marginTop: -space.sm },
});
