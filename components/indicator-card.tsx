import { StyleSheet, Text, View } from 'react-native';
import { palette, radius, space, toneColors, type } from '@/constants/theme';
import { formatDate } from '@/lib/format';
import { indicatorInfo, marketSignal } from '@/lib/labels';
import type { Indicator, IndicatorType } from '@/types';
import { IconSymbol } from './ui/icon-symbol';
import { Card, Chip } from './ui/surface';

export function IndicatorCard({ kind, indicator }: { kind: IndicatorType; indicator?: Indicator }) {
  const info = indicatorInfo[kind];

  if (!indicator) {
    return (
      <Card>
        <Text style={type.overline}>{info.short}</Text>
        <Text style={[type.headline, { marginTop: 4 }]}>{info.title}</Text>
        <Text style={[type.callout, { marginTop: space.sm }]}>No data yet — tap refresh to load.</Text>
      </Card>
    );
  }

  const signal = marketSignal(kind, indicator.value);
  const change = indicator.raw_json?.change ?? 0;
  const up = change > 0;
  // For all three indicators, a rising value means tighter / riskier conditions,
  // except the yield spread where rising is healthier.
  const changeIsGood = kind === 'yield_spread' ? up : !up;
  const changeColor = change === 0 ? palette.muted : changeIsGood ? palette.positive : palette.negative;

  return (
    <Card>
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text style={type.overline}>{info.short}</Text>
          <Text style={[type.headline, { marginTop: 2 }]}>{info.title}</Text>
        </View>
        <Chip label={signal.label} tone={signal.tone} size="md" icon="circle.fill" />
      </View>

      <View style={styles.valueLine}>
        <Text style={[styles.value, type.number]}>
          {indicator.value.toFixed(2)}
          <Text style={styles.unit}>%</Text>
        </Text>
        {change !== 0 ? (
          <View style={[styles.change, { backgroundColor: toneColors.neutral.bg }]}>
            <IconSymbol name={up ? 'arrow.up' : 'arrow.down'} size={11} color={changeColor} weight="bold" />
            <Text style={[styles.changeText, type.number, { color: changeColor }]}>
              {Math.abs(change).toFixed(2)}
            </Text>
          </View>
        ) : null}
      </View>

      <Text style={type.callout}>{info.description}</Text>
      {indicator.raw_json?.date ? (
        <Text style={[type.caption, { marginTop: space.sm }]}>As of {formatDate(indicator.raw_json.date, true)} · FRED</Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  valueLine: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.md, marginBottom: space.sm },
  value: { fontSize: 34, fontWeight: '700', color: palette.ink, letterSpacing: -1 },
  unit: { fontSize: 18, fontWeight: '600', color: palette.muted },
  change: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  changeText: { fontSize: 12, fontWeight: '600' },
});
