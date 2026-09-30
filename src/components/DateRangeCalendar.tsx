import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../theme';
import { formatUzDate, getMonthMatrix, isSameDay, startOfDay } from '../lib/dates';

interface DateRangeCalendarProps {
  selectedStart: Date | null;
  selectedEnd: Date | null;
  onChange: (start: Date | null, end: Date | null) => void;
  arrivalDates?: Date[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  singleDayMode?: boolean;
}

const WEEKDAYS = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
const MONTH_NAMES = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
];

export const DateRangeCalendar: React.FC<DateRangeCalendarProps> = ({
  selectedStart,
  selectedEnd,
  onChange,
  arrivalDates = [],
  currentMonth,
  onMonthChange,
  singleDayMode = false
}) => {
  const { colors, typography, radius } = useTheme();

  const handlePrevMonth = () => {
    onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDayPress = (date: Date) => {
    if (singleDayMode) {
      onChange(date, null);
      return;
    }

    if (!selectedStart || (selectedStart && selectedEnd)) {
      // 1st tap, or tap when already a range
      onChange(date, null);
    } else {
      // 2nd tap
      const start = startOfDay(selectedStart).getTime();
      const current = startOfDay(date).getTime();
      if (current > start) {
        onChange(selectedStart, date);
      } else if (current < start) {
        onChange(date, null);
      } else {
        // Tapping same single day
        onChange(date, null);
      }
    }
  };

  const today = startOfDay(new Date());

  const monthMatrix = useMemo(
    () => getMonthMatrix(currentMonth.getFullYear(), currentMonth.getMonth()),
    [currentMonth]
  );

  const renderDay = (date: Date | null, rowIndex: number, colIndex: number) => {
    if (!date) {
      return <View key={`empty-${rowIndex}-${colIndex}`} style={styles.dayCell} />;
    }

    const isToday = isSameDay(date, today);
    const hasArrival = arrivalDates.some(ad => isSameDay(ad, date));
    
    let isSelectedStart = false;
    let isSelectedEnd = false;
    let isBetween = false;

    if (selectedStart && isSameDay(date, selectedStart)) isSelectedStart = true;
    if (selectedEnd && isSameDay(date, selectedEnd)) isSelectedEnd = true;
    
    // If only one day is selected, it acts as both start and end visually for "selected" state, 
    // but without the "between" background
    const isSingleSelected = selectedStart && !selectedEnd && isSameDay(date, selectedStart);

    if (selectedStart && selectedEnd) {
      const dTime = startOfDay(date).getTime();
      const sTime = startOfDay(selectedStart).getTime();
      const eTime = startOfDay(selectedEnd).getTime();
      if (dTime > sTime && dTime < eTime) {
        isBetween = true;
      }
    }

    const isSelected = isSelectedStart || isSelectedEnd || isSingleSelected;

    return (
      <View key={date.toISOString()} style={styles.dayCellWrapper}>
        {/* Background for "between" state or half-selected state */}
        {(isBetween || (isSelectedStart && selectedEnd) || (isSelectedEnd && selectedStart)) && (
          <View style={[
            styles.betweenBackground,
            { backgroundColor: `${colors.primary}20` },
            isSelectedStart && { left: '50%', width: '50%' },
            isSelectedEnd && { right: '50%', width: '50%' },
            isBetween && { left: 0, width: '100%' }
          ]} />
        )}
        
        <TouchableOpacity
          style={[
            styles.dayCell,
            isToday && !isSelected && { borderColor: colors.border, borderWidth: 1, borderRadius: radius.full },
            isSelected && { backgroundColor: colors.primary, borderRadius: radius.full }
          ]}
          onPress={() => handleDayPress(date)}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.dayText,
            { fontFamily: typography.fontFamily.medium, color: colors.text },
            isToday && { color: colors.primary },
            isSelected && { color: '#fff' }
          ]}>
            {date.getDate()}
          </Text>
          {hasArrival && (
            <View style={[
              styles.dot,
              { backgroundColor: colors.primary },
              isSelected && { backgroundColor: '#fff' }
            ]} />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.arrowButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.monthText, { color: colors.text, fontFamily: typography.fontFamily.bold }]}>
          {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </Text>
        <TouchableOpacity onPress={handleNextMonth} style={styles.arrowButton}>
          <ChevronRight size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekdaysRow}>
        {WEEKDAYS.map(day => (
          <View key={day} style={styles.weekdayCell}>
            <Text style={[styles.weekdayText, { color: colors.muted, fontFamily: typography.fontFamily.medium }]}>
              {day}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {monthMatrix.map((week, rowIndex) => (
          <View key={`week-${rowIndex}`} style={styles.weekRow}>
            {week.map((day, colIndex) => renderDay(day, rowIndex, colIndex))}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  arrowButton: {
    padding: 8,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthText: {
    fontSize: 18,
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 14,
  },
  daysGrid: {
    width: '100%',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayCellWrapper: {
    flex: 1,
    position: 'relative',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  betweenBackground: {
    position: 'absolute',
    top: 2,
    bottom: 2,
  },
  dayCell: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 16,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 6,
  },
});
