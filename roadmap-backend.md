# SantexPro — Backend Integration Roadmap

> **Loyiha holati:** React + Vite frontend, localStorage ga asoslangan state management
> **Maqsad:** Production-ready bulutli backend ulash
> **Stack:** Supabase · Cloudflare R2 · PostgreSQL FTS · Redis

---

## Loyihani Tahlil Qilish — Hozirgi Holat

### Kuchli tomonlar

| Soha | Holat |
|------|-------|
| TypeScript types | `Product`, `SaleRecord`, `SaleItem`, `CartItem` — aniq va to'liq |
| Context arxitektura | `ProductContext` + `SalesContext` — logika ajratilgan, almashtirishga tayyor |
| Business logika | Stock deduction, return, sale number auto-increment — togri ishlab turibdi |
| Routing | React Router v7 — sahifalar aniq: `/`, `/tovarlar`, `/tarix` |
| Service layer | `updateManager.ts` mavjud — services/ papkasi bor, kengaytirsa boladi |

### Muammolar (Backend kerak bolgan joylar)

| Muammo | Sabab |
|--------|-------|
| `localStorage` — yagona saqlash | Brauzer tozalansa data yoqoladi, boshqa qurilmada korinmaydi |
| Mock data `mockData.ts` | Real mahsulotlar bazasiga otish kerak |
| Rasm saqlash — Unsplash URL | Production uchun oz serverimizda bolishi shart |
| Bir foydalanuvchi | Multi-user, auth, rol tizimi yoq |
| Offline-first yoq | Tarmoq uzilganda ilovaning holatini boshqarish kerak |

---

## Stack Tanlovini Baholash

### Supabase — TOGRI TANLOV

- PostgreSQL — munosabatli malumotlar uchun ideal
- Built-in Auth (email/phone/magic link)
- Realtime subscriptions — bir nechta kassir bir vaqtda ishlasa, stock ozgarishi barcha brauzerlarda korinadi
- Row Level Security (RLS) — foydalanuvchi faqat oz malumotlarini koradi
- Edge Functions (Deno)
- **Bepul tier:** 500 MB DB, 1 GB storage, 50k auth users

### Cloudflare R2 — TOGRI TANLOV

- S3-compatible API
- **Egress fee yoq** (AWS S3 da bor — katta tejamkorlik)
- Cloudflare CDN bilan birga — rasmlar tez yuklanadi
- presigned URL — frontend togidan-togri yuklashi mumkin
- **Bepul tier:** 10 GB/oy storage, 1M oqish/oy

### PostgreSQL FTS (Supabase ichida) — TOGRI TANLOV

- `tsvector` + `tsquery` — uzbek va rus mahsulot nomlarida qidiruv
- `pg_trgm` extension — qisman mos kelish (trigram similarity)
- Alohida qidiruv servisi kerak emas
- SantexPro uchun (<100k mahsulot) YETARLI

---

## Redis — TAVSIYA BERAMAN, LEKIN SHARTLI

| Holat | Redis kerakmi? |
|-------|---------------|
| Sessiya saqlash | Ha (JWT invalidation uchun) |
| Qidiruv kesh | Faqat 10k+ sorov/kunda |
| Rate limiting | Ha (Upstash Redis bilan oson) |
| Real-time cart | Yoq — Supabase Realtime yetarli |
| Hisobot kesh | Ha (kunlik/haftalik statistika) |

> **Birinchi fazada Redis KERAK EMAS.**
> **Ikkinchi fazada** (100+ foydalanuvchi, hisobotlar) — **Upstash Redis** qoshing.

Nima uchun Upstash Redis:
- Serverless — faqat ishlatilgan sorovlar uchun tolanadi
- REST API ham bor — Edge Functions ichida ham ishlaydi
- **Bepul tier:** 10k sorov/kun

---

## Malumotlar Bazasi Sxemasi

```sql
-- =============================================
-- SUPABASE POSTGRESQL SCHEMA
-- =============================================

CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  artikul     TEXT UNIQUE,
  price       NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  unit        TEXT NOT NULL DEFAULT 'dona',
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  image_key   TEXT,
  image_url   TEXT,
  stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  min_stock   INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('russian', coalesce(name, '') || ' ' || coalesce(artikul, ''))
  ) STORED
);

CREATE INDEX products_search_idx ON products USING GIN(search_vector);
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX products_name_trgm_idx ON products USING GIN(name gin_trgm_ops);

CREATE TABLE customers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  phone       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sales (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number     SERIAL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  customer_id     UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name   TEXT,
  customer_phone  TEXT,
  payment_method  TEXT NOT NULL CHECK (payment_method IN ('naqd','karta','transfer','nasiya')),
  subtotal        NUMERIC(12,2) NOT NULL,
  discount        NUMERIC(12,2) DEFAULT 0,
  total           NUMERIC(12,2) NOT NULL,
  received_amount NUMERIC(12,2),
  change_amount   NUMERIC(12,2),
  note            TEXT,
  is_deleted      BOOLEAN DEFAULT false
);

CREATE TABLE sale_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id      UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id   UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  category     TEXT,
  quantity     NUMERIC(10,3) NOT NULL CHECK (quantity > 0),
  price        NUMERIC(12,2) NOT NULL,
  total        NUMERIC(12,2) NOT NULL,
  unit         TEXT NOT NULL
);

CREATE TABLE stock_movements (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('in','out','return','adjustment')),
  quantity   NUMERIC(10,3) NOT NULL,
  reference  TEXT,
  note       TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT,
  role       TEXT NOT NULL DEFAULT 'cashier' CHECK (role IN ('admin','cashier','viewer')),
  store_name TEXT DEFAULT 'SantexPro',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_authenticated" ON products
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "write_admin" ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Auto updated_at trigger
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();
```

---

## Fayl Tuzilmasi

```
santexpro/
├── src/
│   ├── lib/
│   │   ├── supabase.ts          # Supabase client (singleton)
│   │   ├── r2.ts                # Cloudflare R2 helper
│   │   └── redis.ts             # Upstash Redis client (2-fazada)
│   │
│   ├── services/
│   │   ├── updateManager.ts     # (mavjud)
│   │   ├── productService.ts    # YANGI: Supabase CRUD + FTS
│   │   ├── salesService.ts      # YANGI: Sotuv API
│   │   ├── categoryService.ts   # YANGI: Kategoriyalar
│   │   ├── stockService.ts      # YANGI: Stock kirim/chiqim
│   │   ├── imageService.ts      # YANGI: R2 upload/delete
│   │   └── searchService.ts     # YANGI: PostgreSQL FTS
│   │
│   ├── hooks/
│   │   ├── useProducts.ts
│   │   ├── useSales.ts
│   │   ├── useSearch.ts
│   │   └── useRealtime.ts
│   │
│   ├── context/                 # localStorage -> Supabase
│   │   ├── ProductContext.tsx   # useQuery wrapperi boladi
│   │   ├── SalesContext.tsx     # useMutation + optimistic update
│   │   └── UpdateContext.tsx    # (mavjud)
│   │
│   └── types/
│       ├── index.ts             # (mavjud)
│       └── database.ts          # YANGI: Supabase generated types
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   └── 002_stock_procedures.sql
│   └── seed.sql
│
└── .env.local
```

---

## Fazalar Boyicha Reja

### FAZA 0 — Tayyorgarlik (1-2 kun)

```bash
npm install @supabase/supabase-js
npm install @tanstack/react-query
npm install zod
npm install browser-image-compression
# 2-fazada: npm install @upstash/redis
```

**.env.local:**
```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_R2_PUBLIC_URL=https://images.santexpro.uz

# VITE_ olmaydi — server sirlari:
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_key
R2_SECRET_ACCESS_KEY=your_secret
R2_BUCKET_NAME=santexpro-images
```

**Cloudflare R2 CORS:**
```json
[{
  "AllowedOrigins": ["http://localhost:5173", "https://santexpro.uz"],
  "AllowedMethods": ["GET", "PUT", "DELETE"],
  "AllowedHeaders": ["*"]
}]
```

---

### FAZA 1 — Database va Auth (3-5 kun)

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: { persistSession: true, autoRefreshToken: true },
    realtime: { params: { eventsPerSecond: 10 } },
  }
);
```

```bash
# Supabase CLI
npm install -g supabase
supabase login
supabase init
supabase migration new initial_schema
supabase db push
supabase gen types typescript --project-id YOUR_ID > src/types/database.ts
```

---

### FAZA 2 — Mahsulotlar Servisi (3-4 kun)

```typescript
// src/services/productService.ts
export const productService = {
  getAll: async (page = 0, limit = 50) => {
    const { data, error, count } = await supabase
      .from('products')
      .select('*, categories(name)', { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);
    if (error) throw error;
    return { data, count };
  },

  search: async (query: string) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${query}%,artikul.ilike.%${query}%`)
      .eq('is_active', true)
      .limit(20);
    if (error) throw error;
    return data;
  },

  stockIn: async (id: string, quantity: number, note?: string) => {
    const { data, error } = await supabase.rpc('stock_in', {
      p_product_id: id, p_quantity: quantity, p_note: note,
    });
    if (error) throw error;
    return data;
  },
};
```

```sql
-- 002_stock_procedures.sql
CREATE OR REPLACE FUNCTION stock_in(
  p_product_id UUID, p_quantity NUMERIC, p_note TEXT DEFAULT NULL
) RETURNS products AS $$
DECLARE updated_product products;
BEGIN
  UPDATE products SET stock = stock + p_quantity, updated_at = now()
  WHERE id = p_product_id RETURNING * INTO updated_product;
  INSERT INTO stock_movements (product_id, type, quantity, note)
  VALUES (p_product_id, 'in', p_quantity, p_note);
  RETURN updated_product;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### FAZA 3 — Rasm Saqlash R2 (2-3 kun)

```typescript
// supabase/functions/get-upload-url/index.ts
import { S3Client, PutObjectCommand } from 'npm:@aws-sdk/client-s3';
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${Deno.env.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID')!,
    secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY')!,
  },
});

Deno.serve(async (req) => {
  const { fileName, contentType } = await req.json();
  const key = `products/${Date.now()}-${fileName}`;
  const command = new PutObjectCommand({
    Bucket: Deno.env.get('R2_BUCKET_NAME'), Key: key, ContentType: contentType,
  });
  const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
  return Response.json({ presignedUrl, key });
});
```

```typescript
// src/services/imageService.ts
export const imageService = {
  upload: async (file: File): Promise<string> => {
    const { data } = await supabase.functions.invoke('get-upload-url', {
      body: { fileName: file.name, contentType: file.type },
    });
    await fetch(data.presignedUrl, {
      method: 'PUT', body: file,
      headers: { 'Content-Type': file.type },
    });
    return `${import.meta.env.VITE_R2_PUBLIC_URL}/${data.key}`;
  },
};
```

---

### FAZA 4 — Sotuv va Realtime (3-4 kun)

```typescript
// src/hooks/useRealtime.ts
export function useProductsRealtime() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        queryClient.invalidateQueries({ queryKey: ['products'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);
}
```

---

### FAZA 5 — localStorage dan Migratsiya (2-3 kun)

```typescript
// src/services/migrationService.ts
export async function migrateLocalStorageToSupabase() {
  if (localStorage.getItem('santexpro_migrated_v1')) return;

  const localProducts = JSON.parse(localStorage.getItem('santexpro_products_v1') || '[]');
  if (localProducts.length > 0) {
    await supabase.from('products').upsert(localProducts);
  }

  const localSales = JSON.parse(localStorage.getItem('santexpro_sales_v2') || '[]');
  for (const sale of localSales) {
    await supabase.from('sales').insert(sale);
  }

  localStorage.setItem('santexpro_migrated_v1', 'true');
}
```

Context refactoring — barcha sahifalar (KassaPage, TovarlarPage, TarixPage) HECH NARSA OZGARTIRMAYDI.
Faqat context ichki logikasi ozgaradi (useState -> useQuery/useMutation).

---

### FAZA 6 — Redis, ixtiyoriy (2-3 kun)

```typescript
// src/lib/redis.ts
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: import.meta.env.VITE_UPSTASH_REDIS_URL,
  token: import.meta.env.VITE_UPSTASH_REDIS_TOKEN,
});

// Hisobot kesh — 1 soat
export async function getCachedDailyStats(date: string) {
  const key = `daily-stats:${date}`;
  const cached = await redis.get(key);
  if (cached) return cached;
  const fresh = await salesService.getDailyStats(date);
  await redis.setex(key, 3600, JSON.stringify(fresh));
  return fresh;
}

// Rate limiting
export async function checkRateLimit(ip: string): Promise<boolean> {
  const key = `rate:${ip}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 60);
  return count <= 30;
}

// JWT blacklist (logout uchun)
export async function blacklistToken(jti: string, exp: number) {
  const ttl = exp - Math.floor(Date.now() / 1000);
  if (ttl > 0) await redis.setex(`blacklist:${jti}`, ttl, '1');
}
```

---

## Umumiy Vaqt Rejasi

| Faza | Nomi | Vaqt |
|------|------|------|
| 0 | Tayyorgarlik | 1-2 kun |
| 1 | Database va Auth | 3-5 kun |
| 2 | Mahsulotlar Servisi + FTS | 3-4 kun |
| 3 | Rasm Saqlash (R2) | 2-3 kun |
| 4 | Sotuv va Realtime | 3-4 kun |
| 5 | localStorage Migratsiya | 2-3 kun |
| 6 | Redis (ixtiyoriy) | 2-3 kun |
| **Jami (Redis-siz)** | | **~14-19 ish kuni** |
| **Jami (Redis bilan)** | | **~16-22 ish kuni** |

---

## Xavfsizlik

| Qatlam | Himoya |
|--------|--------|
| Auth | Supabase Auth — JWT, auto-refresh |
| DB | Row Level Security |
| R2 | Presigned URL — kalitlar frontend da yoq |
| Env | `VITE_` prefiksi faqat ommaviy kalitlarga |
| API | Edge Function CORS |
| Rate limit | Upstash Redis (6-fazada) |

---

## Boshlash

```bash
# 1. Paketlar
npm install @supabase/supabase-js @tanstack/react-query zod browser-image-compression

# 2. Supabase dashboard -> yangi loyiha -> kalitlarni .env.local ga qoyish
# 3. Cloudflare -> R2 bucket yaratish
# 4. FAZA 0 dan boshlash
```

> **Tavsiya:** Har faza tugagach test qiling va keyingisiga oting.
> Birinchi maqsad: Auth + Products CRUD ishlashi.
