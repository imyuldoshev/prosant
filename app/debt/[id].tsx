import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { useTheme } from '../../src/theme';
import { useDebtsStore } from '../../src/features/store/DebtsStore';
import { useNotificationsStore } from '../../src/features/store/NotificationsStore';
import { getRemaining, getDebtStatus, getDebtLabel } from '../../src/features/debts/utils';
import { formatPrice, formatDate } from '../../src/lib/format';
import { formatUzDate } from '../../src/lib/dates';
import { ArrowLeft, Phone, User, Info } from 'lucide-react-native';
import { DebtProgressBar } from '../../src/features/debts/components/DebtProgressBar';
import { PaymentHistoryRow } from '../../src/features/debts/components/PaymentHistoryRow';
import { PaymentSheet } from '../../src/features/debts/components/PaymentSheet';
import { Button } from '../../src/components/Button';
import { EmptyState } from '../../src/components/EmptyState';

export default function DebtDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, typography, radius, spacing } = useTheme();
  
  const { state: { debts }, dispatch } = useDebtsStore();
  const { dispatch: dispatchNotif } = useNotificationsStore();
  const debt = debts.find(d => d.id === id);

  const [paymentSheetVisible, setPaymentSheetVisible] = useState(false);

  if (!debt) {
    return (
      <Screen>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <EmptyState title="Topilmadi" description="Bunday qarz ma'lumoti yo'q." icon={<Info size={48} color={colors.muted} />} />
      </Screen>
    );
  }

  const remaining = getRemaining(debt);
  const status = getDebtStatus(debt);
  const labelInfo = getDebtLabel(debt);
  const isPaid = status === 'paid';

  const handleCall = () => {
    Linking.openURL(`tel:${debt.telefon}`).catch(() => {
      Alert.alert("Xato", "Qo'ng'iroqni amalga oshirib bo'lmadi.");
    });
  };

  const handlePaymentConfirm = (amount: number) => {
    dispatch({
      type: 'ADD_PAYMENT',
      payload: {
        debtId: debt.id,
        payment: {
          summa: amount,
          sana: new Date().toISOString()
        }
      }
    });
    dispatchNotif({
      type: 'ADD_NOTIFICATION',
      payload: {
        type: 'debt_paid',
        title: "Qarz to'landi",
        message: `${debt.mijozIsm} dan ${formatPrice(amount)} so'm qarz to'landi`,
        time: new Date().toISOString(),
      }
    });
    setPaymentSheetVisible(false);
  };

  const initials = debt.mijozIsm.substring(0, 2).toUpperCase();

  return (
    <Screen style={{ paddingHorizontal: 0 }}>
      <ScrollView 
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { marginBottom: spacing.lg }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ color: colors.text, fontFamily: typography.fontFamily.bold, fontSize: 20 }}>
            Qarz tafsiloti
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Customer Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.lg, marginBottom: spacing.md }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.avatar, { backgroundColor: colors.primary + '15', borderRadius: radius.full }]}>
              <Text style={{ color: colors.primary, fontFamily: typography.fontFamily.bold, fontSize: 18 }}>
                {initials}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: colors.text, fontFamily: typography.fontFamily.semiBold, fontSize: 18 }}>
                {debt.mijozIsm}
              </Text>
              <Text style={{ color: colors.muted, fontFamily: typography.fontFamily.regular, fontSize: 14, marginTop: 2 }}>
                {debt.telefon}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: labelInfo.bgColor, borderRadius: radius.full }]}>
              <Text style={{ color: labelInfo.color, fontFamily: typography.fontFamily.medium, fontSize: 12 }}>
                {labelInfo.label}
              </Text>
            </View>
          </View>
        </View>

        {/* Amounts Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.lg, marginBottom: spacing.md }]}>
          <View style={[styles.row, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
            <Text style={{ color: colors.muted, fontFamily: typography.fontFamily.regular, fontSize: 14 }}>Jami qarz</Text>
            <Text style={{ color: colors.text, fontFamily: typography.fontFamily.semiBold, fontSize: 16 }}>{formatPrice(debt.jamiSumma)}</Text>
          </View>
          <View style={[styles.row, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
            <Text style={{ color: colors.muted, fontFamily: typography.fontFamily.regular, fontSize: 14 }}>To'langan</Text>
            <Text style={{ color: colors.status.green, fontFamily: typography.fontFamily.semiBold, fontSize: 16 }}>{formatPrice(debt.tolanganSumma)}</Text>
          </View>
          <View style={[styles.row, { paddingBottom: 0 }]}>
            <Text style={{ color: colors.text, fontFamily: typography.fontFamily.medium, fontSize: 16 }}>Qolgan</Text>
            <Text style={{ color: colors.status.red, fontFamily: typography.fontFamily.bold, fontSize: 20 }}>{formatPrice(remaining)}</Text>
          </View>
          
          <View style={{ marginTop: 12 }}>
            <DebtProgressBar total={debt.jamiSumma} paid={debt.tolanganSumma} />
          </View>
        </View>

        {/* Dates & Info Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.lg, marginBottom: spacing.lg }]}>
          <View style={[styles.row, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
            <Text style={{ color: colors.muted, fontFamily: typography.fontFamily.regular, fontSize: 14 }}>Berilgan sana</Text>
            <Text style={{ color: colors.text, fontFamily: typography.fontFamily.medium, fontSize: 14 }}>{formatUzDate(new Date(debt.berilganSana))}</Text>
          </View>
          <View style={[styles.row, { borderBottomColor: colors.border, borderBottomWidth: debt.izoh ? 1 : 0, paddingBottom: debt.izoh ? 12 : 0 }]}>
            <Text style={{ color: colors.muted, fontFamily: typography.fontFamily.regular, fontSize: 14 }}>Qaytarish muddati</Text>
            <Text style={{ color: colors.text, fontFamily: typography.fontFamily.medium, fontSize: 14 }}>{formatUzDate(new Date(debt.muddat))}</Text>
          </View>
          {debt.izoh ? (
            <View style={{ paddingTop: 12 }}>
              <Text style={{ color: colors.muted, fontFamily: typography.fontFamily.regular, fontSize: 14, marginBottom: 4 }}>Izoh</Text>
              <Text style={{ color: colors.text, fontFamily: typography.fontFamily.regular, fontSize: 14 }}>{debt.izoh}</Text>
            </View>
          ) : null}
        </View>

        {/* Payments History */}
        <Text style={{ color: colors.text, fontFamily: typography.fontFamily.bold, fontSize: 18, marginBottom: spacing.md }}>
          To'lovlar tarixi
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.lg }]}>
          {debt.tolovlar.length === 0 ? (
            <Text style={{ color: colors.muted, fontFamily: typography.fontFamily.medium, textAlign: 'center', paddingVertical: spacing.md }}>
              Hali to'lov qilinmagan
            </Text>
          ) : (
            debt.tolovlar.map((payment, idx) => (
              <PaymentHistoryRow 
                key={payment.id} 
                payment={payment} 
                isLast={idx === debt.tolovlar.length - 1} 
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomActions, { backgroundColor: colors.card, borderTopColor: colors.border, padding: spacing.md }]}>
        {isPaid ? (
          <View style={[styles.paidBanner, { backgroundColor: colors.status.green + '15', borderRadius: radius.md }]}>
            <Text style={{ color: colors.status.green, fontFamily: typography.fontFamily.bold, fontSize: 16 }}>
              Qarz to'liq to'langan
            </Text>
          </View>
        ) : (
          <>
            <Button 
              title="To'lov qabul qilish" 
              onPress={() => setPaymentSheetVisible(true)} 
              style={{ flex: 1 }}
            />
            <View style={{ width: spacing.md }} />
            <Button 
              title="Qo'ng'iroq qilish" 
              variant="secondary" 
              icon={<Phone size={20} color={colors.primary} />}
              onPress={handleCall}
              style={{ flex: 1 }}
            />
          </>
        )}
      </View>

      {/* Payment Sheet */}
      <PaymentSheet 
        visible={paymentSheetVisible}
        remainingAmount={remaining}
        onClose={() => setPaymentSheetVisible(false)}
        onConfirm={handlePaymentConfirm}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  card: {
    borderWidth: 1,
    padding: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  bottomActions: {
    borderTopWidth: 1,
    flexDirection: 'row',
  },
  paidBanner: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
