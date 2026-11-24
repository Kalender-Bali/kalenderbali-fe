import type { ChatSettings } from '@/features/chatbot/api/chatApi';

export type LimitKey = Exclude<keyof ChatSettings, 'maintenance'>;
export type LimitDraft = Record<LimitKey, string>;
export const limitLabels: Record<LimitKey, string> = {
  premium_daily_tokens: 'Token harian premium', admin_daily_tokens: 'Token harian admin',
};

// Tolak angka pecahan dan overflow sebelum pengaturan dikirim ke database.
export function parseSettings(draft: LimitDraft, maintenance: boolean): ChatSettings {
  const values = {} as Record<LimitKey, number>;
  for (const key of Object.keys(limitLabels) as LimitKey[]) {
    const raw = draft[key]?.trim();
    const number = Number(raw);
    if (!raw || !/^\d+$/.test(raw) || !Number.isSafeInteger(number) || number > 2147483647 || number < 1) {
      throw new Error(`Nilai ${limitLabels[key].toLowerCase()} harus berupa bilangan bulat yang valid.`);
    }
    values[key] = number;
  }
  return { ...values, maintenance };
}
