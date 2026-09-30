import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, SafeAreaView } from 'react-native';
import { useTheme } from '../../../theme';
import { Button } from '../../../components/Button';
import { DateRangeCalendar } from '../../../components/DateRangeCalendar';
import { startOfDay } from '../../../lib/dates';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (date: Date) => void;
  initialDate: Date | null;
}

const chips = [
  { label: 'Ertaga', days: 1 },
  { label: '3 kun', days: 3 },
  { label: '1 hafta', days: 7 },
  { label: '2 hafta', days: 14 },
  { label: '1 oy', days: 30 },
];

export const DueDatePickerSheet: React.FC<Props> = ({ visible, onClose, onSelect, initialDate }) => {
  const { colors, typography, radius, spacing } = useTheme();
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate);
  const [currentMonth, setCurrentMonth] = useState<Date>(initialDate || startOfDay(new Date()));

  // Reset internal state when opened
  React.useEffect(() => {
    if (visible) {
      setSelectedDate(initialDate);
      setCurrentMonth(initialDate || startOfDay(new Date()));
    }
  }, [visible, initialDate]);

  const handleApply = () => {
    if (selectedDate) {
      onSelect(selectedDate);
    }
  };

  const setDaysFromNow = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const result = startOfDay(d);
    setSelectedDate(result);
    setCurrentMonth(result);
  };

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
      transparent={true}
    >
      <TouchableOpacity 
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' }} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1}>
          <View style={[styles.sheetContainer, { backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }]}>
        <View style={styles.handleContainer}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
        </View>

        <Text style={[styles.title, { color: colors.text, fontFamily: typography.fontFamily.bold, marginBottom: spacing.md }]}>
          Qaytarish muddati
        </Text>

        <ScrollView showsVerticalScrollIndicator={false}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
            {chips.map((chip, idx) => {
              // check if selectedDate matches this chip roughly
              const isSelected = false; // We can skip precise matching for visual simplicity or implement it. 
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.chip,
                    { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 20 },
                  ]}
                  onPress={() => setDaysFromNow(chip.days)}
                >
                  <Text style={{ color: colors.text, fontFamily: typography.fontFamily.medium, fontSize: 14 }}>
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={{ marginTop: spacing.md }}>
            <DateRangeCalendar
              selectedStart={selectedDate}
              selectedEnd={null}
              onChange={(start) => setSelectedDate(start)}
              arrivalDates={[]}
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
              singleDayMode={true}
            />
          </View>
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border, paddingTop: spacing.md, marginTop: spacing.md }]}>
          <Button title="Bekor qilish" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
          <View style={{ width: spacing.md }} />
          <Button 
            title="Tanlash" 
            onPress={handleApply} 
            disabled={!selectedDate} 
            style={{ flex: 1 }} 
          />
        </View>
      </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  sheetContainer: {
    padding: 24,
    paddingTop: 12,
  },
  handleContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  title: {
    fontSize: 20,
    textAlign: 'center',
  },
  chipsContainer: {
    gap: 8,
    paddingBottom: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
});
