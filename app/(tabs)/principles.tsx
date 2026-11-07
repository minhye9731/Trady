import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { PrincipleCard } from '@/components/principle-card';
import { Button, IconButton } from '@/components/ui/controls';
import { Screen } from '@/components/ui/screen';
import { EmptyState, ErrorBanner, LoadingState } from '@/components/ui/surface';
import { palette, space } from '@/constants/theme';
import { useApi } from '@/hooks/use-api';
import { api, errorMessage } from '@/lib/api';
import type { Principle } from '@/types';

export default function PrinciplesScreen() {
  const router = useRouter();
  const { data, setData, error, loading, refreshing, refresh } = useApi<Principle[]>('/principles/');

  const toggle = async (p: Principle, is_active: boolean) => {
    setData((list) => list?.map((x) => (x.id === p.id ? { ...x, is_active } : x)) ?? null);
    try {
      const res = await api.put<Principle>(`/principles/${p.id}`, {
        title: p.title,
        content: p.content,
        category: p.category,
        is_active,
      });
      setData((list) => list?.map((x) => (x.id === p.id ? res.data : x)) ?? null);
    } catch (e) {
      setData((list) => list?.map((x) => (x.id === p.id ? p : x)) ?? null);
      Alert.alert('Could not update', errorMessage(e));
    }
  };

  const activeCount = data?.filter((p) => p.is_active).length ?? 0;
  const openNew = () => router.push('/principle');

  return (
    <Screen
      title="Principles"
      subtitle="Your personal investment rules"
      refreshing={refreshing}
      onRefresh={refresh}
      right={<IconButton icon="plus" variant="primary" accessibilityLabel="New principle" onPress={openNew} />}>
      {error ? <ErrorBanner message={error} onRetry={refresh} /> : null}

      {data?.length ? (
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            <Text style={styles.summaryStrong}>{activeCount}</Text> active · {data.length - activeCount} paused
          </Text>
          <Text style={styles.summaryNote}>Active rules are used by the AI report</Text>
        </View>
      ) : null}

      {loading ? (
        <LoadingState />
      ) : !data?.length ? (
        <EmptyState
          icon="book.closed.fill"
          title="No principles yet"
          message="Define the rules you trade by. The AI report checks every trade against them.">
          <Button title="Add a principle" icon="plus" onPress={openNew} />
        </EmptyState>
      ) : (
        <View style={{ gap: space.md }}>
          {data.map((p) => (
            <PrincipleCard
              key={p.id}
              principle={p}
              onPress={() => router.push({ pathname: '/principle', params: { id: p.id } })}
              onToggle={(v) => toggle(p, v)}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: -space.xs },
  summaryText: { fontSize: 14, color: palette.muted },
  summaryStrong: { fontWeight: '700', color: palette.ink },
  summaryNote: { fontSize: 12, color: palette.faint },
});
