import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { Card, EmptyState, ErrorBanner, LoadingState } from '@/components/ui/surface';
import { palette, radius, space, toneColors, type } from '@/constants/theme';
import { useApi } from '@/hooks/use-api';
import { formatCompact, formatNumber } from '@/lib/format';
import { emotionMeta } from '@/lib/labels';
import type { Summary } from '@/types';

export default function StatsScreen() {
  const { data, error, loading, refreshing, refresh } = useApi<Summary>('/stats/summary');

  const emotions = data ? Object.entries(data.emotion_stats).sort((a, b) => b[1] - a[1]) : [];
  const tickers = data ? Object.entries(data.ticker_stats).sort((a, b) => b[1] - a[1]).slice(0, 8) : [];
  const maxTicker = tickers[0]?.[1] ?? 1;

  return (
    <Screen title="Statistics" subtitle="Your trading performance" refreshing={refreshing} onRefresh={refresh}>
      {error ? <ErrorBanner message={error} onRetry={refresh} /> : null}

      {loading ? (
        <LoadingState />
      ) : !data || data.total_trades === 0 ? (
        <EmptyState icon="chart.bar.fill" title="No data yet" message="Statistics appear once you record trades." />
      ) : (
        <>
          <View style={styles.grid}>
            <Tile label="Total trades" value={String(data.total_trades)} />
            <Tile
              label="Win rate"
              value={`${data.win_rate}%`}
              color={data.win_rate >= 50 ? palette.positive : palette.negative}
            />
            <Tile label="Buy" value={String(data.buy_count)} color={palette.positive} />
            <Tile label="Sell" value={String(data.sell_count)} color={palette.negative} />
          </View>

          <Card>
            <Text style={type.overline}>Total volume</Text>
            <Text style={[styles.volume, type.number]}>{formatNumber(data.total_amount, 0)}</Text>
            <Text style={type.caption}>Sum of quantity × price across all trades</Text>
          </Card>

          <Card style={{ gap: space.lg }}>
            <Text style={type.headline}>Emotion breakdown</Text>
            <View style={styles.stack}>
              {emotions.map(([tag, count]) => (
                <View
                  key={tag}
                  style={{ flex: count, backgroundColor: toneColors[emotionMeta(tag).tone].fg }}
                />
              ))}
            </View>
            <View style={{ gap: space.md }}>
              {emotions.map(([tag, count]) => {
                const meta = emotionMeta(tag);
                const pct = Math.round((count / data.total_trades) * 100);
                return (
                  <View key={tag} style={styles.legendRow}>
                    <View style={[styles.swatch, { backgroundColor: toneColors[meta.tone].fg }]} />
                    <Text style={[type.body, { flex: 1 }]}>{meta.label}</Text>
                    <Text style={[styles.count, type.number]}>{count}</Text>
                    <Text style={[styles.pct, type.number]}>{pct}%</Text>
                  </View>
                );
              })}
            </View>
            {data.emotion_stats.fomo ? (
              <Text style={styles.insight}>
                {Math.round((data.emotion_stats.fomo / data.total_trades) * 100)}% of your trades were FOMO-driven.
              </Text>
            ) : null}
          </Card>

          <Card style={{ gap: space.md }}>
            <Text style={type.headline}>Top tickers</Text>
            {tickers.map(([ticker, count], i) => (
              <View key={ticker} style={styles.tickerRow}>
                <Text style={styles.rank}>{i + 1}</Text>
                <Text style={styles.ticker} numberOfLines={1}>
                  {ticker}
                </Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${(count / maxTicker) * 100}%` }]} />
                </View>
                <Text style={[styles.count, type.number]}>{formatCompact(count)}</Text>
              </View>
            ))}
          </Card>
        </>
      )}
    </Screen>
  );
}

function Tile({ label, value, color = palette.ink }: { label: string; value: string; color?: string }) {
  return (
    <Card style={styles.tile}>
      <Text style={type.overline}>{label}</Text>
      <Text style={[styles.tileValue, type.number, { color }]}>{value}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  tile: { width: '47.5%', flexGrow: 1, gap: 6 },
  tileValue: { fontSize: 30, fontWeight: '700', letterSpacing: -0.8 },
  volume: { fontSize: 30, fontWeight: '700', color: palette.ink, letterSpacing: -0.8, marginVertical: 4 },
  stack: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', gap: 2 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  count: { fontSize: 15, fontWeight: '600', color: palette.ink, minWidth: 24, textAlign: 'right' },
  pct: { fontSize: 13, color: palette.muted, width: 40, textAlign: 'right' },
  insight: {
    fontSize: 13,
    color: palette.negative,
    backgroundColor: palette.negativeBg,
    padding: space.md,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  tickerRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  rank: { width: 16, fontSize: 13, fontWeight: '600', color: palette.faint },
  ticker: { width: 64, fontSize: 15, fontWeight: '600', color: palette.ink },
  barTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: palette.hairline, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4, backgroundColor: palette.ink },
});
