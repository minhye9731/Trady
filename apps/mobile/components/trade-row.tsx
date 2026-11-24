import { Pressable, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { palette, space, type } from '@/constants/theme';
import { formatCompact, formatDate, formatNumber } from '@/lib/format';
import { emotionMeta, outcomeMeta } from '@/lib/labels';
import type { Trade } from '@/types';
import { IconSymbol } from './ui/icon-symbol';
import { Chip } from './ui/surface';

export function DirectionBadge({ direction, size = 38 }: { direction: Trade['direction']; size?: number }) {
  const buy = direction === 'buy';
  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size * 0.3,
          backgroundColor: buy ? palette.positiveBg : palette.negativeBg,
        },
      ]}>
      <IconSymbol
        name={buy ? 'arrow.up.right' : 'arrow.down.right'}
        size={size * 0.42}
        color={buy ? palette.positive : palette.negative}
        weight="bold"
      />
    </View>
  );
}

export function TradeRow({
  trade,
  onPress,
  onDelete,
}: {
  trade: Trade;
  onPress: () => void;
  onDelete?: () => void;
}) {
  const emotion = trade.emotion_tag ? emotionMeta(trade.emotion_tag) : null;
  const outcome = trade.outcome && trade.outcome !== 'holding' ? outcomeMeta(trade.outcome) : null;

  const row = (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: palette.surfaceMuted }]}>
      <DirectionBadge direction={trade.direction} />
      <View style={styles.main}>
        <View style={styles.titleLine}>
          <Text style={styles.ticker} numberOfLines={1}>
            {trade.ticker}
          </Text>
          {trade.name ? (
            <Text style={styles.name} numberOfLines={1}>
              {trade.name}
            </Text>
          ) : null}
        </View>
        <View style={styles.metaLine}>
          {emotion ? <Chip label={emotion.label} tone={emotion.tone} /> : null}
          {outcome ? <Chip label={outcome.label} tone={outcome.tone} /> : null}
          <Text style={type.caption}>{formatDate(trade.traded_at)}</Text>
        </View>
      </View>
      <View style={styles.amount}>
        <Text style={[styles.total, type.number]}>{formatCompact(trade.quantity * trade.price)}</Text>
        <Text style={[type.caption, type.number]}>
          {formatNumber(trade.quantity)} × {formatNumber(trade.price)}
        </Text>
      </View>
    </Pressable>
  );

  if (!onDelete) return row;

  return (
    <ReanimatedSwipeable
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={() => (
        <Pressable onPress={onDelete} style={styles.deleteAction} accessibilityLabel="Delete trade">
          <IconSymbol name="trash" size={20} color="#fff" />
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      )}>
      {row}
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: 14,
    backgroundColor: palette.surface,
  },
  badge: { alignItems: 'center', justifyContent: 'center' },
  main: { flex: 1, gap: 5 },
  titleLine: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  ticker: { fontSize: 16, fontWeight: '600', color: palette.ink, letterSpacing: -0.2 },
  name: { flexShrink: 1, fontSize: 13, color: palette.muted },
  metaLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  amount: { alignItems: 'flex-end', gap: 3 },
  total: { fontSize: 15, fontWeight: '600', color: palette.ink },
  deleteAction: {
    width: 84,
    backgroundColor: palette.negative,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  deleteText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
