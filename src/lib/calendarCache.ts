// Mengganti URL cache ketika aturan/master kalender berubah. Endpoint lama
// pernah mengirim immutable setahun sehingga cache browser perlu versi baru.
export const CALENDAR_RULES_VERSION = '2026-11-11-wariga-10';

export function usesCalendarRules(url = ''): boolean {
  return /^\/(kalender|wariga\/|keterangan\/|hari-raya(?:\/|$)|search\/(otonan|hari-raya|piodalan))/.test(url);
}
