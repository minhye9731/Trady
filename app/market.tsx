import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';

import { IndicatorCard } from '@/components/indicator-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Screen } from '@/components/ui/screen';
import { ErrorBanner, LoadingState } from '@/components/ui/surface';
import { palette, radius, space } from '@/constants/theme';
import { useApi } from '@/hooks/use-api';
import { api, errorMessage } from '@/lib/api';
import { indicatorOrder } from '@/lib/labels';
import type { Indicator } from '@/types';

export default function MarketScreen() {
  const { data, error, loading, refreshing, refresh, reload } = useApi<Record<string, Indicator>>('/market/indicators');
  const [updating, setUpdating] = useState(false);

  // Pulls fresh values from FRED on the server, then reloads.
  const update = async () => {
    setUpdating(true);
    try {
      await api.post('/market/refresh', undefined, { timeout: 60000 });
      await reload();
    } catch (e) {
      Alert.alert('Update failed', errorMessage(e));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () =>
            updating ? (
              <ActivityIndicator color={palette.ink} />
            ) : (
              <Pressable onPress={update} hitSlop={10} accessibilityLabel="Update from FRED">
                <IconSymbol name="arrow.clockwise" size={20} color={palette.ink} weight="semibold" />
              </Pressable>
            ),
        }}
      />
      <Screen refreshing={refreshing} onRefresh={refresh} contentStyle={{ paddingTop: 8 }}>
        <Text style={styles.intro}>Key macro indicators for informed trading</Text>
        {error ? <ErrorBanner message={error} onRetry={refresh} /> : null}
        {loading ? (
          <LoadingState />
        ) : (
          indicatorOrder.map((kind) => <IndicatorCard key={kind} kind={kind} indicator={data?.[kind]} />)
        )}
        <View style={styles.tip}>
          <View style={styles.tipHead}>
            <IconSymbol name="lightbulb.fill" size={15} color="#F5C451" />
            <Text style={styles.tipTitle}>Trading tip</Text>
          </View>
          <Text style={styles.tipText}>
            Check these signals before entering a new position. When credit spreads are rising or the yield curve is
            inverted, consider reducing position size and tightening stop losses.
          </Text>
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: 14, color: palette.muted, marginBottom: -space.xs },
  tip: { backgroundColor: palette.ink, borderRadius: radius.lg, padding: space.lg, gap: space.sm },
  tipHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tipTitle: { fontSize: 12, fontWeight: '700', color: '#C8D0DE', letterSpacing: 0.6, textTransform: 'uppercase' },
  tipText: { fontSize: 14, lineHeight: 21, color: '#AEB8CA' },
});
