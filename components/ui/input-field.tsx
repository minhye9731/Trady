import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, Pressable } from 'react-native';
import { TradyColors } from '@/constants/theme';
import { IconSymbol } from './icon-symbol';

interface InputFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  showPasswordToggle?: boolean;
}

export function InputField({
  label,
  error,
  showPasswordToggle,
  secureTextEntry,
  ...props
}: InputFieldProps) {
  const [showPassword, setShowPassword] = useState(!secureTextEntry);

  return (
    <View style={{ marginBottom: 16 }}>
      {label && (
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: TradyColors.textPrimary,
            marginBottom: 8,
          }}
        >
          {label}
        </Text>
      )}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#f8f9fa',
          borderColor: error ? TradyColors.sellRed : TradyColors.border,
          borderWidth: 1,
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
      >
        <TextInput
          {...props}
          secureTextEntry={showPasswordToggle ? !showPassword : secureTextEntry}
          style={{
            flex: 1,
            fontSize: 16,
            color: TradyColors.textPrimary,
          }}
          placeholderTextColor={TradyColors.textSecondary}
        />

        {showPasswordToggle && secureTextEntry && (
          <Pressable onPress={() => setShowPassword(!showPassword)}>
            <IconSymbol
              name={showPassword ? 'eye' : 'eye.slash'}
              size={20}
              color={TradyColors.textSecondary}
            />
          </Pressable>
        )}
      </View>

      {error && (
        <Text style={{ fontSize: 12, color: TradyColors.sellRed, marginTop: 4 }}>
          {error}
        </Text>
      )}
    </View>
  );
}
