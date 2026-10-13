import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  X, 
  RotateCcw,
  Check
} from 'lucide-react';

export interface DateRangePickerProps {
  startDate: string; // 'YYYY-MM-DD' or ''
  endDate: string;   // 'YYYY-MM-DD' or ''
  onChange: (startDate: string, endDate: string) => void;
  className?: string;
  align?: 'left' | 'right';
}

const MONTH_NAMES = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
];

const WEEKDAY_NAMES = ['Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha', 'Ya'];
import { toISODate, formatToDMY } from '../utils/dateUtils';

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  className = '',
  align = 'right'
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize view month & year based on startDate or current date
  const [viewYear, setViewYear] = useState(() => {
    if (startDate) {
      const parts = startDate.split('-').map(Number);
      if (parts.length === 3 && !isNaN(parts[0])) return parts[0];
    }
    return new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    if (startDate) {
      const parts = startDate.split('-').map(Number);
      if (parts.length === 3 && !isNaN(parts[1])) return parts[1] - 1;
    }
    return new Date().getMonth();
  });

  // Temporary selection states while popover is open
  const [tempStart, setTempStart] = useState<string>(startDate);
  const [tempEnd, setTempEnd] = useState<string>(endDate);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // Sync temp values whenever props change or popover opens
  useEffect(() => {
    setTempStart(startDate);
    setTempEnd(endDate);
    setIsSelecting(false);
    setHoverDate(null);
    if (startDate) {
      const parts = startDate.split('-').map(Number);
      if (parts.length === 3) {
        setViewYear(parts[0]);
        setViewMonth(parts[1] - 1);
      }
    }
  }, [startDate, endDate, isOpen]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  // Month navigation
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  // Quick Preset shortcuts
  const handleApplyPreset = (type: 'today' | 'yesterday' | 'week' | 'month' | 'prevMonth' | 'clear') => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (type === 'clear') {
      setTempStart('');
      setTempEnd('');
      setIsSelecting(false);
      onChange('', '');
      setIsOpen(false);
      return;
    }

    let start = '';
    let end = '';

    if (type === 'today') {
      start = toISODate(today);
      end = toISODate(today);
    } else if (type === 'yesterday') {
      const y = new Date(today.getTime() - 24 * 3600 * 1000);
      start = toISODate(y);
      end = toISODate(y);
    } else if (type === 'week') {
      const w = new Date(today.getTime() - 6 * 24 * 3600 * 1000);
      start = toISODate(w);
      end = toISODate(today);
    } else if (type === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      start = toISODate(firstDay);
      end = toISODate(today);
    } else if (type === 'prevMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
      start = toISODate(firstDay);
      end = toISODate(lastDay);
    }

    setTempStart(start);
    setTempEnd(end);
    setIsSelecting(false);
    onChange(start, end);
    setIsOpen(false);
  };

  // Day click handler
  const handleDayClick = (dayStr: string) => {
    if (!isSelecting || (tempStart && tempEnd)) {
      // Step 1: Start selecting
      setTempStart(dayStr);
      setTempEnd('');
      setIsSelecting(true);
    } else {
      // Step 2: Complete range
      let finalStart = tempStart;
      let finalEnd = dayStr;

      if (finalEnd < finalStart) {
        // Swap if end is earlier than start
        finalStart = dayStr;
        finalEnd = tempStart;
      }

      setTempStart(finalStart);
      setTempEnd(finalEnd);
      setIsSelecting(false);
      setHoverDate(null);
      // Immediately propagate selection
      onChange(finalStart, finalEnd);
    }
  };

  // Build calendar matrix
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    // Monday-based index: 0 = Mon, 6 = Sun
    const firstDayIndex = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    const todayStr = toISODate(new Date());

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevDate = new Date(viewYear, viewMonth - 1, dayNum);
      const str = toISODate(prevDate);
      days.push({
        dateStr: str,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: str === todayStr,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const curDate = new Date(viewYear, viewMonth, d);
      const str = toISODate(curDate);
      days.push({
        dateStr: str,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: str === todayStr,
      });
    }

    // Next month padding to complete 42 or 35 cells
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let n = 1; n <= remaining; n++) {
        const nextDate = new Date(viewYear, viewMonth + 1, n);
        const str = toISODate(nextDate);
        days.push({
          dateStr: str,
          dayNumber: n,
          isCurrentMonth: false,
          isToday: str === todayStr,
        });
      }
    }

    return days;
  }, [viewYear, viewMonth]);

  // Calculate active range limits for styling
  const activeRange = useMemo(() => {
    if (!tempStart) return { start: null, end: null };
    if (isSelecting && hoverDate) {
      if (hoverDate < tempStart) {
        return { start: hoverDate, end: tempStart };
      }
      return { start: tempStart, end: hoverDate };
    }
    if (tempEnd) {
      return { start: tempStart, end: tempEnd };
    }
    return { start: tempStart, end: tempStart };
  }, [tempStart, tempEnd, isSelecting, hoverDate]);

  const hasRangeSelected = Boolean(startDate && endDate);

  const displayLabel = useMemo(() => {
    if (startDate && endDate) {
      return `${formatToDMY(startDate)} — ${formatToDMY(endDate)}`;
    }
    return "Sana oralig'i";
  }, [startDate, endDate]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className={`flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all border shadow-xs select-none w-full min-h-[44px] cursor-pointer ${
            hasRangeSelected
              ? 'bg-brand/10 border-brand/40 text-brand ring-2 ring-brand/20'
              : 'bg-slate-50 hover:bg-white border-slate-200 hover:border-slate-300 text-slate-700'
          }`}
          title="Sana oralig'i bo'yicha filtrlash"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <CalendarIcon className={`w-4 h-4 shrink-0 ${hasRangeSelected ? 'text-brand' : 'text-slate-500'}`} />
            <span className="truncate">
              {displayLabel}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {hasRangeSelected && (
              <span
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleApplyPreset('clear');
                }}
                className="p-1 hover:bg-brand/20 text-brand rounded-lg transition-colors cursor-pointer"
                title="Sana filtrini tozalash"
                aria-label="Tozalash"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            )}

            <ChevronDown className={`w-4 h-4 transition-transform text-slate-400 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>
      </div>

      {/* Popover / Mobile Modal */}
      {isOpen && (
        <>
          {/* Mobile Backdrop Overlay (sm:hidden) */}
          <div 
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs sm:hidden animate-in fade-in duration-150"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Calendar Popover / Modal: Centered Modal on mobile (<640px), Absolute dropdown on desktop */}
          <div 
            className={`fixed inset-x-2 top-1/2 -translate-y-1/2 z-50 max-w-[304px] mx-auto sm:max-w-none sm:translate-y-0 sm:inset-auto sm:absolute sm:top-full sm:mt-2 sm:w-[360px] bg-white rounded-3xl shadow-2xl border border-slate-200/90 p-3 sm:p-5 animate-in fade-in zoom-in-95 duration-150 ${
              align === 'left' ? 'sm:left-0' : 'sm:right-0'
            }`}
            onMouseLeave={() => setHoverDate(null)}
          >
            {/* Popover Top: Quick Presets */}
            <div className="flex flex-wrap gap-1 pb-3 border-b border-slate-100">
              {[
                { id: 'today' as const, label: 'Bugun' },
                { id: 'yesterday' as const, label: 'Kecha' },
                { id: 'week' as const, label: '7 kun' },
                { id: 'month' as const, label: 'Shu oy' },
                { id: 'prevMonth' as const, label: "O'tgan oy" },
              ].map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleApplyPreset(p.id)}
                  className="px-2 py-1 text-[10px] sm:text-xs font-bold rounded-lg bg-slate-100 hover:bg-brand/10 hover:text-brand text-slate-600 transition-colors cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
              {hasRangeSelected && (
                <button
                  type="button"
                  onClick={() => handleApplyPreset('clear')}
                  className="px-2 py-1 text-[10px] sm:text-xs font-bold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors ml-auto flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  Tozalash
                </button>
              )}
            </div>

            {/* Month Header Navigation */}
            <div className="flex items-center justify-between py-2 sm:py-3">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1.5 sm:p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                title="Oldingi oy"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-black text-slate-900 text-xs sm:text-sm tracking-tight select-none">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>

              <button
                type="button"
                onClick={nextMonth}
                className="p-1.5 sm:p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                title="Keyingi oy"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Weekday Names Header */}
            <div className="grid grid-cols-7 gap-0.5 sm:gap-1 text-center mb-1">
              {WEEKDAY_NAMES.map((name, i) => (
                <div 
                  key={i} 
                  className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 py-0.5 sm:py-1 uppercase tracking-wider"
                >
                  {name}
                </div>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div 
              className="grid grid-cols-7 gap-y-0.5 sm:gap-y-1 text-center"
              onMouseLeave={() => setHoverDate(null)}
            >
              {calendarDays.map((day, idx) => {
                const { dateStr, dayNumber, isCurrentMonth, isToday } = day;
                
                const isStart = activeRange.start === dateStr;
                const isEnd = activeRange.end === dateStr;
                const isSingle = isStart && isEnd;
                const isInRange = Boolean(
                  activeRange.start && 
                  activeRange.end && 
                  dateStr > activeRange.start && 
                  dateStr < activeRange.end
                );

                return (
                  <div
                    key={idx}
                    className={`relative p-0.5 ${
                      isInRange ? 'bg-brand/10' : ''
                    } ${
                      isStart && !isSingle ? 'rounded-l-xl bg-brand/10' : ''
                    } ${
                      isEnd && !isSingle ? 'rounded-r-xl bg-brand/10' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleDayClick(dateStr)}
                      onMouseEnter={() => isSelecting && setHoverDate(dateStr)}
                      className={`w-full h-8 sm:h-9 flex items-center justify-center text-[11px] sm:text-xs font-bold transition-all relative z-10 cursor-pointer ${
                        isSingle
                          ? 'bg-brand text-white rounded-xl shadow-md'
                          : isStart
                          ? 'bg-brand text-white rounded-l-xl shadow-md'
                          : isEnd
                          ? 'bg-brand text-white rounded-r-xl shadow-md'
                          : isInRange
                          ? 'text-brand font-black'
                          : isCurrentMonth
                          ? 'text-slate-700 hover:bg-slate-100 rounded-xl'
                          : 'text-slate-300 hover:bg-slate-50 rounded-xl'
                      } ${
                        isToday && !isStart && !isEnd && !isInRange
                          ? 'ring-1 ring-brand text-brand rounded-xl'
                          : ''
                      }`}
                    >
                      {dayNumber}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Bottom Footer Info & Confirmation */}
            <div className="pt-3 mt-2 sm:pt-4 sm:mt-3 border-t border-slate-100 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] sm:text-xs">
                <span className="text-slate-400 font-semibold shrink-0">Tanlangan:</span>
                <span className="font-extrabold text-slate-800 truncate ml-2 text-right">
                  {tempStart && tempEnd 
                    ? `${formatToDMY(tempStart)} — ${formatToDMY(tempEnd)}`
                    : tempStart
                    ? `${formatToDMY(tempStart)} (oxirgi sana?)`
                    : "Tanlanmagan"}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('clear')}
                  className="flex-1 min-h-[38px] py-1.5 sm:py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Tozalash
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (tempStart && tempEnd) {
                      onChange(tempStart, tempEnd);
                    }
                    setIsOpen(false);
                  }}
                  className="flex-1 min-h-[38px] py-1.5 sm:py-2 rounded-xl text-xs font-bold text-white bg-brand hover:bg-brand/90 transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Qo'llash
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
