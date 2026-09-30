import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, Modal } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Screen } from '../../src/components/Screen';
import { useTheme } from '../../src/theme';
import { Button } from '../../src/components/Button';
import { useStaffStore } from '../../src/features/store/StaffStore';
import { useAuth } from '../../src/lib/auth';
import { Avatar } from '../../src/components/Avatar';
import { Badge } from '../../src/components/Badge';
import { Copy } from 'lucide-react-native';

export default function StaffDetailScreen() {
  const { id } = useLocalSearchParams();
  const { colors, typography, radius, spacing } = useTheme();
  const { state: { staffList }, toggleActive, resetPassword } = useStaffStore();
  const { user } = useAuth();
  
  const [newPassword, setNewPassword] = useState('');
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);

  const staff = staffList.find((s) => s.id === id);

  if (!staff) return null;

  const isSelf = user?.id === staff.id;

  const handleToggleActive = () => {
    if (isSelf) return; // Self protection
    const action = staff.faol ? 'Faolsizlantirish' : 'Faollashtirish';
    Alert.alert(
      `${action}ni xohlaysizmi?`,
      "Xodim tizimga kira olmaydi, lekin uning sotuv tarixi saqlanadi.",
      [
        { text: 'Bekor qilish', style: 'cancel' },
        { text: action, style: 'destructive', onPress: () => toggleActive(staff.id) }
      ]
    );
  };

  const handleResetPassword = () => {
    Alert.alert(
      "Parolni tiklash",
      "Rostdan ham ushbu xodimning parolini tiklamoqchimisiz?",
      [
        { text: 'Bekor qilish', style: 'cancel' },
        { 
          text: 'Tiklash', 
          onPress: () => {
            const pass = resetPassword(staff.id);
            setNewPassword(pass);
            setPasswordModalVisible(true);
          }
        }
      ]
    );
  };

  const copyPassword = async () => {
    await Clipboard.setStringAsync(`Yangi parol: ${newPassword}`);
    setPasswordModalVisible(false);
  };

  return (
    <Screen style={{ backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        <View style={{ backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg }}>
          <View style={{ marginBottom: spacing.md }}>
            <Avatar name={staff.ism} size={80} backgroundColor={staff.faol ? colors.primary : colors.muted} />
          </View>
          <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: 24, color: colors.text, marginBottom: spacing.xs }}>
            {staff.ism}
          </Text>
          <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: 16, color: colors.muted, marginBottom: spacing.md }}>
            {staff.telefon}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Badge label={staff.role === 'admin' ? 'Admin' : 'Xodim'} variant={staff.role === 'admin' ? 'success' : 'neutral'} />
            {!staff.faol && <Badge label="Faolsiz" variant="neutral" />}
          </View>
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.xl }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ fontFamily: typography.fontFamily.regular, color: colors.muted }}>Email (Login)</Text>
            <Text style={{ fontFamily: typography.fontFamily.medium, color: colors.text }}>{staff.email}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ fontFamily: typography.fontFamily.regular, color: colors.muted }}>Qo'shilgan sana</Text>
            <Text style={{ fontFamily: typography.fontFamily.medium, color: colors.text }}>
              {new Date(staff.qoshilganSana).toLocaleDateString('uz-UZ')}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm }}>
            <Text style={{ fontFamily: typography.fontFamily.regular, color: colors.muted }}>Holat</Text>
            <Text style={{ fontFamily: typography.fontFamily.medium, color: staff.faol ? colors.primary : colors.muted }}>
              {staff.faol ? 'Faol' : 'Faolsiz'}
            </Text>
          </View>
        </View>

        <View style={{ gap: spacing.md }}>
          <Button 
            title="Tahrirlash" 
            onPress={() => router.push({ pathname: '/staff/form', params: { id: staff.id } })} 
          />
          <Button 
            title="Parolni tiklash" 
            variant="secondary" 
            onPress={handleResetPassword} 
          />
          <Button 
            title={staff.faol ? 'Faolsizlantirish' : 'Faollashtirish'} 
            variant="secondary" 
            onPress={handleToggleActive}
            disabled={isSelf}
            style={!isSelf ? { borderColor: colors.status.red + '40', backgroundColor: colors.status.red + '10' } : undefined}
          />
          {isSelf && (
            <Text style={{ textAlign: 'center', fontSize: 12, color: colors.muted, fontFamily: typography.fontFamily.regular }}>
              Siz o'zingizni faolsizlantira olmaysiz.
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Password Reset Modal */}
      <Modal visible={passwordModalVisible} animationType="fade" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.xl }}>
          <View style={{ backgroundColor: colors.background, padding: spacing.xl, borderRadius: radius.xl, alignItems: 'center' }}>
            <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: 18, color: colors.text, marginBottom: spacing.md }}>
              Yangi parol
            </Text>
            <View style={{ backgroundColor: colors.card, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.lg, width: '100%', alignItems: 'center' }}>
              <Text style={{ color: colors.text, fontFamily: typography.fontFamily.bold, fontSize: 24, letterSpacing: 2 }}>
                {newPassword}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.md, width: '100%' }}>
              <View style={{ flex: 1 }}>
                <Button title="Yopish" variant="secondary" onPress={() => setPasswordModalVisible(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Nusxalash" onPress={copyPassword} icon={<Copy size={16} color="#fff" />} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
