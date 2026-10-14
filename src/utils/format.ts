// src/utils/format.ts
// Summalar va sonlarni o'qishni osonlashtirish uchun formatlash (3 000 000 UZS)

/**
 * Son yoki summa qiymatini minglik ajratgich (bo'sh joy) bilan formatlaydi
 * Masalan: 3000000 -> "3 000 000"
 */
export function formatSum(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === '') return '0';
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/\s/g, ''));
  if (isNaN(num)) return '0';

  // Float aniqligini to'g'irlash (masalan 2.5 metr yoki suzuvchi vergul xatolari)
  const cleanNum = Math.round(num * 100) / 100;
  const parts = cleanNum.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return parts.join('.');
}

/**
 * Input maydoniga kiritilayotgan sonni real-time bo'sh joylar bilan formatlaydi
 * Masalan: "3000000" -> "3 000 000"
 */
export function formatInputNumber(raw: string): string {
  if (!raw) return '';
  // Faqat raqamlar va nuqtani qoldirish
  const cleaned = raw.replace(/[^\d.]/g, '');
  const parts = cleaned.split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  if (parts.length > 1) {
    return intPart + '.' + parts.slice(1).join('');
  }
  return intPart;
}

/**
 * Bo'sh joylar bilan formatlangan matndan toza number qiymatni qaytaradi
 * Masalan: "3 000 000" -> 3000000
 */
export function parseFormattedNumber(val: string | number | null | undefined): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/\s/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}
