import React from 'react';
import { Pressable, Text, ActivityIndicator, ViewProps } from 'react-native';
import { TradyColors } from '@/constants/theme';

interface PrimaryButtonProps extends ViewProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
}

export function PrimaryButton({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  ...props
}: PrimaryButtonProps) {
  const getColors = () => {
    if (disabled || loading) {
      return { bg: '#d1d5db', text: '#9ca3af' };
    }

    switch (variant) {
      case 'secondary':
        return { bg: '#f3f4f6', text: TradyColors.textPrimary };
      case 'danger':
        return { bg: TradyColors.sellRed, text: '#fff' };
      case 'primary':
      default:
        return { bg: TradyColors.accent, text: '#fff' };
    }
  };

  const { bg, text } = getColors();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        {
          backgroundColor: bg,
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 48,
        },
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={text} />
      ) : (
        <Text style={{ color: text, fontSize: 16, fontWeight: '600' }}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
