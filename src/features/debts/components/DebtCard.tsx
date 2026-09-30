import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../theme';
import { Debt } from '../../store/DebtsStore';
import { formatPrice } from '../../../lib/format';
import { formatUzDate } from '../../../lib/dates';
import { getDebtLabel, getRemaining } from '../utils';
import { DebtProgressBar } from './DebtProgressBar';
import { useRouter } from 'expo-router';

interface Props {
  debt: Debt;
}

export const DebtCard: React.FC<Props> = ({ debt }) => {
  const { colors, typography, radius, spacing } = useTheme();
  const router = useRouter();

  const labelInfo = getDebtLabel(debt);
  const remaining = getRemaining(debt);

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.md, marginBottom: spacing.md }]}
      activeOpacity={0.7}
      onPress={() => router.navigate(`/debt/${debt.id}` as any)}
    >
      <View style={styles.topRow}>
        <View style={styles.left}>
          <Text style={{ color: colors.text, fontFamily: typography.fontFamily.semiBold, fontSize: 16 }}>
            {debt.mijozIsm}
          </Text>
          <Text style={{ color: colors.muted, fontFamily: typography.fontFamily.regular, fontSize: 13, marginTop: 2 }}>
            {debt.telefon}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: labelInfo.bgColor, borderRadius: radius.full }]}>
          <Text style={{ color: labelInfo.color, fontFamily: typography.fontFamily.medium, fontSize: 12 }}>
            {labelInfo.label}
          </Text>
        </View>
      </View>

      <Text style={{ color: colors.text, fontFamily: typography.fontFamily.bold, fontSize: 18, marginVertical: 8 }}>
        {formatPrice(remaining)}
      </Text>

      <Text style={{ color: colors.muted, fontFamily: typography.fontFamily.medium, fontSize: 12 }}>
        Muddat: {formatUzDate(new Date(debt.muddat))}
      </Text>

      <DebtProgressBar total={debt.jamiSumma} paid={debt.tolanganSumma} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  left: {
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  }
});
