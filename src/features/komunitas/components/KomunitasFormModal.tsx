import { useState } from 'react';
import type { FormEvent } from 'react';
import type { KomunitasDetail, KomunitasPayload } from '../types/komunitas.types';
import { COMMUNITY_TYPE } from '../types/komunitas.types';
import { useKomunitasGeo } from '../hooks/useKomunitas';
import { safeHttpUrl } from '../utils/komunitasUtils';
import { KomunitasModal } from './KomunitasModal';
import { QueryErrorState } from '@/components/ui/QueryErrorState';
import { inputStyle, primaryButton, secondaryButton } from './komunitasStyles';

/** Form dipasang ulang berdasarkan ID sehingga draft profil lain tidak terbawa. */
export function KomunitasFormModal({ profile, admin, busy, onClose, onSave }: {
  profile?: KomunitasDetail; admin: boolean; busy: boolean; onClose: () => void; onSave: (payload: KomunitasPayload) => Promise<void>;
}) {
  const [form, setForm] = useState({ name: profile?.name || '', phone: profile?.phone || '', address: profile?.address || '',
    country: String(profile?.country_id || ''), province: String(profile?.province_id || ''), city: String(profile?.city_id || ''),
    map: profile?.location_url || '', latitude: profile?.latitude?.toString() ?? '', longitude: profile?.longitude?.toString() ?? '' });
  const [error, setError] = useState('');
  const countries = useKomunitasGeo('countries'), provinces = useKomunitasGeo('provinces', Number(form.country) || undefined), cities = useKomunitasGeo('cities', Number(form.province) || undefined);
  const selectedCountry = countries.data?.find(country => country.id === Number(form.country));
  const indonesia = selectedCountry?.name.trim().toLowerCase() === 'indonesia' || ['ID', 'IDN'].includes(selectedCountry?.code.toUpperCase() || '');
  const update = (key: keyof typeof form, value: string) => setForm(previous => ({ ...previous, [key]: value }));
  const geoError = countries.isError || (!!form.country && provinces.isError) || (!!form.province && cities.isError);
  const geoLoading = countries.isLoading || (!!form.country && provinces.isLoading) || (!!form.province && cities.isLoading);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError('');
    if (!selectedCountry || !safeHttpUrl(form.map)) { setError('Pilih negara dan masukkan tautan peta HTTP/HTTPS yang valid.'); return; }
    if (indonesia && (!form.province || !form.city)) { setError('Provinsi dan kota/kabupaten wajib untuk Indonesia.'); return; }
    // BE saat ini tidak menghapus koordinat lama melalui null; cegah sukses semu pada pengosongan.
    if ((profile?.latitude != null && !form.latitude.trim()) || (profile?.longitude != null && !form.longitude.trim())) { setError('Koordinat yang sudah tersimpan dapat diperbarui, tetapi belum dapat dikosongkan.'); return; }
    const latitude = form.latitude.trim() ? Number(form.latitude) : undefined, longitude = form.longitude.trim() ? Number(form.longitude) : undefined;
    if ((latitude != null && (!Number.isFinite(latitude) || Math.abs(latitude) > 90)) || (longitude != null && (!Number.isFinite(longitude) || Math.abs(longitude) > 180))) { setError('Latitude harus −90 sampai 90; longitude −180 sampai 180.'); return; }
    try { await onSave({ name: form.name, type: COMMUNITY_TYPE, phone: form.phone, address: form.address, country_id: Number(form.country), province_id: Number(form.province) || undefined, city_id: Number(form.city) || undefined, location_url: form.map, latitude, longitude }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Profil belum berhasil disimpan.'); }
  };
  return <KomunitasModal title={profile ? 'Edit Profil Komunitas' : 'Daftarkan Komunitas'} description="Lengkapi profil Suka Duka atau paguyuban Anda." onClose={onClose} busy={busy}>
    <p className="rounded-xl bg-[#e6f7f5] p-3 text-sm text-teal-800">{profile ? 'Perbarui informasi agar komunitas mudah ditemukan.' : admin ? 'Komunitas yang Anda daftarkan akan langsung terbit.' : 'Pengajuan akan ditinjau Admin. Anda otomatis menjadi pengelola.'}</p>
    {[countries, ...(form.country ? [provinces] : []), ...(form.province ? [cities] : [])].map((query, index) => query.isError && <QueryErrorState key={index} title="Pilihan wilayah belum dapat dimuat" error={query.error} onRetry={() => void query.refetch()} />)}
    <form onSubmit={submit} className="space-y-4"><fieldset disabled={busy} className="space-y-4">
      <label className="block"><span className="mb-1 block text-xs font-bold text-slate-500">Nama Komunitas *</span><input required maxLength={200} value={form.name} onChange={event => update('name', event.target.value)} className={inputStyle} autoComplete="organization" /></label>
      <label className="block"><span className="mb-1 block text-xs font-bold text-slate-500">Telepon *</span><input required type="tel" maxLength={50} value={form.phone} onChange={event => update('phone', event.target.value)} className={`${inputStyle} tabular-nums`} autoComplete="tel" /></label>
      <label className="block"><span className="mb-1 block text-xs font-bold text-slate-500">Alamat *</span><textarea required rows={2} maxLength={1000} value={form.address} onChange={event => update('address', event.target.value)} className={inputStyle} autoComplete="street-address" /></label>
      {/* Negara/provinsi/kota memakai ID master geo, bukan nama katalog filter direktori. */}
      <div className="grid gap-3 sm:grid-cols-3">
        <label><span className="mb-1 block text-xs font-bold text-slate-500">Negara *</span><select required value={form.country} disabled={countries.isLoading || countries.isError} onChange={event => setForm(previous => ({ ...previous, country: event.target.value, province: '', city: '' }))} className={inputStyle}><option value="">Pilih negara</option>{countries.data?.map(country => <option key={country.id} value={country.id}>{country.name}</option>)}</select></label>
        <label><span className="mb-1 block text-xs font-bold text-slate-500">Provinsi {indonesia && '*'}</span><select required={indonesia} value={form.province} disabled={!form.country || provinces.isLoading || provinces.isError} onChange={event => setForm(previous => ({ ...previous, province: event.target.value, city: '' }))} className={inputStyle}><option value="">Pilih provinsi</option>{provinces.data?.map(province => <option key={province.id} value={province.id}>{province.name}</option>)}</select></label>
        <label><span className="mb-1 block text-xs font-bold text-slate-500">Kota / Kabupaten {indonesia && '*'}</span><select required={indonesia} value={form.city} disabled={!form.province || cities.isLoading || cities.isError} onChange={event => update('city', event.target.value)} className={inputStyle}><option value="">Pilih kota</option>{cities.data?.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}</select></label>
      </div>
      <label className="block"><span className="mb-1 block text-xs font-bold text-slate-500">URL Google Maps *</span><input required type="url" value={form.map} onChange={event => update('map', event.target.value)} placeholder="https://maps.google.com/…" className={inputStyle} /></label>
      <div className="grid gap-3 sm:grid-cols-2">{(['latitude', 'longitude'] as const).map(key => <label key={key}><span className="mb-1 block text-xs font-bold capitalize text-slate-500">{key} (opsional)</span><input type="number" step="any" min={key === 'latitude' ? -90 : -180} max={key === 'latitude' ? 90 : 180} value={form[key]} onChange={event => update(key, event.target.value)} className={`${inputStyle} tabular-nums`} /></label>)}</div>
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={onClose} className={secondaryButton}>Batal</button><button type="submit" disabled={busy || geoError || geoLoading} className={primaryButton}>{busy ? 'Menyimpan…' : profile ? 'Simpan Perubahan' : 'Daftarkan Komunitas'}</button></div>
    </fieldset></form>
  </KomunitasModal>;
}
