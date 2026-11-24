import { forwardRef, ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { palette, radius, space, toneColors, type, type Tone } from '@/constants/theme';
import { IconSymbol, type IconSymbolName } from './icon-symbol';

function tap() {
  if (process.env.EXPO_OS === 'ios') Haptics.selectionAsync();
}

/* ─── Button ─────────────────────────────────────────── */

type ButtonVariant = 'primary' | 'secondary' | 'tinted' | 'destructive' | 'plain';

const buttonColors: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: palette.ink, fg: palette.onInk },
  secondary: { bg: palette.surface, fg: palette.ink, border: palette.border },
  tinted: { bg: palette.hairline, fg: palette.ink },
  destructive: { bg: palette.negativeBg, fg: palette.negative },
  plain: { bg: 'transparent', fg: palette.info },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  icon?: IconSymbolName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const c = buttonColors[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress?.();
      }}
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        styles[`button_${size}`],
        { backgroundColor: c.bg },
        c.border && { borderWidth: StyleSheet.hairlineWidth, borderColor: c.border },
        pressed && { opacity: 0.8 },
        inactive && { opacity: 0.5 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={c.fg} size="small" />
      ) : (
        <>
          {icon ? <IconSymbol name={icon} size={size === 'sm' ? 14 : 16} color={c.fg} weight="semibold" /> : null}
          <Text style={[styles.buttonText, size === 'sm' && { fontSize: 13 }, { color: c.fg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  variant = 'secondary',
  accessibilityLabel,
  disabled,
}: {
  icon: IconSymbolName;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  accessibilityLabel: string;
  disabled?: boolean;
}) {
  const c = buttonColors[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={() => {
        tap();
        onPress();
      }}
      hitSlop={6}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: c.bg },
        c.border && { borderWidth: StyleSheet.hairlineWidth, borderColor: c.border },
        pressed && { opacity: 0.75 },
        disabled && { opacity: 0.5 },
      ]}>
      <IconSymbol name={icon} size={17} color={c.fg} weight="semibold" />
    </Pressable>
  );
}

/* ─── Text field ─────────────────────────────────────── */

type FieldProps = TextInputProps & {
  label?: string;
  required?: boolean;
  hint?: string;
  secureToggle?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
};

export const TextField = forwardRef<TextInput, FieldProps>(function TextField(
  {
    label,
    required,
    hint,
    secureToggle,
    containerStyle,
    multiline,
    style,
    secureTextEntry,
    onFocus,
    onBlur,
    ...rest
  },
  ref
) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  return (
    <View style={containerStyle}>
      {label ? (
        <Text style={[type.overline, styles.label]}>
          {label}
          {required ? <Text style={{ color: palette.negative }}> *</Text> : null}
        </Text>
      ) : null}
      <View style={[styles.field, focused && styles.fieldFocused, multiline && styles.fieldMultiline]}>
        <TextInput
          ref={ref}
          placeholderTextColor={palette.faint}
          selectionColor={palette.ink}
          {...rest}
          multiline={multiline}
          secureTextEntry={secureToggle ? hidden : secureTextEntry}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, multiline && styles.inputMultiline, style]}
        />
        {secureToggle ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10} accessibilityLabel="Toggle password visibility">
            <IconSymbol name={hidden ? 'eye' : 'eye.slash'} size={18} color={palette.muted} />
          </Pressable>
        ) : null}
      </View>
      {hint ? <Text style={[type.caption, { marginTop: 6 }]}>{hint}</Text> : null}
    </View>
  );
});

/* ─── Segmented control ──────────────────────────────── */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; tone?: Tone }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((o) => {
        const active = o.value === value;
        const fg = active && o.tone && o.tone !== 'neutral' ? toneColors[o.tone].fg : palette.ink;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (!active) tap();
              onChange(o.value);
            }}
            style={[styles.segment, active && styles.segmentActive]}>
            <Text style={[styles.segmentText, { color: active ? fg : palette.muted }, active && { fontWeight: '600' }]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ─── Chip picker ────────────────────────────────────── */

export function ChipPicker<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; tone: Tone }[];
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.chips}>
      {options.map((o) => {
        const active = o.value === value;
        const c = toneColors[o.tone];
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => {
              tap();
              onChange(o.value);
            }}
            style={[
              styles.pickChip,
              active
                ? { backgroundColor: c.bg, borderColor: c.fg }
                : { backgroundColor: palette.surface, borderColor: palette.border },
            ]}>
            <Text style={[styles.pickChipText, { color: active ? c.fg : palette.inkSoft }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ─── Switch row ─────────────────────────────────────── */

export function SwitchRow({
  title,
  subtitle,
  value,
  onValueChange,
  icon,
}: {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  icon?: ReactNode;
}) {
  return (
    <View style={styles.switchRow}>
      {icon}
      <View style={{ flex: 1 }}>
        <Text style={type.body}>{title}</Text>
        {subtitle ? <Text style={type.caption}>{subtitle}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: palette.positive }} />
    </View>
  );
}

/* ─── Field label ────────────────────────────────────── */

export function FieldLabel({ children }: { children: string }) {
  return <Text style={[type.overline, styles.label]}>{children}</Text>;
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.md,
  },
  button_sm: { height: 34, paddingHorizontal: 12, borderRadius: radius.sm + 2 },
  button_md: { height: 46, paddingHorizontal: 18 },
  button_lg: { height: 52, paddingHorizontal: 20 },
  buttonText: { fontSize: 15, fontWeight: '600', letterSpacing: -0.1 },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { marginBottom: 7 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: palette.surfaceMuted,
    borderWidth: 1,
    borderColor: palette.border,
  },
  fieldFocused: { borderColor: palette.ink, backgroundColor: palette.surface },
  fieldMultiline: { alignItems: 'flex-start', paddingVertical: 12 },
  input: { flex: 1, fontSize: 16, color: palette.ink, paddingVertical: 12 },
  inputMultiline: { minHeight: 96, paddingVertical: 0, textAlignVertical: 'top', lineHeight: 22 },
  segmented: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: radius.md,
    backgroundColor: palette.hairline,
  },
  segment: {
    flex: 1,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm + 1,
  },
  segmentActive: {
    backgroundColor: palette.surface,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  segmentText: { fontSize: 14, fontWeight: '500' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  pickChip: {
    paddingHorizontal: 13,
    height: 34,
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  pickChipText: { fontSize: 14, fontWeight: '500' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 4 },
});
