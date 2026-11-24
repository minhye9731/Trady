import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { IconSymbol } from './ui/icon-symbol';
import { TradyColors } from '@/constants/theme';
import type { Principle } from '@/types';

interface PrincipleListItemProps {
  principle: Principle;
  onEdit: () => void;
  onDelete: () => void;
}

export function PrincipleListItem({ principle, onEdit, onDelete }: PrincipleListItemProps) {
  return (
    <Card style={{ marginBottom: 12 }}>
      <View style={{ gap: 8 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 8,
          }}
        >
          <View style={{ flex: 1 }}>
            <Badge variant="category" value={principle.category} />
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable onPress={onEdit} hitSlop={8}>
              <IconSymbol name="pencil" size={18} color={TradyColors.accent} />
            </Pressable>
            <Pressable onPress={onDelete} hitSlop={8}>
              <IconSymbol name="trash" size={18} color={TradyColors.sellRed} />
            </Pressable>
          </View>
        </View>

        <View>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: TradyColors.textPrimary,
              marginBottom: 4,
            }}
          >
            {principle.title}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: TradyColors.textSecondary,
              lineHeight: 16,
            }}
          >
            {principle.description}
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginTop: 4,
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: principle.is_active ? TradyColors.buyGreen : '#d1d5db',
            }}
          />
          <Text
            style={{
              fontSize: 12,
              color: principle.is_active ? TradyColors.buyGreen : '#9ca3af',
              fontWeight: '500',
            }}
          >
            {principle.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
    </Card>
  );
}
