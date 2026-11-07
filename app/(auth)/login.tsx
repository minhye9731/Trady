import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { Button, Segmented, TextField } from '@/components/ui/controls';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { palette, radius, space, type } from '@/constants/theme';
import { api, errorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

type Mode = 'signin' | 'signup';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [mode, setMode] = useState<Mode>('signin');
  const [resetting, setResetting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    const res = await api.post('/auth/signin', { email: email.trim(), password });
    await setAuth(res.data.access_token, res.data.user_id);
  };

  const submit = async () => {
    if (!email.trim() || !password) return Alert.alert('Missing fields', 'Enter your email and password.');
    if (mode === 'signup' && !nickname.trim()) return Alert.alert('Missing nickname', 'Choose a nickname.');
    setLoading(true);
    try {
      if (mode === 'signup') {
        await api.post('/auth/signup', { email: email.trim(), password, nickname: nickname.trim() });
        try {
          await signIn();
        } catch {
          // Supabase may require email confirmation before the first sign-in.
          Alert.alert('Account created', 'Check your inbox to confirm your email, then sign in.');
          setMode('signin');
        }
      } else {
        await signIn();
      }
    } catch (e) {
      Alert.alert(mode === 'signup' ? 'Sign up failed' : 'Sign in failed', errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const sendReset = async () => {
    if (!email.trim()) return Alert.alert('Missing email', 'Enter the email for your account.');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email: email.trim() });
      Alert.alert('Email sent', 'Check your inbox for a link to reset your password.');
      setResetting(false);
    } catch (e) {
      Alert.alert('Could not send email', errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <View style={styles.logo}>
            <IconSymbol name="chart.line.uptrend.xyaxis" size={26} color={palette.ink} weight="bold" />
          </View>
          <Text style={styles.wordmark}>TRADY</Text>
          <Text style={styles.tagline}>Journal every trade.{'\n'}Let AI coach your habits.</Text>
        </View>

        <View style={styles.sheet}>
          {resetting ? (
            <>
              <View style={{ gap: 4 }}>
                <Text style={type.title}>Reset password</Text>
                <Text style={type.callout}>We’ll email you a link to set a new password.</Text>
              </View>
              <TextField
                label="Email"
                placeholder="your@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              <Button title="Send reset link" size="lg" loading={loading} onPress={sendReset} />
              <Button title="Back to sign in" variant="plain" onPress={() => setResetting(false)} />
            </>
          ) : (
            <>
              <Segmented
                options={[
                  { value: 'signin', label: 'Sign in' },
                  { value: 'signup', label: 'Create account' },
                ]}
                value={mode}
                onChange={setMode}
              />
              {mode === 'signup' ? (
                <TextField
                  label="Nickname"
                  placeholder="Your trader nickname"
                  value={nickname}
                  onChangeText={setNickname}
                  autoCorrect={false}
                />
              ) : null}
              <TextField
                label="Email"
                placeholder="your@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
              />
              <TextField
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureToggle
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                textContentType={mode === 'signup' ? 'newPassword' : 'password'}
                onSubmitEditing={submit}
                returnKeyType="go"
              />
              <Button
                title={mode === 'signup' ? 'Create account' : 'Sign in'}
                size="lg"
                loading={loading}
                onPress={submit}
              />
              {mode === 'signin' ? (
                <Pressable onPress={() => setResetting(true)} hitSlop={8} style={{ alignSelf: 'center' }}>
                  <Text style={styles.link}>Forgot password?</Text>
                </Pressable>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.ink },
  scroll: { flexGrow: 1, paddingHorizontal: space.lg, justifyContent: 'space-between', gap: 40 },
  brand: { alignItems: 'flex-start', paddingHorizontal: space.sm, gap: space.md },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: palette.onInk,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: { fontSize: 15, fontWeight: '700', letterSpacing: 3, color: '#8C97AE', marginTop: space.sm },
  tagline: { fontSize: 30, fontWeight: '700', lineHeight: 38, letterSpacing: -0.8, color: palette.onInk },
  sheet: {
    backgroundColor: palette.surface,
    borderRadius: radius.xl + 4,
    padding: space.xl,
    gap: space.lg,
  },
  link: { fontSize: 14, color: palette.muted, fontWeight: '500' },
});
