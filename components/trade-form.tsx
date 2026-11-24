import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { palette, radius, space, type } from '@/constants/theme';
import { formatDateTime, formatNumber, parseOptionalNumber } from '@/lib/format';
import { emotionOptions, outcomeOptions } from '@/lib/labels';
import type { EmotionTag, Trade, TradeDirection, TradeInput, TradeOutcome } from '@/types';
import { Button, ChipPicker, FieldLabel, Segmented, SwitchRow, TextField } from './ui/controls';
import { Card } from './ui/surface';

const directionOptions: { value: TradeDirection; label: string; tone: 'positive' | 'negative' }[] = [
  { value: 'buy', label: 'Buy', tone: 'positive' },
  { value: 'sell', label: 'Sell', tone: 'negative' },
];

function numText(n: number | null | undefined) {
  return n === null || n === undefined ? '' : String(n);
}

export function TradeForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Trade;
  submitLabel: string;
  onSubmit: (input: TradeInput) => Promise<void>;
}) {
  const [direction, setDirection] = useState<TradeDirection>(initial?.direction ?? 'buy');
  const [ticker, setTicker] = useState(initial?.ticker ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [quantity, setQuantity] = useState(numText(initial?.quantity));
  const [price, setPrice] = useState(numText(initial?.price));
  const [currency, setCurrency] = useState(initial?.currency ?? 'USD');
  const [fee, setFee] = useState(numText(initial?.fee));
  const [tradedAt, setTradedAt] = useState(initial ? new Date(initial.traded_at) : new Date());
  const [emotion, setEmotion] = useState<EmotionTag>(initial?.emotion_tag ?? 'analysis');
  const [reason, setReason] = useState(initial?.reason ?? '');
  const [target, setTarget] = useState(numText(initial?.target_price));
  const [stop, setStop] = useState(numText(initial?.stop_loss));
  const [outcome, setOutcome] = useState<TradeOutcome>(initial?.outcome ?? (direction === 'buy' ? 'holding' : 'profit'));
  const [checklist, setChecklist] = useState(initial?.checklist_passed ?? false);
  const [saving, setSaving] = useState(false);

  // Buy일 때는 outcome을 holding으로 강제 설정
  const finalOutcome = direction === 'buy' ? 'holding' : outcome;

  const qty = parseOptionalNumber(quantity);
  const px = parseOptionalNumber(price);
  const total = qty !== null && px !== null ? qty * px : null;

  const submit = async () => {
    if (!ticker.trim()) return Alert.alert('Missing ticker', 'Enter the ticker symbol.');
    if (!qty || qty <= 0) return Alert.alert('Invalid quantity', 'Quantity must be greater than 0.');
    if (!px || px <= 0) return Alert.alert('Invalid price', 'Price must be greater than 0.');
    if (!reason.trim()) return Alert.alert('Missing reason', 'Write down why you made this trade.');

    setSaving(true);
    try {
      await onSubmit({
        ticker: ticker.trim().toUpperCase(),
        name: name.trim() || null,
        direction,
        quantity: qty,
        price: px,
        currency,
        fee: parseOptionalNumber(fee),
        reason: reason.trim(),
        emotion_tag: emotion,
        target_price: parseOptionalNumber(target),
        stop_loss: parseOptionalNumber(stop),
        checklist_passed: checklist,
        outcome: finalOutcome,
        traded_at: tradedAt.toISOString(),
      });
    } finally {
      setSaving(false);
    }
  };

  const openAndroidPicker = () => {
    DateTimePickerAndroid.open({
      value: tradedAt,
      mode: 'date',
      onChange: (_, date) => date && setTradedAt(date),
    });
  };

  return (
    <View style={{ gap: space.lg }}>
      <Card style={styles.group}>
        <Segmented options={directionOptions} value={direction} onChange={setDirection} />
        <View style={styles.row}>
          <TextField
            label="Ticker"
            required
            placeholder="AAPL"
            value={ticker}
            onChangeText={setTicker}
            autoCapitalize="characters"
            autoCorrect={false}
            containerStyle={styles.col}
          />
          <TextField
            label="Name"
            placeholder="Apple Inc."
            value={name}
            onChangeText={setName}
            containerStyle={styles.col}
          />
        </View>
        <View style={styles.row}>
          <TextField
            label="Quantity"
            required
            placeholder="10"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="decimal-pad"
            containerStyle={styles.col}
          />
          <TextField
            label="Price"
            required
            placeholder="150"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            containerStyle={styles.col}
          />
        </View>
        <View style={styles.row}>
          <TextField
            label="Currency"
            placeholder="USD"
            value={currency}
            onChangeText={setCurrency}
            autoCapitalize="characters"
            containerStyle={styles.col}
          />
          <TextField
            label="Fee (Optional)"
            placeholder="0"
            value={fee}
            onChangeText={setFee}
            keyboardType="decimal-pad"
            containerStyle={styles.col}
          />
        </View>
        <View style={styles.totalLine}>
          <Text style={type.caption}>Total amount</Text>
          <Text style={[styles.totalValue, type.number]}>{total !== null ? formatNumber(total) : '—'}</Text>
        </View>
        <View style={styles.dateLine}>
          <Text style={type.overline}>Date & time</Text>
          {Platform.OS === 'ios' ? (
            <DateTimePicker
              value={tradedAt}
              mode="datetime"
              display="compact"
              accentColor={palette.ink}
              onChange={(_, date) => date && setTradedAt(date)}
            />
          ) : (
            <Pressable onPress={openAndroidPicker} style={styles.androidDate}>
              <Text style={type.body}>{formatDateTime(tradedAt.toISOString())}</Text>
            </Pressable>
          )}
        </View>
      </Card>

      <Card style={styles.group}>
        <View>
          <FieldLabel>How did you feel?</FieldLabel>
          <ChipPicker options={emotionOptions} value={emotion} onChange={setEmotion} />
        </View>
        <TextField
          label="Reason"
          required
          placeholder="Why are you making this trade?"
          value={reason}
          onChangeText={setReason}
          multiline
        />
      </Card>

      <Card style={styles.group}>
        <View style={styles.row}>
          <TextField
            label="Target"
            placeholder="Optional"
            value={target}
            onChangeText={setTarget}
            keyboardType="decimal-pad"
            containerStyle={styles.col}
          />
          <TextField
            label="Stop loss"
            placeholder="Optional"
            value={stop}
            onChangeText={setStop}
            keyboardType="decimal-pad"
            containerStyle={styles.col}
          />
        </View>
        {direction === 'sell' ? (
          <View>
            <FieldLabel>Outcome</FieldLabel>
            <Segmented options={outcomeOptions.filter(o => o.value !== 'holding')} value={outcome} onChange={setOutcome} />
          </View>
        ) : null}
        <SwitchRow
          title="Principle checklist confirmed"
          subtitle="I checked this trade against my principles"
          value={checklist}
          onValueChange={setChecklist}
        />
      </Card>

      <Button title={submitLabel} size="lg" loading={saving} onPress={submit} />
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: space.lg },
  row: { flexDirection: 'row', gap: space.md },
  col: { flex: 1 },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: palette.background,
    marginTop: -space.xs,
  },
  totalValue: { fontSize: 16, fontWeight: '600', color: palette.ink },
  dateLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  androidDate: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: palette.hairline,
  },
});
