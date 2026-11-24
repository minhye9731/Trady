import React from 'react';
import { View, ViewProps } from 'react-native';
import { TradyColors } from '@/constants/theme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export function Card({ children, style, ...props }: CardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: TradyColors.card,
          borderColor: TradyColors.border,
          borderWidth: 0.5,
          borderRadius: 12,
          padding: 16,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
