import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../theme';
import { Button } from '../../../components/Button';
import { CheckCircle2 } from 'lucide-react-native';
import { formatPrice } from '../../../lib/format';
import { PaymentType } from './PaymentTypeSelector';

interface Props {
  visible: boolean;
  onNewSale: () => void;
  onViewDebts?: () => void;
  total: number;
  paymentType: PaymentType;
  debtName?: string;
  debtDueDate?: string;
}

export const SaleSuccessSheet: React.FC<Props> = ({ visible, onNewSale, onViewDebts, total, paymentType, debtName, debtDueDate }) => {
  const { colors, typography, radius, spacing } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={[styles.container, { backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl }]}>
        <View style={styles.iconContainer}>
          <CheckCircle2 size={64} color={colors.status.green} />
        </View>
        
        <Text style={[styles.title, { color: colors.text, fontFamily: typography.fontFamily.bold, marginBottom: spacing.md }]}>
          Sotuv muvaffaqiyatli amalga oshirildi
        </Text>
        
        <View style={[styles.detailsBox, { backgroundColor: colors.background, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.xl }]}>
          <View style={styles.row}>
            <Text style={{ color: colors.muted, fontFamily: typography.fontFamily.medium, fontSize: 16 }}>Jami summa:</Text>
            <Text style={{ color: colors.text, fontFamily: typography.fontFamily.bold, fontSize: 18 }}>{formatPrice(total)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={{ color: colors.muted, fontFamily: typography.fontFamily.medium, fontSize: 16 }}>To'lov turi:</Text>
            <Text style={{ color: colors.text, fontFamily: typography.fontFamily.semiBold, fontSize: 16 }}>{paymentType}</Text>
          </View>
          
          {paymentType === 'Qarzga' && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: spacing.sm }]} />
              <View style={styles.row}>
                <Text style={{ color: colors.muted, fontFamily: typography.fontFamily.medium, fontSize: 14 }}>Mijoz:</Text>
                <Text style={{ color: colors.text, fontFamily: typography.fontFamily.semiBold, fontSize: 14 }}>{debtName}</Text>
              </View>
              <View style={styles.row}>
                <Text style={{ color: colors.muted, fontFamily: typography.fontFamily.medium, fontSize: 14 }}>Muddat:</Text>
                <Text style={{ color: colors.status.amber, fontFamily: typography.fontFamily.semiBold, fontSize: 14 }}>{debtDueDate}</Text>
              </View>
            </>
          )}
        </View>

        <Button title="Yangi sotuv" onPress={onNewSale} style={{ marginBottom: spacing.md }} />
        {paymentType === 'Qarzga' && onViewDebts && (
          <Button title="Qarzlarni ko'rish" variant="secondary" onPress={onViewDebts} />
        )}
      </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    textAlign: 'center',
  },
  detailsBox: {
    width: '100%',
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    width: '100%',
  }
});
