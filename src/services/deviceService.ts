// src/services/deviceService.ts
// ProSant — 3 ta ruxsat etilgan qurilma (2 ta Laptop va 1 ta Telefon) xavfsizlik xizmati

import { supabase } from '../lib/supabase';
import type { AllowedDeviceRow } from '../types/database';

export const MAX_ALLOWED_DEVICES = 3;
const DEVICE_ID_KEY = 'prosant_device_id_v1';
const DEVICE_VERIFIED_KEY = 'prosant_device_verified_v1';

export interface DeviceAccessResult {
  isAllowed: boolean;
  isTableReady: boolean;
  currentDeviceId: string;
  currentDevice: AllowedDeviceRow | null;
  allDevices: AllowedDeviceRow[];
  totalSlots: number;
  remainingSlots: number;
  error?: string;
}

export const deviceService = {
  /**
   * Ushbu brauzer uchun doimiy unikal ID olish yoki yaratish
   */
  getDeviceId(): string {
    try {
      let id = localStorage.getItem(DEVICE_ID_KEY);
      if (!id) {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          id = crypto.randomUUID();
        } else {
          id = 'psdev_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36);
        }
        localStorage.setItem(DEVICE_ID_KEY, id);
      }
      return id;
    } catch {
      return 'psdev_fallback_' + Date.now();
    }
  },

  /**
   * Qurilma turini avtomatik aniqlash (Laptop yoki Telefon)
   */
  detectDeviceType(): 'laptop' | 'mobile' | 'other' {
    if (typeof navigator === 'undefined') return 'laptop';
    const ua = navigator.userAgent.toLowerCase();
    if (/android|iphone|ipad|ipod|mobile|windows phone/i.test(ua)) {
      return 'mobile';
    }
    return 'laptop';
  },

  /**
   * Brauzer va OS haqida qisqacha ma'lumot
   */
  getBrowserSummary(): string {
    if (typeof navigator === 'undefined') return 'Brauzer';
    const ua = navigator.userAgent;
    let browser = 'Brauzer';
    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
    else if (ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Firefox')) browser = 'Firefox';

    let os = '';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    else if (ua.includes('Mac')) os = 'macOS';

    return `${browser} (${os || 'Qurilma'})`;
  },

  /**
   * Barcha ruxsat etilgan qurilmalarni Supabase dan yuklash
   */
  async fetchAllowedDevices(): Promise<{ devices: AllowedDeviceRow[]; isTableReady: boolean }> {
    try {
      const { data, error } = await supabase
        .from('allowed_devices')
        .select('*')
        .order('registered_at', { ascending: true });

      if (error) {
        // Agar jadval hali Supabase da yaratilmagan bo'lsa (404/42P01)
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('allowed_devices jadvali hali yaratilmagan. Migratsiyani ishga tushiring.');
          return { devices: [], isTableReady: false };
        }
        console.error('Qurilmalarni tekshirishda xatolik:', error.message);
        return { devices: [], isTableReady: true };
      }

      return { devices: (data as AllowedDeviceRow[]) || [], isTableReady: true };
    } catch (err) {
      console.warn('Qurilma tekshiruvi tarmoq xatosi:', err);
      return { devices: [], isTableReady: false };
    }
  },

  /**
   * Ushbu qurilma tizimga ruxsat etilganligini tekshirish
   */
  async checkCurrentDeviceAccess(): Promise<DeviceAccessResult> {
    const currentDeviceId = this.getDeviceId();
    const { devices, isTableReady } = await this.fetchAllowedDevices();

    // Agar jadval hali Supabase da yaratilmagan bo'lsa, ilova ishini to'xtatmaslik uchun vaqtincha ruxsat beramiz
    if (!isTableReady) {
      return {
        isAllowed: true,
        isTableReady: false,
        currentDeviceId,
        currentDevice: null,
        allDevices: [],
        totalSlots: MAX_ALLOWED_DEVICES,
        remainingSlots: MAX_ALLOWED_DEVICES,
      };
    }

    const currentDevice = devices.find(d => d.device_id === currentDeviceId && d.is_approved) || null;
    const isAllowed = Boolean(currentDevice);
    const activeDevices = devices.filter(d => d.is_approved);
    const remainingSlots = Math.max(0, MAX_ALLOWED_DEVICES - activeDevices.length);

    if (isAllowed) {
      localStorage.setItem(DEVICE_VERIFIED_KEY, 'true');
      // Fondagi oxirgi ko'rilgan vaqtni yangilash (throttled)
      this.touchLastSeen(currentDeviceId);
    } else {
      localStorage.removeItem(DEVICE_VERIFIED_KEY);
    }

    return {
      isAllowed,
      isTableReady: true,
      currentDeviceId,
      currentDevice,
      allDevices: devices,
      totalSlots: MAX_ALLOWED_DEVICES,
      remainingSlots,
    };
  },

  /**
   * Yangi qurilmani ruxsat etilganlar ro'yxatiga biriktirish
   */
  async registerCurrentDevice(deviceName: string, deviceType?: 'laptop' | 'mobile' | 'other'): Promise<{ success: boolean; message: string }> {
    const currentDeviceId = this.getDeviceId();
    const { devices, isTableReady } = await this.fetchAllowedDevices();

    if (!isTableReady) {
      return {
        success: false,
        message: 'Supabase bazasida "allowed_devices" jadvali topilmadi. Avval SQL migratsiyani bajaring.',
      };
    }

    // Qurilma allaqachon bormi?
    const existing = devices.find(d => d.device_id === currentDeviceId);
    if (existing && existing.is_approved) {
      localStorage.setItem(DEVICE_VERIFIED_KEY, 'true');
      return { success: true, message: 'Ushbu qurilma allaqachon tasdiqlangan.' };
    }

    // Limit tekshiruvi (3 tadan ko'p bo'lmasligi kerak)
    const activeCount = devices.filter(d => d.is_approved && d.device_id !== currentDeviceId).length;
    if (activeCount >= MAX_ALLOWED_DEVICES) {
      return {
        success: false,
        message: `Maksimal limitga yetildi (${MAX_ALLOWED_DEVICES} ta qurilma). Yangi qurilma qo'shish uchun avval eskisini o'chirishingiz kerak.`,
      };
    }

    const resolvedType = deviceType || this.detectDeviceType();
    const browserInfo = this.getBrowserSummary();

    const { error } = await supabase.from('allowed_devices').upsert({
      device_id: currentDeviceId,
      device_name: deviceName.trim() || (resolvedType === 'mobile' ? 'Mening Telefonim' : 'Mening Laptopim'),
      device_type: resolvedType,
      browser_info: browserInfo,
      is_approved: true,
      last_seen_at: new Date().toISOString(),
    }, { onConflict: 'device_id' });

    if (error) {
      console.error('Qurilmani ro\'yxatdan o\'tkazish xatosi:', error);
      return { success: false, message: error.message || 'Qurilmani biriktirishda xatolik yuz berdi.' };
    }

    localStorage.setItem(DEVICE_VERIFIED_KEY, 'true');
    return { success: true, message: 'Qurilma muvaffaqiyatli biriktirildi!' };
  },

  /**
   * Qurilmani ro'yxatdan o'chirish (masalan, eski telefonni o'chirib yangisini ulash uchun)
   */
  async removeDevice(deviceId: string): Promise<{ success: boolean; message: string }> {
    const { error } = await supabase
      .from('allowed_devices')
      .delete()
      .eq('device_id', deviceId);

    if (error) {
      return { success: false, message: error.message };
    }

    if (deviceId === this.getDeviceId()) {
      localStorage.removeItem(DEVICE_VERIFIED_KEY);
    }

    return { success: true, message: 'Qurilma muvaffaqiyatli o\'chirildi.' };
  },

  /**
   * Admin PIN kodini tekshirish (xavfsiz biriktirish va o'chirish uchun)
   */
  verifyAdminPin(pin: string): boolean {
    const clean = pin.trim().toLowerCase();
    const validPins = ['admin', '123456', 'prosant', 'admin123', '2024', '7777'];
    return validPins.includes(clean);
  },

  /**
   * Qurilmaning oxirgi kirgan vaqtini yangilash
   */
  async touchLastSeen(deviceId: string): Promise<void> {
    try {
      const lastTouch = sessionStorage.getItem('prosant_last_touch');
      const now = Date.now();
      // Har 30 daqiqada faqat bir marta yangilaymiz
      if (lastTouch && now - Number(lastTouch) < 30 * 60 * 1000) {
        return;
      }
      sessionStorage.setItem('prosant_last_touch', String(now));
      await supabase
        .from('allowed_devices')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('device_id', deviceId);
    } catch {
      // Jim e'tiborsiz qoldiriladi
    }
  },
};
