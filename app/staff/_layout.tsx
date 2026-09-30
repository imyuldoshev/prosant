import { Stack } from 'expo-router';
import { useTheme } from '../../src/theme';

export default function StaffLayout() {
  const { colors } = useTheme();

  return (
    <Stack screenOptions={{ 
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.text,
      headerShadowVisible: false,
      contentStyle: { backgroundColor: colors.background }
    }}>
      <Stack.Screen name="index" options={{ title: 'Xodimlar' }} />
      <Stack.Screen name="[id]" options={{ title: 'Xodim ma\'lumoti' }} />
      <Stack.Screen name="form" options={{ presentation: 'modal', title: 'Xodim' }} />
    </Stack>
  );
}
