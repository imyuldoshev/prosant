import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Input } from '../../../components/Input';
import { useTheme } from '../../../theme';
import { Calendar } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

export interface DebtFormData {
  mijozIsm: string;
  telefon: string;
  muddat: string | null;
  izoh: string;
}

interface Props {
  data: DebtFormData;
  onChange: (data: DebtFormData) => void;
  onOpenDatePicker: () => void;
  formattedMuddat: string;
}

export const DebtFields: React.FC<Props> = ({ data, onChange, onOpenDatePicker, formattedMuddat }) => {
  const { colors, typography, radius } = useTheme();

  return (
    <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.container}>
      <Input
        label="Mijoz ismi *"
        placeholder="Ismini kiriting"
        value={data.mijozIsm}
        onChangeText={(val) => onChange({ ...data, mijozIsm: val })}
      />
      <Input
        label="Telefon *"
        placeholder="+998"
        value={data.telefon}
        onChangeText={(val) => onChange({ ...data, telefon: val })}
        keyboardType="phone-pad"
      />
      
      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: colors.text, fontFamily: typography.fontFamily.medium, marginBottom: 8, fontSize: 14 }}>
          Qaytarish muddati *
        </Text>
        <TouchableOpacity
          style={[styles.dateInput, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.md }]}
          onPress={onOpenDatePicker}
          activeOpacity={0.7}
        >
          <Text style={{ color: data.muddat ? colors.text : colors.muted, fontFamily: typography.fontFamily.regular, fontSize: 16 }}>
            {data.muddat ? formattedMuddat : 'Sanani tanlang'}
          </Text>
          <Calendar size={20} color={colors.muted} />
        </TouchableOpacity>
      </View>

      <Input
        label="Izoh (ixtiyoriy)"
        placeholder="Qo'shimcha ma'lumot..."
        value={data.izoh}
        onChangeText={(val) => onChange({ ...data, izoh: val })}
        multiline
        numberOfLines={2}
        style={{ height: 80, textAlignVertical: 'top' }}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    gap: 0,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    height: 48,
    paddingHorizontal: 16,
  }
});
