export const formatUzDate = (date: Date): string => {
  const months = [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 
    'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day}-${month}, ${year}`;
};

export const isSameDay = (d1: Date, d2: Date): boolean => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

export const startOfDay = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

export const getMonthMatrix = (year: number, month: number): (Date | null)[][] => {
  const matrix: (Date | null)[][] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // 0 = Sunday, 1 = Monday. We want Monday to be 0
  let startDayOfWeek = firstDay.getDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6; // Sunday becomes 6
  
  let currentWeek: (Date | null)[] = new Array(startDayOfWeek).fill(null);
  
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const currentDate = new Date(year, month, d);
    currentWeek.push(currentDate);
    if (currentWeek.length === 7) {
      matrix.push(currentWeek);
      currentWeek = [];
    }
  }
  
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    matrix.push(currentWeek);
  }
  
  return matrix;
};

export const isWithinRange = (date: Date, start: Date, end: Date): boolean => {
  const d = startOfDay(date).getTime();
  const s = startOfDay(start).getTime();
  const e = startOfDay(end).getTime();
  return d >= Math.min(s, e) && d <= Math.max(s, e);
};
