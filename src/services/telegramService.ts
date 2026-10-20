// src/services/telegramService.ts
// ProSant sotuv cheklarini Telegram bot orqali guruh yoki kanalga yuborish servisi

import type { SaleRecord } from '../types';
import { formatSum } from '../utils/format';

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  topicId?: string; // Telegram Forum guruhlarida mavzu (thread) ID
  enabled: boolean;
  autoSendOnSale: boolean;
}

const STORAGE_KEY_TOKEN = 'santexpro_telegram_bot_token';
const STORAGE_KEY_CHAT_ID = 'santexpro_telegram_chat_id';
const STORAGE_KEY_TOPIC_ID = 'santexpro_telegram_topic_id';
const STORAGE_KEY_ENABLED = 'santexpro_telegram_enabled';
const STORAGE_KEY_AUTOSEND = 'santexpro_telegram_auto_send';

/**
 * HTML matnidagi maxsus belgilarni Telegram xavfsiz formatiga o'tkazish
 */
function escapeHtml(text: string | number | undefined | null): string {
  if (text === undefined || text === null) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Sanani o'zbekcha / chiroyli formatda ko'rsatish
 */
function formatDateTime(dateStr: string): string {
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

/**
 * To'lov turining o'zbekcha nomi va emoji belgisi
 */
function getPaymentMethodDisplay(method: string): { label: string; icon: string } {
  switch (method) {
    case 'naqd':
      return { label: 'Naqd pul', icon: '💵' };
    case 'karta':
      return { label: 'Plastik karta', icon: '💳' };
    case 'transfer':
      return { label: "Bank o'tkazmasi", icon: '🏦' };
    case 'nasiya':
      return { label: 'Nasiya (Qarz)', icon: '⏳' };
    default:
      return { label: method, icon: '💰' };
  }
}

export const telegramService = {
  /**
   * Joriy Telegram konfiguratsiyasini olish (LocalStorage yoki .env dan)
   */
  getConfig(): TelegramConfig {
    const envToken = (import.meta.env.VITE_TELEGRAM_BOT_TOKEN as string) || '';
    const envChatId = (import.meta.env.VITE_TELEGRAM_CHAT_ID as string) || '';

    const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
    const savedChatId = localStorage.getItem(STORAGE_KEY_CHAT_ID);
    const savedTopicId = localStorage.getItem(STORAGE_KEY_TOPIC_ID) || '';
    const savedEnabled = localStorage.getItem(STORAGE_KEY_ENABLED);
    const savedAutoSend = localStorage.getItem(STORAGE_KEY_AUTOSEND);

    return {
      botToken: savedToken !== null ? savedToken : envToken,
      chatId: savedChatId !== null ? savedChatId : envChatId,
      topicId: savedTopicId || undefined,
      enabled: savedEnabled !== null ? savedEnabled === 'true' : true,
      autoSendOnSale: savedAutoSend !== null ? savedAutoSend === 'true' : true,
    };
  },

  /**
   * Konfiguratsiyani yangilash va saqlash
   */
  saveConfig(config: Partial<TelegramConfig>): void {
    if (config.botToken !== undefined) {
      localStorage.setItem(STORAGE_KEY_TOKEN, config.botToken.trim());
    }
    if (config.chatId !== undefined) {
      localStorage.setItem(STORAGE_KEY_CHAT_ID, config.chatId.trim());
    }
    if (config.topicId !== undefined) {
      if (config.topicId.trim()) {
        localStorage.setItem(STORAGE_KEY_TOPIC_ID, config.topicId.trim());
      } else {
        localStorage.removeItem(STORAGE_KEY_TOPIC_ID);
      }
    }
    if (config.enabled !== undefined) {
      localStorage.setItem(STORAGE_KEY_ENABLED, String(config.enabled));
    }
    if (config.autoSendOnSale !== undefined) {
      localStorage.setItem(STORAGE_KEY_AUTOSEND, String(config.autoSendOnSale));
    }
  },

  /**
   * Telegram to'g'ri sozlanganmi yoki yo'qligini tekshirish
   */
  isConfigured(): boolean {
    const cfg = this.getConfig();
    return Boolean(cfg.botToken && cfg.chatId && cfg.enabled);
  },

  /**
   * Sotuv chekini Telegramga mos spetsifikatsiya (ro'yxat) shaklida formatlash
   */
  formatSaleMessage(
    sale: SaleRecord,
    options?: { cashierName?: string; storeName?: string }
  ): string {
    const store = options?.storeName || 'ProSant — Santexnika';
    const cashier = options?.cashierName || 'Kassa';
    const formattedDate = formatDateTime(sale.createdAt);
    const payment = getPaymentMethodDisplay(sale.paymentMethod);

    const lines: string[] = [];

    // 1. Sarlavha
    lines.push(`🧾 <b>SAVDO CHEKI: ${escapeHtml(sale.saleNumber)}</b>`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`🏪 <b>Do'kon:</b> ${escapeHtml(store)}`);
    lines.push(`📅 <b>Sana va vaqt:</b> ${escapeHtml(formattedDate)}`);
    lines.push(`👤 <b>Sotuvchi/Kassir:</b> ${escapeHtml(cashier)}`);

    // 2. Xaridor
    if (sale.customerName || sale.customerPhone) {
      const custName = escapeHtml(sale.customerName || 'Mijoz');
      const custPhone = sale.customerPhone ? ` (${escapeHtml(sale.customerPhone)})` : '';
      lines.push(`👥 <b>Xaridor:</b> ${custName}${custPhone}`);
    } else {
      lines.push(`👥 <b>Xaridor:</b> Chakana xaridor`);
    }

    lines.push(`━━━━━━━━━━━━━━━━━━━━━`);

    // 3. Sotilgan tovarlar spetsifikatsiyasi (spisok)
    const itemCount = sale.items.length;
    lines.push(`📦 <b>Sotilgan tovarlar ro'yxati (${itemCount} ta):</b>\n`);

    sale.items.forEach((item, index) => {
      const num = index + 1;
      const unit = escapeHtml(item.unit || 'dona');
      const qty = formatSum(item.quantity);
      const price = formatSum(item.price);
      const total = formatSum(item.total);
      const artikul = item.artikul ? ` <code>[${escapeHtml(item.artikul)}]</code>` : '';

      lines.push(`${num}. <b>${escapeHtml(item.productName)}</b>${artikul}`);
      lines.push(`    ▫️ ${qty} ${unit} × ${price} so'm = <b>${total} so'm</b>`);
    });

    lines.push(`━━━━━━━━━━━━━━━━━━━━━`);

    // 4. Chegirma va Yakuniy summa
    if (sale.discount && sale.discount > 0) {
      lines.push(`🏷 <b>Chegirma:</b> -${formatSum(sale.discount)} so'm`);
    }

    lines.push(`💰 <b>JAMI TO'LOV:</b> <b>${formatSum(sale.total)} so'm</b>`);
    lines.push(`${payment.icon} <b>To'lov turi:</b> ${escapeHtml(payment.label)}`);

    // 5. Naqd to'lov qabul va qaytim
    if (sale.paymentMethod === 'naqd' && sale.receivedAmount) {
      lines.push(`💵 <b>Qabul qilindi:</b> ${formatSum(sale.receivedAmount)} so'm`);
      if (sale.changeAmount && sale.changeAmount > 0) {
        lines.push(`💸 <b>Qaytim:</b> ${formatSum(sale.changeAmount)} so'm`);
      }
    }

    // 6. Nasiya eslatmasi
    if (sale.paymentMethod === 'nasiya') {
      lines.push(`⚠️ <b>Nasiya qarzdorlik:</b> ${formatSum(sale.total)} so'm`);
    }

    // 7. Izoh (agar mavjud bo'lsa)
    if (sale.note) {
      lines.push(`📝 <b>Izoh:</b> <i>"${escapeHtml(sale.note)}"</i>`);
    }

    lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`✨ <i>ProSant savdo tizimi</i>`);

    return lines.join('\n');
  },

  /**
   * Telegram Bot API orqali xabar yuborish
   */
  async sendMessage(
    text: string,
    overrideConfig?: { botToken?: string; chatId?: string; topicId?: string }
  ): Promise<{ success: boolean; error?: string }> {
    const config = this.getConfig();
    const token = overrideConfig?.botToken || config.botToken;
    const chatId = overrideConfig?.chatId || config.chatId;
    const topicId = overrideConfig?.topicId !== undefined ? overrideConfig.topicId : config.topicId;

    if (!token || !chatId) {
      return {
        success: false,
        error: 'Telegram Bot Token yoki Chat ID ko‘rsatilmagan',
      };
    }

    try {
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      const body: Record<string, unknown> = {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      };

      if (topicId && !isNaN(Number(topicId))) {
        body.message_thread_id = Number(topicId);
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        const desc = data?.description || `HTTP xatosi: ${response.status}`;
        console.warn('[Telegram Service] Xabar yuborishda xatolik:', desc);
        return { success: false, error: desc };
      }

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Noma’lum tarmoq xatosi';
      console.warn('[Telegram Service] Tarmoq xatosi:', msg);
      return { success: false, error: msg };
    }
  },

  /**
   * Sotuv amalga oshirilganda Telegramga chek xabarini yuborish
   */
  async sendSaleNotification(
    sale: SaleRecord,
    options?: { cashierName?: string; force?: boolean }
  ): Promise<{ success: boolean; error?: string }> {
    const config = this.getConfig();

    // Agar Telegram o'chirilgan bo'lsa yoki autoSend false bo'lsa (force bo'lmasa)
    if (!options?.force) {
      if (!config.enabled || !config.autoSendOnSale) {
        return { success: false, error: 'Telegram xabarnomasi o‘chirilgan' };
      }
    }

    if (!config.botToken || !config.chatId) {
      return { success: false, error: 'Telegram sozlamalari kiritilmagan' };
    }

    const message = this.formatSaleMessage(sale, {
      cashierName: options?.cashierName,
      storeName: 'ProSant — Santexnika',
    });

    return await this.sendMessage(message);
  },

  /**
   * Bot token va Chat ID ni sinab ko'rish (Test xabar yuborish)
   */
  async testConnection(
    botToken: string,
    chatId: string,
    topicId?: string
  ): Promise<{ success: boolean; message: string }> {
    const cleanToken = botToken.trim();
    const cleanChatId = chatId.trim();

    if (!cleanToken) {
      return { success: false, message: 'Iltimos, Bot Token kiriting' };
    }
    if (!cleanChatId) {
      return { success: false, message: 'Iltimos, Chat ID kiriting' };
    }

    const testText = [
      `🔔 <b>ProSant — Telegram Bot Sinov Xabari</b>`,
      `━━━━━━━━━━━━━━━━━━━━━`,
      `✅ Bot muvaffaqiyatli ulandi!`,
      `🕒 <b>Vaqt:</b> ${formatDateTime(new Date().toISOString())}`,
      `📌 <b>Holat:</b> Kassadan sotuv amalga oshirilganda barcha cheklar va tovarlar ro‘yxati ushbu chatga avtomatik yuboriladi.`,
      `━━━━━━━━━━━━━━━━━━━━━`,
      `✨ <i>ProSant tizimi faol!</i>`,
    ].join('\n');

    const result = await this.sendMessage(testText, {
      botToken: cleanToken,
      chatId: cleanChatId,
      topicId: topicId?.trim() || undefined,
    });

    if (result.success) {
      return {
        success: true,
        message: 'Ajoyib! Telegram chatga sinov xabari muvaffaqiyatli yuborildi.',
      };
    } else {
      return {
        success: false,
        message: `Xatolik yuz berdi: ${result.error}`,
      };
    }
  },
};
