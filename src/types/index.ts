export interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  category: string;
  image: string;
  stock: number;
  minStock?: number;
  artikul?: string;
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
  price: number;
  unit: string;
  total: number;
  artikul?: string;
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
  discount?: number;
  receivedAmount?: number;
  changeAmount?: number;
  note?: string;
}
