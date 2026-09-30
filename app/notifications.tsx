import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../src/theme';
import { useProductsStore } from '../src/features/store/ProductsStore';
import { useDebtsStore } from '../src/features/store/DebtsStore';
import { useNotificationsStore } from '../src/features/store/NotificationsStore';
import { ChevronLeft, AlertTriangle, BellRing, PackageX, ShoppingCart, CheckCircle, PackagePlus, CalendarClock, Info } from 'lucide-react-native';
import { EmptyState } from '../src/components/EmptyState';
import { isSameDay, formatUzDate } from '../src/lib/dates';
import { formatPrice } from '../src/lib/format';

type NotificationItem = {
  id: string;
  type: 'out_of_stock' | 'low_stock' | 'product_added' | 'sale_made' | 'debt_paid' | 'debt_due' | 'info';
  title: string;
  message: string;
  time: string;
  sortTime: number;
  productId?: string;
  debtId?: string;
};

export default function NotificationsScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const { state: { products } } = useProductsStore();
  const { state: { debts } } = useDebtsStore();
  const { state: { notifications: storeNotifications } } = useNotificationsStore();

  const notifications = useMemo(() => {
    const items: NotificationItem[] = [];
    const now = new Date();
    
    // 1. Dynamic: Out of stock & low stock
    products.forEach(p => {
      if (p.joriyQoldiq === 0) {
        items.push({
          id: `notif_out_${p.id}`,
          type: 'out_of_stock',
          title: 'Mahsulot tugadi',
          message: `${p.nom} omborda mutlaqo qolmadi. Zudlik bilan kirim qilish tavsiya etiladi.`,
          time: 'Hozir',
          sortTime: now.getTime() + 100000, // Highest priority
          productId: p.id,
        });
      } else if (p.joriyQoldiq <= p.minimalQoldiq) {
        items.push({
          id: `notif_low_${p.id}`,
          type: 'low_stock',
          title: 'Zaxira kam qoldi',
          message: `${p.nom} dan atigi ${p.joriyQoldiq} ${p.birlik} qoldi (Minimal: ${p.minimalQoldiq} ${p.birlik}).`,
          time: 'Hozir',
          sortTime: now.getTime() + 50000, // Second highest priority
          productId: p.id,
        });
      }
    });

    // 2. Dynamic: Debt due dates (today or overdue)
    debts.forEach(d => {
      const qolgan = d.jamiSumma - d.tolanganSumma;
      if (qolgan > 0) {
        const muddat = new Date(d.muddat);
        if (isSameDay(muddat, now) || muddat < now) {
          items.push({
            id: `notif_due_${d.id}`,
            type: 'debt_due',
            title: 'Qarz muddati keldi',
            message: `${d.mijozIsm} ning ${formatPrice(qolgan)} so'm qarzni to'lash muddati ${formatUzDate(muddat)} da.`,
            time: 'Bugun',
            sortTime: muddat.getTime(),
            debtId: d.id,
          });
        }
      }
    });

    // 3. Static: Events from NotificationsStore (added products, sales, debt payments)
    storeNotifications.forEach(n => {
      const timeDate = new Date(n.time);
      items.push({
        id: n.id,
        type: n.type as NotificationItem['type'],
        title: n.title,
        message: n.message,
        time: formatUzDate(timeDate),
        sortTime: timeDate.getTime(),
      });
    });

    // Sort by sortTime descending
    return items.sort((a, b) => b.sortTime - a.sortTime);
  }, [products, debts, storeNotifications]);

  const renderItem = ({ item }: { item: NotificationItem }) => {
    let Icon = Info;
    let iconColor = colors.primary;
    let bgColor = colors.primary + '15';

    switch (item.type) {
      case 'out_of_stock':
        Icon = PackageX;
        iconColor = colors.status.red;
        bgColor = colors.status.red + '15';
        break;
      case 'low_stock':
        Icon = AlertTriangle;
        iconColor = colors.status.amber;
        bgColor = colors.status.amber + '15';
        break;
      case 'product_added':
        Icon = PackagePlus;
        iconColor = colors.status.green;
        bgColor = colors.status.green + '15';
        break;
      case 'sale_made':
        Icon = ShoppingCart;
        iconColor = colors.primary;
        bgColor = colors.primary + '15';
        break;
      case 'debt_paid':
        Icon = CheckCircle;
        iconColor = colors.status.green;
        bgColor = colors.status.green + '15';
        break;
      case 'debt_due':
        Icon = CalendarClock;
        iconColor = colors.status.red;
        bgColor = colors.status.red + '15';
        break;
    }

    const handlePress = () => {
      if (item.productId) {
        router.push(`/product/${item.productId}` as any);
      } else if (item.debtId) {
        router.push(`/debt/${item.debtId}` as any);
      }
    };

    return (
      <TouchableOpacity 
        style={[styles.notificationCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.md }]}
        activeOpacity={item.productId || item.debtId ? 0.7 : 1}
        onPress={handlePress}
        disabled={!item.productId && !item.debtId}
      >
        <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
          <Icon size={24} color={iconColor} />
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={{ color: colors.text, fontFamily: typography.fontFamily.bold, fontSize: 16, flex: 1, marginRight: 8 }}>{item.title}</Text>
            <Text style={{ color: colors.muted, fontFamily: typography.fontFamily.regular, fontSize: 12 }}>{item.time}</Text>
          </View>
          <Text style={{ color: colors.muted, fontFamily: typography.fontFamily.regular, fontSize: 14, marginTop: 4, lineHeight: 20 }}>
            {item.message}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ color: colors.text, fontFamily: typography.fontFamily.bold, fontSize: 18 }}>
            Bildirishnomalar
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl * 2 }}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ marginTop: spacing.xl * 2 }}>
            <EmptyState 
              icon={<BellRing size={48} color={colors.muted} />}
              title="Hech qanday bildirishnoma yo'q"
              description="Hozircha tizimda yangiliklar mavjud emas."
            />
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  }
});
