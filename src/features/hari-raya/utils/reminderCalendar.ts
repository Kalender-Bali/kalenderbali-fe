export interface ReminderOptions { remindHMinus1: boolean; remindHariH: boolean }

function calendarText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function foldLine(value: string): string {
  const encoder = new TextEncoder();
  let line = '', length = 0;
  const lines: string[] = [];
  for (const character of value) {
    const size = encoder.encode(character).length;
    if (length + size > 75) { lines.push(line); line = ' '; length = 1; }
    line += character; length += size;
  }
  return [...lines, line].join('\r\n');
}

/** Kalender berisi alarm nyata; impor ke aplikasi kalender untuk mengaktifkannya. */
export function buildReminderCalendar(date: string, name: string, options: ReminderOptions): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !options.remindHariH && !options.remindHMinus1) {
    throw new Error('Tanggal dan waktu pengingat harus dipilih.');
  }
  const [year, month, day] = date.split('-').map(Number);
  const midnight = new Date(Date.UTC(year, month - 1, day));
  if (midnight.toISOString().slice(0, 10) !== date) throw new Error('Tanggal pengingat tidak valid.');
  // 06.00 WITA = 22.00 UTC pada hari sebelumnya. H-1 17.00 WITA adalah 13 jam sebelumnya.
  const start = new Date(Date.UTC(year, month - 1, day, -2));
  const stamp = (value: Date) => value.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Kalender Bali//Pengingat//ID','CALSCALE:GREGORIAN','METHOD:PUBLISH',
    'BEGIN:VEVENT',`UID:rahina-${date}-${encodeURIComponent(name)}@kalenderbali.app`,`DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,`DTEND:${stamp(new Date(start.getTime()+30*60*1000))}`,`SUMMARY:${calendarText(name)}`];
  for (const trigger of [options.remindHMinus1 ? '-PT13H' : null, options.remindHariH ? 'PT0S' : null]) {
    if (trigger) lines.push('BEGIN:VALARM','ACTION:DISPLAY',`TRIGGER:${trigger}`,`DESCRIPTION:${calendarText(name)}`,'END:VALARM');
  }
  lines.push('END:VEVENT','END:VCALENDAR');
  return lines.map(foldLine).join('\r\n')+'\r\n';
}

export function downloadReminderCalendar(date: string, name: string, options: ReminderOptions): void {
  const blob = new Blob([buildReminderCalendar(date, name, options)], {type:'text/calendar;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = `Pengingat-Hari-Raya-${date}.ics`;
  document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
}
