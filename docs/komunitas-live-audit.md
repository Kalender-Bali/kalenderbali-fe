# Pengujian Langsung FE Komunitas dengan Backend Aktif

Tanggal: 18 November 2026 (WITA).

Pengujian memakai backend yang berjalan di `http://127.0.0.1:8080/api/v1` dan database konfigurasinya. Modul API FE asli dimuat melalui Vite dan mengirim HTTP nyata, tanpa adapter simulasi. Browser menggunakan `http://localhost:3000/komunitas`.

## Hasil akhir

| Pemeriksaan | Hasil |
| --- | --- |
| Pembacaan API nyata dan proteksi akses tamu | 14/14 lulus |
| Workflow CRUD, moderasi, mapping, dan isolasi kas | 21/21 lulus |
| Tes otomatis Komunitas setelah audit live | 29/29 lulus |
| ESLint setelah penambahan alat audit | Lulus |
| Browser Member | Pendaftaran, edit profil, tambah/edit kas, refresh, dialog hapus/Escape, dan logout berhasil |
| Pembersihan | Profil, transaksi, tiga akun dummy, sesi, dan file kredensial sementara sudah dibersihkan |

Angka 14 dan 21 berasal dari dua matriks berbeda dan mengandung sebagian alur yang saling berkaitan; bukan klaim 35 skenario bisnis yang seluruhnya berbeda. Pengulangan matriks CRUD dipakai untuk verifikasi akhir alat audit, bukan dijumlahkan lagi.

## Matriks CRUD yang dibuktikan

| Alur | Bukti hasil |
| --- | --- |
| Member membuat komunitas | HTTP create berhasil, status Review, pembuat ada pada mapping pengelola |
| Tab privat dan wilayah | Komunitas baru terlihat pada Saya/Pengajuan; katalog wilayah privat diterima parser FE |
| Pembatasan Review | Tidak muncul di direktori publik; detail tamu dan Member lain ditolak |
| Edit profil | Nama, telepon, dan URL peta tersimpan; tidak ada field odalan pada respons komunitas |
| Moderasi Admin | Perubahan Review ke Rejected, lalu Published berhasil melalui API FE |
| Publikasi | Profil terbit dapat dicari dan dibuka publik menggunakan filter negara/provinsi/kota |
| Create oleh Admin | Komunitas baru langsung Published |
| Pemisahan direktori | Kelola Pura dan Piodalan mengecualikan Suka Duka melalui pembaca FE asli |
| Pencatatan kas | Debit dan kredit berhasil dibuat; perubahan nominal tersimpan dan dapat dibaca ulang |
| Rekap dan filter | Debit Rp250.000, kredit Rp50.000, saldo Rp200.000; filter tahun/kategori/jenis sesuai |
| Kas di lokasi sama | Saldo komunitas pertama Rp200.000, komunitas kedua Rp12.345, dan pura Rp34.567 tetap terpisah meskipun alamat serta kategori sama |
| Penolakan akses | Member tanpa mapping ditolak pada edit profil, create/edit/delete kas, moderasi, tambah mapping, dan hapus profil |
| Penambahan pengelola | Admin menambah mapping; pengguna yang baru dipetakan langsung dapat mengedit profil dan transaksi |
| Pencabutan pengelola | Token pengguna yang sama langsung ditolak menulis setelah mapping dicabut |
| Penghapusan transaksi | Ringkasan berubah sesuai transaksi tersisa; data tetap benar saat diminta ulang |
| Penghapusan profil | Hanya Admin yang berhasil; profil menjadi not found dan kas terkait kosong |

Detail pemeriksaan per kasus dan ID data uji tersedia pada [hasil baca](komunitas-live-results/public.json), [hasil CRUD](komunitas-live-results/crud.json), serta [hasil cleanup](komunitas-live-results/cleanup.json).

## Pemeriksaan browser

1. Membuka direktori, modal profil, ringkasan cepat, serta buku kas dari data yang benar-benar ada di backend. Mode tamu tidak menyediakan aksi perubahan.
2. Login menggunakan Member dummy, lalu kembali otomatis ke form pendaftaran.
3. Mengisi master negara Indonesia, provinsi Bali, dan Kota Denpasar; mengirim profil berpenanda `AUDIT-KOMUNITAS-BROWSER-20261118`.
4. FE berpindah ke Pengajuan dan menampilkan status Review serta pembuat sebagai pengelola.
5. Mengedit telepon; nilai baru muncul pada detail setelah penyimpanan.
6. Membuka buku kas komunitas Review, menambah pemasukan Rp15.000, kemudian mengedit menjadi Rp17.500.
7. Refresh browser tetap menampilkan transaksi dan saldo Rp17.500, membuktikan data tersimpan di backend, bukan hanya state komponen.
8. Membuka konfirmasi hapus transaksi lalu membatalkannya dengan Escape; fokus kembali ke tombol pemicu. Penghapusan nyata diuji melalui HTTP, bukan melalui klik konfirmasi browser.
9. Logout dari akun dummy dan mengembalikan browser ke direktori publik sebelum pembersihan akun.

## Akun dan pembersihan

Pengguna mengizinkan pembuatan akun dummy dan penetapan role melalui database. Helper `backend-go/kalenderbali-be/tools/komunitas_audit/main.go` membuat tiga akun baru berpenanda unik: Admin, Member, dan Member lain. Helper memakai repository/seeder aplikasi, password acak ter-hash, serta status terverifikasi tanpa pengiriman email. Tidak mengubah role, password, atau profil akun yang sudah ada.

Kredensial hanya disimpan sementara dalam file mode 0600 di `/tmp`; tidak disimpan dalam repositori/laporan. Helper cleanup memeriksa ID, email, nama berpenanda audit, dan ketiadaan mapping tersisa sebelum menghapus akun. Seluruh profil/transaksi audit dibersihkan lebih dahulu melalui API Admin dengan pemeriksaan penanda dan kepemilikan akun dummy. Sesi akun ikut dibersihkan dan file kredensial dihapus.

## Temuan lingkungan dan batas cakupan

- Konfigurasi CORS backend mengizinkan `http://localhost:3000`, tetapi tidak `http://127.0.0.1:3000`. URL IP dapat menampilkan katalog GET namun POST login ditolak dengan `Origin is not allowed`. Pengujian browser berhasil melalui **localhost** tanpa mengubah whitelist atau middleware.
- Audit menemukan dua asumsi pada alat uji yang dikoreksi: create pura mengembalikan HTTP 201, sedangkan logout mengembalikan HTTP 204 tanpa JSON. Ini perbaikan alat audit, bukan perubahan fitur atau kontrak backend.
- Jalur Admin dan pencabutan akses diuji melalui HTTP nyata dengan modul FE/API serta backend asli. Tidak seluruh kombinasi tombol Admin dijalankan manual di browser.
- Pagination komunitas dengan lebih dari 20 profil belum diuji memakai dataset live besar; metadata cursor dan penanganan respons rusak dicakup tes otomatis serta validasi HTTP. Tidak membuat puluhan profil tambahan hanya untuk mengisi direktori.
- Tidak ada perubahan usecase, endpoint, skema database, atau implementasi tutup buku gabungan dalam pengujian ini. Perubahan kode BE terbatas pada helper akun audit yang tidak dipanggil server aplikasi.

## Menjalankan ulang

Pembacaan publik saja, dari `frontend-reactjs/`:

```sh
# Membaca backend loopback dengan fungsi FE asli; tidak mengubah profil/kas.
node tools/komunitas-live-audit.mjs --public --report /tmp/komunitas-read.json
```

Untuk matriks tulis, buat akun sementara dari root backend, lalu jalankan audit dari root frontend:

```sh
# Root backend: hanya membuat akun baru; tidak menjalankan seed pengguna umum.
go run ./tools/komunitas_audit -action seed -credentials /tmp/komunitas-accounts.json

# Root frontend: CRUD dibatasi profil berpenanda milik audit dan dibersihkan otomatis.
node tools/komunitas-live-audit.mjs --execute --credentials-file /tmp/komunitas-accounts.json --report /tmp/komunitas-crud.json

# Root frontend: cleanup tambahan untuk profil audit yang tersisa atau dibuat lewat browser.
node tools/komunitas-live-audit.mjs --cleanup-accounts-profiles --credentials-file /tmp/komunitas-accounts.json --report /tmp/komunitas-cleanup.json

# Root backend: hapus tiga akun dummy, sesi terkait, dan file kredensial sementara.
go run ./tools/komunitas_audit -action cleanup -credentials /tmp/komunitas-accounts.json
```
