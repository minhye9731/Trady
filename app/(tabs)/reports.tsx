import { Fragment, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { Markdown } from '@/components/markdown';
import { Button } from '@/components/ui/controls';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Screen } from '@/components/ui/screen';
import { Card, Chip, Divider, EmptyState, ErrorBanner, LoadingState, SectionHeader } from '@/components/ui/surface';
import { palette, radius, space, type } from '@/constants/theme';
import { useApi } from '@/hooks/use-api';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { Report, ReportType } from '@/types';

export default function ReportsScreen() {
  const router = useRouter();
  const { data, error, loading, refreshing, refresh, reload } = useApi<Report[]>('/reports/');
  const [generating, setGenerating] = useState<ReportType | null>(null);

  const generate = async (kind: ReportType) => {
    setGenerating(kind);
    try {
      // GPT-4o can take 20–40s; allow well beyond the default timeout.
      const res = await api.post<{ id: string }>('/reports/generate', { type: kind }, { timeout: 120000 });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await reload();
      router.push(`/report/${res.data.id}`);
    } catch (e) {
      Alert.alert('Report failed', errorMessage(e, 'Could not generate the report. Please try again.'));
    } finally {
      setGenerating(null);
    }
  };

  const latest = data?.[0];

  return (
    <Screen title="AI Report" subtitle="Coaching on your trading habits" refreshing={refreshing} onRefresh={refresh}>
      {error ? <ErrorBanner message={error} onRetry={refresh} /> : null}

      <View style={styles.generator}>
        <View style={styles.generatorHead}>
          <View style={styles.sparkle}>
            <IconSymbol name="wand.and.stars" size={18} color={palette.onInk} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.generatorTitle}>Generate a report</Text>
            <Text style={styles.generatorText}>
              GPT-4o reviews your trades against your active principles and emotion tags.
            </Text>
          </View>
        </View>
        {generating ? (
          <View style={styles.progress}>
            <ActivityIndicator color={palette.onInk} />
            <Text style={styles.progressText}>Analyzing your {generating} trades… this takes ~30 seconds</Text>
          </View>
        ) : (
          <View style={styles.generatorButtons}>
            <Pressable style={[styles.genButton, styles.genButtonPrimary]} onPress={() => generate('weekly')}>
              <Text style={[styles.genButtonText, { color: palette.ink }]}>Weekly</Text>
              <Text style={[styles.genButtonSub, { color: palette.muted }]}>Last 7 days</Text>
            </Pressable>
            <Pressable style={styles.genButton} onPress={() => generate('monthly')}>
              <Text style={styles.genButtonText}>Monthly</Text>
              <Text style={styles.genButtonSub}>Last 30 days</Text>
            </Pressable>
          </View>
        )}
      </View>

      {loading ? (
        <LoadingState />
      ) : !latest ? (
        <EmptyState
          icon="doc.text.fill"
          title="No reports yet"
          message="Add some trades, then generate your first weekly report."
        />
      ) : (
        <>
          <SectionHeader title="Latest" />
          <Card onPress={() => router.push(`/report/${latest.id}`)} style={{ gap: space.md }}>
            <ReportMeta report={latest} />
            <View style={styles.preview}>
              <Markdown content={latest.content.split('\n').slice(0, 12).join('\n')} />
              <View style={styles.fade} />
            </View>
            <Button title="Read full report" variant="tinted" size="sm" onPress={() => router.push(`/report/${latest.id}`)} />
          </Card>

          {data.length > 1 ? (
            <>
              <SectionHeader title="History" />
              <Card padded={false} style={{ overflow: 'hidden' }}>
                {data.slice(1).map((r, i) => (
                  <Fragment key={r.id}>
                    {i > 0 ? <Divider inset={space.lg} /> : null}
                    <Pressable
                      onPress={() => router.push(`/report/${r.id}`)}
                      style={({ pressed }) => [styles.historyRow, pressed && { backgroundColor: palette.surfaceMuted }]}>
                      <ReportMeta report={r} />
                      <IconSymbol name="chevron.right" size={13} color={palette.faint} weight="semibold" />
                    </Pressable>
                  </Fragment>
                ))}
              </Card>
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}

function ReportMeta({ report }: { report: Report }) {
  return (
    <View style={styles.meta}>
      <Chip label={report.type.toUpperCase()} tone={report.type === 'weekly' ? 'ink' : 'violet'} />
      <Text style={styles.period}>
        {formatDate(report.period_start)} – {formatDate(report.period_end, true)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  generator: { backgroundColor: palette.ink, borderRadius: radius.xl, padding: space.xl, gap: space.lg },
  generatorHead: { flexDirection: 'row', gap: space.md },
  sparkle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generatorTitle: { fontSize: 17, fontWeight: '600', color: palette.onInk },
  generatorText: { fontSize: 13, lineHeight: 19, color: '#9AA5BB', marginTop: 3 },
  generatorButtons: { flexDirection: 'row', gap: space.md },
  genButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  genButtonPrimary: { backgroundColor: palette.surface },
  genButtonText: { fontSize: 15, fontWeight: '600', color: palette.onInk },
  genButtonSub: { fontSize: 12, color: '#9AA5BB', marginTop: 2 },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  progressText: { flex: 1, fontSize: 13, color: '#C8D0DE' },
  meta: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm },
  period: { ...type.caption, fontSize: 13 },
  preview: { maxHeight: 220, overflow: 'hidden' },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 48,
    backgroundColor: palette.surface,
    opacity: 0.85,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: 16,
  },
});
