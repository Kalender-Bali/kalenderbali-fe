import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { CalendarDays, X } from 'lucide-react';
import { formatFullIndoDate, getIndoDayName } from '@/features/kalender/utils/calendarUtils';
import type { DewasaCriteriaField, DewasaDateResult, DewasaMatchedReason } from '../types/mengaturDewasa.types';

interface Props {
  result: DewasaDateResult;
  fields: DewasaCriteriaField[];
  onClose: () => void;
}

function ReasonList({ title, reasons, fields }: { title: string; reasons: DewasaMatchedReason[]; fields: DewasaCriteriaField[] }) {
  return (
    <section className="rounded-xl bg-[#f8fafc] border border-slate-200/70 p-4">
      <h3 className="text-sm font-bold text-[#0f172a]">{title}</h3>
      {reasons.length ? <ul className="mt-2 space-y-3">{reasons.map((reason, index) => (
        <li key={`${reason.field ?? ''}-${reason.calendar_value_id ?? reason.name}-${index}`} className="text-sm text-slate-600 leading-relaxed">
          <p className="font-semibold text-slate-700">{reason.field ? `${fields.find((field) => field.field === reason.field)?.label ?? reason.field}: ` : ''}{reason.name}</p>
          {reason.group_index !== undefined && <p className="text-xs text-slate-500">Kelompok <span className="tabular-nums">{reason.group_index + 1}</span></p>}
          {reason.description && <p className="mt-1">{reason.description}</p>}
        </li>
      ))}</ul> : <p className="mt-2 text-sm text-slate-500">Tidak ada kriteria yang cocok pada bagian ini.</p>}
    </section>
  );
}

// Portal mengelola fokus, Escape dan body scroll agar dialog dapat digunakan keyboard.
export function MengaturDewasaDetailModal({ result, fields, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return; }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const elements = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'));
      if (!elements.length) { event.preventDefault(); return; }
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialogRef.current.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [onClose]);

  const labels = { eligible: 'Memenuhi kriteria', conflict: 'Ada konflik', no_match: 'Tidak cocok' };
  const calendar = result.calendar;
  const wewaran = calendar?.wewaran;
  const elements = wewaran ? [
    ['Ekawara', wewaran.ekawara?.nama], ['Dwiwara', wewaran.dwiwara?.nama],
    ['Triwara', wewaran.triwara?.nama], ['Caturwara', wewaran.caturwara?.nama],
    ['Pancawara', wewaran.pancawara?.nama], ['Sadwara', wewaran.sadwara?.nama],
    ['Saptawara', wewaran.saptawara?.nama], ['Astawara', wewaran.astawara?.nama],
    ['Sangawara', wewaran.sangawara?.nama], ['Dasawara', wewaran.dasawara?.nama],
    ['Wuku', wewaran.wuku?.nama], ['Neptu', wewaran.neptu],
  ].filter(([, value]) => value !== undefined && value !== null && value !== '') : [];

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="dewasa-detail-title" className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-6 sm:p-7 bg-gradient-to-r from-teal-50/60 via-slate-50/40 to-emerald-50/30 border-b border-slate-100 flex items-start justify-between gap-4">
          <div><p className="text-[11px] font-extrabold uppercase tracking-widest text-[#0d9488]">Detail tanggal</p><h2 id="dewasa-detail-title" className="mt-1 text-base sm:text-lg font-extrabold text-[#0f172a] tracking-tight tabular-nums">{getIndoDayName(result.tanggal)}, {formatFullIndoDate(result.tanggal)}</h2><p className="mt-1 text-sm font-semibold text-slate-600">{labels[result.status]}</p></div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Tutup detail tanggal" className="min-w-11 min-h-11 rounded-xl text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer [touch-action:manipulation]"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto p-6 sm:p-7 space-y-5">
          <ReasonList title="Kriteria mendukung yang cocok" reasons={result.matched_recommended} fields={fields} />
          <ReasonList title="Kriteria dihindari yang cocok" reasons={result.matched_avoid} fields={fields} />
          {calendar ? <section className="rounded-xl bg-[#f8fafc] border border-slate-200/70 p-4"><h3 className="text-sm font-bold text-[#0f172a]">Kalender Bali</h3><dl className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">{elements.map(([label, value]) => <div key={label}><dt className="text-[11px] font-semibold text-slate-500">{label}</dt><dd className="text-sm font-bold text-slate-700 tabular-nums">{value}</dd></div>)}{calendar.sasih && <><div><dt className="text-[11px] font-semibold text-slate-500">Sasih</dt><dd className="text-sm font-bold text-slate-700">{calendar.sasih.nama_sasih}</dd></div><div><dt className="text-[11px] font-semibold text-slate-500">Tahun Saka</dt><dd className="text-sm font-bold text-slate-700 tabular-nums">{calendar.sasih.tahun_saka}</dd></div></>}{calendar.pengalantaka && <><div><dt className="text-[11px] font-semibold text-slate-500">Pengalantaka</dt><dd className="text-sm font-bold text-slate-700">{calendar.pengalantaka.pengalantaka}</dd></div><div><dt className="text-[11px] font-semibold text-slate-500">Hari lunar</dt><dd className="text-sm font-bold text-slate-700 tabular-nums">{calendar.pengalantaka.penanggal_1}{calendar.pengalantaka.penanggal_2 > 0 && ` / ${calendar.pengalantaka.penanggal_2}`}</dd></div><div><dt className="text-[11px] font-semibold text-slate-500">Purnama / Tilem</dt><dd className="text-sm font-bold text-slate-700">{calendar.pengalantaka.purnama_tilem}</dd></div></>}</dl></section> : <p className="text-sm text-slate-500">Data kalender untuk tanggal ini tidak tersedia.</p>}
          <Link to={`/kalender?date=${encodeURIComponent(result.tanggal)}`} className="h-11 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm transition-colors inline-flex items-center justify-center gap-2 [touch-action:manipulation]"><CalendarDays className="w-4 h-4" /> Lihat di kalender lengkap</Link>
        </div>
      </div>
    </div>, document.body,
  );
}
