type SubscriptionStatus = {
  isPremium?: boolean;
  premiumExpiresAt?: string | null;
};

// Role and display tier are not evidence of an active paid subscription.
export function hasActivePremium(user?: SubscriptionStatus | null, now = Date.now()): boolean {
  if (!user?.isPremium || !user.premiumExpiresAt) return false;
  const expiresAt = Date.parse(user.premiumExpiresAt);
  return Number.isFinite(expiresAt) && expiresAt > now;
}
