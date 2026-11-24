import React from 'react';
import { View, Text } from 'react-native';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { TradyColors } from '@/constants/theme';
import type { MarketIndicator } from '@/types';

interface MarketSignalCardProps {
  indicator: MarketIndicator;
}

export function MarketSignalCard({ indicator }: MarketSignalCardProps) {
  const lastUpdate = new Date(indicator.timestamp);
  const timeAgo = Math.floor(
    (new Date().getTime() - lastUpdate.getTime()) / (1000 * 60)
  );

  return (
    <Card style={{ marginBottom: 12 }}>
      <View style={{ gap: 12 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: TradyColors.textPrimary,
                marginBottom: 4,
              }}
            >
              {indicator.name}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: TradyColors.textSecondary,
              }}
            >
              Updated {timeAgo} min ago
            </Text>
          </View>
          <Badge variant="signal" value={indicator.signal} />
        </View>

        <View
          style={{
            paddingVertical: 8,
            paddingHorizontal: 12,
            backgroundColor: '#f8f9fa',
            borderRadius: 8,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: TradyColors.accent,
            }}
          >
            {typeof indicator.value === 'number'
              ? indicator.value.toFixed(2)
              : indicator.value}
          </Text>
        </View>

        {indicator.description && (
          <Text
            style={{
              fontSize: 12,
              color: TradyColors.textSecondary,
              lineHeight: 16,
            }}
          >
            {indicator.description}
          </Text>
        )}
      </View>
    </Card>
  );
}
