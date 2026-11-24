import { useState, useMemo, useCallback } from 'react';
import { 
  Store, Users, Plus, Search, Calendar, ChevronRight, ArrowLeft, Phone, 
  MapPin, FileText, Download, Edit2, Trash2, Eye, Printer, Send, 
  TrendingUp, DollarSign, X, CheckCircle2, Clock, Package, Receipt
} from 'lucide-react';
import type { SaleRecord, Contact } from '../types';
import { useContacts } from '../context/ContactContext';
import { formatSum } from '../utils/format';
import { formatDateTime } from '../utils/dateUtils';

interface ContactHistorySectionProps {
  sales: SaleRecord[];
  onViewReceipt: (sale: SaleRecord) => void;
  onPrintReceipt: (sale: SaleRecord) => void;
  onSendTelegram?: (sale: SaleRecord) => void;
}

// Oylarni o'zbekcha nomlash
const MONTH_NAMES: { [key: string]: string } = {
  '01': 'Yanvar',
  '02': 'Fevral',
  '03': 'Mart',
  '04': 'Aprel',
  '05': 'May',
  '06': 'Iyun',
  '07': 'Iyul',
  '08': 'Avgust',
  '09': 'Sentyabr',
  '10': 'Oktyabr',
  '11': 'Noyabr',
  '12': 'Dekabr',
};

function formatMonthKey(key: string): string {
  const [year, month] = key.split('-');
  return `${MONTH_NAMES[month] || month} ${year}`;
}

export function ContactHistorySection({
  sales,
  onViewReceipt,
  onPrintReceipt,
  onSendTelegram,
}: ContactHistorySectionProps) {
  const { contacts, addContact, updateContact, deleteContact, clearAllContacts } = useContacts();

  // Search & Navigation state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('all'); // 'all' yoki '2026-10'
  const [detailTab, setDetailTab] = useState<'products' | 'receipts'>('products');

  // Contact Modal (Create & Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formName, setFormName] = useState('');
  const [formStoreName, setFormStoreName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formNote, setFormNote] = useState('');

  // Delete modal
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [isConfirmClearAllOpen, setIsConfirmClearAllOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const [currentMonthPrefix] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Har bir kontakt bo'yicha sotuvlarni hisoblash va bog'lash
  const contactStatsList = useMemo(() => {
    return contacts.map(contact => {
      // Sotuvlarni kontaktga moslashtirish (ID yoki aniq nom/do'kon bo'yicha)
      const matchedSales = sales.filter(s => {
        if (s.contactId && s.contactId === contact.id) return true;
        if (s.contactName && contact.storeName && s.contactName.toLowerCase().includes(contact.storeName.toLowerCase())) return true;
        if (s.contactName && s.contactName.trim().toLowerCase() === contact.name.trim().toLowerCase()) return true;
        if (s.customerName && s.customerName.trim().toLowerCase() === contact.name.trim().toLowerCase()) return true;
        return false;
      });

      const totalRevenue = matchedSales.reduce((sum, s) => sum + (s.total || 0), 0);
      const currentMonthSales = matchedSales.filter(s => s.createdAt && s.createdAt.startsWith(currentMonthPrefix));
      const currentMonthRevenue = currentMonthSales.reduce((sum, s) => sum + (s.total || 0), 0);

      // Eng oxirgi sotuv sanasi
      const lastSale = matchedSales.length > 0 
        ? matchedSales.reduce((latest, s) => new Date(s.createdAt) > new Date(latest.createdAt) ? s : latest, matchedSales[0])
        : null;

      return {
        contact,
        sales: matchedSales,
        salesCount: matchedSales.length,
        totalRevenue,
        currentMonthRevenue,
        lastSaleDate: lastSale?.createdAt || null,
      };
    });
  }, [contacts, sales, currentMonthPrefix]);

  // Umumiy kontaktlar bo'yicha statistika
  const globalContactStats = useMemo(() => {
    let totalRev = 0;
    let currentMonthRev = 0;
    let totalSalesCount = 0;

    for (const item of contactStatsList) {
      totalRev += item.totalRevenue;
      currentMonthRev += item.currentMonthRevenue;
      totalSalesCount += item.salesCount;
    }

    return {
      totalContacts: contacts.length,
      totalRev,
      currentMonthRev,
      totalSalesCount,
    };
  }, [contacts.length, contactStatsList]);

  // Qidiruv bo'yicha filtrlangan kontaktlar
  const filteredContactStats = useMemo(() => {
    if (!searchQuery.trim()) return contactStatsList;
    const q = searchQuery.toLowerCase();
    return contactStatsList.filter(item => {
      const c = item.contact;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.storeName && c.storeName.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q))
      );
    });
  }, [contactStatsList, searchQuery]);

  // Hozir tanlangan kontakt ma'lumotlari
  const selectedContactData = useMemo(() => {
    if (!selectedContactId) return null;
    return contactStatsList.find(item => item.contact.id === selectedContactId) || null;
  }, [contactStatsList, selectedContactId]);

  // Tanlangan kontakt sotuvlarini oylar bo'yicha guruhlash
  const monthlyGroups = useMemo(() => {
    if (!selectedContactData) return [];

    const groups: { [key: string]: SaleRecord[] } = {};
    for (const sale of selectedContactData.sales) {
      if (!sale.createdAt) continue;
      const key = sale.createdAt.slice(0, 7); // "YYYY-MM"
      if (!groups[key]) groups[key] = [];
      groups[key].push(sale);
    }

    // Oylar bo'yicha eng yangilari birinchi
    return Object.entries(groups)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, monthSales]) => {
        const total = monthSales.reduce((acc, s) => acc + (s.total || 0), 0);
        return {
          key,
          label: formatMonthKey(key),
          sales: monthSales,
          total,
          salesCount: monthSales.length,
        };
      });
  }, [selectedContactData]);

  // Tanlangan oy bo'yicha cheklar
  const activeMonthSales = useMemo(() => {
    if (!selectedContactData) return [];
    if (selectedMonthKey === 'all') return selectedContactData.sales;
    return selectedContactData.sales.filter(s => s.createdAt && s.createdAt.startsWith(selectedMonthKey));
  }, [selectedContactData, selectedMonthKey]);

  // Tanlangan oy bo'yicha tovarlar spetsifikatsiyasi (Oylik Mahsulotlar Ro'yxati)
  const monthlyProductSpecification = useMemo(() => {
    const map = new Map<string, {
      productId: string;
      productName: string;
      category?: string;
      quantity: number;
      unit: string;
      total: number;
      prices: number[];
      artikul?: string;
    }>();

    for (const sale of activeMonthSales) {
      for (const item of sale.items) {
        const key = item.productId || item.productName;
        const existing = map.get(key);
        if (existing) {
          existing.quantity += item.quantity;
          existing.total += item.total;
          existing.prices.push(item.price);
        } else {
          map.set(key, {
            productId: item.productId,
            productName: item.productName,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit || 'dona',
            total: item.total,
            prices: [item.price],
            artikul: item.artikul,
          });
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [activeMonthSales]);

  // Modalni ochish (Yangi yoki Tahrirlash)
  const handleOpenModal = (contact?: Contact) => {
    if (contact) {
      setEditingContact(contact);
      setFormName(contact.name);
      setFormStoreName(contact.storeName || '');
      setFormPhone(contact.phone || '');
      setFormAddress(contact.address || '');
      setFormNote(contact.note || '');
    } else {
      setEditingContact(null);
      setFormName('');
      setFormStoreName('');
      setFormPhone('');
      setFormAddress('');
      setFormNote('');
    }
    setIsModalOpen(true);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() && !formStoreName.trim()) {
      showToast("Do'kon yoki sotuvchi ismini kiriting");
      return;
    }

    const nameToUse = formName.trim() || formStoreName.trim();

    if (editingContact) {
      await updateContact(editingContact.id, {
        name: nameToUse,
        storeName: formStoreName.trim() || undefined,
        phone: formPhone.trim() || undefined,
        address: formAddress.trim() || undefined,
        note: formNote.trim() || undefined,
      });
      showToast(`"${nameToUse}" ma'lumotlari yangilandi ✅`);
    } else {
      const created = await addContact({
        name: nameToUse,
        storeName: formStoreName.trim() || undefined,
        phone: formPhone.trim() || undefined,
        address: formAddress.trim() || undefined,
        note: formNote.trim() || undefined,
      });
      showToast(`"${created.name}" muvaffaqiyatli qo'shildi ✅`);
    }

    setIsModalOpen(false);
  };

  const handleDeleteContact = async () => {
    if (!contactToDelete) return;
    await deleteContact(contactToDelete.id);
    showToast(`"${contactToDelete.name}" o'chirildi`);
    if (selectedContactId === contactToDelete.id) {
      setSelectedContactId(null);
    }
    setContactToDelete(null);
  };

  const handleClearAllContacts = async () => {
    await clearAllContacts();
    setSelectedContactId(null);
    setIsConfirmClearAllOpen(false);
    showToast("Barcha do'konlar va kontaktlar tozalandi ✅");
  };

  // Oylik spetsifikatsiyani nusxalash (Telegram / WhatsApp ga jo'natish uchun qulay)
  const handleCopySpecification = () => {
    if (!selectedContactData) return;
    const storeTitle = selectedContactData.contact.storeName 
      ? `${selectedContactData.contact.storeName} (${selectedContactData.contact.name})`
      : selectedContactData.contact.name;

    const periodTitle = selectedMonthKey === 'all' 
      ? "Barcha davrlar" 
      : formatMonthKey(selectedMonthKey);

    let text = `📦 DILERLIK HISOB-KITOB SPISKASI\n`;
    text += `🏬 Do'kon: ${storeTitle}\n`;
    text += `📅 Davr: ${periodTitle}\n`;
    text += `--------------------------------\n`;

    monthlyProductSpecification.forEach((p, idx) => {
      text += `${idx + 1}. ${p.productName} — ${p.quantity} ${p.unit} x ${formatSum(p.total / p.quantity)} = ${formatSum(p.total)} UZS\n`;
    });

    const monthTotal = activeMonthSales.reduce((acc, s) => acc + (s.total || 0), 0);
    text += `--------------------------------\n`;
    text += `💰 JAMI: ${formatSum(monthTotal)} UZS (${activeMonthSales.length} ta chek)\n`;

    navigator.clipboard.writeText(text);
    showToast("Oylik spiska matni buferga nusxalandi! ✅");
  };

  // CSV yuklab olish
  const handleExportCsv = () => {
    if (!selectedContactData) return;
    const storeTitle = selectedContactData.contact.storeName || selectedContactData.contact.name;
    const filename = `${storeTitle}_spiska_${selectedMonthKey}.csv`;

    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    csvContent += 'Mahsulot nomi,Artikul,Kategoriya,Miqdori,Birligi,Jami summa (UZS)\n';

    monthlyProductSpecification.forEach(p => {
      const row = [
        `"${p.productName.replace(/"/g, '""')}"`,
        `"${p.artikul || ''}"`,
        `"${p.category || ''}"`,
        p.quantity,
        `"${p.unit}"`,
        p.total,
      ].join(',');
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV fayl yuklab olindi! ✅");
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/95 text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* AGAR BITTA DO'KON TANLANGAN BO'LSA: BATAFSIL OYLIK SPISKA VIEW */}
      {selectedContactData ? (
        <div className="space-y-4">
          
          {/* Top Return & Header Card */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedContactId(null);
                  setSelectedMonthKey('all');
                }}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-2xl text-slate-700 dark:text-slate-200 transition-all cursor-pointer active:scale-95 shrink-0 flex items-center gap-1.5 font-bold text-xs"
                title="Do'konlar ro'yxatiga qaytish"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Ortga</span>
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-black text-xs rounded-full">
                    Dilerlik do'koni
                  </span>
                  {selectedContactData.contact.storeName && (
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white truncate">
                      {selectedContactData.contact.storeName}
                    </h2>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-indigo-500" />
                    Mas'ul: {selectedContactData.contact.name}
                  </span>
                  {selectedContactData.contact.phone && (
                    <a
                      href={`tel:${selectedContactData.contact.phone}`}
                      className="font-mono text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {selectedContactData.contact.phone}
                    </a>
                  )}
                  {selectedContactData.contact.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {selectedContactData.contact.address}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions: Edit & Add */}
            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
              <button
                type="button"
                onClick={handleCopySpecification}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title="Telegram / Matn sifatida nusxalash"
              >
                <FileText className="w-4 h-4 text-indigo-500" />
                <span>Nusxalash</span>
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title="CSV yuklab olish"
              >
                <Download className="w-4 h-4 text-emerald-500" />
                <span>Eksport</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenModal(selectedContactData.contact)}
                className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all cursor-pointer"
                title="Tahrirlash"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* OYLIK TANLOV BUTTONLARI (Monthly Pills) */}
          <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <span>Oylik spiskalarni ko'rish:</span>
              </span>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                Jami: {formatSum(selectedContactData.totalRevenue)} UZS ({selectedContactData.salesCount} ta chek)
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedMonthKey('all')}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shrink-0 ${
                  selectedMonthKey === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Barcha davrlar ({selectedContactData.salesCount})
              </button>

              {monthlyGroups.map(group => (
                <button
                  key={group.key}
                  type="button"
                  onClick={() => setSelectedMonthKey(group.key)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    selectedMonthKey === group.key
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{group.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    selectedMonthKey === group.key ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {formatSum(group.total)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* SPISKA STATISTIKASI & TAB TOGGLE */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* View Switcher: Products Breakdown vs Receipts */}
            <div className="flex items-center p-1 bg-slate-200/80 dark:bg-slate-800 rounded-2xl w-fit">
              <button
                type="button"
                onClick={() => setDetailTab('products')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  detailTab === 'products'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Package className="w-3.5 h-3.5 text-indigo-500" />
                <span>Olingan mahsulotlar spiskasi ({monthlyProductSpecification.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('receipts')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  detailTab === 'receipts'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Receipt className="w-3.5 h-3.5 text-emerald-500" />
                <span>Cheklar ro'yxati ({activeMonthSales.length})</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
              <span>Davr jami savdosi:</span>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {formatSum(activeMonthSales.reduce((acc, s) => acc + (s.total || 0), 0))} UZS
              </span>
            </div>
          </div>

          {/* TAB 1: MAHSULOTLAR SPISKA JADVALI */}
          {detailTab === 'products' ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              {monthlyProductSpecification.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  Ushbu davrda xarid qilingan tovarlar mavjud emas
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
                        <th className="py-3 px-4">#</th>
                        <th className="py-3 px-4">Mahsulot nomi</th>
                        <th className="py-3 px-4">Kategoriya</th>
                        <th className="py-3 px-4 text-center">Miqdori</th>
                        <th className="py-3 px-4 text-right">O'rtacha narxi</th>
                        <th className="py-3 px-4 text-right">Jami summa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                      {monthlyProductSpecification.map((prod, idx) => {
                        const avgPrice = prod.quantity > 0 ? Math.round(prod.total / prod.quantity) : 0;
                        return (
                          <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                            <td className="py-3 px-4">
                              <span className="font-bold block text-slate-900 dark:text-white">{prod.productName}</span>
                              {prod.artikul && (
                                <span className="font-mono text-[10px] text-slate-400">Artikul: {prod.artikul}</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                              {prod.category || '—'}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md font-mono font-bold">
                                {prod.quantity} {prod.unit}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono">
                              {formatSum(avgPrice)} UZS
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                              {formatSum(prod.total)} UZS
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 font-black border-t-2 border-slate-200 dark:border-slate-700">
                        <td colSpan={3} className="py-3.5 px-4 text-slate-900 dark:text-white uppercase tracking-wider">
                          Jami tovarlar ({monthlyProductSpecification.length} xil)
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono">
                          {monthlyProductSpecification.reduce((acc, p) => acc + p.quantity, 0)} dona/metr
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-400">—</td>
                        <td className="py-3.5 px-4 text-right font-mono text-base text-emerald-600 dark:text-emerald-400">
                          {formatSum(monthlyProductSpecification.reduce((acc, p) => acc + p.total, 0))} UZS
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* TAB 2: CHEKLAR RO'YXATI */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeMonthSales.length === 0 ? (
                <div className="col-span-2 p-8 text-center text-slate-400 text-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                  Ushbu davrda rasmiylashtirilgan cheklar mavjud emas
                </div>
              ) : (
                activeMonthSales.map(sale => (
                  <div
                    key={sale.id}
                    className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-2.5 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg">
                          {sale.saleNumber}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-semibold">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(sale.createdAt)}
                        </span>
                      </div>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        sale.paymentMethod === 'naqd'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : sale.paymentMethod === 'karta'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                          : sale.paymentMethod === 'transfer'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}>
                        {sale.paymentMethod}
                      </span>
                    </div>

                    {/* Tarkibi qisqacha */}
                    <div className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 font-medium">
                      {sale.items.map(it => `${it.productName} (${it.quantity} ${it.unit})`).join(', ')}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 font-bold block">Chek summasi:</span>
                        <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                          {formatSum(sale.total)} UZS
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {onSendTelegram && (
                          <button
                            type="button"
                            onClick={() => onSendTelegram(sale)}
                            className="p-2 hover:bg-sky-50 dark:hover:bg-sky-950/50 text-sky-600 rounded-xl transition-colors cursor-pointer"
                            title="Telegramga yuborish"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onPrintReceipt(sale)}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
                          title="Chop etish"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onViewReceipt(sale)}
                          className="px-3 py-1.5 bg-brand/10 hover:bg-brand/20 text-brand rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Chek</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      ) : (
        /* KONTAKTLAR VA DO'KONLAR RO'YXATI (Overview & Cards List) */
        <div className="space-y-4">
          
          {/* STATS SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider block">
                  Jami Diler Do'konlar
                </span>
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {globalContactStats.totalContacts} ta
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider block">
                  Ushbu Oydagi Dilerlik Savdosi
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatSum(globalContactStats.currentMonthRev)} <span className="text-xs font-sans">UZS</span>
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider block">
                  Jami Dilerlik Aylanmasi
                </span>
                <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
                  {formatSum(globalContactStats.totalRev)} <span className="text-xs font-sans">UZS</span>
                </span>
              </div>
            </div>

          </div>

          {/* TOOLBAR: SEARCH & ADD BUTTON */}
          <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Do'kon nomi, sotuvchi yoki telefon raqami bo'yicha qidirish..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-2.5 pl-10 pr-4 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-slate-800 dark:text-slate-100"
              />
            </div>

            <button
              type="button"
              onClick={() => handleOpenModal()}
              className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all cursor-pointer shadow-md shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2 text-xs sm:text-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Yangi do'kon qo'shish</span>
            </button>

            {contacts.length > 0 && (
              <button
                type="button"
                onClick={() => setIsConfirmClearAllOpen(true)}
                className="w-full sm:w-auto px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 font-bold rounded-2xl transition-all cursor-pointer border border-rose-200 dark:border-rose-800/60 active:scale-95 flex items-center justify-center gap-1.5 text-xs sm:text-sm shrink-0"
                title="Barcha do'konlarni tozalash"
              >
                <Trash2 className="w-4 h-4" />
                <span>Barchasini tozalash</span>
              </button>
            )}
          </div>

          {/* STORE CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {filteredContactStats.length === 0 ? (
              <div className="col-span-full bg-white dark:bg-slate-900 p-8 rounded-3xl text-center border border-slate-200 dark:border-slate-800 text-slate-400">
                <Store className="w-8 h-8 mx-auto mb-2 opacity-40 text-indigo-500" />
                <p className="font-bold text-sm">Hech qanday diler yoki do'kon topilmadi</p>
                <p className="text-xs text-slate-400 mt-1">Yangi do'kon qo'shish uchun yuqoridagi tugmani bosing</p>
              </div>
            ) : (
              filteredContactStats.map(item => {
                const c = item.contact;
                return (
                  <div
                    key={c.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between gap-4 group"
                  >
                    <div>
                      {/* Top row: Avatar + Store Name + Action buttons */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm shrink-0 border border-indigo-100 dark:border-indigo-900/60">
                            <Store className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {c.storeName || c.name}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold truncate flex items-center gap-1">
                              <Users className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{c.name}</span>
                            </p>
                          </div>
                        </div>

                        {/* Edit & Delete Mini buttons */}
                        <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleOpenModal(c)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            title="Tahrirlash"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setContactToDelete(c)}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                            title="O'chirish"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Meta badges: Phone & Address */}
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        {c.phone && (
                          <a
                            href={`tel:${c.phone}`}
                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 text-slate-700 dark:text-slate-300 hover:text-indigo-600 rounded-lg font-mono font-semibold flex items-center gap-1 transition-colors"
                          >
                            <Phone className="w-3 h-3 text-indigo-500" />
                            <span>{c.phone}</span>
                          </a>
                        )}
                        {c.address && (
                          <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg font-medium flex items-center gap-1 truncate max-w-[200px]">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{c.address}</span>
                          </span>
                        )}
                      </div>

                      {c.note && (
                        <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500 italic line-clamp-1">
                          "{c.note}"
                        </p>
                      )}
                    </div>

                    {/* Stats Box & Primary CTA */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Ushbu oyda:</span>
                          <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
                            {formatSum(item.currentMonthRevenue)} UZS
                          </span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Jami savdo:</span>
                          <span className="font-mono font-black text-slate-900 dark:text-white text-xs sm:text-sm">
                            {formatSum(item.totalRevenue)} UZS
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedContactId(c.id)}
                        className="w-full py-2.5 px-3 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white dark:bg-indigo-950/50 dark:hover:bg-indigo-600 dark:text-indigo-300 dark:hover:text-white font-black text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 group/btn"
                      >
                        <span>Oylik spiskalar & Cheklar ({item.salesCount})</span>
                        <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

      {/* CREATE / EDIT CONTACT MODAL */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 flex flex-col gap-4 animate-in zoom-in-95 my-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center font-bold">
                  <Store className="w-5 h-5" />
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {editingContact ? "Do'konni tahrirlash" : "Yangi do'kon / diler qo'shish"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Do'kon yoki Obyekt nomi:
                </label>
                <input
                  type="text"
                  placeholder="Masalan: Qo'yliq 12-do'kon, Chorsu filial..."
                  value={formStoreName}
                  onChange={e => setFormStoreName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Mas'ul shaxs / Sotuvchi ismi: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Akmal aka, Jasur usta..."
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Telefon raqami:
                </label>
                <input
                  type="tel"
                  placeholder="+998 (90) 123-45-67"
                  value={formPhone}
                  onChange={e => setFormPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Manzil / Lokatsiya:
                </label>
                <input
                  type="text"
                  placeholder="Masalan: Qo'yliq bozori 3-qator"
                  value={formAddress}
                  onChange={e => setFormAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Izoh / Qayd:
                </label>
                <textarea
                  rows={2}
                  placeholder="Qo'shimcha eslatmalar (masalan: hisob-kitob har oy oxirida)..."
                  value={formNote}
                  onChange={e => setFormNote(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer"
                >
                  {editingContact ? "Saqlash" : "Qo'shish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {contactToDelete && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] flex items-center justify-center p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-5 flex flex-col gap-3.5 animate-in zoom-in-95 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                "{contactToDelete.storeName || contactToDelete.name}" o'chirilsinmi?
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Ushbu kontakt o'chiriladi. U bilan bog'liq bo'lgan cheklar va sotuvlar tarixi saqlanib qoladi.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setContactToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleDeleteContact}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/30 cursor-pointer"
              >
                Ha, o'chirish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLEAR ALL CONFIRM MODAL */}
      {isConfirmClearAllOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] flex items-center justify-center p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-5 flex flex-col gap-3.5 animate-in zoom-in-95 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Barcha do'konlar o'chirilsinmi?
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Ro'yxatdagi barcha ({contacts.length} ta) dilerlar va do'konlar butunlay o'chiriladi.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmClearAllOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleClearAllContacts}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/30 cursor-pointer"
              >
                Ha, hammasini o'chirish
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
