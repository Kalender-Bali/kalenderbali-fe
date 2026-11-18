import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { QueryErrorState } from '@/components/ui/QueryErrorState';
import { formatFullIndoDate, getTodayWITA } from '@/features/kalender/utils/calendarUtils';
import { PremiumUpgradeModal } from '@/features/kelola-pura/components/PremiumUpgradeModal';
import { toApiError } from '@/lib/apiError';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePengingat, usePengingatMutations, usePengingatPolicy } from '../hooks/usePengingat';
import type { PengingatCandidate } from '../types/pengingat.types';
import { PengingatAddDialog } from './PengingatAddDialog';
import { PengingatModal } from './PengingatModal';

interface Props {
  candidate: PengingatCandidate;
  onClose: () => void;
}

export function PengingatDewasaResultDialog({ candidate, onClose }: Props) {
  const authenticated = useAuthStore(state => state.isAuthenticated && Boolean(state.user && state.token));
  const location = useLocation();
  const reminders = usePengingat();
  const policyQuery = usePengingatPolicy();
  const { create } = usePengingatMutations();
  const [savedName, setSavedName] = useState('');
  const [limitReached, setLimitReached] = useState(false);
  const today = getTodayWITA();
  const date = candidate.nextDate;
  const formattedDate = formatFullIndoDate(date);
  const policy = policyQuery.data;

  function info(title: string, children: ReactNode) {
    return (
      <PengingatModal
        title={title}
        description={`Mengatur Dewasa · ${formattedDate}`}
        onClose={onClose}
        footer={<button type="button" onClick={onClose} className="h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold cursor-pointer">Tutup</button>}
      >
        {children}
      </PengingatModal>
    );
  }

  if (!authenticated) {
    return info('Masuk untuk menambahkan pengingat', (
      <Link to="/login" state={{ from: location }} onClick={onClose} className="min-h-11 px-5 rounded-xl bg-[#0e9f90] text-white text-sm font-bold inline-flex items-center">Masuk ke akun</Link>
    ));
  }
  if (savedName) {
    return info('Pengingat berhasil ditambahkan', (
      <div className="space-y-3">
        <p role="status" className="text-sm text-slate-600 dark:text-slate-300">{savedName} sudah tersimpan di Pengingat Dewasa.</p>
        <Link to="/pengingat" onClick={onClose} className="min-h-11 inline-flex items-center text-sm font-bold text-teal-700 dark:text-teal-300">Lihat pengingat</Link>
      </div>
    ));
  }
  if (date < today) {
    return info('Tanggal sudah terlewat', <p className="text-sm text-slate-600 dark:text-slate-300">Pilih tanggal mulai hari ini yang memenuhi kriteria kegiatanmu.</p>);
  }
  if (reminders.isError || policyQuery.isError) {
    return info('Pengingat belum dapat diperiksa', (
      <QueryErrorState
        title="Data pengingat belum dapat dimuat"
        error={reminders.isError ? reminders.error : policyQuery.error}
        onRetry={() => { void reminders.refetch(); void policyQuery.refetch(); }}
      />
    ));
  }
  if (!policy || !reminders.data) {
    return info('Menyiapkan pengingat', <p role="status" className="text-sm text-slate-500 dark:text-slate-400">Memeriksa paket dan pengingat yang tersimpan…</p>);
  }

  const count = reminders.data.filter(entry => entry.kind === 'mengatur-dewasa').length;
  if (limitReached || count >= policy.maxPerFeature) {
    if (policy.tier === 'Free') {
      return (
        <PremiumUpgradeModal
          isOpen
          onClose={onClose}
          title="Tambah Lebih Banyak Pengingat"
          description="Batas pengingat Mengatur Dewasa untuk akun Free sudah tercapai."
          benefits={['Hingga 10 pengingat per fitur dengan Premium']}
        />
      );
    }
    return info('Batas Pengingat Tercapai', (
      <p className="text-sm text-slate-600 dark:text-slate-300">Kamu sudah mencapai batas <span className="tabular-nums">{policy.maxPerFeature}</span> pengingat Mengatur Dewasa. Hapus salah satu pengingat untuk menambahkan yang baru.</p>
    ));
  }

  return (
    <PengingatAddDialog
      title="Tambah pengingat Mengatur Dewasa"
      description="Atur kapan kamu ingin diingatkan untuk tanggal yang sudah dipilih."
      nameLabel="Nama rencana kegiatan"
      namePlaceholder="Contoh: Mulai renovasi rumah"
      requireName
      candidate={candidate}
      policy={policy}
      today={today}
      onClose={onClose}
      onSave={async entry => {
        try {
          const saved = await create.mutateAsync(entry);
          setSavedName(saved.title);
        } catch (failure) {
          if (toApiError(failure).code === 'reminder_limit_reached') setLimitReached(true);
          throw failure;
        }
      }}
      beforeName={(
        <div className="rounded-xl bg-[#f8fafc] dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700 p-4 space-y-1.5">
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Tanggal kegiatan</p>
          <time dateTime={date} className="block text-sm font-bold text-teal-700 dark:text-teal-300 tabular-nums">{formattedDate}</time>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{candidate.title}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{candidate.description}</p>
        </div>
      )}
    >
      {null}
    </PengingatAddDialog>
  );
}
