export interface Product {
  id: string;
  name: string;
  costPrice?: number;
  price: number;
  unit: string;
  category: string;
  image: string;
  stock: number;
  minStock?: number;
  artikul?: string;
}

/**
 * Mahsulotning qoldig'i kam qolganligini aniqlash:
 * 1. Agar mahsulotda "Eng kam qoldiq" (minStock) belgilangan bo'lsa: stock <= minStock
 * 2. Aks holda standart chegara: stock <= 5
 */
export function isLowStockProduct(p?: Product | null): boolean {
  if (!p) return false;
  const stock = Number(p.stock) || 0;
  const minStock = Number(p.minStock);
  if (!isNaN(minStock) && minStock > 0) {
    return stock <= minStock;
  }
  return stock <= 5;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type PaymentMethod = 'naqd' | 'karta' | 'transfer' | 'nasiya';

export interface SaleItem {
  productId: string;
  productName: string;
  category?: string;
  quantity: number;
  costPrice?: number;
  price: number;
  unit: string;
  total: number;
  artikul?: string;
}

export interface Contact {
  id: string;
  name: string;
  storeName?: string;
  phone?: string;
  address?: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SaleRecord {
  id: string;
  saleNumber: string;
  createdAt: string;
  items: SaleItem[];
  total: number;
  paymentMethod: PaymentMethod;
  customerName?: string;
  customerPhone?: string;
  contactId?: string;
  contactName?: string;
  discount?: number;
  receivedAmount?: number;
  changeAmount?: number;
  note?: string;
}

