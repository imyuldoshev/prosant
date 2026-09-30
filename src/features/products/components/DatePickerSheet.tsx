import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { useTheme } from '../../../theme';
import { DateRangeCalendar } from '../../../components/DateRangeCalendar';
import { Button } from '../../../components/Button';
import { X } from 'lucide-react-native';

interface DatePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  initialDate: Date;
  onApply: (date: Date) => void;
}

export function DatePickerSheet({ visible, onClose, initialDate, onApply }: DatePickerSheetProps) {
  const { colors, typography, radius, spacing } = useTheme();
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate);
  const [currentMonth, setCurrentMonth] = useState(initialDate);

  // Sync state when opened
  React.useEffect(() => {
    if (visible) {
      setSelectedDate(initialDate);
      setCurrentMonth(initialDate);
    }
  }, [visible, initialDate]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>
      
      <View style={[styles.sheet, { backgroundColor: colors.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }]}>
        <View style={styles.header}>
          <Text style={{ color: colors.text, fontFamily: typography.fontFamily.bold, fontSize: 18 }}>
            Sana tanlash
          </Text>
          <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.card }]}>
            <X size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={{ padding: spacing.lg }}>
          <DateRangeCalendar
            selectedStart={selectedDate}
            selectedEnd={null}
            onChange={(start) => setSelectedDate(start)}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            singleDayMode={true}
          />

          <View style={{ marginTop: spacing.xl }}>
            <Button 
              title="Tasdiqlash" 
              onPress={() => {
                if (selectedDate) onApply(selectedDate);
              }}
              disabled={!selectedDate}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
});
