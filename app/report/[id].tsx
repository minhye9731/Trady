import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { Markdown } from '@/components/markdown';
import { Screen } from '@/components/ui/screen';
import { Card, Chip, ErrorBanner, LoadingState } from '@/components/ui/surface';
import { palette, space, type } from '@/constants/theme';
import { useApi } from '@/hooks/use-api';
import { formatDate, formatDateTime } from '@/lib/format';
import type { Report } from '@/types';

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // The API only lists reports, so pick this one out of the list.
  const { data, error, reload } = useApi<Report[]>('/reports/');
  const report = data?.find((r) => r.id === id);

  if (!report) {
    return (
      <Screen>
        {error ? <ErrorBanner message={error} onRetry={reload} /> : data ? <Text style={type.callout}>Report not found.</Text> : <LoadingState />}
      </Screen>
    );
  }

  return (
    <Screen contentStyle={{ paddingTop: 8 }}>
      <View style={styles.head}>
        <Chip label={report.type.toUpperCase()} tone={report.type === 'weekly' ? 'ink' : 'violet'} size="md" />
        <Text style={styles.period}>
          {formatDate(report.period_start)} – {formatDate(report.period_end, true)}
        </Text>
      </View>
      <Card style={{ paddingVertical: space.xl }}>
        <Markdown content={report.content} />
      </Card>
      <Text style={styles.footer}>
        Generated {formatDateTime(report.created_at)} · AI feedback can be wrong — use it as a coach, not advice.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  period: { fontSize: 14, color: palette.muted },
  footer: { ...type.caption, textAlign: 'center', lineHeight: 18 },
});
