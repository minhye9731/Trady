import React from 'react';
import { Text, ViewProps } from 'react-native';
import { Card } from './card';
import { TradyColors } from '@/constants/theme';

interface StatCardProps extends ViewProps {
  label: string;
  value: string | number;
  color?: string;
  unit?: string;
}

export function StatCard({ label, value, color = TradyColors.accent, unit, style, ...props }: StatCardProps) {
  return (
    <Card style={[{ flex: 1 }, style]} {...props}>
      <Text style={{ fontSize: 12, color: TradyColors.textSecondary, textTransform: 'uppercase', fontWeight: '500', marginBottom: 4 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 28, fontWeight: '700', color, marginBottom: 4 }}>
        {value}{unit}
      </Text>
    </Card>
  );
}
