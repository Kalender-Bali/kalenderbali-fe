import { Sparkles } from 'lucide-react';
import { useAlertStore } from '@/stores/useAlertStore';
import type { FinanceSubmission } from '../types/kelolaPura.types';
import { formatDateWITA, formatRupiah } from '../utils/kelolaPuraUtils';

interface FinanceSubmissionsDrawerProps {
  submissions: FinanceSubmission[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onClose: () => void;
}

export function FinanceSubmissionsDrawer({
  submissions,
  onApprove,
  onReject,
  onClose,
}: FinanceSubmissionsDrawerProps) {
  const { showAlert } = useAlertStore();

  return (
    <section
      aria-label="Tinjauan Usulan Catatan Kas Member"
      className="bg-amber-50/60 rounded-2xl border border-amber-200/80 p-5 shadow-xs space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-600" aria-hidden="true" />
          <h2 className="text-sm font-bold text-amber-950">
            Usulan Catatan Kas dari Member Komunitas ({submissions.length})
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold text-amber-800 hover:text-amber-950"
        >
          Tutup Panel
        </button>
      </div>

      {submissions.length === 0 ? (
        <p className="text-xs text-amber-800/80 font-medium">
          Belum ada usulan catatan kas yang diajukan oleh member untuk pura ini.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className="bg-white rounded-xl border border-amber-200 p-4 space-y-2 shadow-2xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                    sub.entry_type === 'debit'
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'bg-rose-50 text-rose-800'
                  }`}
                >
                  {sub.entry_type === 'debit' ? 'Usulan Kas Masuk' : 'Usulan Kas Keluar'}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    sub.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : sub.status === 'rejected'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {sub.status.toUpperCase()}
                </span>
              </div>

              <div className="text-xs space-y-0.5">
                <p className="font-extrabold text-slate-900 tabular-nums">
                  {formatRupiah(sub.amount)} · {sub.category_name}
                </p>
                <p className="text-slate-600 italic">&ldquo;{sub.note}&rdquo;</p>
                <p className="text-[11px] text-slate-400">
                  Diajukan oleh: <span className="font-semibold">{sub.user_name}</span> (
                  {sub.user_email}) · {formatDateWITA(sub.transaction_date)}
                </p>
              </div>

              {sub.status === 'pending' && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onReject(sub.id)}
                    className="min-h-[32px] px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer"
                  >
                    Tolak
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onApprove(sub.id);
                      showAlert('Usulan kas disetujui!');
                    }}
                    className="min-h-[32px] px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs transition-all cursor-pointer"
                  >
                    Setujui Usulan
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
