// src/components/DeviceGate.tsx
// ProSant — 3 ta qurilma (2 ta Laptop + 1 ta Telefon) himoya qatlami

import React, { useEffect, useState, useCallback } from 'react';
import { deviceService, type DeviceAccessResult, MAX_ALLOWED_DEVICES } from '../services/deviceService';
import { Shield, ShieldAlert, Laptop, Smartphone, Lock, CheckCircle2, RefreshCw, Trash2, KeyRound } from 'lucide-react';
import logoMobile from '../assets/logo/logo-mobile.webp';

interface DeviceGateProps {
  children: React.ReactNode;
}

export function DeviceGate({ children }: DeviceGateProps) {
  const [status, setStatus] = useState<DeviceAccessResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Eski qurilmani almashtirish modal holati
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [replacePin, setReplacePin] = useState('');
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [replaceError, setReplaceError] = useState<string | null>(null);

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

  // Qurilmani biriktirish
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!deviceName.trim()) {
      setErrorMessage('Iltimos, qurilmangiz uchun nom kiriting (masalan: Do\'kon laptopi)');
      return;
    }

    if (!deviceService.verifyAdminPin(adminPin)) {
      setErrorMessage('Admin PIN kodi noto\'g\'ri!');
      return;
    }

    try {
      setIsRegistering(true);
      const res = await deviceService.registerCurrentDevice(deviceName);
      if (res.success) {
        setSuccessMessage('Qurilma muvaffaqiyatli biriktirildi!');
        setTimeout(() => {
          checkAccess();
        }, 600);
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Qurilmani biriktirishda xatolik yuz berdi');
    } finally {
      setIsRegistering(false);
    }
  };

  // Eski qurilmani o'chirish (joy bo'shatish uchun)
  const handleRemoveDevice = async (deviceId: string) => {
    if (!window.confirm('Haqiqatan ham ushbu qurilmani ro\'yxatdan o\'chirmoqchimisiz?')) {
      return;
    }

    try {
      const res = await deviceService.removeDevice(deviceId);
      if (res.success) {
        await checkAccess();
        setShowReplaceModal(false);
        setIsPinVerified(false);
        setReplacePin('');
      } else {
        setReplaceError(res.message);
      }
    } catch (err: any) {
      setReplaceError(err?.message || 'O\'chirishda xatolik yuz berdi');
    }
  };

  // 1. Yuklanish holati
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
            Qurilma xavfsizligi tekshirilmoqda...
          </p>
        </div>
      </div>
    );
  }

  // 2. Agar qurilma ruxsat etilgan bo'lsa (yoki jadval hali yaratilmagan bo'lsa) — dasturni ochish
  if (status?.isAllowed) {
    return <>{children}</>;
  }

  // 3. Agar jadval hali Supabase da yaratilmagan bo'lsa — foydalanuvchiga xabar berish
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

        {/* HOLAT A: Yangi qurilmani biriktirish mumkin (Bo'sh slotlar mavjud) */}
        {hasAvailableSlot ? (
          <div>
            <div className="text-center mb-5">
              <div className="inline-flex p-3 bg-blue-950/60 text-blue-400 rounded-2xl border border-blue-800/60 mb-3">
                {detectedType === 'mobile' ? <Smartphone className="w-8 h-8" /> : <Laptop className="w-8 h-8" />}
              </div>
              <h2 className="text-base font-bold text-white">Yangi Qurilmani Biriktirish</h2>
              <p className="text-xs text-slate-400 mt-1">
                Tizim faqat ruxsat etilgan <strong>3 ta qurilma</strong> (2 ta Laptop va 1 ta Telefon) uchun sozlangan.
              </p>
              <div className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60">
                <span>Biriktirilgan qurilmalar:</span>
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

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Admin PIN kodi (tasdiqlash uchun):
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    placeholder="Admin PIN kodini kiriting"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    required
                  />
                  <KeyRound className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
                </div>
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
          /* HOLAT B: Barcha 3 ta slot to'lgan — Begona qurilma bloklandi! */
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

            {/* Agar egasi yangi telefon olgan bo'lsa — Admin PIN bilan almashtirish */}
            <div className="mt-5 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowReplaceModal(true)}
                className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Eski qurilmani almashtirish (Admin PIN bilan)</span>
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 text-center text-[11px] text-slate-500">
          Qurilma kodi: <code className="text-slate-400 font-mono">{status?.currentDeviceId.slice(0, 14)}...</code>
        </div>
      </div>

      {/* Eski qurilmani almashtirish / bo'shatish modali */}
      {showReplaceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-400" />
              Qurilmani Almashtirish
            </h3>

            {!isPinVerified ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-400">
                  Eski qurilmalardan birini o'chirish uchun Admin PIN kodini kiriting:
                </p>
                <input
                  type="password"
                  value={replacePin}
                  onChange={(e) => setReplacePin(e.target.value)}
                  placeholder="Admin PIN"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                {replaceError && (
                  <p className="text-xs text-rose-400">{replaceError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReplaceModal(false);
                      setReplaceError(null);
                    }}
                    className="flex-1 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (deviceService.verifyAdminPin(replacePin)) {
                        setIsPinVerified(true);
                        setReplaceError(null);
                      } else {
                        setReplaceError('PIN kod noto\'g\'ri!');
                      }
                    }}
                    className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl"
                  >
                    Davom etish
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-300">
                  Qaysi eski qurilmani o'chirib, o'rniga yangisini ulamoqchisiz?
                </p>
                <div className="space-y-2">
                  {status?.allDevices.map((dev) => (
                    <div
                      key={dev.id}
                      className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between text-xs"
                    >
                      <div className="truncate pr-2">
                        <strong className="text-white block truncate">{dev.device_name}</strong>
                        <span className="text-[10px] text-slate-400">{dev.browser_info}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDevice(dev.device_id)}
                        className="p-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded-lg border border-rose-800 transition-colors"
                        title="O'chirish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowReplaceModal(false);
                    setIsPinVerified(false);
                  }}
                  className="w-full py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Yopish
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
