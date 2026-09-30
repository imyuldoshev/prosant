import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme';
import { Home, Calendar as CalendarIcon, Wallet, User, PlusCircle, Package } from 'lucide-react-native';

export default function TabsLayout() {
  const { colors, typography } = useTheme();
  const insets = useSafeAreaInsets();

  const bottomPadding = Platform.OS === 'ios' ? Math.max(insets.bottom, 16) + 8 : 12;
  const tabHeight = 60 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          height: tabHeight,
          paddingBottom: bottomPadding,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: typography.fontFamily.medium,
          fontSize: typography.fontSize.xs,
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Bosh sahifa',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Mahsulotlar',
          tabBarIcon: ({ color, size }) => <Package size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: 'Sotish',
          tabBarIcon: ({ focused }) => (
            <PlusCircle 
              size={focused ? 48 : 40} 
              color={colors.primary} 
              fill={colors.background} 
              style={{ marginTop: -10 }}
            />
          ),
          tabBarLabel: () => null, // Hide label for prominent button
        }}
      />
      <Tabs.Screen
        name="debts"
        options={{
          title: 'Qarzlar',
          tabBarIcon: ({ color, size }) => <Wallet size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
