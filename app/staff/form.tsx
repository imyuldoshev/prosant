import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Modal } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Screen } from '../../src/components/Screen';
import { useTheme } from '../../src/theme';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { SegmentedControl } from '../../src/components/SegmentedControl';
import { useStaffStore, Staff } from '../../src/features/store/StaffStore';
import { useAuth } from '../../src/lib/auth';
import { Copy } from 'lucide-react-native';

export default function StaffFormScreen() {
  const { colors, typography, radius, spacing } = useTheme();
  const { state: { staffList }, addStaff, updateStaff, resetPassword } = useStaffStore();
  const params = useLocalSearchParams();
  const editId = params.id as string | undefined;

  const { user } = useAuth();
  
  const isEditing = !!editId;
  const existingStaff = isEditing ? staffList.find(s => s.id === editId) : null;
  const isSelf = user?.id === existingStaff?.id;

  const [ism, setIsm] = useState(existingStaff?.ism || '');
  const [telefon, setTelefon] = useState(existingStaff?.telefon || '+998');
  const [email, setEmail] = useState(existingStaff?.email || '');
  const [role, setRole] = useState<'admin' | 'xodim'>(existingStaff?.role || 'xodim');
  const [parol, setParol] = useState('');
  
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState({ login: '', password: '' });

  useEffect(() => {
    if (isEditing && !existingStaff) {
      router.back();
    }
  }, [isEditing, existingStaff]);

  const generatePassword = () => {
    setParol(Math.random().toString(36).slice(-8));
  };

  const handleSave = () => {
    if (!ism || !telefon || !email) return;
    if (!isEditing && parol.length < 6) return;

    if (isEditing && editId) {
      updateStaff(editId, { ism, telefon, email, role });
      router.back();
    } else {
      const newStaff: Staff = {
        id: Math.random().toString(36).slice(-8),
        ism,
        telefon,
        email,
        role,
        faol: true,
        qoshilganSana: new Date().toISOString(),
      };
      addStaff(newStaff);
      setGeneratedCredentials({ login: email, password: parol });
      setSuccessModalVisible(true);
    }
  };

  const copyCredentials = async () => {
    await Clipboard.setStringAsync(`Login: ${generatedCredentials.login}\nParol: ${generatedCredentials.password}`);
    // Ideally show toast
  };

  return (
    <Screen style={{ backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}>
        <Input
          label="To'liq ism"
          placeholder="Ism Familiya"
          value={ism}
          onChangeText={setIsm}
          style={{ marginBottom: spacing.md }}
        />
        
        <Input
          label="Telefon"
          placeholder="+998"
          value={telefon}
          onChangeText={setTelefon}
          keyboardType="phone-pad"
          style={{ marginBottom: spacing.md }}
        />

        <Input
          label="Email (Login uchun)"
          placeholder="email@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={{ marginBottom: spacing.md }}
        />

        {!isEditing && (
          <View style={{ marginBottom: spacing.md }}>
            <Input
              label="Parol"
              placeholder="Parol"
              value={parol}
              onChangeText={setParol}
              secureTextEntry
            />
            <Button 
              title="Generatsiya qilish" 
              variant="secondary" 
              onPress={generatePassword} 
              style={{ marginTop: spacing.sm, alignSelf: 'flex-start', paddingHorizontal: spacing.md }}
            />
          </View>
        )}

        <Text style={{ fontFamily: typography.fontFamily.medium, color: colors.text, marginBottom: spacing.xs }}>
          Rol
        </Text>
        {isSelf ? (
          <View style={{ backgroundColor: colors.card, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: colors.text, fontFamily: typography.fontFamily.medium }}>Admin</Text>
            <Text style={{ color: colors.muted, fontFamily: typography.fontFamily.regular, fontSize: 12, marginTop: 4 }}>
              O'zingizni rolingizni o'zgartira olmaysiz.
            </Text>
          </View>
        ) : (
          <SegmentedControl
            segments={[
              { label: 'Xodim', id: 'xodim' },
              { label: 'Admin', id: 'admin' },
            ]}
            activeSegment={role}
            onChange={(val) => setRole(val as 'admin' | 'xodim')}
          />
        )}
        <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: 12, color: colors.muted, marginTop: spacing.xs, marginBottom: spacing.xl }}>
          Xodim mahsulot qo'sha olmaydi va narxlarni o'zgartira olmaydi.
        </Text>

      </ScrollView>
      
      <View style={{ position: 'absolute', bottom: spacing.md, left: spacing.md, right: spacing.md }}>
        <Button title="Saqlash" onPress={handleSave} />
      </View>

      <Modal visible={successModalVisible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.background, padding: spacing.xl, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }}>
            <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: 20, color: colors.text, marginBottom: spacing.md }}>
              Xodim qo'shildi
            </Text>
            
            <View style={{ backgroundColor: colors.card, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.md }}>
              <Text style={{ color: colors.muted, fontFamily: typography.fontFamily.regular, marginBottom: 4 }}>Login</Text>
              <Text style={{ color: colors.text, fontFamily: typography.fontFamily.semiBold, fontSize: 16, marginBottom: spacing.md }}>{generatedCredentials.login}</Text>
              
              <Text style={{ color: colors.muted, fontFamily: typography.fontFamily.regular, marginBottom: 4 }}>Parol</Text>
              <Text style={{ color: colors.text, fontFamily: typography.fontFamily.semiBold, fontSize: 16 }}>{generatedCredentials.password}</Text>
            </View>

            <Text style={{ color: colors.muted, fontFamily: typography.fontFamily.regular, fontSize: 12, marginBottom: spacing.lg, textAlign: 'center' }}>
              Parolni xodimga xavfsiz yetkazing. Keyin uni ko'rib bo'lmaydi.
            </Text>

            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Button title="Yopish" variant="secondary" onPress={() => { setSuccessModalVisible(false); router.back(); }} />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Nusxalash" onPress={copyCredentials} icon={<Copy size={16} color="#fff" />} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
