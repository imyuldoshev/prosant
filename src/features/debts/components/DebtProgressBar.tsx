import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme';
import { formatPrice } from '../../../lib/format';

interface Props {
  total: number;
  paid: number;
}

export const DebtProgressBar: React.FC<Props> = ({ total, paid }) => {
  const { colors, typography, radius } = useTheme();
  
  const percentage = Math.min(100, Math.max(0, (paid / total) * 100));

  return (
    <View style={styles.container}>
      <View style={[styles.track, { backgroundColor: colors.border, borderRadius: radius.full }]}>
        <View 
          style={[
            styles.fill, 
            { backgroundColor: colors.status.green, borderRadius: radius.full, width: `${percentage}%` }
          ]} 
        />
      </View>
      <Text style={{ color: colors.muted, fontFamily: typography.fontFamily.regular, fontSize: 12, marginTop: 4 }}>
        {formatPrice(paid)} / {formatPrice(total)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 8,
  },
  track: {
    height: 6,
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  }
});
