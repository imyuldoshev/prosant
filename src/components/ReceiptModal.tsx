import { useEffect, useRef, useState } from 'react';
import { Printer, X, CheckCircle2, FileText, Receipt as ReceiptIcon } from 'lucide-react';
import type { SaleRecord } from '../types';
import { formatSum } from '../utils/format';

interface ReceiptModalProps {
  sale: SaleRecord | null;
  onClose: () => void;
  autoPrint?: boolean;
}

function formatReceiptDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
  } catch {
    return dateStr;
  }
}

function getPaymentMethodLabel(method: string): string {
  switch (method) {
    case 'naqd': return 'Naqd pul';
    case 'karta': return 'Plastik karta';
    case 'transfer': return "Bank o'tkazmasi";
    case 'nasiya': return 'Nasiya (Qarz)';
    default: return method;
  }
}

export function ReceiptModal({ sale, onClose, autoPrint = false }: ReceiptModalProps) {
  const hasAutoPrintedRef = useRef(false);
  const [printLayout, setPrintLayout] = useState<'a4' | 'thermal'>('a4');

  useEffect(() => {
    if (sale && autoPrint && !hasAutoPrintedRef.current) {
      hasAutoPrintedRef.current = true;
      const timer = setTimeout(() => {
        window.print();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [sale, autoPrint]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!sale) return null;

  const formattedDate = formatReceiptDateTime(sale.createdAt);

  return (
    <div 
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[90] flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Savdo cheki va nakladnaya"
    >
      <div className="w-full max-w-3xl flex flex-col my-auto max-h-[96dvh] sm:max-h-[96vh]">
        
        {/* On-Screen Action Toolbar (Hidden during printing) */}
        <div className="no-print bg-slate-900 text-white px-4 sm:px-5 py-3 rounded-t-2xl flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shadow-lg shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-bold text-xs sm:text-sm md:text-base">
              Chek: <span className="font-mono text-brand-light">{sale.saleNumber}</span>
            </span>
          </div>

          {/* Print format switchers & actions */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setPrintLayout('a4')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  printLayout === 'a4' ? 'bg-brand text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
                title="Standart A4 nakladnaya formati"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>A4</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintLayout('thermal')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  printLayout === 'thermal' ? 'bg-brand text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
                title="58mm / 80mm termal kassa lentalari formati"
              >
                <ReceiptIcon className="w-3.5 h-3.5" />
                <span>Kassa lenti (80mm)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-[40px] px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
              title="Chekni chop etish (Ctrl + P)"
            >
              <Printer className="w-4 h-4" />
              <span>Chop etish</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95 min-h-[40px] min-w-[40px] flex items-center justify-center"
              aria-label="Yopish"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Container for Preview */}
        <div className="bg-slate-200 dark:bg-slate-950 p-2 sm:p-6 overflow-y-auto shadow-2xl flex justify-center transition-colors">
          
          {/* THE REAL PRINTABLE RECEIPT / INVOICE DOCUMENT */}
          <div 
            id="printable-receipt"
            className={`receipt-printable bg-white text-black p-4 sm:p-6 rounded-sm shadow-md font-sans text-xs sm:text-sm leading-normal border border-slate-300 dark:border-slate-800 print:border-none print:shadow-none print:p-0 print:m-0 ${
              printLayout === 'thermal' ? 'max-w-[80mm] w-full text-[11px]' : 'max-w-[210mm] w-full'
            }`}
          >
            {/* 1. Header Information */}
            <div className="space-y-1.5 pb-3 border-b border-black">
              <div className="text-center pb-1">
                <h1 className="text-base sm:text-lg font-black tracking-wider uppercase text-black">
                  ProSant
                </h1>
                <p className="text-[10px] sm:text-xs text-slate-600 font-medium">
                  Santexnika mahsulotlari
                </p>
              </div>

              <div className="flex justify-between items-baseline pt-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-bold text-slate-700 uppercase tracking-wide text-[10px] sm:text-xs">
                    Sotuvchi:
                  </span>
                  <span className="font-bold text-slate-900 text-xs sm:text-sm">
                    ProSant
                  </span>
                </div>
                <div className="text-right text-[10px] sm:text-xs font-semibold text-slate-600">
                  <span>Chek raqami: </span>
                  <strong className="text-black font-mono">{sale.saleNumber}</strong>
                </div>
              </div>

              <div className="flex justify-between items-baseline">
                <div className="flex items-baseline gap-1.5 min-w-0 flex-1 pr-2">
                  <span className="font-bold text-slate-700 uppercase tracking-wide text-[10px] sm:text-xs shrink-0">
                    Xaridor:
                  </span>
                  <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                    {sale.customerName ? sale.customerName : 'Chakana xaridor'}
                    {sale.customerPhone ? ` (${sale.customerPhone})` : ''}
                  </span>
                </div>
                <div className="text-right text-[10px] sm:text-xs text-slate-600 shrink-0">
                  <span>Sana: </span>
                  <span className="font-mono font-medium">{formattedDate}</span>
                </div>
              </div>
            </div>

            {/* 2. Products Table */}
            <div className="pt-2 pb-2 overflow-x-auto">
              <table className="w-full border-collapse border border-black text-[10px] sm:text-xs">
                <thead>
                  <tr className="bg-slate-100 font-bold border-b border-black text-center">
                    <th className="border border-black py-1 px-1 w-6 sm:w-8">№</th>
                    {printLayout === 'a4' && (
                      <th className="border border-black py-1 px-1.5 w-20">Artikul</th>
                    )}
                    <th className="border border-black py-1 px-1.5 text-left">Mahsulot nomi</th>
                    <th className="border border-black py-1 px-1.5 w-16 sm:w-20 text-center">Miqdori</th>
                    <th className="border border-black py-1 px-1.5 w-20 sm:w-24 text-right">Narxi</th>
                    <th className="border border-black py-1 px-1.5 w-24 sm:w-28 text-right">Jami</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((item, idx) => {
                    const artikulCode = item.artikul || `ART-${String(item.productId).slice(-4)}`;
                    return (
                      <tr key={idx} className="border-b border-black/70">
                        <td className="border border-black py-1 px-1 text-center font-medium">
                          {idx + 1}
                        </td>
                        {printLayout === 'a4' && (
                          <td className="border border-black py-1 px-1.5 text-center font-mono font-semibold">
                            {artikulCode}
                          </td>
                        )}
                        <td className="border border-black py-1 px-1.5 text-left font-medium">
                          {item.productName}
                        </td>
                        <td className="border border-black py-1 px-1 text-center font-mono whitespace-nowrap">
                          <span className="font-bold">{formatSum(item.quantity)}</span>{' '}
                          <span className="text-[9px] sm:text-[10px] text-slate-600 font-sans">{item.unit || 'dona'}</span>
                        </td>
                        <td className="border border-black py-1 px-1.5 text-right font-mono whitespace-nowrap">
                          {formatSum(item.price)}
                        </td>
                        <td className="border border-black py-1 px-1.5 text-right font-mono font-bold whitespace-nowrap">
                          {formatSum(item.total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 3. Totals Row */}
            <div className="flex flex-col items-end pt-1 pb-3 gap-0.5">
              {sale.discount && sale.discount > 0 ? (
                <div className="text-right text-xs text-slate-600">
                  <span className="mr-2">Chegirma:</span>
                  <span className="font-mono font-bold text-rose-600">
                    -{formatSum(sale.discount)} UZS
                  </span>
                </div>
              ) : null}
              <div className="text-right">
                <span className="font-black text-xs sm:text-base mr-2">Jami to'lov:</span>
                <span className="font-black text-sm sm:text-lg font-mono">
                  {formatSum(sale.total)} <span className="text-xs font-sans">so'm</span>
                </span>
              </div>
            </div>

            {/* 4. Payment & Debt Summary */}
            <div className="space-y-1 pt-2 pb-3 text-[10px] sm:text-xs border-t border-black/40">
              <div className="flex justify-between items-center text-slate-800">
                <span>
                  To'lov usuli: <strong className="uppercase text-black">{getPaymentMethodLabel(sale.paymentMethod)}</strong>
                </span>
                {sale.paymentMethod === 'naqd' && sale.receivedAmount && (
                  <span className="font-mono text-slate-700">
                    Qabul qilindi: {formatSum(sale.receivedAmount)} UZS
                    {sale.changeAmount ? ` | Qaytim: ${formatSum(sale.changeAmount)} UZS` : ''}
                  </span>
                )}
              </div>

              {sale.note && (
                <div className="text-slate-600 italic pt-0.5">
                  Izoh: "{sale.note}"
                </div>
              )}

              {/* Debt Notice (If nasiya) */}
              {sale.paymentMethod === 'nasiya' && (
                <div className="font-bold text-rose-800 bg-rose-50 p-2 rounded border border-rose-200 mt-1">
                  Nasiya bo'yicha qarzdorlik miqdori: {formatSum(sale.total)} so'm
                </div>
              )}
            </div>

            {/* 5. Footer Message */}
            <div className="text-center pt-2 pb-1 border-t border-dashed border-black/50 text-[10px] sm:text-xs text-slate-600">
              <p className="font-extrabold text-slate-800">Xaridingiz uchun rahmat!</p>
              <p className="text-[9px] text-slate-500 mt-0.5">ProSant — Santexnika mahsulotlari</p>
            </div>

          </div>

        </div>

        {/* Footer Actions on screen */}
        <div className="no-print bg-slate-900 border-t border-slate-800 p-3 rounded-b-2xl flex justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all cursor-pointer min-h-[40px]"
          >
            Yopish
          </button>
        </div>

      </div>
    </div>
  );
}
