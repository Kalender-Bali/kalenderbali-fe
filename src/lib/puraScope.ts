/** Pemisahan direktori mengikuti tipe profil, bukan alamat maupun identitas pengelola. */
export function isCommunityType(type: string): boolean { return type.trim().toLowerCase() === 'suka duka'; }
export function onlyPuras<T extends { type: string }>(items: T[]): T[] { return items.filter(item => !isCommunityType(item.type || '')); }
