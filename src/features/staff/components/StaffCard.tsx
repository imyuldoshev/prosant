import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme';
import { Avatar } from '../../../components/Avatar';
import { Badge } from '../../../components/Badge';
import { Staff } from '../../store/StaffStore';

interface StaffCardProps {
  staff: Staff;
  isCurrentUser: boolean;
  onPress: () => void;
}

export const StaffCard: React.FC<StaffCardProps> = ({ staff, isCurrentUser, onPress }) => {
  const { colors, typography, radius, spacing } = useTheme();

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.xl,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      opacity: staff.faol ? 1 : 0.6,
    },
    info: {
      flex: 1,
      marginLeft: spacing.md,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
      gap: 6,
    },
    name: {
      fontFamily: typography.fontFamily.semiBold,
      fontSize: 16,
      color: colors.text,
    },
    phone: {
      fontFamily: typography.fontFamily.regular,
      fontSize: 14,
      color: colors.muted,
      marginBottom: 6,
    },
    badgesRow: {
      flexDirection: 'row',
      gap: 8,
    },
    youLabel: {
      fontSize: 12,
      color: colors.primary,
      fontFamily: typography.fontFamily.bold,
      backgroundColor: colors.primary + '20',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    }
  });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Avatar name={staff.ism} backgroundColor={staff.faol ? colors.primary : colors.muted} />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{staff.ism}</Text>
          {isCurrentUser && <Text style={styles.youLabel}>Siz</Text>}
        </View>
        <Text style={styles.phone}>{staff.telefon}</Text>
        <View style={styles.badgesRow}>
          <Badge label={staff.role === 'admin' ? 'Admin' : 'Xodim'} variant={staff.role === 'admin' ? 'success' : 'neutral'} />
          {!staff.faol && <Badge label="Faolsiz" variant="neutral" />}
        </View>
      </View>
    </TouchableOpacity>
  );
};
