import { Alert, Pressable, Text } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { TradeForm } from '@/components/trade-form';
import { Screen } from '@/components/ui/screen';
import { palette } from '@/constants/theme';
import { api, errorMessage } from '@/lib/api';
import type { TradeInput } from '@/types';

export default function NewTradeScreen() {
  const router = useRouter();

  const create = async (input: TradeInput) => {
    try {
      await api.post('/trades/', input);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      Alert.alert('Could not save', errorMessage(e));
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={10}>
              <Text style={{ fontSize: 17, color: palette.ink }}>Cancel</Text>
            </Pressable>
          ),
        }}
      />
      <Screen contentStyle={{ paddingTop: 8 }}>
        <TradeForm submitLabel="Save trade" onSubmit={create} />
      </Screen>
    </>
  );
}
