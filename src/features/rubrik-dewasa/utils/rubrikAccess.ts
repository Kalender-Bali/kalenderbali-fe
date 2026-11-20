export function canAuthorRubrik(role?: string) {
  return ['contributor', 'admin'].includes(role?.toLowerCase() ?? '');
}

// ID milik akun diperiksa sebelum membandingkan dengan ID numerik respons Rubrik.
export function canManageOwnedContent(user: { id: string | number; role: string } | null, owner: number) {
  return Boolean(user && (user.role.toLowerCase() === 'admin' || (
    Number.isSafeInteger(owner) && owner > 0 && String(owner) === String(user.id)
  )));
}
