import type { AuthUser } from '@/stores/useAuthStore';
import type { KomunitasDetail, KomunitasStatus } from '../types/komunitas.types';

/** ID numerik harus utuh dan positif; data rusak tidak boleh memberikan hak pengelolaan. */
export function positiveId(value: unknown): number | undefined {
  if (typeof value !== 'number' && typeof value !== 'string') return undefined;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : undefined;
}
export function isAdmin(user: AuthUser | null): boolean { return user?.role.trim().toLowerCase() === 'admin'; }
export function canRegister(user: AuthUser | null): boolean {
  return !!user && ['member', 'contributor', 'admin'].includes(user.role.trim().toLowerCase());
}
export function canManageCommunity(user: AuthUser | null, profile?: KomunitasDetail | null): boolean {
  const id = positiveId(user?.id);
  return !!id && !!profile && (isAdmin(user) || profile.manager.some(manager => manager.user_id === id));
}

/** Hanya HTTP(S) yang ditautkan; URL dari database tetap diperiksa sebelum menjadi href. */
export function safeHttpUrl(value: string): string | undefined {
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : undefined; }
  catch { return undefined; }
}
export function todayWita(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Makassar', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (type: string) => parts.find(part => part.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function financeDate(value: string): string {
  return new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Makassar', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00+08:00`));
}
export const rupiah = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
export const statusStyle: Record<KomunitasStatus, string> = {
  Published: 'bg-emerald-50 text-emerald-700', Review: 'bg-amber-50 text-amber-800', Rejected: 'bg-rose-50 text-rose-700',
};
