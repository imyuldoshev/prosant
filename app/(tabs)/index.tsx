import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { Input } from '../../src/components/Input';
import { Badge } from '../../src/components/Badge';
import { EmptyState } from '../../src/components/EmptyState';
import { useTheme } from '../../src/theme';
import { useProductsStore } from '../../src/features/store/ProductsStore';
import { useSalesStore } from '../../src/features/store/SalesStore';
import { formatPrice } from '../../src/lib/format';
import { Category, Product } from '../../src/types';
import { Bell, Search, SlidersHorizontal, CircleDashed, Droplet, Bath, Target, CornerUpRight, Component, Server } from 'lucide-react-native';
import { router } from 'expo-router';
import { DateFilterSheet } from '../../src/features/products/components/DateFilterSheet';
import { isWithinRange, formatUzDate, isSameDay } from '../../src/lib/dates';

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

export default function DashboardScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'Hammasi'>('Hammasi');
  const [refreshing, setRefreshing] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  
  const [dateFilterStart, setDateFilterStart] = useState<Date | null>(null);
  const [dateFilterEnd, setDateFilterEnd] = useState<Date | null>(null);
  const [dateFilterPreset, setDateFilterPreset] = useState<string | null>('all');
  const [isFilterSheetVisible, setIsFilterSheetVisible] = useState(false);

  const { state: { products } } = useProductsStore();
  const { state: { sales } } = useSalesStore();

  const categories = ['Hammasi', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.nom.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'Hammasi' || p.category === selectedCategory;
      
      let matchesDate = true;
      if (dateFilterStart) {
        const arrivalDate = new Date(p.oxirgiKirimSana);
        if (dateFilterStart && dateFilterEnd) {
          matchesDate = isWithinRange(arrivalDate, dateFilterStart, dateFilterEnd);
        } else {
          matchesDate = isSameDay(arrivalDate, dateFilterStart);
        }
      }
      
      return matchesSearch && matchesCategory && matchesDate;
    });
  }, [searchQuery, selectedCategory, dateFilterStart, dateFilterEnd, products]);

  const getMatchCountForFilter = useCallback((start: Date | null, end: Date | null) => {
    if (!start) return products.length;
    let list = products.filter(p => {
        const arrivalDate = new Date(p.oxirgiKirimSana);
        if (start && end) {
          return isWithinRange(arrivalDate, start, end);
        } else {
          return isSameDay(arrivalDate, start);
        }
    });
    return list.length;
  }, [products]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.joriyQoldiq <= p.minimalQoldiq && p.joriyQoldiq > 0).length;
  const zeroStockProducts = products.filter(p => p.joriyQoldiq === 0).length;
  const issuesCount = lowStockProducts + zeroStockProducts;

  const todaySalesByProduct = useMemo(() => {
    const aggregated: Record<string, boolean> = {};
    sales.forEach(entry => {
      aggregated[entry.productId] = true;
    });
    return aggregated;
  }, [sales]);

  const soldProductsCount = Object.keys(todaySalesByProduct).length;

  const navigateToProduct = (id: string) => {
    setIsNavigating(true);
    setTimeout(() => {
      router.push(`/product/${id}` as any);
      setIsNavigating(false);
    }, 300);
  };

  const navigateToTab = (segment: string) => {
    setIsNavigating(true);
    setTimeout(() => {
      router.navigate({ pathname: '/(tabs)/products', params: { segment } });
      setIsNavigating(false);
    }, 300);
  };

  const renderProduct = ({ item }: { item: Product }) => {
    let badge = null;
    if (item.joriyQoldiq === 0) {
      badge = <Badge variant="danger" label="Tugagan" style={styles.cardBadge} />;
    } else if (item.joriyQoldiq <= item.minimalQoldiq) {
      badge = <Badge variant="warning" label="Kam qoldi" style={styles.cardBadge} />;
    }

    return (
      <TouchableOpacity 
        style={[styles.productCard, { backgroundColor: colors.card, borderRadius: radius.lg, borderColor: colors.border }]}
        onPress={() => navigateToProduct(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.imageArea, { backgroundColor: colors.background, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg }]}>
          {badge}
          {getIconForProduct(item.rasm, colors.muted, 40)}
        </View>
        <View style={[styles.cardContent, { padding: spacing.md }]}>
          <Text 
            style={{ color: colors.text, fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm, marginBottom: spacing.xs }}
            numberOfLines={2}
          >
            {item.nom}
          </Text>
          <Text style={{ color: colors.primary, fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.md, marginBottom: spacing.xs }}>
            {formatPrice(item.sotuvNarxi)}
          </Text>
          <Text style={{ color: colors.muted, fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.xs, marginBottom: spacing.sm }}>
            Qoldiq: {item.joriyQoldiq} {item.birlik}
          </Text>
          <TouchableOpacity 
            style={{ 
              backgroundColor: item.joriyQoldiq === 0 ? colors.border : colors.primary, 
              paddingVertical: 6, 
              borderRadius: radius.sm, 
              alignItems: 'center' 
            }}
            onPress={() => {
              router.navigate({ pathname: '/(tabs)/sales', params: { addProductId: item.id } });
            }}
            disabled={item.joriyQoldiq === 0}
          >
            <Text style={{ color: '#FFF', fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.xs }}>Sotish</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Screen style={{ paddingHorizontal: 0 }}>
      <FlatList
        data={filteredProducts}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
        columnWrapperStyle={{ gap: spacing.md }}
        showsVerticalScrollIndicator={false}
        renderItem={renderProduct}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={{ marginBottom: spacing.lg }}>
            {/* Header Row */}
            <View style={[styles.headerRow, { marginBottom: spacing.lg }]}>
              <View>
                <Text style={{ color: colors.text, fontFamily: typography.fontFamily.bold, fontSize: 22 }}>
                  Salom, Admin
                </Text>
                <Text style={{ color: colors.muted, fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm, marginTop: 2 }}>
                  SantexPro
                </Text>
              </View>
              <TouchableOpacity 
                style={[styles.bellBtn, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: 22 }]}
                onPress={() => router.push('/notifications')}
              >
                <Bell size={20} color={colors.text} />
                {issuesCount > 0 && <View style={[styles.redDot, { backgroundColor: colors.status.red }]} />}
              </TouchableOpacity>
            </View>

            {/* Summary Row */}
            <View style={[styles.summaryRow, { gap: spacing.md, marginBottom: spacing.lg }]}>
              <TouchableOpacity 
                style={[styles.summaryCard, { backgroundColor: colors.card, borderRadius: radius.md, borderColor: colors.border }]}
                onPress={() => navigateToTab('all')}
                activeOpacity={0.7}
              >
                <Text style={{ textAlign: 'center', color: colors.muted, fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.xs, marginBottom: spacing.xs }}>
                  Jami mahsulot
                </Text>
                <Text style={{ textAlign: 'center', color: colors.text, fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.xl }}>
                  {totalProducts} ta
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.summaryCard, { backgroundColor: colors.card, borderRadius: radius.md, borderColor: colors.border }]}
                onPress={() => navigateToTab('low')}
                activeOpacity={0.7}
              >
                <Text style={{ textAlign: 'center', color: colors.muted, fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.xs, marginBottom: spacing.xs }}>
                  Kam qolgan
                </Text>
                <Text style={{ textAlign: 'center', color: colors.status.amber, fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.xl }}>
                  {issuesCount} ta
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.summaryCard, { backgroundColor: colors.card, borderRadius: radius.md, borderColor: colors.border }]}
                onPress={() => navigateToTab('sold')}
                activeOpacity={0.7}
              >
                <Text style={{ textAlign: 'center', color: colors.muted, fontFamily: typography.fontFamily.medium, fontSize: typography.fontSize.xs, marginBottom: spacing.xs }}>
                  Bugungi sotuv
                </Text>
                <Text style={{ textAlign: 'center', color: colors.primary, fontFamily: typography.fontFamily.bold, fontSize: typography.fontSize.xl }}>
                  {soldProductsCount} ta
                </Text>
              </TouchableOpacity>
            </View>

            {/* Search Row */}
            <View style={[styles.searchRow, { marginBottom: spacing.lg }]}>
              <View style={{ flex: 1 }}>
                <Input 
                  label="" 
                  placeholder="Mahsulot qidirish..." 
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  icon={<Search size={20} color={colors.muted} />}
                  style={{ marginBottom: 0 }}
                />
              </View>
              <TouchableOpacity 
                style={[
                  styles.filterBtn, 
                  { borderRadius: radius.md, marginLeft: spacing.md },
                  dateFilterStart ? { backgroundColor: colors.primary } : { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }
                ]}
                onPress={() => setIsFilterSheetVisible(true)}
              >
                <SlidersHorizontal size={20} color={dateFilterStart ? "#FFFFFF" : colors.text} />
              </TouchableOpacity>
            </View>

            {/* Category Chips */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={{ marginHorizontal: -spacing.md }}
              contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.sm, paddingBottom: spacing.sm }}
            >
              {categories.map((cat, idx) => {
                const isSelected = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setSelectedCategory(cat as any)}
                    style={[
                      styles.chip,
                      { 
                        backgroundColor: isSelected ? colors.primary : colors.card,
                        borderColor: isSelected ? colors.primary : colors.border,
                        borderRadius: 20
                      }
                    ]}
                  >
                    <Text style={{ 
                      color: isSelected ? '#FFFFFF' : colors.text,
                      fontFamily: typography.fontFamily.medium,
                      fontSize: typography.fontSize.sm
                    }}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View style={{ marginTop: spacing.xl }}>
            <EmptyState 
              icon={<Search size={48} color={colors.muted} />}
              title="Mahsulot topilmadi"
              description="Boshqa qidiruv so'zini kiritib ko'ring yoki filtrlarni tozalang"
            />
          </View>
        }
      />
      {isNavigating && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', zIndex: 999 }]}>
          <View style={{ backgroundColor: colors.card, padding: spacing.lg, borderRadius: radius.lg, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.text, fontFamily: typography.fontFamily.medium, marginTop: spacing.md }}>Yuklanmoqda...</Text>
          </View>
        </View>
      )}

      <DateFilterSheet
        visible={isFilterSheetVisible}
        onClose={() => setIsFilterSheetVisible(false)}
        initialStart={dateFilterStart}
        initialEnd={dateFilterEnd}
        initialPreset={dateFilterPreset}
        onApply={(start, end, preset) => {
          setDateFilterStart(start);
          setDateFilterEnd(end);
          setDateFilterPreset(preset);
          setIsFilterSheetVisible(false);
        }}
        arrivalDates={products.map(p => new Date(p.oxirgiKirimSana))}
        getMatchCount={getMatchCountForFilter}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bellBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: 10,
    right: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCard: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    height: 48,
    overflow: 'hidden',
  },
  filterBtn: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
  },
  productCard: {
    flex: 1,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 12, // For spacing between rows
  },
  imageArea: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cardBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 1,
  },
  cardContent: {
  },
});
