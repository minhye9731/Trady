import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { Button, ChipPicker, FieldLabel, SwitchRow, TextField } from '@/components/ui/controls';
import { Screen } from '@/components/ui/screen';
import { Card, LoadingState } from '@/components/ui/surface';
import { palette, space, type } from '@/constants/theme';
import { api, errorMessage } from '@/lib/api';
import { categoryOptions } from '@/lib/labels';
import type { Principle, PrincipleCategory, PrincipleInput } from '@/types';

/** Create (no id) or edit (?id=) a principle. Presented as a modal. */
export default function PrincipleScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const editing = !!id;

  const [loaded, setLoaded] = useState(!editing);
  const [version, setVersion] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<PrincipleCategory>('entry');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .get<Principle>(`/principles/${id}`)
      .then(({ data }) => {
        setTitle(data.title);
        setContent(data.content ?? '');
        setCategory(data.category ?? 'entry');
        setActive(data.is_active);
        setVersion(data.version);
        setLoaded(true);
      })
      .catch((e) => {
        Alert.alert('Could not load', errorMessage(e));
        router.back();
      });
  }, [id, router]);

  const save = async () => {
    if (!title.trim()) return Alert.alert('Missing title', 'Give this principle a short title.');
    const body: PrincipleInput = { title: title.trim(), content: content.trim() || null, category, is_active: active };
    setSaving(true);
    try {
      if (editing) await api.put(`/principles/${id}`, body);
      else await api.post('/principles/', body);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      Alert.alert('Could not save', errorMessage(e));
      setSaving(false);
    }
  };

  const remove = () => {
    Alert.alert('Delete this principle?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/principles/${id}`);
            router.back();
          } catch (e) {
            Alert.alert('Delete failed', errorMessage(e));
          }
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: editing ? 'Edit Principle' : 'New Principle',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={10}>
              <Text style={styles.headerAction}>Cancel</Text>
            </Pressable>
          ),
        }}
      />
      <Screen contentStyle={{ paddingTop: 8 }}>
        {!loaded ? (
          <LoadingState />
        ) : (
          <>
            <Card style={{ gap: space.lg }}>
              <View>
                <FieldLabel>Category</FieldLabel>
                <ChipPicker options={categoryOptions} value={category} onChange={setCategory} />
              </View>
              <TextField
                label="Title"
                required
                placeholder="e.g. Never chase a breakout"
                value={title}
                onChangeText={setTitle}
              />
              <TextField
                label="Detail"
                placeholder="Describe this principle in detail..."
                value={content}
                onChangeText={setContent}
                multiline
              />
            </Card>
            <Card>
              <SwitchRow
                title="Active"
                subtitle="Inactive principles are ignored by the AI report"
                value={active}
                onValueChange={setActive}
              />
            </Card>
            {version ? (
              <Text style={[type.caption, { textAlign: 'center' }]}>
                Version {version} · saving creates version {version + 1}
              </Text>
            ) : null}
            <Button title={editing ? 'Save changes' : 'Add principle'} size="lg" loading={saving} onPress={save} />
            {editing ? <Button title="Delete principle" variant="destructive" icon="trash" onPress={remove} /> : null}
          </>
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  headerAction: { fontSize: 17, color: palette.ink },
});
