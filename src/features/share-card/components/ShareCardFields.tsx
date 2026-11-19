import { useId } from 'react';
import { characters, messageLimit, senderLimit } from '../utils/shareCardDraft';

const fieldClass = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none transition-colors focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const labelClass = 'mb-1.5 block text-[11px] font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-400';

export function ShareCardFields({ message, sender, onChange }: {
  message: string;
  sender: string;
  onChange: (field: 'message' | 'sender', value: string) => void;
}) {
  const messageId = useId();
  const senderId = useId();
  return (
    <>
      {/* Batas karakter yang sama dipakai pada kedua jenis kartu. */}
      <div>
        <label htmlFor={messageId} className={labelClass}>Pesan (opsional)</label>
        <textarea id={messageId} rows={2} value={message} aria-describedby={`${messageId}-count`}
          className={`${fieldClass} min-h-16 resize-y`}
          onChange={(event) => onChange('message', characters(event.target.value).slice(0, messageLimit).join(''))} />
        <p id={`${messageId}-count`} className="mt-1 text-right text-xs tabular-nums text-slate-500 dark:text-slate-400">
          {characters(message).length}/{messageLimit}
        </p>
      </div>
      <div>
        <label htmlFor={senderId} className={labelClass}>Nama pengirim (opsional)</label>
        <input id={senderId} type="text" value={sender} aria-describedby={`${senderId}-count`}
          className={`${fieldClass} h-11`}
          onChange={(event) => onChange('sender', characters(event.target.value).slice(0, senderLimit).join(''))} />
        <p id={`${senderId}-count`} className="mt-1 text-right text-xs tabular-nums text-slate-500 dark:text-slate-400">
          {characters(sender).length}/{senderLimit}
        </p>
      </div>
    </>
  );
}
