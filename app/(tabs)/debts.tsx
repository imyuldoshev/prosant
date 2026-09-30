import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, RefreshControl } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { Input } from '../../src/components/Input';
import { EmptyState } from '../../src/components/EmptyState';
import { useTheme } from '../../src/theme';
import { Search, Banknote } from 'lucide-react-native';
import { useDebtsStore } from '../../src/features/store/DebtsStore';
import { DebtSummaryCard } from '../../src/features/debts/components/DebtSummaryCard';
import { DebtCard } from '../../src/features/debts/components/DebtCard';
import { getDebtStatus, getRemaining } from '../../src/features/debts/utils';
import { SegmentedControl } from '../../src/components/SegmentedControl';

type FilterType = 'Hammasi' | 'Yaqinda' | 'Muddati o\'tgan' | 'To\'langan';

export default function DebtsScreen() {
  const { colors, typography, spacing } = useTheme();
  
  const { state: { debts } } = useDebtsStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('Hammasi');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  // Compute summary stats
  const { totalRemaining, debtorsCount, overdueCount } = useMemo(() => {
    let tr = 0;
    let dc = 0;
    let oc = 0;
    debts.forEach(d => {
      const rem = getRemaining(d);
      if (rem > 0) {
        tr += rem;
        dc++;
        if (getDebtStatus(d) === 'overdue') oc++;
      }
    });
    return { totalRemaining: tr, debtorsCount: dc, overdueCount: oc };
  }, [debts]);

  // Filter and sort debts
  const filteredAndSortedDebts = useMemo(() => {
    let filtered = debts.filter(d => {
      // Search
      const q = searchQuery.toLowerCase();
      if (q && !d.mijozIsm.toLowerCase().includes(q) && !d.telefon.toLowerCase().includes(q)) {
        return false;
      }
      
      const status = getDebtStatus(d);
      
      // Filter tab
      if (filter === 'Hammasi') return true;
      if (filter === 'Yaqinda') return status === 'soon';
      if (filter === 'Muddati o\'tgan') return status === 'overdue';
      if (filter === 'To\'langan') return status === 'paid';
      
      return true;
    });

    // Sort logic
    filtered.sort((a, b) => {
      const statusA = getDebtStatus(a);
      const statusB = getDebtStatus(b);

      // Paid goes last
      if (statusA === 'paid' && statusB !== 'paid') return 1;
      if (statusB === 'paid' && statusA !== 'paid') return -1;

      // Overdue goes first
      if (statusA === 'overdue' && statusB !== 'overdue') return -1;
      if (statusB === 'overdue' && statusA !== 'overdue') return 1;

      // If both are same category, sort by due date (nearest first)
      const dateA = new Date(a.muddat).getTime();
      const dateB = new Date(b.muddat).getTime();
      return dateA - dateB;
    });

    return filtered;
  }, [debts, searchQuery, filter]);

  const filterTabs = [
    { id: 'Hammasi', label: 'Hammasi' },
    { id: 'Yaqinda', label: 'Yaqinda' },
    { id: 'Muddati o\'tgan', label: 'Muddati o\'tgan' },
    { id: 'To\'langan', label: 'To\'langan' }
  ];

  return (
    <Screen style={{ paddingHorizontal: 0 }}>
      <FlatList
        data={filteredAndSortedDebts}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={{ marginBottom: spacing.md }}>
            <View style={[styles.header, { marginBottom: spacing.lg }]}>
              <Text style={{ color: colors.text, fontFamily: typography.fontFamily.bold, fontSize: 22 }}>
                Qarzlar
              </Text>
            </View>

            <DebtSummaryCard 
              totalRemaining={totalRemaining}
              debtorsCount={debtorsCount}
              overdueCount={overdueCount}
            />

            <View style={{ marginTop: spacing.xl, marginBottom: spacing.md }}>
              <Input
                label=""
                placeholder="Mijoz ismi yoki telefon..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                icon={<Search size={20} color={colors.muted} />}
                style={{ marginBottom: 0 }}
              />
            </View>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={{ marginHorizontal: -spacing.md, marginBottom: spacing.md }}
              contentContainerStyle={{ paddingHorizontal: spacing.md }}
            >
              <SegmentedControl 
                segments={filterTabs} 
                activeSegment={filter} 
                onChange={(v) => setFilter(v as FilterType)} 
              />
            </ScrollView>
          </View>
        }
        renderItem={({ item }) => <DebtCard debt={item} />}
        ListEmptyComponent={
          <View style={{ marginTop: spacing.xl }}>
            <EmptyState 
              icon={<Banknote size={48} color={colors.muted} />}
              title="Qarzlar topilmadi"
              description="Tanlangan bo'limda hech qanday ma'lumot yo'q."
            />
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
