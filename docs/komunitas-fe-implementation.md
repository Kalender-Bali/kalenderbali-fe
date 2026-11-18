# Laporan Implementasi FE Komunitas

Tanggal: 18 November 2026. Acuan: [blueprint komunitas](../../komunitas.md) dan [audit Tahap 1](komunitas-fe-contract.md).

Kode FE inti telah diimplementasikan. Verifikasi otomatis, HTTP nyata terhadap backend/database aktif, serta alur Member di browser telah dilakukan. [Laporan audit live](komunitas-live-audit.md) memuat hasil 14 pemeriksaan baca dan 21 pemeriksaan workflow CRUD beserta pembersihan data dummy. Backend aplikasi dan tutup buku gabungan tidak diubah; helper akun sementara ditambahkan khusus audit atas izin pengguna.

## Laporan per tahap

Semua path berikut relatif terhadap `frontend-reactjs/`. Path komponen tanpa prefix lengkap pada satu sel tetap berada dalam direktori yang sama dengan komponen pertama.

| Tahap | Pekerjaan dan hasil | Lokasi |
| --- | --- | --- |
| 1 | Memeriksa kontrak HTTP, bentuk summary/detail, mapping pengelola, API kas, pagination, dan pola cache. Memperbaiki asumsi field dalam blueprint. | `docs/komunitas-fe-contract.md`, `../komunitas.md` |
| 2 | Menambahkan tipe summary, detail, pengelola, wilayah, payload, pagination, dan alias keuangan. Tipe summary bersama diperbaiki agar tidak mewajibkan entries yang tidak dikirim HTTP. | `src/features/komunitas/types/komunitas.types.ts`, `src/features/kelola-pura/types/kelolaPura.types.ts` |
| 3 | Menambahkan API tiga tab, wilayah, detail, tambah/edit/hapus, moderasi, pengelola, kandidat dari katalog Admin, dan master geo. Memvalidasi respons dan whitelist payload. Menggunakan ulang enam fungsi kas tanpa request duplikat. | `src/features/komunitas/api/komunitasApi.ts` |
| 4 | Menambahkan infinite query cursor, query detail/wilayah/geo/kas, mutation tanpa retry otomatis, dan URL state. Cache dibatasi sesi; respons mutation sesi lama ditolak; invalidasi kas diarahkan ke ID pemilik. | `src/features/komunitas/hooks/useKomunitas.ts`, `src/features/komunitas/utils/komunitasUtils.ts` |
| 5 | Menambahkan header mint, tombol daftar, metrik komunitas dimuat/negara jangkauan, tab, pencarian debounce 300 ms, filter wilayah, dan reset. Input mempertahankan fokus saat URL berubah. | `src/features/komunitas/components/KomunitasHero.tsx`, `KomunitasFilter.tsx`, `komunitasStyles.ts` |
| 6 | Menambahkan kartu/grid responsif, status pengajuan, lokasi, pintasan profil/kas, Muat Lebih Banyak, skeleton, dan empty state. Telepon dimuat pada detail, tanpa request detail per kartu. | `src/features/komunitas/components/KomunitasCard.tsx`, `KomunitasList.tsx` |
| 7 | Menambahkan detail informasi/kas, kontak, peta HTTP(S), koordinat, pengelola, ringkasan cepat, dan pintasan kas penuh. Kerangka modal menyediakan portal, scroll lock, fokus awal/pemulihan, trap Tab, dan Escape. | `src/features/komunitas/components/KomunitasDetailModal.tsx`, `KomunitasModal.tsx` |
| 8 | Menambahkan form create/edit dengan master geo, validasi field wajib, URL, dan koordinat. Tipe selalu Suka Duka, tanpa odalan. Member diberi informasi Review dan mapping otomatis; Admin langsung terbit. | `src/features/komunitas/components/KomunitasFormModal.tsx` |
| 9 | Menambahkan Setujui/Tolak, pencarian/pemilihan kandidat pengelola, tambah/cabut mapping, dan konfirmasi hapus profil dengan penjelasan dampak pada riwayat kas. Aksi administratif hanya untuk Admin. | `src/features/komunitas/components/KomunitasManagersModal.tsx`, `KomunitasDeleteConfirmModal.tsx`, `KomunitasDetailModal.tsx`, `src/features/komunitas/pages/KomunitasPage.tsx` |
| 10 | Menambahkan buku kas penuh dengan identitas komunitas, metrik Rupiah, filter tahun/kategori/jenis, tabel, dan loading/error/kosong. Default tahun mengikuti WITA; filter jenis hanya memengaruhi tabel. | `src/features/komunitas/components/KomunitasKeuanganView.tsx` |
| 11 | Menambahkan form tambah/edit dan konfirmasi hapus transaksi, nominal Rupiah bulat positif, tanggal, kategori, catatan, dan pembaruan transaksi/ringkasan setelah sukses. Hak tulis mengikuti Admin/mapping; tidak memakai usulan localStorage. | `src/features/komunitas/components/KomunitasFinanceModal.tsx`, `KomunitasDeleteConfirmModal.tsx`, `src/features/komunitas/hooks/useKomunitas.ts` |
| 12 | Mengecualikan Suka Duka sebelum daftar Kelola Pura/Piodalan masuk cache bersama, menolak URL detail komunitas pada kedua modul, menghapus opsi Suka Duka dari jenis pura, serta menyelaraskan tombol/modal kas pura dengan mapping. Memvalidasi pemilik transaksi pada API kas bersama. | `src/lib/puraScope.ts`; `src/features/kelola-pura/api/kelolaPuraApi.ts`, `hooks/useKelolaPura.ts`, `types/kelolaPura.types.ts`, `utils/kelolaPuraUtils.ts`, `components/PuraKeuanganView.tsx`; `src/features/piodalan/api/piodalanApi.ts` |
| 13 | Merangkai halaman dan URL state; memasang route publik lazy `/komunitas`, alias `/layanan/komunitas`, skeleton route, dan sidebar Users. Daftar tamu menuju login dan kembali ke form. Pergantian akun membuang draft lama. | `src/features/komunitas/pages/KomunitasPage.tsx`, `src/features/komunitas/components/KomunitasSkeleton.tsx`, `src/routes/AppRoutes.tsx`, `src/components/layout/Sidebar.tsx` |
| 14 | Menambahkan tes kontrak/SSR dan memeriksa build/lint/regresi. Audit lanjutan memakai HTTP serta database nyata untuk CRUD, moderasi, mapping, dan isolasi kas; browser menjalankan pendaftaran/edit profil dan tambah/edit kas sampai refresh. | `tests/komunitas.test.mjs`, `tests/komunitasViews.test.mjs`, `tools/komunitas-live-audit.mjs`, `docs/komunitas-live-audit.md` |

Setiap berkas baru menyertakan komentar pada blok utama. Komentar khusus menjelaskan alasan scope, hak pengelola, validasi payload, sesi, dan invalidasi cache.

## Verifikasi

- `npm run test:komunitas`: **29/29 lulus**, mencakup kontrak/aturan/SSR serta penolakan respons simpan kas yang rusak. Adapter jaringan dan pengganti portal hanya ada dalam proses tes; aplikasi tidak memiliki sumber data dummy atau fallback profil/kas palsu.
- `npm run lint`: **lulus**, pemeriksaan ESLint proyek.
- `npm run build`: **lulus**, TypeScript dan bundling Vite. Route Komunitas menjadi chunk lazy terpisah; Vite tetap memperingatkan chunk utama aplikasi yang melebihi 500 kB.
- `node --test --test-force-exit --test-concurrency=1 tests/*.test.mjs`: **161 lulus dari 163**, dengan dua kegagalan Dashboard yang sudah ada sebelum pekerjaan Komunitas. Keduanya direproduksi pada salinan sementara dengan seluruh perubahan kode bersama Kelola Pura/Piodalan dari tugas ini dikembalikan, tanpa mengubah workspace pengguna.
- Browser Brave desktop: route, sidebar, skeleton, error ketika API tidak tersedia, tab privat yang meminta login, dan tombol daftar menuju login diperiksa langsung.
- Pemeriksaan visual awal viewport 390 piksel: header, banner, metrik, toolbar menumpuk, tab yang dapat digeser, dan filter satu kolom diperiksa tanpa menulis data. Audit live lanjutan kemudian memakai data dummy khusus yang sudah dibersihkan.
- Audit lanjutan backend aktif: **14/14 pemeriksaan baca dan 21/21 workflow CRUD lulus**. Data dummy hanya dibuat khusus audit, lalu seluruhnya dibersihkan. Browser membuktikan penyimpanan dan edit transaksi tetap benar setelah refresh.

## Batasan dan pekerjaan penerimaan live

1. Pada verifikasi awal backend belum aktif; batasan itu sudah diselesaikan melalui audit live lanjutan. Pendaftaran, moderasi, mapping, dan CRUD kas telah diuji terhadap backend/database aktif.
2. Browser menjalankan alur Member dengan data uji nyata, termasuk form, tabel, dan persistensi setelah refresh. Jalur Admin dan pencabutan hak diuji melalui HTTP nyata; tidak seluruh kombinasi tombol Admin dijalankan manual di browser. Gunakan origin `http://localhost:3000` sesuai CORS backend.
3. BE tidak mengosongkan koordinat lama melalui null. Form edit menolak pengosongan koordinat tersimpan dan memberi pesan; pembaruan koordinat tetap tersedia. Nama/telepon/alamat/URL wajib sehingga tidak dikosongkan melalui form.
4. Statistik komunitas adalah jumlah yang sudah dimuat, bukan total global. Negara jangkauan berasal dari katalog wilayah tab aktif. Tidak menambah endpoint statistik.
5. Pengelola tetap relasi per profil. Premium/Contributor bukan syarat. Akun Guest terdaftar tidak boleh mendaftar komunitas, tetapi tab Saya mengikuti mapping pengguna login.
6. Kas pura dan komunitas tetap terpisah per ID. Laporan gabungan, snapshot, hubungan cakupan pura–komunitas, dan penguncian periode belum diimplementasikan sesuai urutan kerja yang disepakati.

## Dua kegagalan regresi yang sudah ada

- `tests/featuresIntegration.test.mjs`: DashboardDewasaAyu menggunakan fixture tanpa tanggal yang sekarang dibutuhkan, sehingga membaca `undefined.split`.
- `tests/localAudit.test.mjs`: fixture ringkasan Dashboard mengharapkan headline `Ringkasan API riil`, sedangkan kode Dashboard yang sudah berubah menghitung ringkasan dari field lain. Fixture belum mengikuti kontrak Dashboard saat ini.

Tes atau kode Dashboard tersebut tidak diubah untuk menyembunyikan kegagalan di luar cakupan Komunitas.
