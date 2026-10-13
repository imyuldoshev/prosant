import { useEffect, useRef } from 'react';
import { Printer, X, CheckCircle2 } from 'lucide-react';
import type { SaleRecord } from '../types';

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

export function ReceiptModal({ sale, onClose, autoPrint = false }: ReceiptModalProps) {
  const hasAutoPrintedRef = useRef(false);

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
    >
      <div className="w-full max-w-3xl flex flex-col my-auto max-h-[96dvh] sm:max-h-[96vh]">
        
        {/* On-Screen Action Toolbar (Hidden during printing) */}
        <div className="no-print bg-slate-900 text-white px-5 py-3 rounded-t-2xl flex items-center justify-between border-b border-slate-800 shadow-lg shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm sm:text-base">
              Chek / Nakladnaya: <span className="font-mono text-brand-light">{sale.saleNumber}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
              title="Chekni chop etish (Ctrl + P)"
            >
              <Printer className="hidden sm:inline-block w-4 h-4" />
              <span>Chop etish (Print)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
              aria-label="Yopish"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Container for Preview */}
        <div className="bg-slate-200 p-2 sm:p-6 overflow-y-auto rounded-b-2xl shadow-2xl flex justify-center">
          
          {/* THE REAL PRINTABLE RECEIPT / INVOICE DOCUMENT */}
          <div 
            id="printable-receipt"
            className="receipt-printable bg-white text-black w-full max-w-[210mm] p-6 sm:p-8 rounded-sm shadow-md font-sans text-xs sm:text-sm leading-normal border border-slate-300 print:border-none print:shadow-none print:p-0 print:m-0"
            style={{ minHeight: '140mm' }}
          >
            {/* 1. Header Information */}
            <div className="space-y-1.5 pb-4 border-b border-black/40">
              <div className="flex justify-between items-baseline">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-slate-700 uppercase tracking-wide text-[11px] sm:text-xs">
                    Поставщик:
                  </span>
                  <span className="font-black text-slate-900 text-sm sm:text-base">
                    Управленческая организация "SantexPro"
                  </span>
                </div>
                <div className="text-right text-[11px] sm:text-xs font-semibold text-slate-600">
                  <span>Накладная: </span>
                  <strong className="text-black font-mono">{sale.saleNumber}</strong>
                </div>
              </div>

              <div className="flex justify-between items-baseline">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-slate-700 uppercase tracking-wide text-[11px] sm:text-xs">
                    Покупатель:
                  </span>
                  <span className="font-bold text-slate-900 text-xs sm:text-sm">
                    {sale.customerPhone ? `${sale.customerPhone} ` : ''}
                    {sale.customerName ? sale.customerName : 'Розничный покупатель (Chakana)'}
                  </span>
                </div>
                <div className="text-right text-[11px] sm:text-xs text-slate-600">
                  <span>Дата: </span>
                  <span className="font-mono font-medium">{formattedDate}</span>
                </div>
              </div>
            </div>

            {/* 2. Products Table */}
            <div className="pt-3 pb-2 overflow-x-auto">
              <table className="w-full border-collapse border border-black text-[11px] sm:text-xs">
                <thead>
                  <tr className="bg-slate-100 font-bold border-b border-black text-center">
                    <th className="border border-black py-1.5 px-1.5 w-8">№</th>
                    <th className="border border-black py-1.5 px-2 w-24">Артикул</th>
                    <th className="border border-black py-1.5 px-2 text-left">Товар</th>
                    <th className="border border-black py-1.5 px-2 w-24">Количество</th>
                    <th className="border border-black py-1.5 px-2 w-24 text-right">Цена</th>
                    <th className="border border-black py-1.5 px-2 w-28 text-right">Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((item, idx) => {
                    // Extract or generate article code
                    const artikulCode = item.artikul || `ART-${String(item.productId).padStart(4, '0')}`;
                    return (
                      <tr key={idx} className="border-b border-black/70">
                        <td className="border border-black py-1.5 px-1.5 text-center font-medium">
                          {idx + 1}
                        </td>
                        <td className="border border-black py-1.5 px-2 text-center font-mono font-semibold">
                          {artikulCode}
                        </td>
                        <td className="border border-black py-1.5 px-2 text-left font-medium">
                          {item.productName}
                        </td>
                        <td className="border border-black py-1.5 px-2 text-center font-mono">
                          <span className="font-bold">{item.quantity}</span>{' '}
                          <span className="text-[10px] text-slate-600 font-sans">{item.unit || 'шт'}</span>
                        </td>
                        <td className="border border-black py-1.5 px-2 text-right font-mono">
                          {item.price.toLocaleString('ru-RU')}
                        </td>
                        <td className="border border-black py-1.5 px-2 text-right font-mono font-bold">
                          {item.total.toLocaleString('ru-RU')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 3. Totals (Итого) Row */}
            <div className="flex justify-end pt-1 pb-4">
              <div className="text-right">
                <span className="font-black text-sm sm:text-base mr-3">Итого:</span>
                <span className="font-black text-base sm:text-lg font-mono">
                  {sale.total.toLocaleString('ru-RU')} <span className="text-xs font-sans">UZS</span>
                </span>
              </div>
            </div>

            {/* 4. Payment & Debt Summary */}
            <div className="space-y-1 pt-2 pb-4 text-[11px] sm:text-xs border-t border-black/40">
              <div className="flex justify-between items-center text-slate-700">
                <span>
                  Вид оплаты: <strong className="uppercase text-black">{sale.paymentMethod}</strong>
                  {sale.paymentMethod === 'naqd' && sale.receivedAmount && (
                    <span className="ml-2 font-mono">
                      (Оплачено: {sale.receivedAmount.toLocaleString('ru-RU')} UZS
                      {sale.changeAmount ? `, Сдача: ${sale.changeAmount.toLocaleString('ru-RU')} UZS` : ''})
                    </span>
                  )}
                </span>
              </div>

              {/* Debt Notice (If debt/nasiya or customer has balance) */}
              {sale.paymentMethod === 'nasiya' ? (
                <div className="font-bold text-black pt-1">
                  Ваша задолженность на {formattedDate} составляет{' '}
                  <span className="font-mono text-xs sm:text-sm font-black">
                    {sale.total.toLocaleString('ru-RU')} UZS
                  </span>
                </div>
              ) : null}
            </div>

          </div>

        </div>

        {/* Footer Actions on screen */}
        <div className="no-print bg-slate-900 p-3 rounded-b-2xl flex justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all cursor-pointer"
          >
            Yopish
          </button>
        </div>

      </div>
    </div>
  );
}
