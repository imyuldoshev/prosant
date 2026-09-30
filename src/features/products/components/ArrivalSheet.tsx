import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { useTheme } from '../../../theme';
import { useProductsStore } from '../../store/ProductsStore';
import { Product } from '../../../types';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { DatePickerSheet } from './DatePickerSheet';
import { Snackbar } from '../../../components/Snackbar';
import { formatDate } from '../../../lib/format';
import { X, Search, Calendar, Minus, Plus } from 'lucide-react-native';

interface ArrivalSheetProps {
  visible: boolean;
  onClose: () => void;
  preselectedProductId?: string | null;
}

export function ArrivalSheet({ visible, onClose, preselectedProductId }: ArrivalSheetProps) {
  const { colors, typography, radius, spacing } = useTheme();
  const { state: { products }, dispatch } = useProductsStore();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [qtyStr, setQtyStr] = useState('0');
  const [tannarxStr, setTannarxStr] = useState('');
  const [taminotchi, setTaminotchi] = useState('');
  const [izoh, setIzoh] = useState('');
  
  const [date, setDate] = useState<Date>(new Date());
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    if (visible) {
      if (preselectedProductId) {
        const p = products.find(p => p.id === preselectedProductId) || null;
        setSelectedProduct(p);
        if (p) {
          setTannarxStr(p.tannarx.toString());
        }
      } else {
        setSelectedProduct(null);
      }
      setQtyStr('0');
      setSearchQuery('');
      setTaminotchi('');
      setIzoh('');
      setDate(new Date());
    }
  }, [visible, preselectedProductId, products]);

  const qty = parseFloat(qtyStr) || 0;
  const newTannarx = tannarxStr ? parseFloat(tannarxStr.replace(/\s/g, '')) : undefined;

  const searchResults = products
    .filter(p => p.nom.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleConfirm = () => {
    if (!selectedProduct || qty <= 0) return;

    const movement = {
      id: Math.random().toString(),
      productId: selectedProduct.id,
      tur: 'kirim' as const,
      miqdor: qty,
      sana: date.toISOString(),
      tannarx: newTannarx,
      taminotchi: taminotchi || undefined,
      izoh: izoh || undefined
    };

    dispatch({
      type: 'ADD_STOCK_ARRIVAL',
      payload: {
        productId: selectedProduct.id,
        movement,
        newTannarx
      }
    });

    setSnackbarMessage(`${qty} ${selectedProduct.birlik} kirim qilindi`);
    setSnackbarVisible(true);
    
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const incrementQty = () => setQtyStr(String(qty + 1));
  const decrementQty = () => setQtyStr(String(Math.max(0, qty - 1)));

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
        <KeyboardAvoidingView 
          style={styles.overlay} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableWithoutFeedback onPress={onClose}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          
          <View style={[styles.sheet, { backgroundColor: colors.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }]}>
            <View style={styles.header}>
              <Text style={{ color: colors.text, fontFamily: typography.fontFamily.bold, fontSize: 18 }}>
                Kirim qilish
              </Text>
              <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.card }]}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl * 2 }} showsVerticalScrollIndicator={false}>
              
              {!selectedProduct ? (
                <View style={{ marginBottom: spacing.lg }}>
                  <Input 
                    label="Mahsulotni tanlang" 
                    placeholder="Qidirish..." 
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    icon={<Search size={20} color={colors.muted} />}
                  />
                  
                  {searchResults.length > 0 && (
                    <View style={[styles.searchResults, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.md }]}>
                      {searchResults.map(p => (
                        <TouchableOpacity 
                          key={p.id} 
                          style={[styles.resultItem, { borderBottomColor: colors.border }]}
                          onPress={() => {
                            setSelectedProduct(p);
                            setTannarxStr(p.tannarx.toString());
                            setSearchQuery('');
                          }}
                        >
                          <Text style={{ color: colors.text, fontFamily: typography.fontFamily.medium }}>{p.nom}</Text>
                          <Text style={{ color: colors.muted, fontFamily: typography.fontFamily.regular, fontSize: 12 }}>Qoldiq: {p.joriyQoldiq} {p.birlik}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              ) : (
                <View style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.md, marginBottom: spacing.lg }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontFamily: typography.fontFamily.semiBold, fontSize: 16 }}>{selectedProduct.nom}</Text>
                    <Text style={{ color: colors.muted, fontFamily: typography.fontFamily.regular, fontSize: 13, marginTop: 4 }}>
                      Joriy qoldiq: <Text style={{ fontFamily: typography.fontFamily.semiBold }}>{selectedProduct.joriyQoldiq} {selectedProduct.birlik}</Text>
                    </Text>
                  </View>
                  {!preselectedProductId && (
                    <TouchableOpacity onPress={() => setSelectedProduct(null)}>
                      <Text style={{ color: colors.primary, fontFamily: typography.fontFamily.medium }}>O'zgartirish</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {selectedProduct && (
                <View style={{ gap: spacing.md }}>
                  <View>
                    <Text style={{ color: colors.text, fontFamily: typography.fontFamily.medium, marginBottom: 8, fontSize: 14 }}>Miqdor <Text style={{ color: colors.status.red }}>*</Text></Text>
                    <View style={[styles.stepperContainer, { borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.card }]}>
                      <TouchableOpacity onPress={decrementQty} style={[styles.stepperBtn, { borderRightColor: colors.border }]}>
                        <Minus size={20} color={colors.text} />
                      </TouchableOpacity>
                      <TextInput 
                        style={[styles.stepperInput, { color: colors.text, fontFamily: typography.fontFamily.semiBold }]}
                        value={qtyStr}
                        onChangeText={setQtyStr}
                        keyboardType="numeric"
                        textAlign="center"
                      />
                      <TouchableOpacity onPress={incrementQty} style={[styles.stepperBtn, { borderLeftColor: colors.border }]}>
                        <Plus size={20} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View>
                    <Text style={{ color: colors.text, fontFamily: typography.fontFamily.medium, marginBottom: 8, fontSize: 14 }}>Kelgan sana</Text>
                    <TouchableOpacity 
                      style={[styles.dateBtn, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.md }]}
                      onPress={() => setIsDatePickerVisible(true)}
                    >
                      <Text style={{ color: colors.text, fontFamily: typography.fontFamily.medium }}>{formatDate(date.toISOString())}</Text>
                      <Calendar size={20} color={colors.muted} />
                    </TouchableOpacity>
                  </View>

                  <Input 
                    label="Yangi tannarx (ixtiyoriy)" 
                    placeholder="0 so'm"
                    value={tannarxStr}
                    onChangeText={setTannarxStr}
                    keyboardType="numeric"
                  />
                  
                  <Input 
                    label="Ta'minotchi (ixtiyoriy)" 
                    placeholder="Kompaniya yoki shaxs nomi"
                    value={taminotchi}
                    onChangeText={setTaminotchi}
                  />

                  <Input 
                    label="Izoh (ixtiyoriy)" 
                    placeholder="Qo'shimcha ma'lumotlar"
                    value={izoh}
                    onChangeText={setIzoh}
                  />
                  
                  {qty > 0 && (
                    <View style={{ alignItems: 'center', marginVertical: spacing.sm }}>
                      <Text style={{ color: colors.primary, fontFamily: typography.fontFamily.medium }}>
                        Qoldiq: {selectedProduct.joriyQoldiq}  →  {selectedProduct.joriyQoldiq + qty} {selectedProduct.birlik}
                      </Text>
                    </View>
                  )}

                  <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
                    <Button 
                      title="Bekor qilish" 
                      variant="secondary" 
                      onPress={onClose}
                      style={{ flex: 1 }}
                    />
                    <Button 
                      title="Tasdiqlash" 
                      onPress={handleConfirm}
                      disabled={qty <= 0}
                      style={{ flex: 1 }}
                    />
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <DatePickerSheet 
        visible={isDatePickerVisible}
        onClose={() => setIsDatePickerVisible(false)}
        initialDate={date}
        onApply={(d) => {
          setDate(d);
          setIsDatePickerVisible(false);
        }}
      />
      
      <Snackbar 
        visible={snackbarVisible}
        message={snackbarMessage}
        onDismiss={() => setSnackbarVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 0,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResults: {
    borderWidth: 1,
    marginTop: 8,
  },
  resultItem: {
    padding: 12,
    borderBottomWidth: 1,
  },
  productCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
  },
  stepperContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    height: 48,
  },
  stepperBtn: {
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperInput: {
    flex: 1,
    fontSize: 16,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'transparent',
  },
  dateBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
  },
});
