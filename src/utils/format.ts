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
  // Vergulni nuqtaga almashtirish va faqat raqamlar hamda bitta nuqtani qoldirish
  const normalized = raw.replace(/,/g, '.');
  const cleaned = normalized.replace(/[^\d.]/g, '');
  const parts = cleaned.split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  if (parts.length > 1) {
    return intPart + '.' + parts.slice(1).join('').replace(/\./g, '');
  }
  return intPart;
}

/**
 * Real-time input maydoniga kiritilayotgan sonni formatlaydi va
 * kursor (caret) o'rnini to'g'ri saqlab qoladi.
 *
 * Masalan:
 * "1 300 000" dagi "3" o'chirilganda, kursor boshiga (0 ga) sakrab ketmaydi,
 * o'chirilgan joyda ("1|00 000") qoladi va keyingi raqam to'g'ri o'rniga yoziladi.
 */
export function formatWithCursor(
  rawVal: string,
  cursorPos: number
): { formatted: string; newCursor: number } {
  if (!rawVal) return { formatted: '', newCursor: 0 };

  const normalized = rawVal.replace(/,/g, '.');

  // Kursorgacha bo'lgan toza raqamlar va nuqtani hisoblash
  const rawBeforeCursor = normalized.slice(0, cursorPos);
  const cleanedBefore = rawBeforeCursor.replace(/[^\d.]/g, '');
  const firstDotIdx = cleanedBefore.indexOf('.');
  const validBefore = firstDotIdx === -1
    ? cleanedBefore
    : cleanedBefore.slice(0, firstDotIdx + 1) + cleanedBefore.slice(firstDotIdx + 1).replace(/\./g, '');
  const digitsBeforeCursor = validBefore.length;

  const formatted = formatInputNumber(rawVal);

  if (digitsBeforeCursor === 0) {
    return { formatted, newCursor: 0 };
  }

  let newCursor = formatted.length;
  let digitsSeen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/[\d.]/.test(formatted[i])) {
      digitsSeen++;
    }
    if (digitsSeen === digitsBeforeCursor) {
      newCursor = i + 1;
      break;
    }
  }

  return { formatted, newCursor };
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
