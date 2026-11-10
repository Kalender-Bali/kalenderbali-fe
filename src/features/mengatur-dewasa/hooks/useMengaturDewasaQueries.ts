import { useCallback, useEffect, useRef } from 'react';
import { useMutation, useQueries, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  fetchDewasaActivities,
  fetchDewasaActivity,
  fetchDewasaCriteriaFields,
  fetchDewasaCriteriaValues,
  searchMengaturDewasa,
} from '../api/mengaturDewasaApi';
import type { MengaturDewasaSearchRequest } from '../types/mengaturDewasa.types';

// Katalog disimpan sementara di memori; no-store backend tidak diasumsikan immutable.
const catalogStaleTime = 5 * 60 * 1000;

export function useDewasaActivities() {
  return useQuery({
    queryKey: ['mengatur-dewasa', 'activities'],
    queryFn: ({ signal }) => fetchDewasaActivities(signal),
    staleTime: catalogStaleTime,
    // Jika offline tanpa cache, tampilkan error alih-alih loading yang tertunda.
    networkMode: 'always',
  });
}

export function useDewasaActivity(id: string | null) {
  return useQuery({
    queryKey: ['mengatur-dewasa', 'activities', id],
    queryFn: ({ signal }) => {
      if (!id) throw new Error('Pilih template kegiatan terlebih dahulu.');
      return fetchDewasaActivity(id, signal);
    },
    enabled: Boolean(id),
    staleTime: catalogStaleTime,
    networkMode: 'always',
  });
}

export function useDewasaCriteriaFields(enabled = true) {
  return useQuery({
    queryKey: ['mengatur-dewasa', 'criteria-fields'],
    queryFn: ({ signal }) => fetchDewasaCriteriaFields(signal),
    staleTime: catalogStaleTime,
    enabled,
    networkMode: 'always',
  });
}

// Gabungkan permintaan nilai yang field-nya sama agar setiap kategori dimuat sekali.
export function useDewasaCriteriaOptions(fields: string[]) {
  return useQueries({
    queries: fields.map((field) => ({
      queryKey: ['mengatur-dewasa', 'criteria-fields', field, 'values'],
      queryFn: ({ signal }: { signal: AbortSignal }) => fetchDewasaCriteriaValues(field, signal),
      staleTime: catalogStaleTime,
      networkMode: 'always',
    })),
  });
}

export function useDewasaCriteriaValues(field: string | null) {
  return useQuery({
    queryKey: ['mengatur-dewasa', 'criteria-fields', field, 'values'],
    queryFn: ({ signal }) => {
      if (!field) throw new Error('Pilih field kriteria terlebih dahulu.');
      return fetchDewasaCriteriaValues(field, signal);
    },
    enabled: Boolean(field),
    staleTime: catalogStaleTime,
    networkMode: 'always',
  });
}

// Hasil POST hidup pada observer mutation, bukan query cache yang persisten.
// Perubahan sesi membatalkan request dan menghapus hasil agar tidak bocor antar pengguna.
export function useMengaturDewasaSearch() {
  const controllerRef = useRef<AbortController | null>(null);
  const mutation = useMutation({
    mutationKey: ['mengatur-dewasa', 'search'],
    gcTime: 0,
    retry: false,
    // Jangan antrekan input pribadi saat offline untuk dijalankan pada sesi lain.
    networkMode: 'always',
    mutationFn: async (request: MengaturDewasaSearchRequest) => {
      const session = useAuthStore.getState();
      if (!session.isAuthenticated || !session.user || !session.token) {
        throw new Error('Masuk terlebih dahulu untuk mencari tanggal.');
      }
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      try {
        const result = await searchMengaturDewasa(request, controller.signal);
        const current = useAuthStore.getState();
        if (
          controller.signal.aborted ||
          !current.isAuthenticated ||
          current.user?.id !== session.user.id ||
          current.token !== session.token
        ) {
          throw new Error('Sesi berubah. Silakan ulangi pencarian.');
        }
        return result;
      } finally {
        if (controllerRef.current === controller) controllerRef.current = null;
      }
    },
  });

  const { reset } = mutation;
  useEffect(() => {
    const unsubscribe = useAuthStore.subscribe((current, previous) => {
      if (
        current.user?.id !== previous.user?.id ||
        current.token !== previous.token ||
        current.isAuthenticated !== previous.isAuthenticated
      ) {
        controllerRef.current?.abort();
        reset();
      }
    });
    return () => {
      unsubscribe();
      controllerRef.current?.abort();
      reset();
    };
  }, [reset]);

  // Saat form berubah, batalkan hasil lama agar tidak dianggap milik input baru.
  const cancelSearch = useCallback(() => {
    controllerRef.current?.abort();
    reset();
  }, [reset]);

  return { ...mutation, cancelSearch };
}
