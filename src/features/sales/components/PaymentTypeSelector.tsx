import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme';

export type PaymentType = 'Naqd' | 'Karta' | 'Qarzga';

interface Props {
  value: PaymentType;
  onChange: (val: PaymentType) => void;
}

export const PaymentTypeSelector: React.FC<Props> = ({ value, onChange }) => {
  const { colors, typography, radius } = useTheme();
  const types: PaymentType[] = ['Naqd', 'Karta', 'Qarzga'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderRadius: radius.md, borderColor: colors.border }]}>
      {types.map((type, i) => {
        const isSelected = value === type;
        return (
          <TouchableOpacity
            key={type}
            style={[
              styles.segment,
              { borderRadius: radius.md - 2 },
              isSelected && { backgroundColor: colors.primary }
            ]}
            onPress={() => onChange(type)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.text,
              { fontFamily: typography.fontFamily.medium, color: isSelected ? '#fff' : colors.text }
            ]}>
              {type}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderWidth: 1,
    padding: 4,
    height: 48,
  },
  segment: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 14,
  }
});
