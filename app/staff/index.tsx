import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { useTheme } from '../../src/theme';
import { Button } from '../../src/components/Button';
import { useAuth } from '../../src/lib/auth';
import { useStaffStore } from '../../src/features/store/StaffStore';
import { StaffCard } from '../../src/features/staff/components/StaffCard';
import { Input } from '../../src/components/Input';
import { EmptyState } from '../../src/components/EmptyState';
import { SegmentedControl } from '../../src/components/SegmentedControl';
import { Plus, Search } from 'lucide-react-native';

type FilterType = 'all' | 'admin' | 'xodim' | 'inactive';

export default function StaffListScreen() {
  const { colors, spacing } = useTheme();
  const { user } = useAuth();
  const { state: { staffList } } = useStaffStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    // Route guard
    if (user?.role !== 'admin') {
      router.replace('/(tabs)/profile');
    }
  }, [user]);

  if (user?.role !== 'admin') return null;

  const filteredStaff = staffList.filter((s) => {
    const matchesSearch = s.ism.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.telefon.includes(searchQuery);
    if (!matchesSearch) return false;

    switch (filter) {
      case 'admin': return s.role === 'admin' && s.faol;
      case 'xodim': return s.role === 'xodim' && s.faol;
      case 'inactive': return !s.faol;
      case 'all':
      default: return true;
    }
  });

  const filterOptions = [
    { label: 'Hammasi', id: 'all' },
    { label: 'Adminlar', id: 'admin' },
    { label: 'Xodimlar', id: 'xodim' },
    { label: 'Faolsiz', id: 'inactive' },
  ];

  return (
    <Screen style={{ backgroundColor: colors.background }}>
      <View style={{ padding: spacing.md }}>
        <Input
          label=""
          placeholder="Xodim qidirish..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          icon={<Search size={20} color={colors.muted} />}
          style={{ marginBottom: spacing.md }}
        />
        <SegmentedControl
          segments={filterOptions}
          activeSegment={filter}
          onChange={(val) => setFilter(val as FilterType)}
        />
      </View>

      <FlatList
        data={filteredStaff}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <StaffCard
            staff={item}
            isCurrentUser={item.id === user.id}
            onPress={() => router.push({ pathname: '/staff/[id]', params: { id: item.id } })}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title="Xodim topilmadi"
            description="Qidiruv so'zini o'zgartirib ko'ring"
            icon="Users"
          />
        }
      />

      <View style={{ position: 'absolute', bottom: spacing.xl, left: spacing.md, right: spacing.md }}>
        <Button
          title="+ Xodim qo'shish"
          onPress={() => router.push('/staff/form')}
          icon={<Plus size={20} color="#fff" />}
        />
      </View>
    </Screen>
  );
}
