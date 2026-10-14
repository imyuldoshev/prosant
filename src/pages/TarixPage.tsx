import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  History, Search, Calendar, Download, Trash2, Eye, Printer, 
  CreditCard, Banknote, Building2, FileText, 
  X, AlertCircle, ShoppingBag, TrendingUp, DollarSign,
  User, Phone, Clock, ChevronDown
} from 'lucide-react';
import { useSales } from '../context/SalesContext';
import { useProducts } from '../context/ProductContext';
import { useBlockUpdate } from '../context/UpdateContext';
import type { SaleRecord, PaymentMethod } from '../types';
import { DateRangePicker } from '../components/DateRangePicker';
import { ReceiptModal } from '../components/ReceiptModal';
import { CustomSelect } from '../components/CustomSelect';
import { toISODate, formatDateTime, formatToDMY } from '../utils/dateUtils';

type SortOrderType = 'newest' | 'oldest' | 'highest' | 'lowest';

export function TarixPage() {
  const { sales, deleteSale, clearAllSales, resetToDemoSales } = useSales();
  const { products } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();

  // Fast product lookup map for calculating cost prices / profit
  const productsMap = useMemo(() => {
    return new Map(products.map(p => [p.id, p]));
  }, [products]);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<SortOrderType>('newest');

  // Mobile expandable card details state
  const [expandedSaleIds, setExpandedSaleIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedSaleIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Date Range state synced with URL search params (?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD)
  const [startDate, setStartDate] = useState(() => searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(() => searchParams.get('endDate') || '');

  // Keep state in sync if URL query parameters change externally
  useEffect(() => {
    const s = searchParams.get('startDate') || '';
    const e = searchParams.get('endDate') || '';
    setStartDate(s);
    setEndDate(e);
  }, [searchParams]);

  // Synchronize date range state and URL query params
  const handleDateRangeChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);

    const newParams = new URLSearchParams(searchParams);
    if (start && end) {
      newParams.set('startDate', start);
      newParams.set('endDate', end);
    } else {
      newParams.delete('startDate');
      newParams.delete('endDate');
    }
    setSearchParams(newParams, { replace: true });
  };

  // Quick preset button click handler
  const handleQuickPreset = (preset: 'all' | 'today' | 'yesterday' | 'week' | 'month') => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (preset === 'all') {
      handleDateRangeChange('', '');
    } else if (preset === 'today') {
      const todayStr = toISODate(today);
      handleDateRangeChange(todayStr, todayStr);
    } else if (preset === 'yesterday') {
      const y = new Date(today.getTime() - 24 * 3600 * 1000);
      const yStr = toISODate(y);
      handleDateRangeChange(yStr, yStr);
    } else if (preset === 'week') {
      const w = new Date(today.getTime() - 6 * 24 * 3600 * 1000);
      handleDateRangeChange(toISODate(w), toISODate(today));
    } else if (preset === 'month') {
      // Oxirgi 1 oy (oxirgi 30 kunlik davr)
      const m = new Date(today.getTime() - 29 * 24 * 3600 * 1000);
      handleDateRangeChange(toISODate(m), toISODate(today));
    }
  };

  // Calculate which preset is active
  const currentPreset = useMemo(() => {
    if (!startDate && !endDate) return 'all';
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayStr = toISODate(today);

    if (startDate === todayStr && endDate === todayStr) return 'today';
    const yStr = toISODate(new Date(today.getTime() - 24 * 3600 * 1000));
    if (startDate === yStr && endDate === yStr) return 'yesterday';
    const wStr = toISODate(new Date(today.getTime() - 6 * 24 * 3600 * 1000));
    if (startDate === wStr && endDate === todayStr) return 'week';
    const mStr = toISODate(new Date(today.getTime() - 29 * 24 * 3600 * 1000));
    if (startDate === mStr && endDate === todayStr) return 'month';
    const firstDay = toISODate(new Date(today.getFullYear(), today.getMonth(), 1));
    if (startDate === firstDay && endDate === todayStr) return 'month';
    return 'custom';
  }, [startDate, endDate]);

  // Dynamic user-friendly date range badge text
  const dateRangeBadgeText = useMemo(() => {
    if (!startDate && !endDate) return "Barcha davrlar bo'yicha";
    if (currentPreset === 'today') return 'Bugungi kun hisobi';
    if (currentPreset === 'yesterday') return 'Kecha hisobi';
    if (currentPreset === 'week') return 'Oxirgi 7 kun hisobi';
    if (currentPreset === 'month') return 'Oxirgi 1 oylik hisob';
    return `${formatToDMY(startDate)} — ${formatToDMY(endDate)}`;
  }, [startDate, endDate, currentPreset]);

  // Modal states
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
  const [shouldPrint, setShouldPrint] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<SaleRecord | null>(null);
  const [restoreStockOnDelete, setRestoreStockOnDelete] = useState(true);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  // Safety guard: Block silent updates while viewing receipt modal or confirm dialogs
  useBlockUpdate(
    selectedSale !== null || saleToDelete !== null || isConfirmClearOpen,
    'Sotuvlar tarixi modal oynasi ochiq'
  );

  // Trigger print safely once selectedSale is set and rendered
  useEffect(() => {
    if (shouldPrint && selectedSale) {
      window.print();
      setShouldPrint(false);
    }
  }, [shouldPrint, selectedSale]);

  // Filtered & Sorted Sales
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const saleDate = new Date(sale.createdAt);

      // 1. Date Range Filter:
      // Kun chegaralari: startDate 00:00:00.000 va endDate 23:59:59.999
      // Agar faqat bitta sana tanlansa yoki hech qanday oraliq tanlanmasa, filtrsiz barcha ma'lumotlar ko'rinsin.
      if (startDate && endDate) {
        const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
        const [eYear, eMonth, eDay] = endDate.split('-').map(Number);

        const startBoundary = new Date(sYear, sMonth - 1, sDay, 0, 0, 0, 0);
        const endBoundary = new Date(eYear, eMonth - 1, eDay, 23, 59, 59, 999);

        if (saleDate < startBoundary || saleDate > endBoundary) {
          return false;
        }
      }

      // 2. Payment Method Filter
      if (paymentFilter !== 'all' && sale.paymentMethod !== paymentFilter) {
        return false;
      }

      // 3. Search Query (Sale ID, Product Name, Customer, Phone)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesNumber = sale.saleNumber.toLowerCase().includes(query);
        const matchesCustomer = sale.customerName?.toLowerCase().includes(query) || false;
        const matchesPhone = sale.customerPhone?.toLowerCase().includes(query) || false;
        const matchesNote = sale.note?.toLowerCase().includes(query) || false;
        const matchesItem = sale.items.some(it => it.productName.toLowerCase().includes(query));

        if (!matchesNumber && !matchesCustomer && !matchesPhone && !matchesNote && !matchesItem) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortOrder === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortOrder === 'highest') {
        return b.total - a.total;
      }
      if (sortOrder === 'lowest') {
        return a.total - b.total;
      }
      return 0;
    });
  }, [sales, searchQuery, startDate, endDate, paymentFilter, sortOrder]);

  // Summary Metrics dynamically calculated from filteredSales (so date range filter updates the numbers)
  const stats = useMemo(() => {
    const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
    const totalCount = filteredSales.length;

    // Foyda (belgilangan sotish narxidan qolgan sof foyda):
    // Jami tushum - Jami tannarx (asl narx)
    let totalCost = 0;
    for (const sale of filteredSales) {
      for (const item of sale.items) {
        const prod = productsMap.get(item.productId);
        const cp = typeof item.costPrice === 'number' && item.costPrice > 0
          ? item.costPrice
          : (prod && typeof prod.costPrice === 'number' && prod.costPrice > 0
              ? prod.costPrice
              : item.price * 0.7); // 30% margin fallback for older records without costPrice
        totalCost += cp * item.quantity;
      }
    }

    const totalProfit = Math.round(totalRevenue - totalCost);
    const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0';

    // Payment methods breakdown for the filtered period
    const methods = {
      naqd: filteredSales.filter(s => s.paymentMethod === 'naqd').reduce((sum, s) => sum + s.total, 0),
      karta: filteredSales.filter(s => s.paymentMethod === 'karta').reduce((sum, s) => sum + s.total, 0),
      transfer: filteredSales.filter(s => s.paymentMethod === 'transfer').reduce((sum, s) => sum + s.total, 0),
      nasiya: filteredSales.filter(s => s.paymentMethod === 'nasiya').reduce((sum, s) => sum + s.total, 0),
    };

    return {
      totalRevenue,
      totalProfit,
      profitMargin,
      totalCount,
      methods,
    };
  }, [filteredSales, productsMap]);

  // Payment badge styles
  const getPaymentBadge = (method: PaymentMethod) => {
    switch (method) {
      case 'naqd':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Banknote className="w-3.5 h-3.5 text-emerald-600" />
            Naqd
          </span>
        );
      case 'karta':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <CreditCard className="w-3.5 h-3.5 text-blue-600" />
            Karta
          </span>
        );
      case 'transfer':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <Building2 className="w-3.5 h-3.5 text-purple-600" />
            O'tkazma
          </span>
        );
      case 'nasiya':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <FileText className="w-3.5 h-3.5 text-amber-600" />
            Nasiya
          </span>
        );
      default:
        return null;
    }
  };

  // Export filtered sales as CSV
  const handleExportCSV = () => {
    if (filteredSales.length === 0) {
      alert("Eksport qilish uchun sotuvlar mavjud emas!");
      return;
    }

    const csvEscape = (val: string) => `"${val.replace(/"/g, '""')}"`;

    const headers = ["Chek raqami", "Sana va Vaqt", "Mijoz", "Telefon", "To'lov usuli", "Mahsulotlar soni", "Chegirma (UZS)", "Jami summa (UZS)", "Izoh"];
    const rows = filteredSales.map(s => [
      csvEscape(s.saleNumber),
      csvEscape(formatDateTime(s.createdAt)),
      csvEscape(s.customerName || 'Oddiy mijoz'),
      csvEscape(s.customerPhone || '-'),
      csvEscape(s.paymentMethod.toUpperCase()),
      s.items.reduce((sum, it) => sum + it.quantity, 0),
      s.discount || 0,
      s.total,
      csvEscape(s.note || '')
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `santexpro_sotuvlar_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 h-full overflow-y-auto space-y-4 sm:space-y-6 bg-slate-50">
      
      {/* 1. TOP HEADER & GLOBAL ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 bg-white p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-14 sm:h-14 bg-brand/10 text-brand rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
            <History className="w-5 h-5 sm:w-8 sm:h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">Sotuvlar Tarixi</h1>
              <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-slate-100 text-slate-700 font-bold text-[10px] sm:text-xs rounded-full whitespace-nowrap">
                {sales.length} ta chek
              </span>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5 line-clamp-1 sm:line-clamp-none">
              Barcha amalga oshirilgan xaridlar, cheklar va moliyaviy hisobotlar
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl transition-all shadow-xs flex items-center gap-2 active:scale-95"
            title="CSV formatda yuklab olish"
          >
            <Download className="hidden sm:inline-block w-4 h-4 text-slate-500" />
            <span>Excel / CSV</span>
          </button>

          {sales.length > 0 && (
            <button
              type="button"
              onClick={() => setIsConfirmClearOpen(true)}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-sm rounded-xl transition-all border border-rose-200/60 flex items-center gap-2 active:scale-95"
              title="Barcha tarixni tozalash"
            >
              <Trash2 className="hidden sm:inline-block w-4 h-4" />
              <span>Tozalash</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS: 2 KATTA TITLE (JAMI TUSHUM & FOYDA) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        
        {/* KATTA TITLE 1: JAMI TUSHUM */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-xl shadow-indigo-900/20 border border-white/10 group transition-all hover:shadow-2xl">
          <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute right-5 top-5 w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white backdrop-blur-md border border-white/10 shadow-inner">
            <DollarSign className="w-6 h-6 text-blue-200" />
          </div>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-black uppercase tracking-widest text-blue-200/90 bg-white/10 px-3 py-1 rounded-lg backdrop-blur-xs">
              Jami tushum
            </span>
            <span className="text-[11px] font-bold text-blue-200/70">
              • {dateRangeBadgeText}
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-2 flex-wrap">
            <span className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white drop-shadow-xs">
              {stats.totalRevenue.toLocaleString()}
            </span>
            <span className="text-base sm:text-lg font-bold text-blue-200">
              UZS
            </span>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-blue-100/90 font-semibold flex-wrap gap-2">
            <span className="flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-blue-300" />
              <span>{stats.totalCount} ta chek bo'yicha savdo</span>
            </span>
            <span className="bg-white/15 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white">
              {startDate && endDate ? `${formatToDMY(startDate)} — ${formatToDMY(endDate)}` : 'Barcha davrlar'}
            </span>
          </div>
        </div>

        {/* KATTA TITLE 2: FOYDA (Belgilangan narxdan tannarx chegirilgan sof foyda) */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-xl shadow-teal-900/20 border border-white/10 group transition-all hover:shadow-2xl">
          <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute right-5 top-5 w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white backdrop-blur-md border border-white/10 shadow-inner">
            <TrendingUp className="w-6 h-6 text-emerald-200" />
          </div>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-200/90 bg-white/10 px-3 py-1 rounded-lg backdrop-blur-xs">
              Sof Foyda
            </span>
            <span className="text-[11px] font-bold text-emerald-200/70">
              • {dateRangeBadgeText}
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-2 flex-wrap">
            <span className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white drop-shadow-xs">
              {stats.totalProfit >= 0 ? '+' : ''}{stats.totalProfit.toLocaleString()}
            </span>
            <span className="text-base sm:text-lg font-bold text-emerald-200">
              UZS
            </span>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-emerald-100/90 font-semibold flex-wrap gap-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              <span>Belgilangan narxdan qolgan foyda</span>
            </span>
            <span className="bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 px-2.5 py-0.5 rounded-full text-[11px] font-black">
              {stats.profitMargin}% rentabellik
            </span>
          </div>
        </div>

      </div>

      {/* TO'LOV TURLARI BO'YICHA TAQSIMOT (Filtrlangan sana bo'yicha) */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">
          <CreditCard className="w-4 h-4 text-slate-400" />
          <span>To'lov turlari bo'yicha tushum ({dateRangeBadgeText}):</span>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center justify-between sm:justify-start gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-900 border border-emerald-100 rounded-xl text-xs font-bold">
            <span className="text-emerald-700 flex items-center gap-1">
              <Banknote className="w-3.5 h-3.5" /> Naqd:
            </span>
            <span className="font-black">{stats.methods.naqd.toLocaleString()} UZS</span>
          </div>
          <div className="flex items-center justify-between sm:justify-start gap-2 px-3 py-1.5 bg-sky-50 text-sky-900 border border-sky-100 rounded-xl text-xs font-bold">
            <span className="text-sky-700 flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5" /> Karta:
            </span>
            <span className="font-black">{stats.methods.karta.toLocaleString()} UZS</span>
          </div>
          <div className="flex items-center justify-between sm:justify-start gap-2 px-3 py-1.5 bg-purple-50 text-purple-900 border border-purple-100 rounded-xl text-xs font-bold">
            <span className="text-purple-700 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> O'tkazma:
            </span>
            <span className="font-black">{stats.methods.transfer.toLocaleString()} UZS</span>
          </div>
          <div className="flex items-center justify-between sm:justify-start gap-2 px-3 py-1.5 bg-amber-50 text-amber-900 border border-amber-100 rounded-xl text-xs font-bold">
            <span className="text-amber-700 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Nasiya:
            </span>
            <span className="font-black">{stats.methods.nasiya.toLocaleString()} UZS</span>
          </div>
        </div>
      </div>

      {/* 3. FILTERS & SEARCH TOOLBAR */}
      <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm space-y-3 sm:space-y-4">
        <div className="flex flex-col lg:flex-row gap-2.5 sm:gap-3">
          
          {/* Search box */}
          <div className="flex-1 relative">
            <label htmlFor="tarix-search-input" className="sr-only">
              Sotuvlar tarixini qidirish
            </label>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
            <input 
              id="tarix-search-input"
              name="search"
              type="text" 
              aria-label="Sotuvlar tarixini qidirish"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-10 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
              placeholder="Qidiruv: Chek raqami (#1054), mijoz ismi, telefon, mahsulot..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                aria-label="Tozalash"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Date Range Picker Popover */}
          <div className="w-full sm:w-auto">
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={handleDateRangeChange}
              align="left"
              className="w-full sm:w-auto"
            />
          </div>

          {/* Payment Method Filter & Sort */}
          <div className="w-full lg:w-auto grid grid-cols-1 sm:grid-cols-2 lg:flex items-center gap-2.5">
            <div className="w-full sm:w-48 lg:w-48">
              <CustomSelect
                value={paymentFilter}
                onChange={val => setPaymentFilter(val)}
                options={[
                  { value: 'all', label: "Barcha to'lovlar", icon: <CreditCard className="w-4 h-4 text-slate-400" /> },
                  { value: 'naqd', label: "Naqd pul", icon: <Banknote className="w-4 h-4 text-emerald-600" /> },
                  { value: 'karta', label: "Plastik karta", icon: <CreditCard className="w-4 h-4 text-sky-600" /> },
                  { value: 'transfer', label: "O'tkazma", icon: <Building2 className="w-4 h-4 text-purple-600" /> },
                  { value: 'nasiya', label: "Nasiya", icon: <FileText className="w-4 h-4 text-amber-600" /> },
                ]}
                ariaLabel="To'lov turi"
              />
            </div>

            <div className="w-full sm:w-52 lg:w-52">
              <CustomSelect
                value={sortOrder}
                onChange={val => setSortOrder(val as SortOrderType)}
                options={[
                  { value: 'newest', label: "Eng yangi birinchi", icon: <Clock className="w-4 h-4 text-slate-500" /> },
                  { value: 'oldest', label: "Eng eski birinchi", icon: <Clock className="w-4 h-4 text-slate-400" /> },
                  { value: 'highest', label: "Eng katta summa", icon: <DollarSign className="w-4 h-4 text-emerald-600" /> },
                  { value: 'lowest', label: "Eng kichik summa", icon: <TrendingUp className="w-4 h-4 text-rose-500" /> },
                ]}
                ariaLabel="Saralash tartibi"
              />
            </div>
          </div>
        </div>

        {/* Quick Date Filters Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Tezkor sana:
          </span>
          {[
            { id: 'all' as const, label: 'Barchasi' },
            { id: 'today' as const, label: 'Bugun' },
            { id: 'yesterday' as const, label: 'Kecha' },
            { id: 'week' as const, label: 'Oxirgi 7 kun' },
            { id: 'month' as const, label: 'Oxirgi 1 oy' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleQuickPreset(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
                currentPreset === tab.id
                  ? 'bg-brand text-white shadow-sm shadow-brand/30 ring-1 ring-brand'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}

          {/* Active Custom Date Range Badge with clear button */}
          {startDate && endDate && currentPreset === 'custom' && (
            <div className="flex items-center gap-2 px-3 py-1 bg-brand/10 text-brand rounded-xl text-xs font-bold border border-brand/20 ml-auto animate-in fade-in">
              <span>{formatToDMY(startDate)} — {formatToDMY(endDate)}</span>
              <button
                type="button"
                onClick={() => handleDateRangeChange('', '')}
                className="hover:bg-brand/20 p-0.5 rounded-md transition-colors"
                title="Oraliqni tozalash"
                aria-label="Oraliqni tozalash"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. MAIN SALES DATA (MOBILE CARDS & DESKTOP TABLE) */}
      
      {/* MOBILE VIEW (md:hidden): Compact Cards with Expandable Details (NO X-SCROLL!) */}
      <div className="md:hidden flex flex-col gap-3">
        {filteredSales.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-xs">
            <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Search className="w-7 h-7 text-slate-300" />
            </div>
            <h3 className="font-bold text-slate-700 text-base">
              {startDate && endDate 
                ? "Bu oraliqda sotuv topilmadi" 
                : "Hech qanday sotuv topilmadi"}
            </h3>
            <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto">
              Qidiruv yoki sana parametrlarini o'zgartirib ko'ring yoki yangi sotuv amalga oshiring.
            </p>
            {sales.length === 0 ? (
              <button
                type="button"
                onClick={() => resetToDemoSales()}
                className="mt-4 px-4 py-2 bg-brand text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 active:scale-95 cursor-pointer mx-auto"
              >
                <History className="w-3.5 h-3.5" />
                <span>Demo sotuvlarni tiklash</span>
              </button>
            ) : null}
          </div>
        ) : (
          <>
            {filteredSales.map(sale => {
              const isExpanded = expandedSaleIds.has(sale.id);
              const totalItemsCount = sale.items.reduce((acc, it) => acc + it.quantity, 0);

              return (
                <div 
                  key={sale.id}
                  className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex flex-col gap-2.5 transition-all"
                >
                  {/* 1. Header Row: Chek # + Date/Time + Payment Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xs font-black bg-slate-100 text-slate-800 px-2 py-0.5 rounded-lg border border-slate-200/80">
                        {sale.saleNumber}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 truncate">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        {formatDateTime(sale.createdAt)}
                      </span>
                    </div>
                    <div className="shrink-0">
                      {getPaymentBadge(sale.paymentMethod)}
                    </div>
                  </div>

                  {/* 2. Middle Row: Summa + Mijoz + Tovar soni */}
                  <div className="flex items-baseline justify-between gap-2 pt-1 border-t border-slate-100">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-slate-700 flex items-center gap-1.5 truncate">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {sale.customerName || <span className="text-slate-400 italic">Oddiy mijoz</span>}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                        {sale.items.length} xil tovar ({totalItemsCount} dona/metr)
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-black text-slate-900 text-base leading-tight">
                        {sale.total.toLocaleString()} <span className="text-[10px] font-bold text-slate-400">UZS</span>
                      </div>
                      {sale.discount && sale.discount > 0 ? (
                        <div className="text-[10px] font-bold text-rose-500">
                          -{sale.discount.toLocaleString()} UZS
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* 3. Actions Row: Chek, Chop, O'chirish, Ko'proq (More) toggle */}
                  <div className="grid grid-cols-4 gap-1.5 sm:gap-2 pt-1 border-t border-slate-100">
                    {/* Chek ko'rish button */}
                    <button
                      type="button"
                      onClick={() => setSelectedSale(sale)}
                      className="min-h-[38px] px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-brand/10 hover:text-brand text-slate-700 font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                      title="Chekni ko'rish"
                      aria-label="Chekni ko'rish"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Chek</span>
                    </button>

                    {/* Chop etish button */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSale(sale);
                        setShouldPrint(true);
                      }}
                      className="min-h-[38px] px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                      title="Chop etish"
                      aria-label="Chop etish"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Chop</span>
                    </button>

                    {/* O'chirish button */}
                    <button
                      type="button"
                      onClick={() => setSaleToDelete(sale)}
                      className="min-h-[38px] px-2 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                      title="Sotuvni o'chirish"
                      aria-label="Sotuvni o'chirish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>O'chirish</span>
                    </button>

                    {/* Batafsil / More Accordion Toggle Button */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(sale.id)}
                      className={`min-h-[38px] px-2 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer ${
                        isExpanded
                          ? 'bg-brand text-white shadow-xs'
                          : 'bg-brand/10 text-brand hover:bg-brand/15'
                      }`}
                      title={isExpanded ? "Yashirish" : "Batafsil ma'lumot"}
                      aria-expanded={isExpanded}
                    >
                      <span>{isExpanded ? "Yopish" : "Ko'proq"}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* 4. EXPANDABLE SECTION (More bosilganda chiqadigan qism) */}
                  {isExpanded && (
                    <div className="pt-2 border-t border-dashed border-slate-200 flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <ShoppingBag className="w-3 h-3 text-brand" /> Mahsulotlar tafsiloti:
                      </div>

                      <div className="bg-slate-50/80 rounded-xl p-2.5 space-y-2 border border-slate-100">
                        {sale.items.map((item, idx) => (
                          <div key={idx} className="flex items-start justify-between gap-2 text-xs">
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-slate-800 line-clamp-2 leading-snug">
                                {item.productName}
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium">
                                {item.quantity} {item.unit} × {item.price.toLocaleString()} UZS
                              </span>
                            </div>
                            <span className="font-extrabold text-slate-900 shrink-0 text-xs">
                              {(item.quantity * item.price).toLocaleString()} UZS
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Additional details if available (Phone, Note) */}
                      {(sale.customerPhone || sale.note) && (
                        <div className="bg-slate-50 rounded-xl p-2.5 text-xs text-slate-600 space-y-1 border border-slate-100">
                          {sale.customerPhone && (
                            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>Tel: {sale.customerPhone}</span>
                            </div>
                          )}
                          {sale.note && (
                            <div className="text-slate-500 italic text-[11px]">
                              Izoh: "{sale.note}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Mobile Summary bar at bottom */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 text-xs font-semibold text-slate-500 flex items-center justify-between">
              <div>Jami: <strong className="text-slate-800 font-bold">{filteredSales.length}</strong> ta chek</div>
              <div>Summa: <strong className="text-slate-900 font-black">{filteredSales.reduce((sum, s) => sum + s.total, 0).toLocaleString()} UZS</strong></div>
            </div>
          </>
        )}
      </div>

      {/* DESKTOP TABLE VIEW (hidden md:block) */}
      <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden h-auto">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200 text-xs font-bold uppercase tracking-wider">
                <th className="p-4 pl-6">Chek #</th>
                <th className="p-4">Sana & Vaqt</th>
                <th className="p-4">Mijoz</th>
                <th className="p-4">Mahsulotlar</th>
                <th className="p-4">To'lov turi</th>
                <th className="p-4 text-right">Summa</th>
                <th className="p-4 pr-6 text-center">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredSales.map(sale => {
                const totalItemsCount = sale.items.reduce((acc, it) => acc + it.quantity, 0);
                const firstTwoItems = sale.items.slice(0, 2);
                const remainingItemsCount = sale.items.length - 2;

                return (
                  <tr 
                    key={sale.id} 
                    className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                    onClick={() => setSelectedSale(sale)}
                  >
                    {/* Sale ID */}
                    <td className="p-4 pl-6 font-extrabold text-slate-900 whitespace-nowrap">
                      <span className="font-mono bg-slate-100 px-2.5 py-1 rounded-lg text-slate-800 border border-slate-200/60 group-hover:border-brand/40 group-hover:bg-brand/5 group-hover:text-brand transition-colors">
                        {sale.saleNumber}
                      </span>
                    </td>

                    {/* Date / Time */}
                    <td className="p-4 text-slate-600 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">
                        {formatDateTime(sale.createdAt)}
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="p-4 text-slate-700 whitespace-nowrap">
                      {sale.customerName ? (
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {sale.customerName}
                          </div>
                          {sale.customerPhone && (
                            <div className="text-xs text-slate-400 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {sale.customerPhone}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 font-medium italic">Oddiy mijoz</span>
                      )}
                    </td>

                    {/* Items List preview */}
                    <td className="p-4 max-w-xs">
                      <div className="space-y-1">
                        {firstTwoItems.map((it, i) => (
                          <div key={i} className="text-xs text-slate-600 truncate flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-800 truncate">{it.productName}</span>
                            <span className="text-slate-400 shrink-0 font-medium">{it.quantity} {it.unit}</span>
                          </div>
                        ))}
                        {remainingItemsCount > 0 && (
                          <span className="text-[11px] font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-md inline-block">
                            +{remainingItemsCount} ta boshqa tovar
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 block font-medium">
                          Jami: {totalItemsCount} dona/metr
                        </span>
                      </div>
                    </td>

                    {/* Payment Method */}
                    <td className="p-4 whitespace-nowrap">
                      {getPaymentBadge(sale.paymentMethod)}
                    </td>

                    {/* Total Sum */}
                    <td className="p-4 text-right whitespace-nowrap">
                      <div className="font-black text-slate-900 text-base">
                        {sale.total.toLocaleString()} <span className="text-xs font-bold text-slate-400">UZS</span>
                      </div>
                      {sale.discount && sale.discount > 0 && (
                        <div className="text-[11px] font-semibold text-rose-500">
                          -{sale.discount.toLocaleString()} UZS chegirma
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 pr-6 text-center whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedSale(sale)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-brand/10 hover:text-brand text-slate-600 transition-colors"
                          title="Chekni ko'rish"
                          aria-label="Chekni ko'rish"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSale(sale);
                            setShouldPrint(true);
                          }}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                          title="Chop etish"
                          aria-label="Chop etish"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setSaleToDelete(sale)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-600 transition-colors"
                          title="Sotuvni o'chirish / Qaytarish"
                          aria-label="Sotuvni o'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Zero State */}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <Search className="w-8 h-8 text-slate-300" />
                      </div>
                      <h3 className="font-bold text-lg text-slate-700 mb-1">
                        {startDate && endDate 
                          ? "Bu oraliqda hech qanday sotuv topilmadi" 
                          : "Hech qanday sotuv topilmadi"}
                      </h3>
                      <p className="text-slate-400 text-sm max-w-sm mb-4">
                        {startDate && endDate
                          ? `${formatToDMY(startDate)} — ${formatToDMY(endDate)} sanalari oralig'ida hech qanday sotuv yoki chek topilmadi.`
                          : "Qidiruv mezonlariga mos keladigan cheklar mavjud emas yoki hali xaridlar amalga oshirilmagan."}
                      </p>
                      {sales.length === 0 ? (
                        <button
                          type="button"
                          onClick={() => resetToDemoSales()}
                          className="px-5 py-2.5 rounded-xl bg-brand hover:bg-brand/90 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                        >
                          <History className="w-4 h-4" />
                          Demo sotuvlarni tiklash
                        </button>
                      ) : (searchQuery || (startDate && endDate) || paymentFilter !== 'all') ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            handleDateRangeChange('', '');
                            setPaymentFilter('all');
                          }}
                          className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm transition-colors"
                        >
                          Filtrlarni tozalash
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="p-4 px-6 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold text-slate-500">
          <div>
            Jami ko'rsatilmoqda: <span className="font-bold text-slate-800">{filteredSales.length}</span> ta chek
          </div>
          <div className="flex items-center gap-4">
            <span>
              Filtrlangan jami summa: <strong className="text-slate-900 font-black text-sm">{filteredSales.reduce((sum, s) => sum + s.total, 0).toLocaleString()} UZS</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 5. NAKLADNAYA / RECEIPT MODAL (MATCHES USER PHOTO) */}
      {selectedSale && (
        <ReceiptModal
          sale={selectedSale}
          onClose={() => {
            setSelectedSale(null);
            setShouldPrint(false);
          }}
          autoPrint={shouldPrint}
        />
      )}

      {/* 6. DELETE / REFUND CONFIRMATION MODAL */}
      {saleToDelete && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[95] flex items-center justify-center p-3 sm:p-4 transition-all overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center border border-slate-100 animate-in zoom-in-95 duration-200 my-auto max-h-[92dvh] overflow-y-auto">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-black text-slate-900 mb-2">Sotuvni bekor qilish</h3>
            <p className="text-slate-500 text-sm mb-4">
              Haqiqatan ham <strong className="text-slate-800">{saleToDelete.saleNumber}</strong> raqamli chekni o'chirmoqchimisiz?
            </p>

            {/* Stock restore checkbox */}
            <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer text-left mb-6">
              <input 
                type="checkbox"
                checked={restoreStockOnDelete}
                onChange={e => setRestoreStockOnDelete(e.target.checked)}
                className="w-4 h-4 text-brand rounded focus:ring-brand"
              />
              <span className="text-xs font-bold text-slate-700">
                Sotilgan mahsulotlarni ombor qoldig'iga (stock) qaytarish
              </span>
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSaleToDelete(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-sm"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteSale(saleToDelete.id, restoreStockOnDelete);
                  setSaleToDelete(null);
                }}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition-all text-sm"
              >
                Ha, o'chirish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. CLEAR ALL CONFIRMATION MODAL */}
      {isConfirmClearOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[95] flex items-center justify-center p-3 sm:p-4 transition-all overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center border border-slate-100 animate-in zoom-in-95 duration-200 my-auto max-h-[92dvh] overflow-y-auto">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-black text-slate-900 mb-2">Barcha tarixni tozalash</h3>
            <p className="text-slate-500 text-sm mb-6">
              Barcha sotuvlar tarixi o'chiriladi. Bu amalni ortga qaytarib bo'lmaydi. Rozimisiz?
            </p>

            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmClearOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-sm"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearAllSales();
                    setIsConfirmClearOpen(false);
                  }}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition-all text-sm"
                >
                  Hammasini o'chirish
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetToDemoSales();
                  setIsConfirmClearOpen(false);
                }}
                className="w-full py-2.5 bg-brand/10 hover:bg-brand/20 text-brand font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <History className="w-4 h-4" />
                Demo ma'lumotlarni tiklash
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
