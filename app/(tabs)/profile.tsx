import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Modal, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { useTheme } from '../../src/theme';
import { Button } from '../../src/components/Button';
import { useAuth } from '../../src/lib/auth';
import { Avatar } from '../../src/components/Avatar';
import { Badge } from '../../src/components/Badge';
import { SegmentedControl } from '../../src/components/SegmentedControl';
import { RoleSwitcher } from '../../src/features/dev/RoleSwitcher';
import { LogOut, ChevronRight, Users, Shield, Palette } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';

export default function ProfileScreen() {
  const { colors, typography, radius, spacing } = useTheme();
  const { user, signOut } = useAuth();
  const { mode, setMode } = useTheme();

  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignOut = () => {
    Alert.alert('Chiqishni xohlaysizmi?', '', [
      { text: 'Bekor qilish', style: 'cancel' },
      { text: 'Chiqish', style: 'destructive', onPress: () => {
        signOut();
        router.replace('/(auth)/login');
      }},
    ]);
  };

  const handleChangePassword = () => {
    if (newPassword.length < 6) {
      Alert.alert('Xato', "Parol kamida 6 ta belgidan iborat bo'lishi kerak.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Xato', 'Parollar mos kelmadi.');
      return;
    }
    Alert.alert("Muaffaqiyat", "Parol o'zgartirildi!");
    setPasswordModalVisible(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const themeSegments = [
    { label: "Yorug'", id: 'light' },
    { label: "Qorong'i", id: 'dark' },
    { label: 'Tizim', id: 'system' }
  ];

  if (!user) return null;

  return (
    <Screen style={{ backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}>
        <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: 22, color: colors.text, marginBottom: spacing.lg }}>
          Profil
        </Text>

        {/* User Card */}
        <View style={{ backgroundColor: colors.card, padding: spacing.lg, borderRadius: radius.xl, alignItems: 'center', marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ marginBottom: spacing.md }}>
            <Avatar name={user.ism} size={72} backgroundColor={colors.primary} />
          </View>
          <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: 20, color: colors.text, marginBottom: spacing.xs }}>
            {user.ism}
          </Text>
          <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.md, color: colors.muted, marginBottom: spacing.md }}>
            {user.telefon}
          </Text>
          <Badge label={user.role === 'admin' ? 'Admin' : 'Xodim'} variant={user.role === 'admin' ? 'success' : 'neutral'} />
        </View>

        {/* Ko'rinish Section */}
        <Text style={{ fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.lg, color: colors.text, marginBottom: spacing.sm }}>
          Ko'rinish
        </Text>
        <View style={{ backgroundColor: colors.card, padding: spacing.md, borderRadius: radius.xl, marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
            <Palette color={colors.muted} size={20} style={{ marginRight: spacing.sm }} />
            <Text style={{ fontFamily: typography.fontFamily.medium, color: colors.text, fontSize: typography.fontSize.md }}>
              Ilova mavzusi
            </Text>
          </View>
          <SegmentedControl
            segments={themeSegments}
            activeSegment={mode}
            onChange={(val) => setMode(val as 'light' | 'dark' | 'system')}
          />
        </View>

        {/* Xavfsizlik Section */}
        <Text style={{ fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.lg, color: colors.text, marginBottom: spacing.sm }}>
          Xavfsizlik
        </Text>
        <View style={{ backgroundColor: colors.card, borderRadius: radius.xl, marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
          <TouchableOpacity onPress={() => setPasswordModalVisible(true)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Shield color={colors.muted} size={20} style={{ marginRight: spacing.sm }} />
              <Text style={{ fontFamily: typography.fontFamily.medium, color: colors.text, fontSize: typography.fontSize.md }}>
                Parolni o'zgartirish
              </Text>
            </View>
            <ChevronRight color={colors.muted} size={20} />
          </TouchableOpacity>
        </View>

        {/* Boshqaruv Section */}
        {user.role === 'admin' && (
          <>
            <Text style={{ fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.lg, color: colors.text, marginBottom: spacing.sm }}>
              Boshqaruv
            </Text>
            <View style={{ backgroundColor: colors.card, borderRadius: radius.xl, marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
              <TouchableOpacity onPress={() => router.push('/staff' as any)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Users color={colors.muted} size={20} style={{ marginRight: spacing.sm }} />
                  <Text style={{ fontFamily: typography.fontFamily.medium, color: colors.text, fontSize: typography.fontSize.md }}>
                    Xodimlar
                  </Text>
                </View>
                <ChevronRight color={colors.muted} size={20} />
              </TouchableOpacity>
            </View>
          </>
        )}

        <RoleSwitcher />

        <View style={{ marginTop: spacing.xl, marginBottom: spacing.xl }}>
          <Button
            title="Chiqish"
            onPress={handleSignOut}
            variant="secondary"
            icon={<LogOut size={20} color={colors.status.red} />}
            style={{ borderColor: colors.status.red + '40', backgroundColor: colors.status.red + '10' }}
          />
        </View>

        <Text style={{ textAlign: 'center', color: colors.muted, fontFamily: typography.fontFamily.regular, fontSize: 12 }}>
          SantexPro v1.0.0
        </Text>
      </ScrollView>

      {/* Password Change Modal (Mock Bottom Sheet) */}
      <Modal visible={passwordModalVisible} animationType="slide" transparent={true}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.background, padding: spacing.xl, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }}>
            <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: 20, color: colors.text, marginBottom: spacing.lg }}>
              Parolni o'zgartirish
            </Text>
            
            <Text style={{ color: colors.text, marginBottom: 8, fontFamily: typography.fontFamily.medium }}>Joriy parol</Text>
            <View style={{ backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md, paddingHorizontal: spacing.md }}>
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                style={{ height: 48, color: colors.text, fontFamily: typography.fontFamily.regular }}
                placeholder="Joriy parolni kiriting"
                placeholderTextColor={colors.muted}
              />
            </View>

            <Text style={{ color: colors.text, marginBottom: 8, fontFamily: typography.fontFamily.medium }}>Yangi parol</Text>
            <View style={{ backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md, paddingHorizontal: spacing.md }}>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                style={{ height: 48, color: colors.text, fontFamily: typography.fontFamily.regular }}
                placeholder="Yangi parolni kiriting (min. 6 belgi)"
                placeholderTextColor={colors.muted}
              />
            </View>

            <Text style={{ color: colors.text, marginBottom: 8, fontFamily: typography.fontFamily.medium }}>Yangi parolni tasdiqlash</Text>
            <View style={{ backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.xl, paddingHorizontal: spacing.md }}>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                style={{ height: 48, color: colors.text, fontFamily: typography.fontFamily.regular }}
                placeholder="Parolni qayta kiriting"
                placeholderTextColor={colors.muted}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Button title="Bekor qilish" variant="secondary" onPress={() => setPasswordModalVisible(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Saqlash" onPress={handleChangePassword} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
