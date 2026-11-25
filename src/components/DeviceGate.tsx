// src/components/DeviceGate.tsx
// ProSant — 3 ta ruxsat etilgan qurilma (2 ta Laptop + 1 ta Telefon) himoya qatlami

import React, { useEffect, useState, useCallback } from 'react';
import { deviceService, type DeviceAccessResult, MAX_ALLOWED_DEVICES } from '../services/deviceService';
import { Shield, ShieldAlert, Laptop, Smartphone, Lock, CheckCircle2, RefreshCw } from 'lucide-react';
import logoMobile from '../assets/logo/logo-mobile.webp';

interface DeviceGateProps {
  children: React.ReactNode;
}

export function DeviceGate({ children }: DeviceGateProps) {
  const [status, setStatus] = useState<DeviceAccessResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const checkAccess = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await deviceService.checkCurrentDeviceAccess();
      setStatus(result);

      // Agar ruxsat berilmagan bo'lsa, avtomatik standart nom taklif qilish
      if (!result.isAllowed) {
        const detectedType = deviceService.detectDeviceType();
        const existingLaptops = result.allDevices.filter(d => d.device_type === 'laptop').length;
        if (detectedType === 'laptop') {
          setDeviceName(existingLaptops === 0 ? 'Asosiy Laptop' : 'Ikkinchi Laptop');
        } else {
          setDeviceName('Mening Telefonim');
        }
      }
    } catch (e: any) {
      console.error('Device gate check error:', e);
      setErrorMessage(e?.message || 'Qurilma tekshiruvida xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  // Qurilmani biriktirish (Faqat bo'sh slot bo'lgandagina ishlaydi)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!deviceName.trim()) {
      setErrorMessage('Iltimos, qurilmangiz uchun nom kiriting (masalan: Do\'kon laptopi)');
      return;
    }

    try {
      setIsRegistering(true);
      const res = await deviceService.registerCurrentDevice(deviceName);
      if (res.success) {
        setSuccessMessage('Qurilma muvaffaqiyatli biriktirildi!');
        setTimeout(() => {
          checkAccess();
        }, 500);
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Qurilmani biriktirishda xatolik yuz berdi');
    } finally {
      setIsRegistering(false);
    }
  };

  // 1. Yuklanish holati
  if (isLoading && !status) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 select-none">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
            Qurilma xavfsizligi tekshirilmoqda...
          </p>
        </div>
      </div>
    );
  }

  // 2. Agar qurilma ruxsat etilgan bo'lsa — dasturni ochish
  if (status?.isAllowed) {
    return <>{children}</>;
  }

  // 3. Agar jadval hali Supabase da yaratilmagan bo'lsa — ilovani to'xtatmaslik
  if (status && !status.isTableReady) {
    return <>{children}</>;
  }

  const detectedType = deviceService.detectDeviceType();
  const activeCount = status?.allDevices.filter(d => d.is_approved).length || 0;
  const hasAvailableSlot = activeCount < MAX_ALLOWED_DEVICES;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex items-center gap-2 mb-2">
            <img src={logoMobile} alt="ProSant" className="w-10 h-10 object-contain rounded-lg" />
            <span className="text-xl font-black tracking-wider uppercase text-white">ProSant</span>
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 rounded-full">
            Qurilma Xavfsizlik Tizimi
          </span>
        </div>

        {/* HOLAT A: Yangi qurilmani biriktirish mumkin (Avvalgi qurilmalardan biri o'chirilgan yoki bo'sh slot bor) */}
        {hasAvailableSlot ? (
          <div>
            <div className="text-center mb-5">
              <div className="inline-flex p-3 bg-blue-950/60 text-blue-400 rounded-2xl border border-blue-800/60 mb-3">
                {detectedType === 'mobile' ? <Smartphone className="w-8 h-8" /> : <Laptop className="w-8 h-8" />}
              </div>
              <h2 className="text-base font-bold text-white">Yangi Qurilmani Biriktirish</h2>
              <p className="text-xs text-slate-400 mt-1">
                Bo'sh slot ochildi. Ushbu qurilmani tizimga biriktirishingiz mumkin.
              </p>
              <div className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60">
                <span>Ulangan qurilmalar:</span>
                <strong className="text-emerald-400">{activeCount} / {MAX_ALLOWED_DEVICES}</strong>
              </div>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs rounded-xl flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs rounded-xl flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Ushbu qurilma nomi:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    placeholder="Masalan: Do'kon Laptopi yoki Telefon"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    required
                  />
                  <div className="absolute right-3 top-3 text-slate-500 pointer-events-none">
                    {detectedType === 'mobile' ? <Smartphone className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Aniqlangan: {deviceService.getBrowserSummary()}
                </span>
              </div>

              <button
                type="submit"
                disabled={isRegistering}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-900/30 text-sm"
              >
                {isRegistering ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
                <span>Qurilmani Biriktirish va Kirish</span>
              </button>
            </form>
          </div>
        ) : (
          /* HOLAT B: Barcha 3 ta slot to'lgan — Begona qurilma to'liq bloklangan! */
          <div className="text-center">
            <div className="inline-flex p-3.5 bg-rose-950/60 text-rose-400 rounded-2xl border border-rose-800/80 mb-3 animate-pulse">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-base font-bold text-white">Kirish Taqiqlangan</h2>
            <p className="text-xs text-rose-300/90 font-medium mt-1">
              Ushbu tizimga faqat ruxsat etilgan <strong>3 ta qurilma</strong> (2 ta Laptop va 1 ta Telefon) ulanishi mumkin.
            </p>
            <p className="text-[11px] text-slate-400 mt-2">
              Barcha slotlar band (3/3). Begona qurilmalardan foydalanish qat'iyan man etilgan.
            </p>

            {/* Hozirda ulangan qurilmalar ro'yxati */}
            <div className="mt-4 p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Biriktirilgan qurilmalar (3/3):
              </span>
              <ul className="space-y-1.5">
                {status?.allDevices.map((dev, idx) => (
                  <li key={dev.id} className="flex items-center justify-between text-xs text-slate-300">
                    <span className="flex items-center gap-1.5 truncate">
                      {dev.device_type === 'mobile' ? (
                        <Smartphone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      ) : (
                        <Laptop className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      )}
                      <span className="font-medium truncate">{idx + 1}. {dev.device_name}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 shrink-0">{dev.browser_info || ''}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Yangi qurilma qanday ulanishi haqida tushuntirish va faqat tekshirish tugmasi */}
            <div className="mt-5 pt-4 border-t border-slate-800 text-left space-y-3">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                ℹ️ <strong>Yangi qurilma ulash uchun:</strong> Avval ulangan qurilmalardan birida dasturga kirib, 
                chap menyudagi <span className="text-white font-medium">"Ulangan Qurilmalar"</span> bo'limidan bitta qurilmani o'chirib bo'shatishingiz kerak.
              </p>
              <button
                type="button"
                onClick={checkAccess}
                disabled={isLoading}
                className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : 'text-slate-400'}`} />
                <span>Qayta tekshirish</span>
              </button>
            </div>
          </div>
        )}

        <div className="mt-5 text-center text-[10px] text-slate-500">
          Qurilma kodi: <code className="text-slate-400 font-mono">{status?.currentDeviceId.slice(0, 14)}...</code>
        </div>
      </div>
    </div>
  );
}
