import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { useAuth } from '../../lib/auth';
import { useTheme } from '../../theme';

export const RoleSwitcher = () => {
  const { user, devRoleOverride, setDevRoleOverride } = useAuth();
  const { colors } = useTheme();

  // If the user isn't an admin natively, we don't show the switcher,
  // or we can just always show it if we want to test both ways.
  // The prompt says: "A switch 'Xodim sifatida ko'rish' that temporarily switches the current user's role between admin and xodim so I can test permissions."

  const isXodimView = (devRoleOverride || user?.role) === 'xodim';

  const toggleRole = (value: boolean) => {
    if (value) {
      setDevRoleOverride('xodim');
    } else {
      setDevRoleOverride('admin');
    }
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 16,
      marginTop: 24,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    badge: {
      backgroundColor: colors.primary + '20',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      marginBottom: 4,
      alignSelf: 'flex-start',
    },
    badgeText: {
      color: colors.primary,
      fontSize: 10,
      fontFamily: 'Inter_700Bold',
    },
    label: {
      color: colors.text,
      fontSize: 16,
      fontFamily: 'Inter_500Medium',
    },
    leftCol: {
      flex: 1,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.leftCol}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Vaqtincha</Text>
        </View>
        <Text style={styles.label}>Xodim sifatida ko'rish</Text>
      </View>
      <Switch
        value={isXodimView}
        onValueChange={toggleRole}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#ffffff"
      />
    </View>
  );
};
