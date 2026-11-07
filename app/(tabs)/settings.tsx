import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';

import { Button, TextField } from '@/components/ui/controls';
import { Screen } from '@/components/ui/screen';
import { Card, Chip, ErrorBanner, LoadingState } from '@/components/ui/surface';
import { palette, space, type } from '@/constants/theme';
import { useApi } from '@/hooks/use-api';
import { api, errorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { Me } from '@/types';

export default function SettingsScreen() {
  const logout = useAuthStore((s) => s.logout);
  const { data: me, setData, error, loading, refresh } = useApi<Me>('/auth/me');

  const [nickname, setNickname] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (me) setNickname(me.nickname);
  }, [me]);

  const saveNickname = async () => {
    if (!me || !nickname.trim()) return;
    setSavingName(true);
    try {
      await api.put('/auth/me', { nickname: nickname.trim() });
      setData({ ...me, nickname: nickname.trim() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert('Could not update', errorMessage(e));
    } finally {
      setSavingName(false);
    }
  };

  const changePassword = async () => {
    if (newPassword.length < 6) return Alert.alert('Too short', 'Password must be at least 6 characters.');
    if (newPassword !== confirmPassword) return Alert.alert('Mismatch', 'Passwords do not match.');
    setSavingPassword(true);
    try {
      await api.post('/auth/change-password', { new_password: newPassword });
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Password changed', 'Your password was updated successfully.');
    } catch (e) {
      Alert.alert('Could not change password', errorMessage(e));
    } finally {
      setSavingPassword(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert('Sign out?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const initial = (me?.nickname || me?.email || '?').charAt(0).toUpperCase();

  return (
    <Screen title="Settings" subtitle="Manage your account">
      {error ? <ErrorBanner message={error} onRetry={refresh} /> : null}

      {loading ? (
        <LoadingState />
      ) : me ? (
        <>
          <Card style={styles.profile}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={type.headline}>{me.nickname || 'Trader'}</Text>
              <Text style={type.callout} numberOfLines={1}>
                {me.email}
              </Text>
            </View>
            <Chip label={me.plan.toUpperCase()} tone={me.plan === 'free' ? 'neutral' : 'violet'} size="md" />
          </Card>

          <Card style={{ gap: space.md }}>
            <Text style={type.headline}>Display name</Text>
            <TextField placeholder="Nickname" value={nickname} onChangeText={setNickname} autoCorrect={false} />
            <Button
              title="Save"
              variant="tinted"
              loading={savingName}
              disabled={!nickname.trim() || nickname.trim() === me.nickname}
              onPress={saveNickname}
            />
          </Card>

          <Card style={{ gap: space.md }}>
            <Text style={type.headline}>Change password</Text>
            <TextField
              label="New password"
              placeholder="••••••••"
              value={newPassword}
              onChangeText={setNewPassword}
              secureToggle
              autoComplete="new-password"
              textContentType="newPassword"
            />
            <TextField
              label="Confirm password"
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureToggle
              textContentType="newPassword"
            />
            <Button
              title="Update password"
              variant="tinted"
              loading={savingPassword}
              disabled={!newPassword || !confirmPassword}
              onPress={changePassword}
            />
          </Card>
        </>
      ) : null}

      <Button title="Sign out" variant="destructive" icon="rectangle.portrait.and.arrow.right" onPress={confirmLogout} />
      <Text style={styles.version}>Trady {Constants.expoConfig?.version ?? ''}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: palette.onInk },
  version: { ...type.caption, textAlign: 'center' },
});
