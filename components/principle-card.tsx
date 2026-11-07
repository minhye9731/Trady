import { StyleSheet, Switch, Text, View } from 'react-native';
import { palette, space, type } from '@/constants/theme';
import { categoryMeta } from '@/lib/labels';
import type { Principle } from '@/types';
import { Card, Chip } from './ui/surface';

export function PrincipleCard({
  principle,
  onPress,
  onToggle,
}: {
  principle: Principle;
  onPress: () => void;
  onToggle: (value: boolean) => void;
}) {
  const category = categoryMeta(principle.category);
  const inactive = !principle.is_active;
  return (
    <Card onPress={onPress} style={inactive && styles.inactive}>
      <View style={styles.top}>
        <View style={styles.chips}>
          <Chip label={category.label} tone={inactive ? 'neutral' : category.tone} />
          <Text style={styles.version}>v{principle.version}</Text>
        </View>
        <Switch
          value={principle.is_active}
          onValueChange={onToggle}
          trackColor={{ true: palette.positive }}
          style={styles.switch}
        />
      </View>
      <Text style={[type.headline, styles.title, inactive && { color: palette.muted }]}>{principle.title}</Text>
      {principle.content ? (
        <Text style={[type.callout, inactive && { color: palette.faint }]} numberOfLines={4}>
          {principle.content}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  inactive: { backgroundColor: palette.surfaceMuted },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chips: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  version: { fontSize: 11, fontWeight: '600', color: palette.faint },
  switch: { transform: [{ scale: 0.8 }], marginRight: -6 },
  title: { marginTop: space.sm, marginBottom: 4 },
});
