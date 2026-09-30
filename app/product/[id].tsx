import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '../../src/theme';
import { mockProducts } from '../../src/features/products/mockData';
import { formatPrice } from '../../src/lib/format';
import { Badge } from '../../src/components/Badge';
import { Button } from '../../src/components/Button';
import { 
  ChevronLeft, 
  CircleDashed, 
  Droplet, 
  Bath, 
  Target, 
  CornerUpRight, 
  Component, 
  Server,
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react-native';

const getIconForProduct = (iconName: string, color: string, size: number = 32) => {
  const props = { color, size };
  switch (iconName) {
    case 'Droplet': return <Droplet {...props} />;
    case 'Bath': return <Bath {...props} />;
    case 'Target': return <Target {...props} />;
    case 'CornerUpRight': return <CornerUpRight {...props} />;
    case 'Component': return <Component {...props} />;
    case 'Server': return <Server {...props} />;
    case 'CircleDashed':
    default: return <CircleDashed {...props} />;
  }
};

const mockMovements = [
  { id: '1', type: 'kirim', qty: 50, date: 'Bugun, 14:30' },
  { id: '2', type: 'chiqim', qty: 3, date: 'Bugun, 10:15' },
  { id: '3', type: 'chiqim', qty: 12, date: 'Kecha, 16:45' },
  { id: '4', type: 'kirim', qty: 100, date: '25 Sen, 09:00' },
  { id: '5', type: 'chiqim', qty: 5, date: '24 Sen, 11:20' },
];

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const { colors, typography, spacing, radius } = useTheme();

  const product = mockProducts.find(p => p.id === id);
  const userRole = 'admin'; // Mock user role

  if (!product) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text, fontFamily: typography.fontFamily.medium }}>Mahsulot topilmadi</Text>
        <Button title="Ortga" onPress={() => router.back()} style={{ marginTop: spacing.md }} />
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Image Area */}
        <View style={[styles.imageArea, { backgroundColor: colors.card, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }]}>
          <SafeAreaView>
            <TouchableOpacity 
              style={[styles.backBtn, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 22 }]}
              onPress={() => router.back()}
            >
              <ChevronLeft size={24} color={colors.text} />
            </TouchableOpacity>
          </SafeAreaView>
          <View style={styles.iconContainer}>
            {getIconForProduct(product.rasm, colors.muted, 100)}
          </View>
        </View>

        <View style={{ padding: spacing.lg }}>
          {/* Header Info */}
          <View style={{ marginBottom: spacing.lg }}>
            <Badge variant="neutral" label={product.category} style={{ marginBottom: spacing.sm }} />
            <Text style={{ color: colors.text, fontFamily: typography.fontFamily.bold, fontSize: 24, marginBottom: spacing.xs }}>
              {product.nom}
            </Text>
            <Text style={{ color: colors.primary, fontFamily: typography.fontFamily.bold, fontSize: 28 }}>
              {formatPrice(product.sotuvNarxi)}
            </Text>
          </View>

          {/* Info Card */}
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderRadius: radius.lg, borderColor: colors.border }]}>
            {userRole === 'admin' && (
              <View style={[styles.infoRow, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ color: colors.muted, fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.md }}>Tannarx</Text>
                  <Badge variant="neutral" label="Faqat admin" style={{ marginLeft: spacing.sm }} />
                </View>
                <Text style={{ color: colors.text, fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.md }}>
                  {formatPrice(product.tannarx)}
                </Text>
              </View>
            )}
            <View style={[styles.infoRow, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <Text style={{ color: colors.muted, fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.md }}>Qoldiq</Text>
              <Text style={{ color: colors.text, fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.md }}>
                {product.joriyQoldiq} {product.birlik}
              </Text>
            </View>
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <Text style={{ color: colors.muted, fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.md }}>Minimal qoldiq</Text>
              <Text style={{ color: colors.text, fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.md }}>
                {product.minimalQoldiq} {product.birlik}
              </Text>
            </View>
          </View>

          {/* Recent Movements */}
          <View style={{ marginTop: spacing.xl }}>
            <Text style={{ color: colors.text, fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.lg, marginBottom: spacing.md }}>
              So'nggi harakatlar
            </Text>
            
            {mockMovements.map((move, index) => {
              const isKirim = move.type === 'kirim';
              const Icon = isKirim ? ArrowDownRight : ArrowUpRight;
              const iconColor = isKirim ? colors.status.green : colors.status.red;
              const sign = isKirim ? '+' : '-';
              
              return (
                <View key={move.id} style={[styles.movementRow, { borderBottomWidth: index === mockMovements.length - 1 ? 0 : 1, borderBottomColor: colors.border }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.movementIcon, { backgroundColor: `${iconColor}20` }]}>
                      <Icon size={20} color={iconColor} />
                    </View>
                    <View style={{ marginLeft: spacing.md }}>
                      <Text style={{ color: colors.text, fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.md }}>
                        {isKirim ? 'Kirim' : 'Chiqim'}
                      </Text>
                      <Text style={{ color: colors.muted, fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm, marginTop: 2 }}>
                        {move.date}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ color: iconColor, fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.md }}>
                    {sign}{move.qty} {product.birlik}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      {userRole === 'admin' && (
        <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <Button 
            title="Tahrirlash" 
            variant="secondary" 
            style={{ flex: 1, marginRight: spacing.sm }} 
            onPress={() => {}}
          />
          <Button 
            title="Kirim qilish" 
            variant="primary" 
            style={{ flex: 1, marginLeft: spacing.sm }} 
            onPress={() => {}}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  imageArea: {
    height: 320,
    width: '100%',
    position: 'relative',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  backBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    zIndex: 10,
  },
  iconContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  movementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  movementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 32, // SafeArea fallback
    borderTopWidth: 1,
  },
});
