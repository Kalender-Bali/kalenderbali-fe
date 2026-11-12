/** Respons sukses tetap wajib mengikuti kontrak; bentuk yang rusak bukan hasil kosong. */
export function apiArray<T>(value: unknown): T[] {
  if (!Array.isArray(value)) throw new Error('Respons daftar dari server tidak valid. Silakan coba lagi.');
  return value as T[];
}

export function apiObject<T>(value: unknown): T {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Respons data dari server tidak valid. Silakan coba lagi.');
  }
  return value as T;
}
