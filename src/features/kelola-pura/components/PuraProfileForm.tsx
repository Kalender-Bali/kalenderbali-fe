import { useState, type FormEvent } from 'react';
import { AppDialog } from '@/components/ui/AppDialog';
import { useKomunitasGeo } from '@/features/komunitas/hooks/useKomunitas';
import { savePuraProfile, type PuraProfilePayload, type PuraSubmission } from '../api/puraProfileApi';

// Pilihan siklus mengikuti data yang dipakai formulir Flutter.
const cycles = {
  wuku: ['Sinta', 'Landep', 'Ukir', 'Kulantir', 'Tolu', 'Gumbreg', 'Wariga', 'Warigadean', 'Julungwangi', 'Sungsang', 'Dungulan', 'Kuningan', 'Langkir', 'Medangsia', 'Pujut', 'Pahang', 'Klurut', 'Merakih', 'Tambir', 'Medangkungan', 'Matal', 'Uye', 'Menail', 'Prangbakat', 'Bala', 'Ugu', 'Wayang', 'Klawu', 'Dukut', 'Watugunung'],
  saptawara: ['Redite', 'Soma', 'Anggara', 'Buda', 'Wraspati', 'Sukra', 'Saniscara'],
  pancawara: ['Umanis', 'Paing', 'Pon', 'Wage', 'Kliwon'],
  sasih: [['kasa', 'Kasa'], ['karo', 'Karo'], ['ketiga', 'Katiga'], ['kapat', 'Kapat'], ['kelima', 'Kalima'], ['kenam', 'Kaenam'], ['kepitu', 'Kapitu'], ['kawulu', 'Kawalu'], ['kesanga', 'Kasanga'], ['kedasa', 'Kadasa'], ['jiyestha', 'Jyestha'], ['sadha', 'Sadha']],
};

export function PuraProfileForm({ onClose, onSaved, profile }: { onClose: () => void; onSaved: () => void; profile?: PuraSubmission }) {
  const [country, setCountry] = useState(String(profile?.country_id ?? ''));
  const [province, setProvince] = useState(String(profile?.province_id ?? ''));
  const [city, setCity] = useState(String(profile?.city_id ?? ''));
  const [benchmark, setBenchmark] = useState(profile?.benchmark ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const countries = useKomunitasGeo('countries');
  const provinces = useKomunitasGeo('provinces', Number(country) || undefined);
  const cities = useKomunitasGeo('cities', Number(province) || undefined);
  const missingCity = Boolean(city && cities.isSuccess && !cities.data?.some(item => String(item.id) === city));
  // Jangan hilangkan kota lama hanya karena pilihan wilayah belum selesai dimuat.
  const geoUnavailable = countries.isLoading || countries.isError || (!!country && (provinces.isLoading || provinces.isError)) || (!!province && (cities.isLoading || cities.isError)) || (!!city && !cities.data?.some(item => String(item.id) === city));
  const input = 'mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-900';
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || geoUnavailable) return;
    const fields = new FormData(event.currentTarget);
    const text = (key: string) => String(fields.get(key) ?? '').trim();
    const payload: PuraProfilePayload = { name: text('name'), type: text('type'), country_id: Number(country), province_id: Number(province) || undefined, city_id: Number(city) || undefined, address: text('address'), phone: text('phone'), location_url: text('location_url'), benchmark, wuku: text('wuku'), saptawara: text('saptawara'), pancawara: text('pancawara'), sasih: text('sasih'), purnama_tilem: text('purnama_tilem'), latitude: profile?.latitude, longitude: profile?.longitude };
    if (!payload.name || !payload.type || !payload.country_id) { setError('Lengkapi nama, jenis, dan negara.'); return; }
    setBusy(true); setError('');
    try { await savePuraProfile(payload, profile?.id); onSaved(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Pendaftaran gagal.'); }
    finally { setBusy(false); }
  }
  return <AppDialog title={profile ? 'Edit Pengajuan Pura' : 'Daftarkan Pura'} description="Isi informasi Pura untuk diajukan kepada Admin." onClose={() => { if (!busy) onClose(); }}>
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm font-semibold">Nama Pura<input name="name" defaultValue={profile?.name} required className={input} /></label>
      <label className="block text-sm font-semibold">Jenis Pura<select name="type" defaultValue={profile?.type} required className={input}><option value="">Pilih jenis</option>{['Kahyangan Tiga', 'Kahyangan Jagat', 'Swagina', 'Kawitan'].map(type => <option key={type}>{type}</option>)}</select></label>
      <label className="block text-sm font-semibold">Negara<select value={country} required className={input} onChange={e => { setCountry(e.target.value); setProvince(''); setCity(''); }}><option value="">Pilih negara</option>{countries.data?.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
      <label className="block text-sm font-semibold">Provinsi<select value={province} className={input} onChange={e => { setProvince(e.target.value); setCity(''); }}><option value="">Pilih provinsi</option>{provinces.data?.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
      <label className="block text-sm font-semibold">Kota / Kabupaten<select name="city" value={city} onChange={e => setCity(e.target.value)} className={input}><option value="">Pilih kota</option>{missingCity && <option value={city} disabled>Kota sebelumnya tidak tersedia</option>}{cities.data?.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
      {(countries.isError || provinces.isError || cities.isError) && <p role="alert" className="text-sm text-rose-700">Daftar wilayah belum dapat dimuat. <button type="button" className="underline" onClick={() => { if (countries.isError) void countries.refetch(); if (provinces.isError) void provinces.refetch(); if (cities.isError) void cities.refetch(); }}>Coba lagi</button></p>}
      <label className="block text-sm font-semibold">Alamat<textarea name="address" defaultValue={profile?.address} className={input} /></label>
      <label className="block text-sm font-semibold">Telepon<input name="phone" defaultValue={profile?.phone} type="tel" className={input} /></label>
      <label className="block text-sm font-semibold">URL Peta<input name="location_url" defaultValue={profile?.location_url} type="url" className={input} /></label>
      <label className="block text-sm font-semibold">Acuan Odalan<select value={benchmark} onChange={e => setBenchmark(e.target.value)} className={input}><option value="">Belum ditentukan</option><option>Pawukon</option><option>Sasih</option></select></label>
      {benchmark === 'Pawukon' && (['wuku', 'saptawara', 'pancawara'] as const).map(key => <label key={key} className="block text-sm font-semibold capitalize">{key}<select name={key} defaultValue={profile?.[key] ?? ''} required className={input}><option value="">Pilih {key}</option>{cycles[key].map(value => <option key={value}>{value}</option>)}</select></label>)}
      {benchmark === 'Sasih' && <><label className="block text-sm font-semibold">Sasih<select name="sasih" defaultValue={profile?.sasih?.toLowerCase() ?? ''} required className={input}><option value="">Pilih sasih</option>{cycles.sasih.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label className="block text-sm font-semibold">Purnama / Tilem<select name="purnama_tilem" defaultValue={profile?.purnama_tilem?.toLowerCase() ?? ''} required className={input}><option value="">Pilih</option><option value="purnama">Purnama</option><option value="tilem">Tilem</option></select></label></>}
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      <button disabled={busy || geoUnavailable} className="min-h-11 rounded-xl bg-teal-700 px-4 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Menyimpan…' : profile ? 'Simpan Perubahan' : 'Daftarkan Pura'}</button>
    </form>
  </AppDialog>;
}
