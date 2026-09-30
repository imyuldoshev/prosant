import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { useTheme } from '../../src/theme';
import { EmptyState } from '../../src/components/EmptyState';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { Search, ShoppingCart } from 'lucide-react-native';

import { useProductsStore } from '../../src/features/store/ProductsStore';
import { useSalesStore } from '../../src/features/store/SalesStore';
import { useDebtsStore } from '../../src/features/store/DebtsStore';
import { useNotificationsStore } from '../../src/features/store/NotificationsStore';
import { scheduleNotificationForDate } from '../../src/lib/notifications';

import { Product } from '../../src/types';
import { ProductSearchResults } from '../../src/features/sales/components/ProductSearchResults';
import { CartItemRow, CartItem } from '../../src/features/sales/components/CartItemRow';
import { PaymentTypeSelector, PaymentType } from '../../src/features/sales/components/PaymentTypeSelector';
import { DebtFields, DebtFormData } from '../../src/features/sales/components/DebtFields';
import { DueDatePickerSheet } from '../../src/features/sales/components/DueDatePickerSheet';
import { SaleSuccessSheet } from '../../src/features/sales/components/SaleSuccessSheet';

import { formatPrice } from '../../src/lib/format';
import { formatUzDate } from '../../src/lib/dates';

export default function SalesScreen() {
  const { colors, typography, radius, spacing } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Global Stores
  const { state: { products }, dispatch: dispatchProducts } = useProductsStore();
  const { dispatch: dispatchSales } = useSalesStore();
  const { dispatch: dispatchDebts } = useDebtsStore();
  const { dispatch: dispatchNotif } = useNotificationsStore();

  // Local State
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentType, setPaymentType] = useState<PaymentType>('Naqd');
  const [debtData, setDebtData] = useState<DebtFormData>({
    mijozIsm: '',
    telefon: '',
    muddat: null,
    izoh: ''
  });
  
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [isSuccessVisible, setSuccessVisible] = useState(false);

  // Search logic
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return products.filter(p => p.nom.toLowerCase().includes(q)).slice(0, 5);
  }, [searchQuery, products]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.joriyQoldiq) return prev;
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
    setSearchQuery('');
    Keyboard.dismiss();
  };

  React.useEffect(() => {
    if (params.addProductId && typeof params.addProductId === 'string') {
      const product = products.find(p => p.id === params.addProductId);
      if (product && product.joriyQoldiq > 0) {
        addToCart(product);
      }
      router.setParams({ addProductId: '' });
    }
  }, [params.addProductId, products]);

  const increaseQuantity = (productId: string) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId && item.quantity < item.product.joriyQoldiq) {
        return { ...item, quantity: item.quantity + 1 };
      }
      return item;
    }));
  };

  const decreaseQuantity = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === productId);
      if (existing && existing.quantity === 1) {
        return prev.filter(item => item.product.id !== productId);
      }
      return prev.map(item => item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item);
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.product.sotuvNarxi * item.quantity), 0);
  }, [cart]);

  // Validation
  const isCartEmpty = cart.length === 0;
  const isDebtValid = debtData.mijozIsm.trim() && debtData.telefon.trim() && debtData.muddat;
  const canSubmit = !isCartEmpty && (paymentType !== 'Qarzga' || !!isDebtValid);

  // Submit Logic
  const handleConfirm = () => {
    if (!canSubmit) return;

    const now = new Date().toISOString();

    // 1. Decrease Stock
    cart.forEach(item => {
      dispatchProducts({ type: 'DECREASE_STOCK', payload: { productId: item.product.id, amount: item.quantity } });
    });

    // 2. Add to Sales
    const saleEntries = cart.map(item => ({
      productId: item.product.id,
      miqdor: item.quantity,
      summa: item.product.sotuvNarxi * item.quantity,
      vaqt: now,
    }));
    dispatchSales({ type: 'ADD_SALES', payload: saleEntries });
    
    dispatchNotif({
      type: 'ADD_NOTIFICATION',
      payload: {
        type: 'sale_made',
        title: 'Yangi sotuv',
        message: `${saleEntries.length} xil mahsulot jami ${formatPrice(cartTotal)} so'mga sotildi`,
        time: now,
      }
    });

    // 3. Add to Debts if needed
    if (paymentType === 'Qarzga') {
      dispatchDebts({
        type: 'ADD_DEBT',
        payload: {
          mijozIsm: debtData.mijozIsm.trim(),
          telefon: debtData.telefon.trim(),
          jamiSumma: cartTotal,
          tolanganSumma: 0,
          berilganSana: now,
          muddat: debtData.muddat!,
          izoh: debtData.izoh.trim(),
        }
      });
      
      const muddatDate = new Date(debtData.muddat!);
      muddatDate.setHours(9, 0, 0, 0);
      scheduleNotificationForDate(
        "Qarz muddati",
        `${debtData.mijozIsm.trim()} ning qarz to'lash vaqti keldi`,
        muddatDate
      );
    }

    // 4. Show success
    setSuccessVisible(true);
  };

  const resetForm = () => {
    setCart([]);
    setPaymentType('Naqd');
    setDebtData({ mijozIsm: '', telefon: '', muddat: null, izoh: '' });
    setSearchQuery('');
    setSuccessVisible(false);
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: colors.background }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen style={{ paddingHorizontal: 0, paddingBottom: 0 }}>
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: spacing.md }]}>
          <Text style={{ color: colors.text, fontFamily: typography.fontFamily.bold, fontSize: 22 }}>
            Sotish
          </Text>
        </View>

        {/* Search */}
        <View style={{ paddingHorizontal: spacing.md, position: 'relative', zIndex: 20 }}>
          <View style={{ marginBottom: 16 }}>
            <Input
              label=""
              placeholder="Mahsulot qo'shish..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              icon={<Search size={20} color={colors.muted} />}
              style={{ marginBottom: 0 }}
            />
          </View>
          {searchQuery.length > 0 && (
            <ProductSearchResults results={searchResults} onSelect={addToCart} />
          )}
        </View>

        {/* Cart List */}
        <ScrollView 
          style={{ flex: 1, paddingHorizontal: spacing.md, marginTop: spacing.md }}
          contentContainerStyle={{ paddingBottom: spacing.xl * 2 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {isCartEmpty ? (
            <View style={{ marginTop: spacing.xl }}>
              <EmptyState 
                icon={<ShoppingCart size={48} color={colors.muted} />}
                title="Savat bo'sh"
                description="Sotish uchun mahsulot qidiring."
              />
            </View>
          ) : (
            cart.map(item => (
              <CartItemRow
                key={item.product.id}
                item={item}
                onIncrease={() => increaseQuantity(item.product.id)}
                onDecrease={() => decreaseQuantity(item.product.id)}
                onRemove={() => removeFromCart(item.product.id)}
              />
            ))
          )}
        </ScrollView>

        {/* Sticky Bottom Section */}
        <View style={[
          styles.bottomSection, 
          { backgroundColor: colors.card, borderTopColor: colors.border, padding: spacing.md }
        ]}>
          <View style={[styles.totalRow, { marginBottom: spacing.md }]}>
            <Text style={{ color: colors.text, fontFamily: typography.fontFamily.semiBold, fontSize: 18 }}>
              Jami:
            </Text>
            <Text style={{ color: colors.primary, fontFamily: typography.fontFamily.bold, fontSize: 22 }}>
              {formatPrice(cartTotal)}
            </Text>
          </View>
          
          <PaymentTypeSelector value={paymentType} onChange={setPaymentType} />
          
          {paymentType === 'Qarzga' && (
            <DebtFields 
              data={debtData} 
              onChange={setDebtData} 
              onOpenDatePicker={() => setDatePickerVisible(true)} 
              formattedMuddat={debtData.muddat ? formatUzDate(new Date(debtData.muddat)) : ''}
            />
          )}

          <Button 
            title="Sotishni tasdiqlash" 
            onPress={handleConfirm} 
            disabled={!canSubmit} 
            style={{ marginTop: spacing.lg }} 
          />
        </View>
      </Screen>

      <DueDatePickerSheet
        visible={isDatePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        initialDate={debtData.muddat ? new Date(debtData.muddat) : null}
        onSelect={(d) => {
          setDebtData(prev => ({ ...prev, muddat: d.toISOString() }));
          setDatePickerVisible(false);
        }}
      />

      <SaleSuccessSheet
        visible={isSuccessVisible}
        onNewSale={resetForm}
        onViewDebts={() => {
          resetForm();
          router.navigate('/(tabs)/debts');
        }}
        total={cartTotal}
        paymentType={paymentType}
        debtName={debtData.mijozIsm}
        debtDueDate={debtData.muddat ? formatUzDate(new Date(debtData.muddat)) : undefined}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
  },
  bottomSection: {
    borderTopWidth: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  }
});
