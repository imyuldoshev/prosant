export type Category = string;

export interface Movement {
  id: string;
  productId: string;
  tur: 'kirim' | 'chiqim';
  miqdor: number;
  sana: string; // ISO string
  tannarx?: number;
  taminotchi?: string;
  izoh?: string;
}

export interface Product {
  id: string;
  nom: string;
  category: Category;
  rasm: string; // We'll use a lucide icon name as a placeholder rasm instead of an image URL as requested
  sotuvNarxi: number;
  tannarx: number;
  birlik: 'dona' | 'metr' | 'kg' | 'komplekt' | 'litr';
  joriyQoldiq: number;
  minimalQoldiq: number;
  qoshilganSana: string;
  oxirgiKirimSana: string;
  movements?: Movement[];
}
