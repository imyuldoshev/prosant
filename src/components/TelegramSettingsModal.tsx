import { useState, useEffect } from 'react';
import { 
  X, Send, Bot, CheckCircle2, AlertCircle, Eye, EyeOff, 
  HelpCircle, RefreshCw, Power, Check, ExternalLink, MessageSquare
} from 'lucide-react';
import { telegramService, type TelegramConfig } from '../services/telegramService';

interface TelegramSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TelegramSettingsModal({ isOpen, onClose }: TelegramSettingsModalProps) {
  const [config, setConfig] = useState<TelegramConfig>(() => telegramService.getConfig());
  const [showToken, setShowToken] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Test state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Har safar modal ochilganda konfiguratsiyani qayta yuklash
  useEffect(() => {
    if (isOpen) {
      setConfig(telegramService.getConfig());
      setTestResult(null);
      setSaveSuccess(false);
    }
  }, [isOpen]);

  // Escape klavishasi bilan yopish
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    const res = await telegramService.testConnection(
      config.botToken,
      config.chatId,
      config.topicId
    );

    setTestResult(res);
    setIsTesting(false);
  };

  const handleSave = () => {
    telegramService.saveConfig(config);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 900);
  };

  const isConfigured = Boolean(config.botToken.trim() && config.chatId.trim());

  return (
    <div 
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[95] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Telegram Bot Sozlamalari"
    >
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-auto max-h-[94vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-sky-500/10 via-blue-500/5 to-transparent border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-500/25 shrink-0">
              <Send className="w-5 h-5 -rotate-12 translate-x-0.5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Telegram Bot Sozlamalari
                {isConfigured && config.enabled ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Faol
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Sozlanmagan
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sotuv cheklari va tovarlar ro'yxatini avtomatik Telegramga yuborish
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* Status Alert */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start gap-3">
            <Bot className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Kassada yangi sotuv amalga oshirilganda, chekdagi barcha ma'lumotlar (mijoz, tovarlar spetsifikatsiyasi, to'lov usuli, narxlar) avtomatik ravishda botingiz orqali Telegram guruhingizga yetkaziladi.
            </div>
          </div>

          {/* Bot Token Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
              <span>Telegram Bot Token:</span>
              <a
                href="https://t.me/BotFather"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 font-medium"
              >
                <span>@BotFather dan olish</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={config.botToken}
                onChange={(e) => setConfig(prev => ({ ...prev, botToken: e.target.value }))}
                placeholder="Masalan: 7123456789:AAH..."
                className="w-full h-11 px-3.5 pr-10 text-xs sm:text-sm font-mono bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                title={showToken ? 'Yashirish' : "Ko'rsatish"}
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              BotFather bergan API token kalitini to'liq kiriting.
            </p>
          </div>

          {/* Chat ID Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
              <span>Chat / Guruh ID:</span>
              <span className="text-[11px] text-slate-400 font-normal">
                Guruhlar uchun masalan: <code className="text-sky-500 font-mono">-100...</code>
              </span>
            </label>
            <input
              type="text"
              value={config.chatId}
              onChange={(e) => setConfig(prev => ({ ...prev, chatId: e.target.value }))}
              placeholder="Masalan: -1001987654321 yoki 123456789"
              className="w-full h-11 px-3.5 text-xs sm:text-sm font-mono bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-slate-900 dark:text-white"
            />
            <p className="text-[11px] text-slate-400">
              Xabarlar borishi kerak bo'lgan guruh yoki o'zingizning shaxsiy Telegram ID raqamingiz.
            </p>
          </div>

          {/* Optional Topic / Thread ID */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
              <span>Mavzu (Topic / Thread ID) — Ixtiyoriy:</span>
              <span className="text-[11px] text-slate-400 font-normal">Forum guruhlar uchun</span>
            </label>
            <input
              type="text"
              value={config.topicId || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, topicId: e.target.value }))}
              placeholder="Masalan: 12 (bo'sh qoldirilsa umumiy chatga boradi)"
              className="w-full h-10 px-3.5 text-xs sm:text-sm font-mono bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-slate-900 dark:text-white"
            />
          </div>

          {/* Toggles */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
            
            {/* Auto send toggle */}
            <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/70 border border-slate-200 dark:border-slate-800 transition-colors select-none">
              <div className="flex items-center gap-2.5">
                <Send className="w-4 h-4 text-sky-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Sotuv vaqtida avtomatik yuborish
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Kassada har bir xarid yakunlanganda Telegram botga chek boradi
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.autoSendOnSale}
                onChange={(e) => setConfig(prev => ({ ...prev, autoSendOnSale: e.target.checked }))}
                className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
              />
            </label>

            {/* Global Enable toggle */}
            <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/70 border border-slate-200 dark:border-slate-800 transition-colors select-none">
              <div className="flex items-center gap-2.5">
                <Power className="w-4 h-4 text-emerald-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Telegram xabarnomalarini yoqish
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Ilovadan xabar yuborish tizimini to'liq yoqish yoki o'chirish
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
            </label>

          </div>

          {/* Test connection results */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in duration-200 ${
                testResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              )}
              <div className="flex-1 font-medium leading-relaxed">
                {testResult.message}
              </div>
            </div>
          )}

          {/* Step by step guide accordion */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 flex items-center gap-1.5 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Qanday sozlanadi? (Qo'llanma)</span>
            </button>

            {showHelp && (
              <div className="mt-3 p-3.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2 text-slate-700 dark:text-slate-300 leading-relaxed animate-in fade-in duration-150">
                <p className="font-bold text-slate-900 dark:text-white">Tezkor sozlash yo'riqnomasi:</p>
                <ol className="list-decimal pl-4 space-y-1.5">
                  <li>
                    Telegramda <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-sky-500 underline font-semibold">@BotFather</a> ga kiring va <code>/newbot</code> buyrug'ini yuborib yangi bot oching.
                  </li>
                  <li>
                    BotFather bergan <strong>HTTP API Token</strong> kalitini nusxalab yuqoridagi <i>Bot Token</i> qatoriga qo'ying.
                  </li>
                  <li>
                    O'zingizning savdo guruhingizga yangi ochilgan botni <strong>Admin</strong> qilib qo'shing.
                  </li>
                  <li>
                    Guruh ID sini bilish uchun guruhga <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-sky-500 underline font-semibold">@userinfobot</a> ni qo'shing yoki xabarni unga forward qiling (guruh ID odatda <code>-100...</code> belgisi bilan boshlanadi).
                  </li>
                  <li>
                    ID raqamini <i>Chat ID</i> qatoriga yozib, <strong>"Sinab ko'rish"</strong> tugmasini bosing!
                  </li>
                </ol>
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting || !config.botToken.trim() || !config.chatId.trim()}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            {isTesting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-500" />
            ) : (
              <MessageSquare className="w-3.5 h-3.5 text-sky-500" />
            )}
            <span>{isTesting ? "Yuborilmoqda..." : "Sinab ko'rish"}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Bekor qilish
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 active:scale-95 transition-all shadow-md shadow-sky-600/20 flex items-center gap-2 cursor-pointer"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saqlandi!</span>
                </>
              ) : (
                <span>Saqlash</span>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
