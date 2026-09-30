import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme';
import { formatPrice } from '../../../lib/format';

interface Props {
  totalRemaining: number;
  debtorsCount: number;
  overdueCount: number;
}

export const DebtSummaryCard: React.FC<Props> = ({ totalRemaining, debtorsCount, overdueCount }) => {
  const { colors, typography, radius, spacing } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.lg }]}>
      <Text style={{ color: 'rgba(255,255,255,0.8)', fontFamily: typography.fontFamily.medium, fontSize: 14, marginBottom: 4 }}>
        Jami qarz
      </Text>
      <Text style={{ color: '#fff', fontFamily: typography.fontFamily.bold, fontSize: 28, marginBottom: spacing.md }}>
        {formatPrice(totalRemaining)}
      </Text>
      
      <View style={styles.row}>
        <View style={[styles.statBox, { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radius.md }]}>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontFamily: typography.fontFamily.medium, fontSize: 13 }}>
            Qarzdorlar: <Text style={{ fontFamily: typography.fontFamily.bold }}>{debtorsCount}</Text>
          </Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radius.md }]}>
          <Text style={{ color: overdueCount > 0 ? '#fca5a5' : 'rgba(255,255,255,0.9)', fontFamily: typography.fontFamily.medium, fontSize: 13 }}>
            Muddati o'tgan: <Text style={{ fontFamily: typography.fontFamily.bold }}>{overdueCount}</Text>
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  }
});
