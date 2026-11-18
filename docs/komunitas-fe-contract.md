# Audit Tahap 1 FE Komunitas

Tanggal: 18 November 2026. Status: audit kode sumber selesai; integrasi HTTP langsung dan implementasi fitur belum dilakukan.

Dokumen ini menjadi acuan tahap implementasi berikutnya berdasarkan [komunitas.md](../../komunitas.md). Tahap 1 tidak mengubah kode aplikasi atau backend. Pengembangan dilakukan satu tahap setiap kali, dengan laporan hasil di akhir tahap. Blok kode pada tahap berikutnya diberi komentar berbahasa Indonesia yang menjelaskan fungsi atau alasan aturan penting.

Pembaruan setelah implementasi: temuan di bawah merekam kondisi **saat audit Tahap 1**. Tahap 2–13 kini sudah ditulis; perkembangan dan verifikasinya ada di [laporan implementasi](komunitas-fe-implementation.md). Tipe summary bersama yang sebelumnya mewajibkan `entries` telah diperbaiki. Pembacaan kandidat menggunakan `apiClient` langsung dengan validasi dan satu kebijakan retry query, sehingga service Admin lama tidak diubah. Instruksi terbaru pengguna mengizinkan seluruh tahap dilanjutkan berurutan dengan laporan per tahap di akhir.

## 1. Cakupan dan sumber pemeriksaan

- FE sekarang: `src/lib/{axios,apiResponse,apiError,useReadQuery,readRetry,queryClient}.ts`, `src/stores/useAuthStore.ts`, API/types/hooks/komponen Kelola Pura, API Piodalan, serta service/types admin.
- BE: `internal/delivery/http/handler/{dto,pura_handler,pura_summary_handler,pura_regions_handler,geo_handler,finance_handler,user_handler}.go`.
- Domain/usecase/repository: `internal/domain/user.go`, `internal/usecase/{pura,pura_access,pura_summary,pura_regions,finance}.go`, serta repository pura/ringkasan/keuangan PostgreSQL.
- Acuan desain: `frontend-reactjs/AGENTS.md`; kontrak pendamping: `backend-go/kalenderbali-be/docs/pura-contract.md`.

Path BE di atas relatif terhadap `backend-go/kalenderbali-be/`; path FE relatif terhadap `frontend-reactjs/`.

## 2. Kontrak direktori dan wilayah

Semua path API di bawah relatif terhadap `/api/v1`. Axios yang ada sudah menyediakan prefix ini, token aktif, dan normalisasi error; fitur tidak membuat instance HTTP atau penyimpanan token baru.

| Tab FE | Daftar | Katalog wilayah | Akses |
| --- | --- | --- | --- |
| Semua Komunitas | `GET /puras` | `GET /puras/regions` | Publik; hanya Published |
| Komunitas Saya | `GET /puras/my` | `GET /puras/my/regions` | Login; berdasarkan mapping pengguna, termasuk profil belum Published |
| Pengajuan | `GET /puras/unpublished` | `GET /puras/unpublished/regions` | Member/Admin; Review dan Rejected. Member hanya yang dipetakan; Admin seluruh pengajuan |

- Daftar wajib mengirim `view=summary&scope=community`; wilayah wajib mengirim `scope=community`.
- `limit` default 20, rentang 1–100. `cursor` diperlakukan sebagai token opaque dari server, bukan dihitung oleh FE.
- Pencarian nama menerima `search` atau `q`. Implementasi baru memakai `search` secara konsisten. Filter lain: `country`, `province`, `city`, dan `address`.
- Respons daftar: `data` berupa array; `pagination` berisi `limit`, `has_more`, dan `next_cursor` berupa string atau null. Tidak ada `total` keseluruhan.
- Item summary berisi `id`, `name`, `type`, dan `location: { address, city, province, country }`. `status` hanya disertakan pada tab privat. Telepon, ID geografis, koordinat, URL peta, dan pengelola tidak tersedia pada summary.
- Respons wilayah: `data.countries` berupa array `{ name, provinces: [{ name, cities: string[] }] }`. Ini katalog nama untuk filter, bukan katalog ID bagi form.
- Katalog wilayah mengikuti tab dan scope, tidak mengikuti search atau cursor. Pilihan wilayah tidak dihitung dari halaman daftar yang baru dimuat.
- Mode `/puras` tanpa `view=summary` mempertahankan format detail lama dan tidak menerapkan pemisahan `scope` seperti jalur summary. Menambahkan `scope=pura` saja pada pemanggil lama tidak cukup untuk mengecualikan Suka Duka.

## 3. Kontrak profil, form, dan pengelola

| Operasi | Kontrak nyata | Implikasi FE |
| --- | --- | --- |
| Detail | `GET /puras/:id` → `data` objek profil dengan alamat/wilayah di tingkat atas | Tipe berbeda dari item summary yang memakai `location` |
| Tautan peta | Field request dan response bernama `location_url` | Jangan mengirim `map_url` |
| Daftar pengelola pada detail | Field bernama `manager`, array `{ user_id, name, email }`; dapat tidak dikirim jika kosong | Normalisasi ke daftar pengelola pada model FE; jangan membaca field `managers` dari JSON |
| Odalan komunitas | Domain memiliki Observance nil; JSON detail tidak mempunyai field `observance`, dan field odalan individual tidak dikirim ketika kosong | Jangan mewajibkan `observance: null` pada tipe respons atau menampilkan field odalan |
| Tambah/edit | `POST /puras`, `PUT /puras/:id`; response sukses memuat `data` profil | Payload mengunci `type: "Suka Duka"`; tidak mengirim field odalan |
| Publikasi | `PUT /puras/:id/status`, body `{ status }` | UI tahap ini menyediakan Published/Rejected sesuai alur moderasi |
| Baca pengelola | `GET /puras/:id/managers` → `data` array; memerlukan login, tidak dibatasi middleware Admin | Untuk nama pengelola di profil publik, gunakan data detail yang sudah tersedia |
| Tambah/cabut pengelola | `POST /puras/:id/managers` body `{ user_id }`; `DELETE /puras/:id/managers/:user_id` | Khusus Admin; sukses berupa message, bukan profil baru |
| Kandidat pengelola | `GET /admin/members`, filter `role` tersedia; response `data` array | Endpoint terdaftar pada group Admin; jangan membuat katalog pengguna dummy |
| Hapus profil | `DELETE /puras/:id`, khusus Admin | Konfirmasi dampak pada profil, mapping, dan riwayat kas sebelum aksi |

Master form berasal dari `GET /geo/countries`, `/geo/countries/:id/provinces`, dan `/geo/provinces/:id/cities`; setiap item `{ id, code, name }`.

Handler memilih `city_id`, lalu `province_id`, lalu `country_id` sebagai geo place. Usecase mensyaratkan nama dan geo place valid. Persyaratan produk untuk telepon, alamat, URL HTTP/HTTPS, dan provinsi/kota untuk Indonesia diterapkan juga di form; jangan menyebut semuanya sebagai validasi BE yang sudah ada.

Field opsional memakai `omitempty` pada beberapa respons. Tipe Tahap 2 harus mengakomodasi field yang tidak dikirim. API update juga mengabaikan beberapa string kosong: kebutuhan mengosongkan telepon/alamat/URL lama harus diverifikasi saat tahap form, bukan dijanjikan berhasil hanya karena form mengirim string kosong.

## 4. Hak akses yang dipakai FE

- Role domain: Guest, Member, Admin. Pengelola adalah relasi ke profil, bukan role tambahan. Premium/Contributor tidak menjadi syarat pendaftaran atau pengelolaan kas komunitas.
- Member membuat profil Review; Admin membuat Published. Pembuat langsung mendapat mapping pengelola, termasuk sebelum publikasi.
- Edit profil dan tulis kas: Admin atau pengguna yang dipetakan ke profil terkait. Backend memeriksa pemilik record yang tersimpan; state FE hanya mengatur tampilan tombol.
- UI dapat menentukan hak pengelola dari ID akun aktif dan `manager[].user_id` pada detail yang baru dimuat. Samakan representasi ID saat membandingkan akun FE yang menyimpan ID sebagai string dengan JSON BE numerik; nilai yang tidak valid tidak memberikan hak akses.
- Refresh detail dan mapping setelah perubahan pengelola. Penolakan 403 saat hak dicabut harus ditangani tanpa menganggap data kosong atau menampilkan sukses.
- Detail non-Published hanya tersedia bagi Admin atau Member yang dipetakan; pengguna lain memperoleh not found. URL tidak boleh dipakai untuk melewati pemeriksaan tipe Suka Duka dan akses detail.
- Penghapusan profil, moderasi, dan tambah/cabut mapping khusus Admin. Komunitas Saya menunjukkan profil yang dipetakan, bukan otomatis seluruh profil hanya karena akun Admin.

## 5. Kontrak kas dan penggunaan ulang

Gunakan kembali enam fungsi HTTP dari `src/features/kelola-pura/api/kelolaPuraApi.ts`: `fetchFinanceCategories`, `fetchPuraFinance`, `fetchPuraFinanceSummary`, `createFinanceEntry`, `updateFinanceEntry`, dan `deleteFinanceEntry`.

| Operasi | Endpoint / payload | Catatan |
| --- | --- | --- |
| Kategori global | `GET /finance/categories` → `data: [{ id, name }]` | Gunakan data BE; jangan mengasumsikan nama kategori tertentu selalu tersedia |
| Mutasi | `GET /puras/:id/finance` | Filter `year`, `category_id`, `entry_type`; hasil `data` array |
| Ringkasan | `GET /puras/:id/finance/summary` | Filter year/category; tidak menerima filter entry_type |
| Tambah | `POST /puras/:id/finance` | Body kategori, debit/kredit, nominal, tanggal, catatan; ID pada path menentukan pemilik |
| Edit/hapus | `PUT /finance/:id`, `DELETE /finance/:id` | Server memeriksa pemilik transaksi asli; edit tidak memindahkan buku kas |

- JSON transaksi: `id`, `pura_id`, `category_id`, `category_name`, `transaction_date`, `entry_type`, `amount`, `note`, `created_at`, `updated_at`. Tanggal transaksi dikembalikan sebagai `YYYY-MM-DD`; nominal memakai bilangan bulat Rupiah positif.
- JSON summary hanya berisi `total_debit`, `total_kredit`, `saldo`, `debit_per_category`, dan `kredit_per_category`. Rincian kategori berisi `category_name`, `total_amount`, dan `percentage`. Tidak ada field `entries` pada respons summary HTTP, walaupun tipe FE lama mewajibkannya.
- Pada Tahap 2, tipe summary komunitas dapat memakai `Omit<PuraFinanceSummary, 'entries'>` untuk menggunakan kembali struktur yang benar tanpa mengandalkan field yang tidak dikirim. Array transaksi tetap berasal dari endpoint mutasi.
- Debit berarti pemasukan; kredit berarti pengeluaran. Summary menghitung debit minus kredit berdasarkan year/category yang dikirim, bukan otomatis saldo penutupan periode.
- Filter jenis transaksi hanya menyaring tabel; ringkasan tetap mencakup pemasukan dan pengeluaran untuk year/category tersebut. Nilai UI semua jenis diubah ke `undefined`, bukan dikirim sebagai `entry_type=all`.
- Default tahun baru mengikuti tahun berjalan WITA; pilihan semua tahun menghilangkan parameter year. State filter dipertahankan melalui URL.
- Tipe payload create FE lama masih mewajibkan `pura_id`. Jika dipakai kembali, isikan ID yang sama dengan path; jangan membiarkan body menunjuk profil berbeda.
- Baca kas pada router saat ini bersifat publik; tulis memerlukan login dan pemeriksaan mapping. FE membuka kas melalui detail komunitas yang valid. Ini bukan pengganti perlindungan akses di server.
- Kas per profil tetap terpisah meskipun tempat kegiatan sama. Tidak ada `piodalan_id`, laporan gabungan, snapshot tutup buku, atau penguncian periode dalam cakupan FE sekarang.

## 6. Pola data, cache, dan komponen bersama

| Bagian | Keputusan implementasi berikutnya |
| --- | --- |
| HTTP | Gunakan `apiClient` yang ada; teruskan error tanpa fallback palsu |
| Validasi respons | Gunakan `apiArray`/`apiObject` untuk bentuk dasar dan validasi tambahan field yang diperlukan, khususnya metadata pagination dan angka summary |
| Query baca | Gunakan `useReadQuery`; satu retry untuk gangguan sementara dengan jeda 1 detik. 4xx dan pembatalan tidak diulang |
| Mutation | Gunakan TanStack mutation tanpa retry otomatis untuk tambah, edit, hapus, dan moderasi |
| Data privat | Query key menyertakan `useAuthQueryScope()` dan `meta.authScoped: true` agar cache lama dibuang saat sesi/role berubah |
| Direktori komunitas | Gunakan namespace komunitas tersendiri, tab, filter, dan cursor. Jangan memakai cache daftar penuh `['piodalan', 'puras', 'all']` |
| Kas | Gunakan ID pemilik dan filter pada query key; ikuti keluarga key keuangan yang ada agar invalidasi konsisten. Kategori global dapat berbagi cache |
| Error | Gunakan `QueryErrorState`; skeleton selama loading/retry; empty state hanya untuk respons sukses kosong |
| Modal | Portal body, Escape, scroll lock, pengelolaan fokus, dan desain sesuai AGENTS.md |
| Komentar kode | Jelaskan fungsi blok serta alasan aturan scope, akses, pagination, normalisasi, dan invalidasi; hindari komentar yang hanya mengulang baris kode |

`adminService.getAllMembers` sudah tersedia, tetapi masih menggunakan fallback `data || []` dan retry pembacaan sendiri. Saat tahap kandidat pengelola, gunakan ulang dengan validasi hasil serta satu pemilik retry; jangan menumpuk retry service dan query atau menyamarkan payload rusak sebagai katalog kosong. Penyelarasan service ini dikerjakan pada tahap terkait, bukan Tahap 1.

## 7. Penyesuaian UI berdasarkan ketersediaan data

- Hero tahap awal menggunakan dua metrik: **Komunitas dimuat** (jumlah unik hasil yang telah dimuat untuk filter aktif) dan **Negara jangkauan** (jumlah negara dari katalog wilayah pada tab aktif). Label menjelaskan cakupannya. Tidak menambahkan metrik ketiga atau klaim total global tanpa sumber API.
- Kartu menggunakan summary; telepon dan rincian pengelola ditampilkan pada detail. Jangan melakukan satu request detail per kartu hanya untuk mengisi field yang tidak ada pada summary.
- Katalog wilayah dipisahkan dari master geo form: nama untuk filter, ID untuk payload form.
- Ringkasan tahun/kategori diberi label sesuai cakupan, misalnya Saldo berdasarkan filter, agar tidak dianggap sebagai saldo akhir seluruh periode.

## 8. Temuan pada kode lama dan tahapan tindak lanjut

| Temuan | Lokasi FE | Ditangani pada tahap |
| --- | --- | --- |
| Tipe summary lama mewajibkan entries yang tidak dikirim HTTP | `features/kelola-pura/types/kelolaPura.types.ts` | 2: tipe komunitas memakai struktur yang tepat; 3: reuse API |
| Daftar lama tidak memisahkan scope, dengan cache bersama Piodalan | `features/kelola-pura/{api/kelolaPuraApi.ts,hooks/useKelolaPura.ts}`, `features/piodalan/api/piodalanApi.ts` | 12: pisahkan direktori dan periksa seluruh konsumen cache |
| Suka Duka masih tersedia pada opsi tipe pura | `features/kelola-pura/utils/kelolaPuraUtils.ts` | 12 |
| Tombol kas lama hanya memeriksa Admin | `features/kelola-pura/components/PuraKeuanganView.tsx` | 10–12: akses komunitas mengikuti mapping; sesuaikan bagian lama yang digunakan bersama |
| Usulan Member Premium masih memakai localStorage | `features/kelola-pura/hooks/useKelolaPura.ts` | 10–11: tidak digunakan sebagai jalur pencatatan komunitas |
| Invalidasi mutation kas lama terlalu luas dan pesan menyebut pura | `features/kelola-pura/hooks/useKelolaPura.ts` | 4/11: hooks komunitas memakai konteks dan ID yang tepat |
| Kandidat pengelola memerlukan validasi respons dan pengaturan retry | `features/admin/services/adminService.ts` | 3/9 |
| Beberapa field edit lama tidak bisa dikosongkan melalui string kosong | Kontrak PUT profil BE | 8: verifikasi perilaku dan tampilkan hasil simpan sebenarnya; jika perlu perubahan BE, laporkan secara spesifik |

## 9. Hasil dan batas verifikasi

- Tahap 1 selesai pada tingkat audit kode sumber dan penetapan kontrak FE. Tidak ada kode fitur atau perubahan BE yang dibuat.
- Dokumen utama diselaraskan dengan nama field JSON, pemisahan summary/detail, akses GET pengelola, metrik yang tersedia, dan cakupan saldo.
- Belum menjalankan aplikasi, request ke database/API aktif, build, lint, atau tes; tahap ini hanya mengubah dokumentasi. Keberadaan endpoint dalam kode tidak diklaim sebagai bukti integrasi live berhasil.
- Tahap berikutnya hanya Tahap 2: membuat `src/features/komunitas/types/komunitas.types.ts` dengan komentar penjelas. API, hooks, dan komponen menunggu tahap masing-masing.
