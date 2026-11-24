import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal } from 'react-native';
import { TradyColors } from '@/constants/theme';

interface SelectFieldProps {
  label?: string;
  value: string;
  options: { label: string; value: string }[];
  onValueChange: (value: string) => void;
  error?: string;
}

export function SelectField({ label, value, options, onValueChange, error }: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((opt) => opt.value === value)?.label || 'Select...';

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

      <Pressable
        onPress={() => setOpen(true)}
        style={{
          backgroundColor: '#f8f9fa',
          borderColor: error ? TradyColors.sellRed : TradyColors.border,
          borderWidth: 1,
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            color: value ? TradyColors.textPrimary : TradyColors.textSecondary,
          }}
        >
          {selectedLabel}
        </Text>
      </Pressable>

      {error && (
        <Text style={{ fontSize: 12, color: TradyColors.sellRed, marginTop: 4 }}>
          {error}
        </Text>
      )}

      <Modal visible={open} transparent animationType="fade">
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onPress={() => setOpen(false)}
        >
          <View
            style={{
              flex: 1,
              justifyContent: 'flex-end',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
            }}
          >
            <View
              style={{
                backgroundColor: TradyColors.card,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                maxHeight: '60%',
              }}
            >
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingTop: 16,
                  borderBottomColor: TradyColors.border,
                  borderBottomWidth: 1,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: TradyColors.textPrimary,
                  }}
                >
                  {label}
                </Text>
              </View>

              <ScrollView>
                {options.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      onValueChange(option.value);
                      setOpen(false);
                    }}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderBottomColor: TradyColors.border,
                      borderBottomWidth: 0.5,
                      backgroundColor:
                        value === option.value ? '#f0f2f5' : TradyColors.card,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        color:
                          value === option.value
                            ? TradyColors.accent
                            : TradyColors.textPrimary,
                        fontWeight: value === option.value ? '600' : '400',
                      }}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
