type PendingExport = { id: string; clear: () => void };
const inMemory = new WeakMap<File, Map<string, PendingExport>>();

function createOperationId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function pendingCardExport(file: File, userId: string): Promise<PendingExport> {
  const operations = inMemory.get(file) ?? new Map<string, PendingExport>();
  const existing = operations.get(userId);
  if (existing) return existing;

  let id = createOperationId();
  let key: string | undefined;
  try {
    // Simpan ID operasi per akun dan PNG untuk retry. Data kartu tetap di browser.
    const hash = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
    const fingerprint = Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
    key = `pending-card-export:${userId}:${fingerprint}`;
    id = sessionStorage.getItem(key) ?? id;
    sessionStorage.setItem(key, id);
  } catch {
    // Penyimpanan yang tidak tersedia tetap mendukung retry selama file masih terbuka.
  }
  const operation = {
    id,
    clear() {
      operations.delete(userId);
      try {
        if (key && sessionStorage.getItem(key) === id) sessionStorage.removeItem(key);
      } catch { /* Penyimpanan opsional untuk retry. */ }
    },
  };
  operations.set(userId, operation);
  inMemory.set(file, operations);
  return operation;
}
