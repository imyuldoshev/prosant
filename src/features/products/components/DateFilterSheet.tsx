import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TouchableWithoutFeedback } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../../../theme';
import { DateRangeCalendar } from '../../../components/DateRangeCalendar';
import { startOfDay } from '../../../lib/dates';
import { Button } from '../../../components/Button';

interface DateFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  initialStart: Date | null;
  initialEnd: Date | null;
  initialPreset: string | null;
  onApply: (start: Date | null, end: Date | null, preset: string | null) => void;
  arrivalDates: Date[];
  getMatchCount: (start: Date | null, end: Date | null) => number;
}

const PRESETS = [
  { id: 'all', label: 'Hammasi' },
  { id: 'today', label: 'Bugun' },
  { id: 'yesterday', label: 'Kecha' },
  { id: 'last7', label: 'Oxirgi 7 kun' },
  { id: 'last30', label: 'Oxirgi 30 kun' }
];

export const DateFilterSheet: React.FC<DateFilterSheetProps> = ({
  visible,
  onClose,
  initialStart,
  initialEnd,
  initialPreset,
  onApply,
  arrivalDates,
  getMatchCount
}) => {
  const { colors, typography, radius, spacing } = useTheme();

  const [start, setStart] = useState<Date | null>(initialStart);
  const [end, setEnd] = useState<Date | null>(initialEnd);
  const [preset, setPreset] = useState<string | null>(initialPreset);
  const [currentMonth, setCurrentMonth] = useState<Date>(initialStart || new Date());

  useEffect(() => {
    if (visible) {
      setStart(initialStart);
      setEnd(initialEnd);
      setPreset(initialPreset);
      setCurrentMonth(initialStart || new Date());
    }
  }, [visible, initialStart, initialEnd, initialPreset]);

  const handlePresetPress = (presetId: string) => {
    setPreset(presetId);
    const today = startOfDay(new Date());
    
    if (presetId === 'all') {
      setStart(null);
      setEnd(null);
    } else if (presetId === 'today') {
      setStart(today);
      setEnd(null);
      setCurrentMonth(today);
    } else if (presetId === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      setStart(yesterday);
      setEnd(null);
      setCurrentMonth(yesterday);
    } else if (presetId === 'last7') {
      const last7 = new Date(today);
      last7.setDate(last7.getDate() - 6);
      setStart(last7);
      setEnd(today);
      setCurrentMonth(today);
    } else if (presetId === 'last30') {
      const last30 = new Date(today);
      last30.setDate(last30.getDate() - 29);
      setStart(last30);
      setEnd(today);
      setCurrentMonth(today);
    }
  };

  const handleCalendarChange = (newStart: Date | null, newEnd: Date | null) => {
    setStart(newStart);
    setEnd(newEnd);
    setPreset(null);
  };

  const handleApply = () => {
    onApply(start, end, preset);
  };

  const handleClear = () => {
    setStart(null);
    setEnd(null);
    setPreset('all');
  };

  const matchCount = getMatchCount(start, end);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      
      <View style={[styles.sheet, { backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text, fontFamily: typography.fontFamily.bold }]}>
            Kelgan sana bo'yicha
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.presetsContainer}>
            {PRESETS.map(p => (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.presetChip,
                  { backgroundColor: colors.background, borderRadius: radius.full },
                  preset === p.id && { backgroundColor: colors.primary }
                ]}
                onPress={() => handlePresetPress(p.id)}
              >
                <Text style={[
                  styles.presetText,
                  { color: colors.text, fontFamily: typography.fontFamily.medium },
                  preset === p.id && { color: '#fff' }
                ]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <DateRangeCalendar
            selectedStart={start}
            selectedEnd={end}
            onChange={handleCalendarChange}
            arrivalDates={arrivalDates}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
          />

          <View style={[styles.matchCountContainer, { marginTop: spacing.xl, marginBottom: spacing.md }]}>
            <Text style={{ color: colors.text, fontFamily: typography.fontFamily.medium, fontSize: 16 }}>
              {matchCount} ta mahsulot topildi
            </Text>
          </View>
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border, paddingTop: spacing.md, paddingBottom: spacing.xl }]}>
          <Button 
            title="Tozalash" 
            variant="secondary" 
            onPress={handleClear} 
            style={{ flex: 1, marginRight: spacing.sm }} 
          />
          <Button 
            title="Qo'llash" 
            variant="primary" 
            onPress={handleApply} 
            style={{ flex: 1, marginLeft: spacing.sm }} 
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '85%',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  presetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  presetChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  presetText: {
    fontSize: 14,
  },
  matchCountContainer: {
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
});
