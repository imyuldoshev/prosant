import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useTheme } from '../../src/theme';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { Screen } from '../../src/components/Screen';
import { Logo } from '../../src/components/Logo';
import { useAuth } from '../../src/lib/auth';
import { Phone, Lock, Mail } from 'lucide-react-native';

export default function LoginScreen() {
  const { colors, spacing, typography } = useTheme();
  const { signIn } = useAuth();
  
  // Hozircha login faqat Email orqali amalga oshadi, keyinchalik telefonni ham sozlashimiz mumkin
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Xatolik', 'Email va parolni kiriting');
      return;
    }
    
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Kirishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={[styles.scrollContainer, { padding: spacing.xl }]}>
          <View style={styles.topSection}>
            <Logo size={72} style={{ marginBottom: 24 }} />
            <Text style={[styles.title, { color: colors.text, fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.xxl }]}>
              Xush kelibsiz
            </Text>
            <Text style={[styles.subtitle, { color: colors.muted, fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.md }]}>
              Tizimga kirish uchun ma'lumotlaringizni kiriting
            </Text>
          </View>

          <View style={styles.formSection}>
            <Input
              label="Email"
              placeholder="admin@santex.pro"
              value={email}
              onChangeText={setEmail}
              icon={<Mail size={20} color={colors.muted} />}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label="Parol"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              icon={<Lock size={20} color={colors.muted} />}
              isPassword
            />
            
            <Button
              title="Kirish"
              onPress={handleLogin}
              loading={loading}
              style={{ marginTop: spacing.md }}
            />
          </View>

          <View style={[styles.footer, { marginTop: spacing.xxl }]}>
            <Text style={[styles.footerText, { color: colors.muted, fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm }]}>
              Hisoblar faqat administrator tomonidan yaratiladi.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
  },
  formSection: {
    width: '100%',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    textAlign: 'center',
  }
});
