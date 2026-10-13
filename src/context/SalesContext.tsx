import React, { createContext, useContext, useState, useEffect } from 'react';
import type { SaleRecord } from '../types';
import { useProducts } from './ProductContext';

const SALES_STORAGE_KEY = 'santexpro_sales_v2';

interface AddSaleParams {
  items: SaleRecord['items'];
  total: number;
  paymentMethod: SaleRecord['paymentMethod'];
  customerName?: string;
  customerPhone?: string;
  discount?: number;
  receivedAmount?: number;
  changeAmount?: number;
  note?: string;
  createdAt?: string;
}

interface SalesContextType {
  sales: SaleRecord[];
  addSale: (params: AddSaleParams) => SaleRecord;
  deleteSale: (id: string, restoreStock?: boolean) => void;
  getSaleById: (id: string) => SaleRecord | undefined;
  clearAllSales: () => void;
  resetToDemoSales: () => void;
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

// Boshlang'ich realistik namunaviy sotuvlar (Tarix sahifasi bo'sh ko'rinmasligi uchun)
function generateDemoSales(): SaleRecord[] {
  const now = new Date();
  
  const formatDateOffset = (hoursAgo: number) => {
    const d = new Date(now.getTime() - hoursAgo * 3600 * 1000);
    return d.toISOString();
  };

  return [
    {
      id: 'sale_1012_01',
      saleNumber: '#1054',
      createdAt: formatDateOffset(0.5), // 30 daqiqa oldin
      customerName: 'Jahongir aka (Usta)',
      customerPhone: '+998 90 123 45 67',
      paymentMethod: 'naqd',
      discount: 25000,
      total: 1250000,
      receivedAmount: 1300000,
      changeAmount: 50000,
      items: [
        {
          productId: '1',
          productName: 'Truba (Oq) 20mm',
          category: 'Trubalar',
          quantity: 40,
          price: 5000,
          unit: 'metr',
          total: 200000
        },
        {
          productId: '3',
          productName: 'Truba (Oq) 32mm',
          category: 'Trubalar',
          quantity: 25,
          price: 12000,
          unit: 'metr',
          total: 300000
        },
        {
          productId: '6',
          productName: 'Troynik Oq 20mm',
          category: 'Fitinglar',
          quantity: 30,
          price: 2500,
          unit: 'dona',
          total: 75000
        },
        {
          productId: '14',
          productName: 'Smesitel Vanna Premium',
          category: 'Smesitellar',
          quantity: 2,
          price: 350000,
          unit: 'dona',
          total: 700000
        }
      ],
      note: "Yangi bino montaji uchun xarid qilindi"
    },
    {
      id: 'sale_1012_02',
      saleNumber: '#1053',
      createdAt: formatDateOffset(2), // 2 soat oldin
      customerName: 'Dilshodbek',
      customerPhone: '+998 97 888 77 66',
      paymentMethod: 'karta',
      discount: 0,
      total: 750000,
      receivedAmount: 750000,
      changeAmount: 0,
      items: [
        {
          productId: '19',
          productName: 'Radiator (Bimetal) 10 seksiyali',
          category: 'Isitish',
          quantity: 1,
          price: 750000,
          unit: 'dona',
          total: 750000
        }
      ]
    },
    {
      id: 'sale_1012_03',
      saleNumber: '#1052',
      createdAt: formatDateOffset(3.5),
      customerName: 'Sobir quruvchi',
      paymentMethod: 'transfer',
      discount: 50000,
      total: 3450000,
      items: [
        {
          productId: '23',
          productName: 'Kotel 2 konturli 24kW (Ariston)',
          category: 'Isitish',
          quantity: 1,
          price: 3500000,
          unit: 'dona',
          total: 3500000
        }
      ],
      note: 'Hisob-faktura orqali o\'tkazildi'
    },
    {
      id: 'sale_1012_04',
      saleNumber: '#1051',
      createdAt: formatDateOffset(5),
      customerName: 'Sanjar',
      paymentMethod: 'naqd',
      discount: 0,
      total: 180000,
      receivedAmount: 200000,
      changeAmount: 20000,
      items: [
        {
          productId: '15',
          productName: 'Smesitel Rakovina Oddiy',
          category: 'Smesitellar',
          quantity: 1,
          price: 180000,
          unit: 'dona',
          total: 180000
        }
      ]
    },
    {
      id: 'sale_1012_05',
      saleNumber: '#1050',
      createdAt: formatDateOffset(18), // Kecha
      customerName: 'Olim aka',
      customerPhone: '+998 93 555 44 33',
      paymentMethod: 'karta',
      discount: 10000,
      total: 640000,
      items: [
        {
          productId: '25',
          productName: 'Sirkulyatsion Nasos 25/4 (Shimge)',
          category: 'Nasoslar',
          quantity: 1,
          price: 350000,
          unit: 'dona',
          total: 350000
        },
        {
          productId: '11',
          productName: 'Amerikanka (Ichki rezba) 25x3/4"',
          category: 'Fitinglar',
          quantity: 6,
          price: 25000,
          unit: 'dona',
          total: 150000
        },
        {
          productId: '21',
          productName: 'Tyoply Pol Trubasi 16mm PEX-A',
          category: 'Isitish',
          quantity: 15,
          price: 10000,
          unit: 'metr',
          total: 150000
        }
      ]
    },
    {
      id: 'sale_1012_06',
      saleNumber: '#1049',
      createdAt: formatDateOffset(26), // Kecha
      customerName: 'Azamat (Santexnik)',
      paymentMethod: 'nasiya',
      discount: 0,
      total: 2150000,
      items: [
        {
          productId: '28',
          productName: 'Unitaz Monoblok',
          category: 'Katta tovarlar',
          quantity: 1,
          price: 850000,
          unit: 'dona',
          total: 850000
        },
        {
          productId: '30',
          productName: 'Rakovina Tumbasi bilan 80sm',
          category: 'Katta tovarlar',
          quantity: 1,
          price: 1200000,
          unit: 'dona',
          total: 1200000
        },
        {
          productId: '33',
          productName: 'Sifon Avtomat',
          category: 'Aksessuarlar',
          quantity: 1,
          price: 65000,
          unit: 'dona',
          total: 65000
        },
        {
          productId: '34',
          productName: 'Jo\'mrak (Vintil) 1/2"',
          category: 'Aksessuarlar',
          quantity: 1,
          price: 35000,
          unit: 'dona',
          total: 35000
        }
      ],
      note: 'Oy oxirigacha to\'lanadi'
    },
    {
      id: 'sale_1012_07',
      saleNumber: '#1048',
      createdAt: formatDateOffset(48), // 2 kun oldin
      customerName: 'Bekzod',
      paymentMethod: 'naqd',
      discount: 0,
      total: 420000,
      receivedAmount: 420000,
      changeAmount: 0,
      items: [
        {
          productId: '16',
          productName: 'Smesitel Oshxona Egiluvchan',
          category: 'Smesitellar',
          quantity: 1,
          price: 250000,
          unit: 'dona',
          total: 250000
        },
        {
          productId: '7',
          productName: 'Mufta Oq 20mm',
          category: 'Fitinglar',
          quantity: 10,
          price: 1500,
          unit: 'dona',
          total: 15000
        },
        {
          productId: '32',
          productName: 'Sochiq quritgich 50x60sm Suvli',
          category: 'Aksessuarlar',
          quantity: 1,
          price: 155000,
          unit: 'dona',
          total: 155000
        }
      ]
    },
    {
      id: 'sale_1012_08',
      saleNumber: '#1047',
      createdAt: formatDateOffset(72), // 3 kun oldin
      customerName: 'Murod akalar',
      paymentMethod: 'transfer',
      discount: 100000,
      total: 4800000,
      items: [
        {
          productId: '31',
          productName: 'Dush Kabina 90x90sm',
          category: 'Katta tovarlar',
          quantity: 1,
          price: 3500000,
          unit: 'dona',
          total: 3500000
        },
        {
          productId: '17',
          productName: 'Smesitel Dush Tropik Dush',
          category: 'Smesitellar',
          quantity: 1,
          price: 600000,
          unit: 'dona',
          total: 600000
        },
        {
          productId: '22',
          productName: 'Tyoply Pol Kollektori 5 kontur',
          category: 'Isitish',
          quantity: 1,
          price: 650000,
          unit: 'dona',
          total: 650000
        },
        {
          productId: '9',
          productName: 'Perexod Oq 25x20mm',
          category: 'Fitinglar',
          quantity: 50,
          price: 3000,
          unit: 'dona',
          total: 150000
        }
      ]
    }
  ];
}

export function SalesProvider({ children }: { children: React.ReactNode }) {
  const { deductStock, returnStock } = useProducts();

  const [sales, setSales] = useState<SaleRecord[]>(() => {
    try {
      const saved = localStorage.getItem(SALES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load sales from localStorage', e);
    }
    return generateDemoSales();
  });

  useEffect(() => {
    try {
      localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(sales));
    } catch (e) {
      console.error('Failed to save sales to localStorage', e);
    }
  }, [sales]);

  const addSale = (params: AddSaleParams): SaleRecord => {
    // Navbatdagi chek raqamini topish (maksimal raqam asosida)
    const maxNum = sales.reduce((max, s) => {
      const n = parseInt(s.saleNumber.replace(/\D/g, ''), 10);
      return isNaN(n) ? max : Math.max(max, n);
    }, 1000);
    const nextNumber = maxNum + 1;

    const newSale: SaleRecord = {
      id: `sale_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      saleNumber: `#${nextNumber}`,
      createdAt: params.createdAt || new Date().toISOString(),
      items: params.items,
      total: params.total,
      paymentMethod: params.paymentMethod,
      customerName: params.customerName?.trim() || undefined,
      customerPhone: params.customerPhone?.trim() || undefined,
      discount: params.discount || 0,
      receivedAmount: params.receivedAmount,
      changeAmount: params.changeAmount,
      note: params.note?.trim() || undefined,
    };

    // Mahsulotlar qoldig'ini kamaytirish
    deductStock(
      params.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      }))
    );

    setSales(prev => [newSale, ...prev]);
    return newSale;
  };

  const deleteSale = (id: string, restoreStock: boolean = true) => {
    const saleToDelete = sales.find(s => s.id === id);
    if (!saleToDelete) return;

    if (restoreStock && saleToDelete.items) {
      returnStock(
        saleToDelete.items.map(it => ({
          productId: it.productId,
          quantity: it.quantity,
        }))
      );
    }

    setSales(prev => prev.filter(s => s.id !== id));
  };

  const getSaleById = (id: string): SaleRecord | undefined => {
    return sales.find(s => s.id === id);
  };

  const clearAllSales = () => {
    setSales([]);
    localStorage.removeItem(SALES_STORAGE_KEY);
  };

  const resetToDemoSales = () => {
    const demo = generateDemoSales();
    setSales(demo);
    localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(demo));
  };

  return (
    <SalesContext.Provider
      value={{
        sales,
        addSale,
        deleteSale,
        getSaleById,
        clearAllSales,
        resetToDemoSales,
      }}
    >
      {children}
    </SalesContext.Provider>
  );
}

export function useSales() {
  const context = useContext(SalesContext);
  if (!context) {
    throw new Error('useSales must be used within a SalesProvider');
  }
  return context;
}
