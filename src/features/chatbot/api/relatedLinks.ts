export type RelatedLink = { label: string; choice: string; to: string };

// Bentuk tautan hanya dari kode kategori dan nama yang diterima dari data Keterangan.
export function relatedLinks(value: unknown): RelatedLink[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 5).flatMap(item => {
    if (!item || typeof item !== 'object' || typeof item.name !== 'string' || item.name.length > 100) return [];
    if (item.kind === 'warta' || item.kind === 'rubrik') {
      if (typeof item.resource_id !== 'string' || !/^[1-9][0-9]{0,15}$/.test(item.resource_id) || !Number.isSafeInteger(Number(item.resource_id))) return [];
      const label = item.name.trim();
      if (!label) return [];
      const prefix = item.kind === 'warta' ? 'warta' : 'rubrik-dewasa';
      return [{ label, choice: `Saya maksud ${label}.`, to: `/${prefix}/${item.resource_id}` }];
    }
    if (item.kind || typeof item.type_code !== 'string' || !/^[a-z0-9_]{1,60}$/.test(item.type_code)) return [];
    const category = item.type_code.replaceAll('_', ' ');
    const label = item.name.trim() ? `${item.name.trim()} · ${category}` : category;
    const choice = item.name.trim() ? `Saya maksud ${item.name.trim()} pada kategori ${category}.` : `Saya maksud kategori ${category}.`;
    const query = item.name.trim() ? `?q=${encodeURIComponent(item.name.trim())}` : '';
    return [{ label, choice, to: `/keterangan/${item.type_code}${query}` }];
  });
}
