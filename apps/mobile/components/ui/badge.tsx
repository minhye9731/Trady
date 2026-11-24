import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { TradyColors } from '@/constants/theme';
import type { TradeDirection, PrincipleCategory, ReportType, SignalType } from '@/types';

interface BadgeProps extends ViewProps {
  variant: 'direction' | 'category' | 'report' | 'signal';
  value: TradeDirection | PrincipleCategory | ReportType | SignalType;
}

const getColors = (variant: string, value: string) => {
  if (variant === 'direction') {
    return value === 'buy'
      ? { bg: `${TradyColors.buyGreen}20`, text: TradyColors.buyGreen }
      : { bg: `${TradyColors.sellRed}20`, text: TradyColors.sellRed };
  }

  if (variant === 'category') {
    const categoryColors: Record<string, { bg: string; text: string }> = {
      entry: { bg: '#3b82f620', text: '#3b82f6' },
      takeprofit: { bg: '#10b98120', text: '#10b981' },
      stoploss: { bg: '#ef444420', text: '#ef4444' },
      position: { bg: '#f59e0b20', text: '#f59e0b' },
      psychology: { bg: '#8b5cf620', text: '#8b5cf6' },
    };
    return categoryColors[value] || { bg: '#f0f2f5', text: TradyColors.textSecondary };
  }

  if (variant === 'report') {
    return value === 'weekly'
      ? { bg: '#3b82f620', text: '#3b82f6' }
      : { bg: '#8b5cf620', text: '#8b5cf6' };
  }

  if (variant === 'signal') {
    const signalColors: Record<string, { bg: string; text: string }> = {
      strong_buy: { bg: '#10b98120', text: '#10b981' },
      buy: { bg: '#2d7a4f20', text: '#2d7a4f' },
      hold: { bg: '#f59e0b20', text: '#f59e0b' },
      sell: { bg: '#ef444420', text: '#ef4444' },
      strong_sell: { bg: '#c9444420', text: '#c94444' },
    };
    return signalColors[value] || { bg: '#f0f2f5', text: TradyColors.textSecondary };
  }

  return { bg: '#f0f2f5', text: TradyColors.textSecondary };
};

const getLabel = (variant: string, value: string) => {
  if (variant === 'direction') {
    return value === 'buy' ? 'BUY' : 'SELL';
  }
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ');
};

export function Badge({ variant, value, style, ...props }: BadgeProps) {
  const { bg, text } = getColors(variant, value);
  const label = getLabel(variant, value);

  return (
    <View
      style={[
        {
          backgroundColor: bg,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 6,
          alignSelf: 'flex-start',
        },
        style,
      ]}
      {...props}
    >
      <Text style={{ color: text, fontSize: 12, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}
