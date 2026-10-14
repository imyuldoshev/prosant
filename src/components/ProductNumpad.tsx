import { memo } from 'react';
import { Calculator, Delete, Check } from 'lucide-react';

export type NumField = 'costPrice' | 'price' | 'minStock' | 'stock' | null;

interface ProductNumpadProps {
  activeNumField: NumField;
  unit: string;
  onClose: () => void;
  onInput: (val: string) => void;
  onPreset: (val: number) => void;
}

export const ProductNumpad = memo(function ProductNumpad({
  activeNumField,
  unit,
  onClose,
  onInput,
  onPreset,
}: ProductNumpadProps) {
  if (!activeNumField) return null;

  const isMoney = activeNumField === 'costPrice' || activeNumField === 'price';
  const presets = isMoney ? [1000, 5000, 10000, 50000] : [1, 5, 10, 50];

  const fieldTitle =
    activeNumField === 'costPrice'
      ? 'Asl narx (kelish narxi)'
      : activeNumField === 'price'
        ? 'Belgilangan narx (sotish)'
        : activeNumField === 'stock'
          ? 'Dastlabki kirim'
          : 'Eng kam qoldiq';

  return (
    <div className="hidden lg:flex bg-slate-50 border-2 border-brand/30 rounded-3xl p-3 sm:p-4 flex-col gap-2 animate-in zoom-in-95 duration-150 shadow-inner">
      <div className="flex items-center justify-between text-xs font-bold text-slate-600 pb-1 border-b border-slate-200">
        <span className="flex items-center gap-1 text-brand">
          <Calculator className="w-4 h-4" />
          <span>Kalkulyator: {fieldTitle}</span>
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 font-bold px-2 py-0.5 rounded-lg hover:bg-slate-200 text-xs cursor-pointer"
        >
          Yopish ✕
        </button>
      </div>

      {/* Quick Presets for fast entry */}
      <div className="grid grid-cols-4 gap-2 max-w-md mx-auto w-full pt-1">
        {presets.map(preset => (
          <button
            key={preset}
            type="button"
            onClick={() => onPreset(preset)}
            className="py-2 rounded-xl bg-brand/10 hover:bg-brand/20 border border-brand/30 font-black text-xs text-brand active:scale-95 transition-all cursor-pointer select-none"
          >
            +{preset} {isMoney ? 'UZS' : unit}
          </button>
        ))}
      </div>

      {/* Spacious 4-Column Calculator Grid with Tall OK Button on Right */}
      <div className="grid grid-cols-4 gap-2 select-none max-w-md mx-auto w-full pt-1">
        {/* Row 1 */}
        {[1, 2, 3].map(num => (
          <button
            key={num}
            type="button"
            onClick={() => onInput(num.toString())}
            className="h-14 sm:h-16 bg-white hover:bg-slate-100 active:bg-brand active:text-white active:scale-95 text-slate-800 text-2xl font-black rounded-2xl transition-all shadow-xs flex items-center justify-center cursor-pointer border border-slate-200/80"
          >
            {num}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onInput('C')}
          className="h-14 sm:h-16 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 active:scale-95 text-rose-600 text-xl font-black rounded-2xl transition-all shadow-xs flex items-center justify-center cursor-pointer border border-rose-200"
          title="Tozalash"
        >
          C
        </button>

        {/* Row 2 */}
        {[4, 5, 6].map(num => (
          <button
            key={num}
            type="button"
            onClick={() => onInput(num.toString())}
            className="h-14 sm:h-16 bg-white hover:bg-slate-100 active:bg-brand active:text-white active:scale-95 text-slate-800 text-2xl font-black rounded-2xl transition-all shadow-xs flex items-center justify-center cursor-pointer border border-slate-200/80"
          >
            {num}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onInput('BACKSPACE')}
          className="h-14 sm:h-16 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 active:scale-95 text-amber-700 rounded-2xl transition-all shadow-xs flex items-center justify-center cursor-pointer border border-amber-200"
          title="Bitta o'chirish"
        >
          <Delete className="w-6 h-6 stroke-[2.2]" />
        </button>

        {/* Row 3 */}
        {[7, 8, 9].map(num => (
          <button
            key={num}
            type="button"
            onClick={() => onInput(num.toString())}
            className="h-14 sm:h-16 bg-white hover:bg-slate-100 active:bg-brand active:text-white active:scale-95 text-slate-800 text-2xl font-black rounded-2xl transition-all shadow-xs flex items-center justify-center cursor-pointer border border-slate-200/80"
          >
            {num}
          </button>
        ))}
        {/* Tall OK Button on Right spanning 2 rows */}
        <button
          type="button"
          onClick={() => onInput('OK')}
          className="row-span-2 h-full bg-brand hover:bg-sky-600 active:scale-95 text-white font-black text-lg rounded-2xl shadow-md shadow-brand/30 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer select-none border border-sky-400/40"
          title="Tasdiqlash va yopish"
        >
          <Check className="w-6 h-6 stroke-[3]" />
          <span>OK</span>
        </button>

        {/* Row 4 */}
        <button
          type="button"
          onClick={() => onInput('.')}
          className="h-14 sm:h-16 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 active:scale-95 text-slate-800 text-3xl font-black rounded-2xl transition-all shadow-xs flex items-center justify-center cursor-pointer border border-slate-200/80"
        >
          .
        </button>
        <button
          type="button"
          onClick={() => onInput('0')}
          className="h-14 sm:h-16 bg-white hover:bg-slate-100 active:bg-brand active:text-white active:scale-95 text-slate-800 text-2xl font-black rounded-2xl transition-all shadow-xs flex items-center justify-center cursor-pointer border border-slate-200/80"
        >
          0
        </button>
        <button
          type="button"
          onClick={() => onInput('00')}
          className="h-14 sm:h-16 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 active:scale-95 text-slate-800 text-xl font-black rounded-2xl transition-all shadow-xs flex items-center justify-center cursor-pointer border border-slate-200/80"
        >
          00
        </button>
      </div>
    </div>
  );
});
