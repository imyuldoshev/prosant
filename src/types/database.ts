// src/types/database.ts
// Supabase PostgreSQL jadvallariga mos TypeScript turlari
// (supabase gen types typescript chiqarganiga mos struktura)

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PaymentMethodDb = 'naqd' | 'karta' | 'transfer' | 'nasiya';
export type UserRole = 'admin' | 'cashier' | 'viewer';
export type StockMovementType = 'in' | 'out' | 'return' | 'adjustment';

// ============================================================
// Jadval satrlari (Row types)
// ============================================================

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

export type ProductRow = {
  id: string;
  name: string;
  artikul: string | null;
  cost_price?: number | null;
  price: number;
  unit: string;
  category_id: string | null;
  image_key: string | null;
  image_url: string | null;
  stock: number;
  min_stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  search_vector?: unknown;
  categories?: { name: string } | null;
};

export type CustomerRow = {
  id: string;
  name: string;
  phone: string | null;
  created_at: string;
};

export type SaleRow = {
  id: string;
  sale_number: number;
  created_at: string;
  customer_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  payment_method: PaymentMethodDb;
  subtotal: number;
  discount: number;
  total: number;
  received_amount: number | null;
  change_amount: number | null;
  note: string | null;
  is_deleted: boolean;
  sale_items?: SaleItemRow[];
};

export type SaleItemRow = {
  id: string;
  sale_id: string;
  product_id: string | null;
  product_name: string;
  category: string | null;
  quantity: number;
  price: number;
  total: number;
  unit: string;
  artikul?: string | null;
};

export type StockMovementRow = {
  id: string;
  product_id: string;
  type: StockMovementType;
  quantity: number;
  reference: string | null;
  note: string | null;
  created_at: string;
};

export type ProfileRow = {
  id: string;
  full_name: string | null;
  role: UserRole;
  store_name: string;
  created_at: string;
};

// ============================================================
// Insert types
// ============================================================

export type CategoryInsert = {
  id?: string;
  name: string;
  slug: string;
  created_at?: string;
};

export type ProductInsert = {
  id?: string;
  name: string;
  artikul?: string | null;
  cost_price?: number | null;
  price: number;
  unit?: string;
  category_id?: string | null;
  image_key?: string | null;
  image_url?: string | null;
  stock?: number;
  min_stock?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type CustomerInsert = {
  id?: string;
  name: string;
  phone?: string | null;
  created_at?: string;
};

export type SaleInsert = {
  id?: string;
  sale_number?: number;
  created_at?: string;
  customer_id?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  payment_method: PaymentMethodDb;
  subtotal?: number;
  discount?: number;
  total?: number;
  received_amount?: number | null;
  change_amount?: number | null;
  note?: string | null;
  is_deleted?: boolean;
};

export type SaleItemInsert = {
  id?: string;
  sale_id: string;
  product_id?: string | null;
  product_name: string;
  category?: string | null;
  quantity: number;
  price: number;
  total: number;
  unit?: string;
  artikul?: string | null;
};

export type StockMovementInsert = {
  id?: string;
  product_id: string;
  type: StockMovementType;
  quantity: number;
  reference?: string | null;
  note?: string | null;
  created_at?: string;
};

export type ProfileInsert = {
  id: string;
  full_name?: string | null;
  role?: UserRole;
  store_name?: string;
  created_at?: string;
};

// ============================================================
// Database type
// ============================================================

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: CategoryRow;
        Insert: CategoryInsert;
        Update: Partial<CategoryInsert>;
        Relationships: [];
      };
      products: {
        Row: ProductRow;
        Insert: ProductInsert;
        Update: Partial<ProductInsert>;
        Relationships: [];
      };
      customers: {
        Row: CustomerRow;
        Insert: CustomerInsert;
        Update: Partial<CustomerInsert>;
        Relationships: [];
      };
      sales: {
        Row: SaleRow;
        Insert: SaleInsert;
        Update: Partial<SaleInsert>;
        Relationships: [];
      };
      sale_items: {
        Row: SaleItemRow;
        Insert: SaleItemInsert;
        Update: Partial<SaleItemInsert>;
        Relationships: [];
      };
      stock_movements: {
        Row: StockMovementRow;
        Insert: StockMovementInsert;
        Update: Partial<StockMovementInsert>;
        Relationships: [];
      };
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: Partial<ProfileInsert>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      stock_in: {
        Args: {
          p_product_id: string;
          p_quantity: number;
          p_note?: string | null;
        };
        Returns: ProductRow;
      };
      stock_in_batch: {
        Args: {
          p_items: Json;
          p_note?: string | null;
        };
        Returns: void;
      };
      search_products: {
        Args: {
          search_query: string;
        };
        Returns: ProductRow[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
