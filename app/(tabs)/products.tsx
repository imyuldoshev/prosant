import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Input } from '../../src/components/Input';
import { EmptyState } from '../../src/components/EmptyState';
import { SegmentedControl } from '../../src/components/SegmentedControl';
import { ProductRow } from '../../src/features/products/components/ProductRow';
import { ProductDetailModal } from '../../src/features/products/components/ProductDetailModal';
import { useTheme } from '../../src/theme';
import { useProductsStore } from '../../src/features/store/ProductsStore';
import { useSalesStore } from '../../src/features/store/SalesStore';
import { formatPrice } from '../../src/lib/format';
import { Product } from '../../src/types';
import { useAuth } from '../../src/lib/auth';
import { Search, PackageOpen, Calendar as CalendarIcon, X } from 'lucide-react-native';
import { DateFilterSheet } from '../../src/features/products/components/DateFilterSheet';
import { AddActionSheet } from '../../src/features/products/components/AddActionSheet';
import { ArrivalSheet } from '../../src/features/products/components/ArrivalSheet';
import { isWithinRange, formatUzDate, isSameDay } from '../../src/lib/dates';
import { Plus as PlusIcon } from 'lucide-react-native';

export default function ProductsScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const params = useLocalSearchParams();
  
  const [activeSegment, setActiveSegment] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  const [dateFilterStart, setDateFilterStart] = useState<Date | null>(null);
  const [dateFilterEnd, setDateFilterEnd] = useState<Date | null>(null);
  const [dateFilterPreset, setDateFilterPreset] = useState<string | null>('all');
  const [isFilterSheetVisible, setIsFilterSheetVisible] = useState(false);
  
  const [addActionSheetVisible, setAddActionSheetVisible] = useState(false);
  const [arrivalSheetVisible, setArrivalSheetVisible] = useState(false);
  const [arrivalPreselectId, setArrivalPreselectId] = useState<string | null>(null);
  
  const { state: { products } } = useProductsStore();
  const { state: { sales } } = useSalesStore();
  const { user } = useAuth();

  const todaySales = useMemo(() => {
    const aggregated: Record<string, { sotilganMiqdor: number; jamiSumma: number; entries: any[] }> = {};
    sales.forEach((entry: any) => {
      if (!aggregated[entry.productId]) {
        aggregated[entry.productId] = { sotilganMiqdor: 0, jamiSumma: 0, entries: [] };
      }
      aggregated[entry.productId].sotilganMiqdor += entry.miqdor;
      aggregated[entry.productId].jamiSumma += entry.summa;
      aggregated[entry.productId].entries.push(entry);
    });
    return aggregated;
  }, [sales]);

  const getMatchCountForFilter = useCallback((start: Date | null, end: Date | null) => {
    if (!start) return activeSegment === 'low' ? products.filter(p => p.joriyQoldiq <= p.minimalQoldiq).length : products.length;
    
    let list = activeSegment === 'low' ? products.filter(p => p.joriyQoldiq <= p.minimalQoldiq) : products;
    list = list.filter(p => {
        const arrivalDate = new Date(p.oxirgiKirimSana);
        if (start && end) {
          return isWithinRange(arrivalDate, start, end);
        } else {
          return isSameDay(arrivalDate, start);
        }
    });
    return list.length;
  }, [activeSegment, products]);

  // Handle params from dashboard
  useEffect(() => {
    if (params.segment && typeof params.segment === 'string') {
      setActiveSegment(params.segment);
      setSearchQuery('');
      // Optional: clear param so it doesn't re-trigger unexpectedly, though with expo-router it might stick.
      router.setParams({ segment: '' });
    }
  }, [params.segment]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  // Derive Counts for segments
  const { allCount, lowCount, soldCount, allFiltered, lowFiltered, soldFiltered } = useMemo(() => {
    const isDateFilterActive = (dateFilterStart !== null);
    
    const filterByDateAndSearch = (products: Product[]) => {
      let filtered = products;
      if (isDateFilterActive) {
        filtered = filtered.filter(p => {
          const arrivalDate = new Date(p.oxirgiKirimSana);
          if (dateFilterStart && dateFilterEnd) {
            return isWithinRange(arrivalDate, dateFilterStart, dateFilterEnd);
          } else if (dateFilterStart) {
            return isSameDay(arrivalDate, dateFilterStart);
          }
          return true;
        });
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(p => p.nom.toLowerCase().includes(q));
      }
      return filtered;
    }

    const all = filterByDateAndSearch(products);
    const low = filterByDateAndSearch(products.filter(p => p.joriyQoldiq <= p.minimalQoldiq));
    
    let sold = products.filter(p => todaySales[p.id]);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      sold = sold.filter(p => p.nom.toLowerCase().includes(q));
    }
    
    return {
      allCount: all.length,
      lowCount: low.length,
      soldCount: sold.length,
      allFiltered: all,
      lowFiltered: low,
      soldFiltered: sold
    };
  }, [dateFilterStart, dateFilterEnd, searchQuery, todaySales, products]);

  const segments = [
    { id: 'all', label: 'Jami mahsulot', count: allCount },
    { id: 'low', label: 'Kam qolgan', count: lowCount },
    { id: 'sold', label: 'Bugungi sotuv', count: soldCount },
  ];

  // Derive Lists
  const listData = useMemo(() => {
    const isDateFilterActive = (dateFilterStart !== null);
    if (activeSegment === 'all') {
      const list = [...allFiltered];
      if (isDateFilterActive) {
        list.sort((a, b) => new Date(b.oxirgiKirimSana).getTime() - new Date(a.oxirgiKirimSana).getTime());
      } else {
        list.sort((a, b) => new Date(b.qoshilganSana).getTime() - new Date(a.qoshilganSana).getTime());
      }
      return list;
    } else if (activeSegment === 'low') {
      const list = [...lowFiltered];
      if (isDateFilterActive) {
        list.sort((a, b) => new Date(b.oxirgiKirimSana).getTime() - new Date(a.oxirgiKirimSana).getTime());
      } else {
        list.sort((a, b) => {
          if (a.joriyQoldiq === 0 && b.joriyQoldiq > 0) return -1;
          if (b.joriyQoldiq === 0 && a.joriyQoldiq > 0) return 1;
          return new Date(b.qoshilganSana).getTime() - new Date(a.qoshilganSana).getTime();
        });
      }
      return list;
    } else if (activeSegment === 'sold') {
      const list = [...soldFiltered];
      list.sort((a, b) => todaySales[b.id].jamiSumma - todaySales[a.id].jamiSumma);
      return list;
    }
    return [];
  }, [activeSegment, allFiltered, lowFiltered, soldFiltered, dateFilterStart]);

  // Summary strip data
  const summaryStrip = useMemo(() => {
    if (activeSegment === 'all') {
      const totalValue = listData.reduce((acc, p) => acc + (p.sotuvNarxi * p.joriyQoldiq), 0);
      return (
        <View style={styles.summaryStrip}>
          <Text style={{ color: colors.text, fontFamily: typography.fontFamily.medium }}>{listData.length} ta mahsulot</Text>
          <Text style={{ color: colors.muted, fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm }}>
            Ombor qiymati: {formatPrice(totalValue)}
          </Text>
        </View>
      );
    } else if (activeSegment === 'low') {
      return (
        <View style={styles.summaryStrip}>
          <Text style={{ color: colors.status.amber, fontFamily: typography.fontFamily.medium }}>
            {listData.length} ta mahsulotni to'ldirish kerak
          </Text>
        </View>
      );
    } else if (activeSegment === 'sold') {
      const totalSoldValue = listData.reduce((acc, p) => acc + todaySales[p.id].jamiSumma, 0);
      return (
        <View style={styles.summaryStrip}>
          <Text style={{ color: colors.primary, fontFamily: typography.fontFamily.bold }}>
            Bugun jami: {formatPrice(totalSoldValue)}
          </Text>
        </View>
      );
    }
    return null;
  }, [activeSegment, listData, todaySales, colors, typography]);

  const renderEmptyState = () => {
    let message = "Hech narsa topilmadi";
    let button = null;
    if (searchQuery) {
      message = "Qidiruv bo'yicha mahsulot topilmadi";
    } else if (dateFilterStart && activeSegment !== 'sold') {
      message = "Bu sanada mahsulot kelmagan";
      button = (
        <TouchableOpacity 
          style={{ marginTop: 16 }}
          onPress={() => {
            setDateFilterStart(null);
            setDateFilterEnd(null);
            setDateFilterPreset('all');
          }}
        >
          <Text style={{ color: colors.primary, fontFamily: typography.fontFamily.medium, fontSize: 16 }}>Filtrni tozalash</Text>
        </TouchableOpacity>
      );
    } else if (activeSegment === 'low') {
      message = "Kam qolgan mahsulot yo'q";
    } else if (activeSegment === 'sold') {
      message = "Bugun hali sotuv bo'lmadi";
    }

    return (
      <View style={{ marginTop: spacing.xl }}>
        <EmptyState 
          icon={<PackageOpen size={48} color={colors.muted} />}
          title={message}
          description="Boshqa toifa yoki qidiruv so'zini kiritib ko'ring"
        />
        {button && <View style={{ alignItems: 'center' }}>{button}</View>}
      </View>
    );
  };

  const renderFilterChip = () => {
    if (!dateFilterStart || activeSegment === 'sold') return null;
    
    let text = '';
    if (dateFilterPreset === 'today') text = 'Bugun';
    else if (dateFilterPreset === 'yesterday') text = 'Kecha';
    else if (dateFilterPreset === 'last7') text = 'Oxirgi 7 kun';
    else if (dateFilterPreset === 'last30') text = 'Oxirgi 30 kun';
    else if (dateFilterStart && dateFilterEnd) {
      text = `${formatUzDate(dateFilterStart)} – ${formatUzDate(dateFilterEnd)}`;
    } else {
      text = formatUzDate(dateFilterStart);
    }

    return (
      <View style={[styles.filterChip, { backgroundColor: `${colors.primary}15` }]}>
        <Text style={[styles.filterChipText, { color: colors.primary, fontFamily: typography.fontFamily.medium }]}>
          {text}
        </Text>
        <TouchableOpacity onPress={() => {
          setDateFilterStart(null);
          setDateFilterEnd(null);
          setDateFilterPreset('all');
        }} style={{ padding: 4 }}>
          <X size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
    );
  };

  const openProduct = (product: Product) => {
    setSelectedProduct(product);
    setModalVisible(true);
  };

  return (
    <Screen style={{ paddingHorizontal: 0 }}>
      <View style={[styles.headerContainer, { paddingHorizontal: spacing.md, paddingTop: spacing.md }]}>
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: typography.fontFamily.bold }]}>
          Mahsulotlar
        </Text>
        
        <View style={{ marginVertical: spacing.md }}>
          <SegmentedControl 
            segments={segments} 
            activeSegment={activeSegment} 
            onChange={setActiveSegment} 
          />
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: 8 }}>
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
          {activeSegment !== 'sold' && (
            <TouchableOpacity 
              style={[
                styles.filterBtn, 
                { borderRadius: radius.md },
                dateFilterStart ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: colors.card, borderColor: colors.border }
              ]}
              onPress={() => setIsFilterSheetVisible(true)}
              activeOpacity={0.7}
            >
              <CalendarIcon size={24} color={dateFilterStart ? '#fff' : colors.text} />
            </TouchableOpacity>
          )}
        </View>
        
        {renderFilterChip()}
        
        {summaryStrip}
      </View>

      <FlatList
        data={listData}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={renderEmptyState}
        renderItem={({ item }) => (
          <ProductRow 
            product={item}
            isSoldSegment={activeSegment === 'sold'}
            soldQuantity={todaySales[item.id]?.sotilganMiqdor}
            soldAmount={todaySales[item.id]?.jamiSumma}
            onPress={() => openProduct(item)}
          />
        )}
      />

      <ProductDetailModal 
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        product={selectedProduct}
        isAdmin={user?.role === 'admin'}
        soldEntries={selectedProduct && todaySales[selectedProduct.id] ? todaySales[selectedProduct.id].entries : undefined}
        soldQuantity={selectedProduct && todaySales[selectedProduct.id] ? todaySales[selectedProduct.id].sotilganMiqdor : undefined}
        soldAmount={selectedProduct && todaySales[selectedProduct.id] ? todaySales[selectedProduct.id].jamiSumma : undefined}
        onKirimQilish={(id) => {
          setArrivalPreselectId(id);
          setArrivalSheetVisible(true);
        }}
        onTahrirlash={(id) => {
          router.navigate({ pathname: '/product/form', params: { id } });
        }}
      />

      {user?.role === 'admin' && activeSegment !== 'sold' && (
        <TouchableOpacity 
          style={[styles.fab, { backgroundColor: colors.primary, borderRadius: 28, shadowColor: colors.primary }]}
          onPress={() => setAddActionSheetVisible(true)}
          activeOpacity={0.8}
        >
          <PlusIcon size={24} color="#fff" />
        </TouchableOpacity>
      )}

      <AddActionSheet 
        visible={addActionSheetVisible}
        onClose={() => setAddActionSheetVisible(false)}
        onNewProduct={() => {
          setAddActionSheetVisible(false);
          router.navigate('/product/form');
        }}
        onArrival={() => {
          setAddActionSheetVisible(false);
          setArrivalPreselectId(null);
          setArrivalSheetVisible(true);
        }}
      />

      <ArrivalSheet 
        visible={arrivalSheetVisible}
        onClose={() => setArrivalSheetVisible(false)}
        preselectedProductId={arrivalPreselectId}
      />

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
  headerContainer: {
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
  },
  summaryStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  filterBtn: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
    gap: 6,
  },
  filterChipText: {
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  }
});
