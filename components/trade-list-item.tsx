import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { IconSymbol } from './ui/icon-symbol';
import { TradyColors } from '@/constants/theme';
import type { Trade } from '@/types';

interface TradeListItemProps {
  trade: Trade;
  onPress: () => void;
  onDelete: () => void;
}

const emotionEmojis: Record<string, string> = {
  confident: '💪',
  anxious: '😰',
  fomo: '🚀',
  analysis: '📊',
  recommended: '👍',
};

export function TradeListItem({ trade, onPress, onDelete }: TradeListItemProps) {
  const date = new Date(trade.traded_at);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const amount = (trade.quantity * trade.price).toFixed(2);

  return (
    <Card
      style={{
        marginBottom: 12,
        paddingVertical: 12,
      }}
    >
      <Pressable onPress={onPress}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <Badge variant="direction" value={trade.direction} />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: TradyColors.textPrimary,
                }}
              >
                {trade.ticker}
              </Text>
            </View>

            <Text
              style={{
                fontSize: 12,
                color: TradyColors.textSecondary,
                marginBottom: 6,
              }}
            >
              {trade.name}
            </Text>

            <Text
              style={{
                fontSize: 14,
                fontWeight: '500',
                color: TradyColors.textPrimary,
                marginBottom: 4,
              }}
            >
              ${amount}
            </Text>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: TradyColors.textSecondary,
                }}
              >
                {formattedDate}
              </Text>
              <Text style={{ fontSize: 14 }}>
                {emotionEmojis[trade.emotion_tag] || '💭'}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={onDelete}
            hitSlop={8}
            style={{ padding: 8 }}
          >
            <IconSymbol name="trash" size={18} color={TradyColors.sellRed} />
          </Pressable>
        </View>
      </Pressable>
    </Card>
  );
}
