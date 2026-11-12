import { READ_RETRY_DELAY, shouldRetryRead } from './readRetry';
import { QueryClient } from '@tanstack/react-query';
import { authQueryScope, useAuthStore } from '@/stores/useAuthStore';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data kalender & ensiklopedia bersifat pasti, jadi kita beri staleTime yang aman
      staleTime: 1000 * 60 * 30, // 30 menit data dianggap fresh (tidak fetch ulang)
      gcTime: 1000 * 60 * 60 * 24, // 24 jam data disimpan di cache memori browser
      refetchOnWindowFocus: false, // Jangan fetch ulang saat pengguna bolak-balik tab browser
      retry: shouldRetryRead,
      retryDelay: READ_RETRY_DELAY,
      networkMode: 'always',
    },
  },
});

// Destroy old private queries (including in-flight requests) on account/role
// changes. Public calendar/reference caches keep their existing lifetime.
useAuthStore.subscribe((current, previous) => {
  if (authQueryScope(current) !== authQueryScope(previous)) {
    queryClient.removeQueries({ predicate: (query) => query.meta?.authScoped === true });
  }
  schedulePremiumExpiry();
});

let premiumExpiryTimer: ReturnType<typeof setTimeout> | undefined;

// An open tab must stop showing cached premium results at the same expiry as
// the backend, even when the user keeps the same access token and account.
function schedulePremiumExpiry() {
  if (premiumExpiryTimer !== undefined) clearTimeout(premiumExpiryTimer);
  premiumExpiryTimer = undefined;
  const state = useAuthStore.getState();
  if (!state.isAuthenticated || !state.user?.isPremium) return;

  const remaining = Date.parse(state.user.premiumExpiresAt || '') - Date.now();
  if (!Number.isFinite(remaining) || remaining <= 0) {
    const isAdmin = state.user.role.trim().toLowerCase() === 'admin';
    state.updateUser({ isPremium: false, tier: isAdmin ? 'Admin' : 'Free' });
    return;
  }
  // Browsers cap setTimeout at a signed 32-bit delay; recheck long plans later.
  premiumExpiryTimer = setTimeout(schedulePremiumExpiry, Math.min(remaining, 2_147_483_647));
}

schedulePremiumExpiry();
