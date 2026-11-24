import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Card } from './ui/card';
import { InputField } from './ui/input-field';
import { SelectField } from './ui/select-field';
import { PrimaryButton } from './ui/primary-button';
import { IconSymbol } from './ui/icon-symbol';
import { TradyColors } from '@/constants/theme';
import type { Trade, TradeFormData, TradeDirection, EmotionTag } from '@/types';

interface TradeFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: TradeFormData) => Promise<void>;
  initialData?: Trade;
  loading?: boolean;
}

const directionOptions = [
  { label: 'Buy', value: 'buy' },
  { label: 'Sell', value: 'sell' },
];

const emotionOptions = [
  { label: 'Confident', value: 'confident' },
  { label: 'Anxious', value: 'anxious' },
  { label: 'FOMO', value: 'fomo' },
  { label: 'Analysis', value: 'analysis' },
  { label: 'Recommended', value: 'recommended' },
];

export function TradeFormModal({
  visible,
  onClose,
  onSubmit,
  initialData,
  loading = false,
}: TradeFormModalProps) {
  const [formData, setFormData] = useState<Partial<TradeFormData>>({
    direction: 'buy',
    emotion_tag: 'analysis',
    checklist_passed: false,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        ticker: initialData.ticker,
        name: initialData.name,
        direction: initialData.direction,
        quantity: initialData.quantity.toString(),
        price: initialData.price.toString(),
        reason: initialData.reason,
        emotion_tag: initialData.emotion_tag,
        target_price: initialData.target_price?.toString(),
        stop_loss: initialData.stop_loss?.toString(),
        checklist_passed: initialData.checklist_passed,
        outcome: initialData.outcome,
        traded_at: initialData.traded_at,
      });
    } else {
      setFormData({
        direction: 'buy',
        emotion_tag: 'analysis',
        checklist_passed: false,
        traded_at: new Date().toISOString(),
      });
    }
  }, [initialData, visible]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.ticker?.trim()) newErrors.ticker = 'Ticker is required';
    if (!formData.name?.trim()) newErrors.name = 'Name is required';
    if (!formData.quantity || parseFloat(formData.quantity as string) <= 0)
      newErrors.quantity = 'Quantity must be greater than 0';
    if (!formData.price || parseFloat(formData.price as string) <= 0)
      newErrors.price = 'Price must be greater than 0';
    if (!formData.reason?.trim()) newErrors.reason = 'Reason is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const submitData: TradeFormData = {
      ticker: formData.ticker!,
      name: formData.name!,
      direction: formData.direction as TradeDirection,
      quantity: parseFloat(formData.quantity!),
      price: parseFloat(formData.price!),
      reason: formData.reason!,
      emotion_tag: formData.emotion_tag as EmotionTag,
      target_price: formData.target_price ? parseFloat(formData.target_price) : undefined,
      stop_loss: formData.stop_loss ? parseFloat(formData.stop_loss) : undefined,
      checklist_passed: formData.checklist_passed || false,
      outcome: formData.outcome,
      traded_at: formData.traded_at || new Date().toISOString(),
    };

    try {
      await onSubmit(submitData);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save trade');
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setFormData((prev) => ({
        ...prev,
        traded_at: selectedDate.toISOString(),
      }));
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View
          style={{
            backgroundColor: TradyColors.background,
            paddingTop: 16,
            paddingHorizontal: 16,
            paddingBottom: 16,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: TradyColors.textPrimary,
            }}
          >
            {initialData ? 'Edit Trade' : 'New Trade'}
          </Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <IconSymbol name="xmark" size={24} color={TradyColors.textPrimary} />
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1, paddingHorizontal: 16 }}
          contentContainerStyle={{ paddingBottom: 16 }}
        >
          <Card style={{ marginBottom: 16 }}>
            <InputField
              label="Ticker"
              placeholder="e.g., AAPL"
              value={formData.ticker || ''}
              onChangeText={(value) =>
                setFormData((prev) => ({ ...prev, ticker: value }))
              }
              error={errors.ticker}
            />

            <InputField
              label="Company Name"
              placeholder="e.g., Apple Inc."
              value={formData.name || ''}
              onChangeText={(value) =>
                setFormData((prev) => ({ ...prev, name: value }))
              }
              error={errors.name}
            />

            <SelectField
              label="Direction"
              value={formData.direction || 'buy'}
              options={directionOptions}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  direction: value as TradeDirection,
                }))
              }
            />

            <InputField
              label="Quantity"
              placeholder="100"
              value={formData.quantity || ''}
              onChangeText={(value) =>
                setFormData((prev) => ({ ...prev, quantity: value }))
              }
              keyboardType="decimal-pad"
              error={errors.quantity}
            />

            <InputField
              label="Price"
              placeholder="150.50"
              value={formData.price || ''}
              onChangeText={(value) =>
                setFormData((prev) => ({ ...prev, price: value }))
              }
              keyboardType="decimal-pad"
              error={errors.price}
            />

            <InputField
              label="Target Price (optional)"
              placeholder="160.00"
              value={formData.target_price || ''}
              onChangeText={(value) =>
                setFormData((prev) => ({ ...prev, target_price: value }))
              }
              keyboardType="decimal-pad"
            />

            <InputField
              label="Stop Loss (optional)"
              placeholder="140.00"
              value={formData.stop_loss || ''}
              onChangeText={(value) =>
                setFormData((prev) => ({ ...prev, stop_loss: value }))
              }
              keyboardType="decimal-pad"
            />
          </Card>

          <Card style={{ marginBottom: 16 }}>
            <SelectField
              label="Emotion Tag"
              value={formData.emotion_tag || 'analysis'}
              options={emotionOptions}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  emotion_tag: value as EmotionTag,
                }))
              }
            />

            <InputField
              label="Reason"
              placeholder="Why did you make this trade?"
              value={formData.reason || ''}
              onChangeText={(value) =>
                setFormData((prev) => ({ ...prev, reason: value }))
              }
              multiline
              numberOfLines={3}
              error={errors.reason}
            />

            <InputField
              label="Outcome (optional)"
              placeholder="Trade result"
              value={formData.outcome || ''}
              onChangeText={(value) =>
                setFormData((prev) => ({ ...prev, outcome: value }))
              }
              multiline
              numberOfLines={2}
            />

            <View style={{ marginBottom: 16 }}>
              <Pressable
                onPress={() => setShowDatePicker(true)}
                style={{
                  backgroundColor: '#f8f9fa',
                  borderColor: TradyColors.border,
                  borderWidth: 1,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: TradyColors.textPrimary,
                      marginBottom: 4,
                    }}
                  >
                    Traded At
                  </Text>
                  <Text style={{ fontSize: 16, color: TradyColors.textPrimary }}>
                    {new Date(formData.traded_at || new Date()).toLocaleDateString()}
                  </Text>
                </View>
                <IconSymbol name="calendar" size={20} color={TradyColors.textSecondary} />
              </Pressable>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={new Date(formData.traded_at || new Date())}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
              />
            )}

            <Pressable
              onPress={() =>
                setFormData((prev) => ({
                  ...prev,
                  checklist_passed: !prev.checklist_passed,
                }))
              }
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 8,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  borderColor: TradyColors.accent,
                  borderWidth: 2,
                  backgroundColor: formData.checklist_passed
                    ? TradyColors.accent
                    : 'transparent',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {formData.checklist_passed && (
                  <IconSymbol name="checkmark" size={16} color="#fff" />
                )}
              </View>
              <Text
                style={{
                  fontSize: 14,
                  color: TradyColors.textPrimary,
                  fontWeight: '500',
                }}
              >
                Checklist Passed
              </Text>
            </Pressable>
          </Card>

          <View style={{ gap: 8 }}>
            <PrimaryButton
              title={initialData ? 'Update Trade' : 'Create Trade'}
              onPress={handleSubmit}
              loading={loading}
            />
            <PrimaryButton
              title="Cancel"
              variant="secondary"
              onPress={onClose}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
