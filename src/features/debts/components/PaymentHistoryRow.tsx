import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme';
import { Payment } from '../../store/DebtsStore';
import { formatPrice } from '../../../lib/format';
import { formatUzDate } from '../../../lib/dates';

interface Props {
  payment: Payment;
  isLast: boolean;
}

export const PaymentHistoryRow: React.FC<Props> = ({ payment, isLast }) => {
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={[styles.container, { borderBottomColor: colors.border, borderBottomWidth: isLast ? 0 : 1, paddingVertical: spacing.sm }]}>
      <Text style={{ color: colors.text, fontFamily: typography.fontFamily.medium, fontSize: 14 }}>
        {formatUzDate(new Date(payment.sana))}
      </Text>
      <Text style={{ color: colors.status.green, fontFamily: typography.fontFamily.bold, fontSize: 16 }}>
        + {formatPrice(payment.summa)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  }
});
