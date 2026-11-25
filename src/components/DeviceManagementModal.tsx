// src/components/DeviceManagementModal.tsx
// ProSant — Ulangan qurilmalarni ko'rish va boshqarish modali

import { useState, useEffect, useCallback } from 'react';
import { deviceService, MAX_ALLOWED_DEVICES } from '../services/deviceService';
import type { AllowedDeviceRow } from '../types/database';
import { Shield, Laptop, Smartphone, Trash2, X, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface DeviceManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeviceManagementModal({ isOpen, onClose }: DeviceManagementModalProps) {
  const [devices, setDevices] = useState<AllowedDeviceRow[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // O'chirish tasdig'i
  const [deletingDevice, setDeletingDevice] = useState<AllowedDeviceRow | null>(null);

  const loadDevices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const currentId = deviceService.getDeviceId();
      setCurrentDeviceId(currentId);
      const res = await deviceService.fetchAllowedDevices();
      setDevices(res.devices);
    } catch (e: any) {
      setError(e?.message || 'Qurilmalarni yuklashda xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadDevices();
    }
  }, [isOpen, loadDevices]);

  const confirmDelete = async () => {
    if (!deletingDevice) return;

    try {
      setIsDeleting(true);
      const res = await deviceService.removeDevice(deletingDevice.device_id);
      if (res.success) {
        setSuccess(`"${deletingDevice.device_name}" qurilmasi muvaffaqiyatli o'chirildi. Yangi qurilma uchun 1 ta bo'sh slot ochildi!`);
        setDeletingDevice(null);
        await loadDevices();
        setTimeout(() => setSuccess(null), 4000);
      } else {
        setError(res.message);
      }
    } catch (e: any) {
      setError(e?.message || 'O\'chirishda xatolik yuz berdi');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  const activeCount = devices.filter(d => d.is_approved).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-950/60 text-emerald-400 rounded-xl border border-emerald-800/60">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Ulangan Qurilmalar</h3>
              <p className="text-[11px] text-slate-400">
                Faqat 3 ta qurilma (2 ta Laptop va 1 ta Telefon)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Status summary */}
          <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs">
            <span className="text-slate-300 font-medium">Faol qurilmalar soni:</span>
            <span className="font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-800/60">
              {activeCount} / {MAX_ALLOWED_DEVICES} ta
            </span>
          </div>

          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
              <span className="text-xs">Yuklanmoqda...</span>
            </div>
          ) : devices.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              Hozircha biriktirilgan qurilmalar topilmadi.
            </div>
          ) : (
            <div className="space-y-2.5">
              {devices.map((device) => {
                const isCurrent = device.device_id === currentDeviceId;
                return (
                  <div
                    key={device.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-blue-950/30 border-blue-500/50'
                        : 'bg-slate-800/40 border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="p-2 rounded-lg bg-slate-800 text-slate-300 shrink-0 mt-0.5">
                          {device.device_type === 'mobile' ? (
                            <Smartphone className="w-4 h-4 text-blue-400" />
                          ) : (
                            <Laptop className="w-4 h-4 text-emerald-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white truncate">
                              {device.device_name}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-semibold bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded border border-blue-500/30 shrink-0">
                                Ushbu qurilma
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 block truncate">
                            {device.browser_info || 'Noma\'lum brauzer'}
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            Ulandi: {new Date(device.registered_at).toLocaleDateString('uz-UZ')}
                          </span>
                        </div>
                      </div>

                      {/* O'chirish tugmasi */}
                      <button
                        type="button"
                        onClick={() => setDeletingDevice(device)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 rounded-lg transition-colors shrink-0 cursor-pointer"
                        title="Qurilmani ro'yxatdan chiqarish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* O'chirishni tasdiqlash bloki */}
          {deletingDevice && (
            <div className="mt-3 p-3.5 bg-rose-950/40 border border-rose-800/80 rounded-xl space-y-3">
              <span className="text-xs font-semibold text-rose-300 block leading-relaxed">
                Haqiqatan ham <strong>"{deletingDevice.device_name}"</strong> qurilmasini ro'yxatdan chiqarmoqchimisiz?
              </span>
              <p className="text-[11px] text-slate-300">
                Ushbu qurilma o'chirilsa, yangi qurilma ulash uchun <strong>1 ta bo'sh slot</strong> ochiladi.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeletingDevice(null)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={confirmDelete}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>Ha, chiqarib yuborish</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Yopish
          </button>
        </div>

      </div>
    </div>
  );
}
