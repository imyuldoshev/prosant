export interface SaleEntry {
  productId: string;
  miqdor: number;
  summa: number;
  vaqt: string;
}

// Mock today's date prefix
const today = new Date().toISOString().split('T')[0];

export const mockTodaySales: SaleEntry[] = [
  { productId: 'p1', miqdor: 20, summa: 240000, vaqt: `${today}T09:15:00.000Z` },
  { productId: 'p3', miqdor: 1, summa: 350000, vaqt: `${today}T10:30:00.000Z` },
  { productId: 'p1', miqdor: 5, summa: 60000, vaqt: `${today}T11:45:00.000Z` },
  { productId: 'p7', miqdor: 2, summa: 1700000, vaqt: `${today}T13:20:00.000Z` },
  { productId: 'p9', miqdor: 50, summa: 175000, vaqt: `${today}T14:10:00.000Z` },
  { productId: 'p3', miqdor: 1, summa: 350000, vaqt: `${today}T15:05:00.000Z` },
  { productId: 'p11', miqdor: 10, summa: 850000, vaqt: `${today}T16:30:00.000Z` },
];

export function getTodaySalesByProduct() {
  const aggregated: Record<string, { sotilganMiqdor: number; jamiSumma: number; entries: SaleEntry[] }> = {};
  
  mockTodaySales.forEach(entry => {
    if (!aggregated[entry.productId]) {
      aggregated[entry.productId] = {
        sotilganMiqdor: 0,
        jamiSumma: 0,
        entries: [],
      };
    }
    aggregated[entry.productId].sotilganMiqdor += entry.miqdor;
    aggregated[entry.productId].jamiSumma += entry.summa;
    aggregated[entry.productId].entries.push(entry);
  });
  
  return aggregated;
}
