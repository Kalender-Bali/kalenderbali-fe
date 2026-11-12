import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { DewasaActivityGuidance } from '../types/alaAyuning.types';

export function DewasaActivityPanel({ activities, id }: { activities: DewasaActivityGuidance[]; id: string }) {
  const [selectedId, setSelectedId] = useState('');
  const selected = activities.find(activity => activity.activity_id === selectedId);

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-4 text-slate-700 space-y-3">
      <div>
        <label htmlFor={id} className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 block mb-1.5">
          Kegiatan yang direncanakan
        </label>
        <div className="relative">
          <select
            id={id}
            value={selectedId}
            onChange={event => setSelectedId(event.target.value)}
            className="w-full h-11 pl-3 pr-9 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600/20 appearance-none"
          >
            <option value="">Pilih kegiatan</option>
            {activities.map(activity => <option key={activity.activity_id} value={activity.activity_id}>{activity.activity_name}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>
      {selected && <DewasaActivityDetails activity={selected} />}
    </div>
  );
}

export function DewasaActivityDetails({ activity }: { activity: DewasaActivityGuidance }) {
  const hasAvoid = activity.matched_avoid.length > 0;
  return (
    <div className="space-y-3" aria-live="polite">
      <p className={`text-xs font-bold ${hasAvoid ? 'text-rose-700' : 'text-slate-700'}`}>
        {hasAvoid ? 'Ada pantangan untuk kegiatan ini.' : activity.status === 'eligible' ? 'Ada anjuran untuk kegiatan ini.' : 'Belum ada anjuran yang cocok untuk kegiatan ini.'}
      </p>
      {hasAvoid && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 space-y-2">
          <h4 className="text-xs font-extrabold text-rose-800">Pantangan yang perlu diperhatikan</h4>
          {activity.matched_avoid.map(reason => (
            <div key={reason.calendar_value_id ?? reason.name} className="text-xs text-rose-900 leading-relaxed">
              <p className="font-bold">{reason.name}</p>
              <p className="whitespace-pre-line break-words">{reason.description || 'Pantangan ini tercatat untuk kegiatan yang dipilih.'}</p>
            </div>
          ))}
          <p className="text-xs font-semibold text-rose-800">Anjuran lain yang tercatat tidak membatalkan pantangan di atas.</p>
        </div>
      )}
      {activity.matched_recommended.length > 0 && (
        <div className="rounded-xl bg-teal-50 border border-teal-200/60 p-3 space-y-2">
          <h4 className="text-xs font-extrabold text-teal-800">Anjuran yang tercatat</h4>
          {activity.matched_recommended.map(reason => (
            <div key={reason.calendar_value_id ?? reason.name} className="text-xs text-slate-700 leading-relaxed">
              <p className="font-bold">{reason.name}</p>
              <p className="whitespace-pre-line break-words">{reason.description || 'Anjuran ini tercatat untuk kegiatan yang dipilih.'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
