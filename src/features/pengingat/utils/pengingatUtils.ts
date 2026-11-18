import type { PengingatCondition, PengingatEntry, PengingatStatus } from '../types/pengingat.types';

export function shiftDate(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function formatReminderDate(date: string, short = false): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: short ? 'short' : 'long', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}

export function getCountdown(date: string, today: string): string {
  const days = Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
  if (days < 0) return 'Terlewat';
  if (days === 0) return 'Hari ini';
  if (days === 1) return 'Besok';
  return `${days} hari lagi`;
}

export function getReminderStatus(entry: PengingatEntry, today: string): PengingatStatus {
  return entry.nextDate < today ? 'terlewat' : 'aktif';
}

export function getConditionLabel(condition: PengingatCondition): string {
  switch (condition.basis) {
    case 'kelahiran': return `Lahir ${formatReminderDate(condition.birthDate, true)} · ${condition.beforeSix ? 'sebelum' : 'mulai'} 06.00 WITA`;
    case 'pawukon': return `${condition.saptawara} ${condition.pancawara} · ${condition.wuku}`;
    case 'sasih': return `${condition.phase} · ${condition.sasih}`;
    case 'hari-raya': return condition.name;
    case 'tanggal': return `Tanggal pilihan · ${formatReminderDate(condition.date, true)}`;
  }
}

export function getAlertLabel(entry: PengingatEntry): string {
  const days = [...entry.alertDays].sort((a, b) => b - a).map(day => day === 0 ? 'Hari H' : `H-${day}`);
  return days.join(', ');
}

export function sortReminders(entries: PengingatEntry[], today: string): PengingatEntry[] {
  const order: Record<PengingatStatus, number> = { aktif: 0, terlewat: 1 };
  return [...entries].sort((a, b) =>
    order[getReminderStatus(a, today)] - order[getReminderStatus(b, today)] ||
    a.nextDate.localeCompare(b.nextDate) || a.title.localeCompare(b.title, 'id'),
  );
}
