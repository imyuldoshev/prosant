import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../../../theme';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { formatPrice } from '../../../lib/format';

interface Props {
  visible: boolean;
  remainingAmount: number;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}

export const PaymentSheet: React.FC<Props> = ({ visible, remainingAmount, onClose, onConfirm }) => {
  const { colors, typography, radius, spacing } = useTheme();
  
  const [inputValue, setInputValue] = useState('');
  
  // Format with spaces as user types
  const handleAmountChange = (text: string) => {
    const rawNum = text.replace(/\D/g, '');
    if (rawNum === '') {
      setInputValue('');
      return;
    }
    const num = parseInt(rawNum, 10);
    // basic space formatting, e.g., 1 250 000
    setInputValue(num.toLocaleString('ru-RU').replace(/,/g, ' '));
  };

  const getAmount = () => {
    return parseInt(inputValue.replace(/\D/g, '') || '0', 10);
  };

  const amount = getAmount();
  const isValid = amount > 0 && amount <= remainingAmount;
  const errorText = amount > remainingAmount ? "Kiritilgan summa qarzdan ko'p!" : null;

  const handleConfirm = () => {
    if (isValid) {
      onConfirm(amount);
      setInputValue(''); // reset for next time
    }
  };

  const handleQuickAmount = (val: number) => {
    setInputValue(val.toLocaleString('ru-RU').replace(/,/g, ' '));
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={[styles.container, { backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl }]}>
            
            <View style={styles.handleContainer}>
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
            </View>

            <Text style={[styles.title, { color: colors.text, fontFamily: typography.fontFamily.bold, marginBottom: spacing.md }]}>
              To'lov qabul qilish
            </Text>

            <View style={[styles.remainingBox, { backgroundColor: colors.background, borderRadius: radius.md, marginBottom: spacing.lg }]}>
              <Text style={{ color: colors.muted, fontFamily: typography.fontFamily.medium, fontSize: 14 }}>
                Qolgan qarz summasi
              </Text>
              <Text style={{ color: colors.status.red, fontFamily: typography.fontFamily.bold, fontSize: 24, marginTop: 4 }}>
                {formatPrice(remainingAmount)}
              </Text>
            </View>

            <Input
              label="To'lov summasi"
              placeholder="0"
              value={inputValue}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
              error={errorText || undefined}
            />

            <View style={[styles.quickButtons, { marginBottom: spacing.lg }]}>
              <TouchableOpacity 
                style={[styles.quickBtn, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.sm }]}
                onPress={() => handleQuickAmount(Math.floor(remainingAmount / 2))}
              >
                <Text style={{ color: colors.text, fontFamily: typography.fontFamily.medium }}>Yarmi</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.quickBtn, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.sm }]}
                onPress={() => handleQuickAmount(remainingAmount)}
              >
                <Text style={{ color: colors.primary, fontFamily: typography.fontFamily.bold }}>Hammasini to'lash</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actions}>
              <Button title="Bekor qilish" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
              <View style={{ width: spacing.md }} />
              <Button title="Tasdiqlash" onPress={handleConfirm} disabled={!isValid} style={{ flex: 1 }} />
            </View>
            
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
  },
  handleContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  title: {
    fontSize: 20,
    textAlign: 'center',
  },
  remainingBox: {
    padding: 16,
    alignItems: 'center',
  },
  quickButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  quickBtn: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
  }
});
