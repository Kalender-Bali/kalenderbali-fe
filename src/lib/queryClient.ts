import { toApiError } from '@/lib/apiError';
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data kalender & ensiklopedia bersifat pasti, jadi kita beri staleTime yang aman
      staleTime: 1000 * 60 * 30, // 30 menit data dianggap fresh (tidak fetch ulang)
      gcTime: 1000 * 60 * 60 * 24, // 24 jam data disimpan di cache memori browser
      refetchOnWindowFocus: false, // Jangan fetch ulang saat pengguna bolak-balik tab browser
      retry: (failureCount, error: unknown) => {
        // Jangan coba ulang jika error dari klien (4xx seperti 400 Bad Request / Validasi)
        if ((toApiError(error).status ?? toApiError(error).response?.status ?? 0) >= 400 && (toApiError(error).status ?? toApiError(error).response?.status ?? 0) < 500) {
          return false;
        }
        return failureCount < 1;
      },
    },
  },
});
