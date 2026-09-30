import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '../../src/theme';
import { useProductsStore } from '../../src/features/store/ProductsStore';
import { useAuth } from '../../src/lib/auth';
import { useNotificationsStore } from '../../src/features/store/NotificationsStore';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { SegmentedControl } from '../../src/components/SegmentedControl';
import { ImagePickerField } from '../../src/components/ImagePickerField';
import { CategoryPickerSheet } from '../../src/features/products/components/CategoryPickerSheet';
import { DatePickerSheet } from '../../src/features/products/components/DatePickerSheet';
import { Snackbar } from '../../src/components/Snackbar';
import { formatDate } from '../../src/lib/format';
import { ChevronLeft, Folder, Calendar } from 'lucide-react-native';

const formatNumberStr = (val: string) => {
  const numeric = val.replace(/\D/g, '');
  return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const parseFormattedNumber = (val: string) => {
  return parseFloat(val.replace(/\s/g, '')) || 0;
};

export default function ProductFormScreen() {
  const { id } = useLocalSearchParams();
  const isEdit = !!id;
  const { colors, typography, spacing, radius } = useTheme();
  const { state: { products }, dispatch } = useProductsStore();
  const { dispatch: dispatchNotif } = useNotificationsStore();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.replace('/(tabs)/products');
    }
  }, [user]);

  const existingProduct = isEdit ? products.find(p => p.id === id) : null;

  const [photoUri, setPhotoUri] = useState<string | null>(existingProduct?.rasm || null);
  const [nomi, setNomi] = useState(existingProduct?.nom || '');
  const [kategoriya, setKategoriya] = useState(existingProduct?.category || '');
  const [birlik, setBirlik] = useState(existingProduct?.birlik || 'dona');
  const [sotuvNarxiStr, setSotuvNarxiStr] = useState(existingProduct ? formatNumberStr(String(existingProduct.sotuvNarxi)) : '');
  const [tannarxStr, setTannarxStr] = useState(existingProduct ? formatNumberStr(String(existingProduct.tannarx)) : '');
  const [miqdorStr, setMiqdorStr] = useState(isEdit ? String(existingProduct?.joriyQoldiq) : '0');
  const [minQoldiqStr, setMinQoldiqStr] = useState(existingProduct ? String(existingProduct.minimalQoldiq) : '5');
  const [kelganSana, setKelganSana] = useState<Date>(new Date());
  const [taminotchi, setTaminotchi] = useState('');

  const [isCategorySheetVisible, setIsCategorySheetVisible] = useState(false);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const [isDirty, setIsDirty] = useState(false);

  // Mark dirty
  useEffect(() => {
    if (nomi || kategoriya || sotuvNarxiStr || tannarxStr || miqdorStr !== (isEdit ? String(existingProduct?.joriyQoldiq) : '0')) {
      setIsDirty(true);
    }
  }, [nomi, kategoriya, sotuvNarxiStr, tannarxStr, miqdorStr]);

  const handleBack = () => {
    if (isDirty) {
      Alert.alert(
        "Diqqat",
        "O'zgarishlar saqlanmaydi. Chiqasizmi?",
        [
          { text: "Bekor qilish", style: "cancel" },
          { text: "Chiqish", style: "destructive", onPress: () => router.back() }
        ]
      );
    } else {
      router.back();
    }
  };

  const sotuvNarxi = parseFormattedNumber(sotuvNarxiStr);
  const tannarx = parseFormattedNumber(tannarxStr);
  const miqdor = parseFloat(miqdorStr) || 0;
  const minimalQoldiq = parseFloat(minQoldiqStr) || 0;

  const isNameValid = nomi.trim().length > 0;
  const isCategoryValid = kategoriya.length > 0;
  const isSotuvValid = sotuvNarxi > 0;
  const isTannarxValid = tannarx > 0;
  const isMiqdorValid = miqdor >= 0;
  const isMinQoldiqValid = minimalQoldiq >= 0;

  const isValid = isNameValid && isCategoryValid && isSotuvValid && isTannarxValid && isMiqdorValid && isMinQoldiqValid;
  const warnNarx = sotuvNarxi > 0 && tannarx > 0 && sotuvNarxi < tannarx;
  const warnBundayNom = products.some(p => p.nom.toLowerCase() === nomi.trim().toLowerCase() && p.id !== id);

  const handleSave = () => {
    if (!isValid) return;

    if (isEdit && existingProduct) {
      dispatch({
        type: 'UPDATE_PRODUCT',
        payload: {
          id: existingProduct.id,
          nom: nomi.trim(),
          category: kategoriya,
          rasm: photoUri || 'CircleDashed',
          sotuvNarxi,
          tannarx,
          birlik: birlik as any,
          minimalQoldiq,
        }
      });
      setSnackbarMessage("O'zgarishlar saqlandi");
    } else {
      const newId = `p_${Date.now()}`;
      const sanaIso = kelganSana.toISOString();
      const newProduct = {
        id: newId,
        nom: nomi.trim(),
        category: kategoriya,
        rasm: photoUri || 'CircleDashed',
        sotuvNarxi,
        tannarx,
        birlik: birlik as any,
        joriyQoldiq: miqdor,
        minimalQoldiq,
        qoshilganSana: sanaIso,
        oxirgiKirimSana: sanaIso,
        movements: miqdor > 0 ? [{
          id: `m_${Date.now()}`,
          productId: newId,
          tur: 'kirim' as const,
          miqdor,
          sana: sanaIso,
          tannarx,
          taminotchi: taminotchi.trim() || undefined
        }] : []
      };
      dispatch({ type: 'ADD_PRODUCT', payload: newProduct });
      dispatchNotif({
        type: 'ADD_NOTIFICATION',
        payload: {
          type: 'product_added',
          title: 'Yangi mahsulot',
          message: `${nomi.trim()} bazaga qo'shildi`,
          time: new Date().toISOString(),
        }
      });
      setSnackbarMessage("Mahsulot qo'shildi");
    }

    setIsDirty(false);
    setSnackbarVisible(true);
    setTimeout(() => {
      router.back();
    }, 1000);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleBack} style={[styles.backBtn, { backgroundColor: colors.card }]}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
            <Text style={{ color: colors.text, fontFamily: typography.fontFamily.bold, fontSize: 18 }}>
              {isEdit ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}
            </Text>
            <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={{ color: colors.primary, fontFamily: typography.fontFamily.semiBold, fontSize: 10 }}>ADMIN</Text>
            </View>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          <ImagePickerField 
            label="Rasm"
            value={photoUri}
            onChange={setPhotoUri}
          />

          <View style={{ marginBottom: spacing.md }}>
            <Input 
              label="Nomi *" 
              placeholder="Masalan, Plastik quvur 20mm" 
              value={nomi}
              onChangeText={setNomi}
              style={{ marginBottom: 4 }}
            />
            {!isNameValid && nomi.length > 0 && <Text style={[styles.errorText, { color: colors.status.red }]}>Nomi kiritilishi shart</Text>}
            {warnBundayNom && <Text style={[styles.warnText, { color: colors.status.amber }]}>Bunday nomli mahsulot bor</Text>}
          </View>

          <View style={{ marginBottom: spacing.md }}>
            <Text style={[styles.label, { color: colors.text, fontFamily: typography.fontFamily.medium }]}>Kategoriya *</Text>
            <TouchableOpacity 
              style={[styles.pickerBtn, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.md }]}
              onPress={() => setIsCategorySheetVisible(true)}
            >
              <Text style={{ color: kategoriya ? colors.text : colors.muted, fontFamily: typography.fontFamily.medium }}>
                {kategoriya || "Tanlang..."}
              </Text>
              <Folder size={20} color={colors.muted} />
            </TouchableOpacity>
            {!isCategoryValid && isDirty && <Text style={[styles.errorText, { color: colors.status.red }]}>Kategoriya kiritilishi shart</Text>}
          </View>

          <View style={{ marginBottom: spacing.md }}>
            <Text style={[styles.label, { color: colors.text, fontFamily: typography.fontFamily.medium }]}>O'lchov birligi</Text>
            <SegmentedControl 
              segments={[
                { id: 'dona', label: 'dona' },
                { id: 'metr', label: 'metr' },
                { id: 'kg', label: 'kg' },
                { id: 'litr', label: 'litr' }
              ]} 
              activeSegment={birlik}
              onChange={(id) => setBirlik(id as any)}
            />
          </View>

          <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Input 
                label="Sotuv narxi *" 
                placeholder="0" 
                value={sotuvNarxiStr}
                onChangeText={(val) => setSotuvNarxiStr(formatNumberStr(val))}
                keyboardType="numeric"
                style={{ marginBottom: 4 }}
              />
              {!isSotuvValid && sotuvNarxiStr.length > 0 && <Text style={[styles.errorText, { color: colors.status.red }]}>0 dan katta bo'lishi kerak</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Input 
                label="Tannarx *" 
                placeholder="0" 
                value={tannarxStr}
                onChangeText={(val) => setTannarxStr(formatNumberStr(val))}
                keyboardType="numeric"
                style={{ marginBottom: 4 }}
              />
              {!isTannarxValid && tannarxStr.length > 0 && <Text style={[styles.errorText, { color: colors.status.red }]}>0 dan katta bo'lishi kerak</Text>}
            </View>
          </View>
          {warnNarx && <Text style={[styles.warnText, { color: colors.status.amber, marginTop: -12, marginBottom: 16 }]}>Sotuv narxi tannarxdan past</Text>}

          {!isEdit ? (
            <View style={{ marginBottom: spacing.md }}>
              <Input 
                label="Boshlang'ich miqdor" 
                placeholder="0" 
                value={miqdorStr}
                onChangeText={setMiqdorStr}
                keyboardType="numeric"
                style={{ marginBottom: 4 }}
              />
              {!isMiqdorValid && <Text style={[styles.errorText, { color: colors.status.red }]}>Manfiy bo'lishi mumkin emas</Text>}
            </View>
          ) : (
            <View style={{ marginBottom: spacing.md }}>
              <Text style={[styles.label, { color: colors.text, fontFamily: typography.fontFamily.medium }]}>Joriy qoldiq</Text>
              <View style={[styles.readOnly, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.md }]}>
                <Text style={{ color: colors.text, fontFamily: typography.fontFamily.semiBold }}>{existingProduct?.joriyQoldiq} {existingProduct?.birlik}</Text>
              </View>
              <Text style={{ color: colors.muted, fontFamily: typography.fontFamily.regular, fontSize: 12, marginTop: 4 }}>Miqdorni Kirim orqali o'zgartiring</Text>
            </View>
          )}

          <View style={{ marginBottom: spacing.md }}>
            <Input 
              label="Minimal qoldiq" 
              placeholder="5" 
              value={minQoldiqStr}
              onChangeText={setMinQoldiqStr}
              keyboardType="numeric"
              style={{ marginBottom: 4 }}
            />
            {!isMinQoldiqValid && <Text style={[styles.errorText, { color: colors.status.red }]}>Manfiy bo'lishi mumkin emas</Text>}
          </View>

          {!isEdit && (
            <>
              <View style={{ marginBottom: spacing.md }}>
                <Text style={[styles.label, { color: colors.text, fontFamily: typography.fontFamily.medium }]}>Kelgan sana</Text>
                <TouchableOpacity 
                  style={[styles.pickerBtn, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.md }]}
                  onPress={() => setIsDatePickerVisible(true)}
                >
                  <Text style={{ color: colors.text, fontFamily: typography.fontFamily.medium }}>
                    {formatDate(kelganSana.toISOString())}
                  </Text>
                  <Calendar size={20} color={colors.muted} />
                </TouchableOpacity>
              </View>

              <View style={{ marginBottom: spacing.md }}>
                <Input 
                  label="Ta'minotchi (ixtiyoriy)" 
                  placeholder="Kompaniya yoki shaxs" 
                  value={taminotchi}
                  onChangeText={setTaminotchi}
                />
              </View>
            </>
          )}
        </ScrollView>

        <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border, padding: spacing.md }]}>
          <Button 
            title="Saqlash" 
            onPress={handleSave}
            disabled={!isValid}
          />
        </View>

      </KeyboardAvoidingView>

      <CategoryPickerSheet 
        visible={isCategorySheetVisible}
        onClose={() => setIsCategorySheetVisible(false)}
        selectedCategory={kategoriya}
        onSelect={(cat) => {
          setKategoriya(cat);
          setIsCategorySheetVisible(false);
        }}
      />

      <DatePickerSheet 
        visible={isDatePickerVisible}
        onClose={() => setIsDatePickerVisible(false)}
        initialDate={kelganSana}
        onApply={(d) => {
          setKelganSana(d);
          setIsDatePickerVisible(false);
        }}
      />

      <Snackbar 
        visible={snackbarVisible}
        message={snackbarMessage}
        onDismiss={() => setSnackbarVisible(false)}
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
  badge: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  pickerBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  readOnly: {
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  warnText: {
    fontSize: 12,
    marginTop: 4,
  },
  bottomBar: {
    borderTopWidth: 1,
  }
});
