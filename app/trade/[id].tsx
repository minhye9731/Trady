import { useState, type ReactNode } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { TradeForm } from '@/components/trade-form';
import { DirectionBadge } from '@/components/trade-row';
import { Button, Segmented } from '@/components/ui/controls';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Screen } from '@/components/ui/screen';
import { Card, Chip, Divider, ErrorBanner, LoadingState } from '@/components/ui/surface';
import { palette, space, type } from '@/constants/theme';
import { useApi } from '@/hooks/use-api';
import { api, errorMessage } from '@/lib/api';
import { formatDateTime, formatNumber } from '@/lib/format';
import { emotionMeta, outcomeOptions } from '@/lib/labels';
import type { Trade, TradeInput, TradeOutcome } from '@/types';

function toInput(t: Trade): TradeInput {
  return {
    ticker: t.ticker,
    name: t.name,
    direction: t.direction,
    quantity: t.quantity,
    price: t.price,
    reason: t.reason,
    emotion_tag: t.emotion_tag,
    target_price: t.target_price,
    stop_loss: t.stop_loss,
    checklist_passed: t.checklist_passed,
    outcome: t.outcome,
    traded_at: t.traded_at,
  };
}

export default function TradeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: trade, setData, error, reload } = useApi<Trade>(`/trades/${id}`);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const save = async (input: TradeInput) => {
    try {
      const res = await api.put<Trade>(`/trades/${id}`, input);
      setData(res.data);
      setEditing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert('Could not save', errorMessage(e));
    }
  };

  const setOutcome = async (outcome: TradeOutcome) => {
    if (!trade) return;
    const previous = trade;
    setData({ ...trade, outcome });
    try {
      await api.put(`/trades/${id}`, { ...toInput(trade), outcome });
    } catch (e) {
      setData(previous);
      Alert.alert('Could not update', errorMessage(e));
    }
  };

  const remove = () => {
    Alert.alert('Delete this trade?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await api.delete(`/trades/${id}`);
            router.back();
          } catch (e) {
            setDeleting(false);
            Alert.alert('Delete failed', errorMessage(e));
          }
        },
      },
    ]);
  };

  const header = (
    <Stack.Screen
      options={{
        title: trade?.ticker ?? '',
        headerRight: trade
          ? () => (
              <Pressable onPress={() => setEditing((v) => !v)} hitSlop={10}>
                <Text style={styles.headerAction}>{editing ? 'Cancel' : 'Edit'}</Text>
              </Pressable>
            )
          : undefined,
      }}
    />
  );

  if (!trade) {
    return (
      <Screen>
        {header}
        {error ? <ErrorBanner message={error} onRetry={reload} /> : <LoadingState />}
      </Screen>
    );
  }

  if (editing) {
    return (
      <Screen contentStyle={{ paddingTop: 8 }}>
        {header}
        <TradeForm initial={trade} submitLabel="Save changes" onSubmit={save} />
      </Screen>
    );
  }

  const buy = trade.direction === 'buy';
  const emotion = emotionMeta(trade.emotion_tag);

  return (
    <Screen contentStyle={{ paddingTop: 8 }}>
      {header}

      <Card style={{ gap: space.lg }}>
        <View style={styles.heroTop}>
          <DirectionBadge direction={trade.direction} size={48} />
          <View style={{ flex: 1 }}>
            <View style={styles.tickerLine}>
              <Text style={styles.ticker}>{trade.ticker}</Text>
              <Chip label={buy ? 'BUY' : 'SELL'} tone={buy ? 'positive' : 'negative'} />
            </View>
            {trade.name ? <Text style={type.callout}>{trade.name}</Text> : null}
          </View>
        </View>
        <View>
          <Text style={type.overline}>Total amount</Text>
          <Text style={[styles.total, type.number]}>{formatNumber(trade.quantity * trade.price)}</Text>
          <Text style={[type.callout, type.number]}>
            {formatNumber(trade.quantity)} shares × {formatNumber(trade.price)}
          </Text>
        </View>
      </Card>

      <Card style={{ gap: space.md }}>
        <Text style={type.overline}>Outcome</Text>
        <Segmented options={outcomeOptions} value={trade.outcome ?? 'holding'} onChange={setOutcome} />
      </Card>

      <Card padded={false}>
        <DetailRow label="Date" value={formatDateTime(trade.traded_at)} />
        <Divider inset={space.lg} />
        <DetailRow label="Emotion" value={<Chip label={emotion.label} tone={emotion.tone} size="md" />} />
        <Divider inset={space.lg} />
        <DetailRow label="Target" value={formatNumber(trade.target_price)} />
        <Divider inset={space.lg} />
        <DetailRow label="Stop loss" value={formatNumber(trade.stop_loss)} />
        <Divider inset={space.lg} />
        <DetailRow
          label="Checklist"
          value={
            trade.checklist_passed ? (
              <View style={styles.check}>
                <IconSymbol name="checkmark.seal.fill" size={16} color={palette.positive} />
                <Text style={[styles.detailValue, { color: palette.positive }]}>Confirmed</Text>
              </View>
            ) : (
              <Text style={[styles.detailValue, { color: palette.muted }]}>Not confirmed</Text>
            )
          }
        />
      </Card>

      <Card style={{ gap: space.sm }}>
        <Text style={type.overline}>Reason</Text>
        <Text style={type.body}>{trade.reason || 'No reason recorded.'}</Text>
      </Card>

      <Button title="Delete trade" variant="destructive" icon="trash" loading={deleting} onPress={remove} />
    </Screen>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      {typeof value === 'string' ? <Text style={[styles.detailValue, type.number]}>{value}</Text> : value}
    </View>
  );
}

const styles = StyleSheet.create({
  headerAction: { fontSize: 17, color: palette.ink, fontWeight: '500' },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  tickerLine: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  ticker: { fontSize: 24, fontWeight: '700', color: palette.ink, letterSpacing: -0.5 },
  total: { fontSize: 34, fontWeight: '700', color: palette.ink, letterSpacing: -1, marginVertical: 2 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 50,
    paddingHorizontal: space.lg,
  },
  detailLabel: { fontSize: 15, color: palette.muted },
  detailValue: { fontSize: 15, fontWeight: '500', color: palette.ink },
  check: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
