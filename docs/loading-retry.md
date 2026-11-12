# Loading dan retry pembacaan data

Alur tampilan: **skeleton → request awal → satu retry otomatis jika gangguan sementara → error dengan tombol Coba Lagi jika percobaan kedua tetap gagal**.

- `readRetry.ts` menyimpan kebijakan bersama: satu pengulangan dengan jeda 1 detik. Error HTTP 4xx dan request yang dibatalkan tidak diulang. Status error yang dibungkus dalam `cause` tetap diperiksa.
- `useReadQuery` memakai TanStack Query untuk pembacaan data. Flag `isLoading`, `isError`, dan `error` yang dikembalikan hook ini adalah status untuk tampilan. Selama request atau retry masih berjalan, `isLoading` aktif dan error lama disembunyikan. Data cache tetap disimpan. Status asli seperti `isFetching`, `isPending`, dan `status` tetap berasal dari TanStack Query.
- Mode jaringan `always` membuat request tetap dicoba saat perangkat dinyatakan offline, sehingga kegagalan dapat diselesaikan setelah satu retry tanpa antrean loading yang tertunda sampai koneksi kembali.
- Dashboard memakai skeleton terpisah untuk Dewasa Ayu dan piodalan. Kalender menunggu data tahun dengan skeleton grid dan panel detail; pemuatan agenda harian/bulanan ditangani per bagian.
- Pembacaan langsung pada halaman admin menggunakan `withReadRetry`, sehingga loading halaman tetap aktif sampai seluruh percobaan selesai.
- Pencarian Mengatur Dewasa adalah POST perhitungan tanpa penulisan data. Pengulangannya berada di dalam satu operasi dengan sesi dan `AbortController` yang sama. Pergantian akun atau pembatalan menghentikan percobaan berikutnya.
- Penulisan transaksi, pembuatan pesanan pembayaran, perubahan role, persetujuan, dan operasi tambah/ubah/hapus tidak mendapatkan retry otomatis dari perubahan ini.
- Gita membedakan loading, error final, dan hasil kosong untuk katalog serta pencarian teks/semantik.

Pengujian:

```sh
node --test --test-force-exit --test-concurrency=1 tests/*.test.mjs
npm run lint
npm run build
```

`loadingRetry.test.mjs` menguji jumlah percobaan, status sebelum/sesudah retry, error lama dengan cache, pembatalan, pembacaan admin, operasi tulis yang tidak diulang, pergantian akun saat perhitungan, dan tampilan Gita/dashboard/kalender. Eksekusi tes secara serial menghindari persaingan cache optimizer Vite antar server SSR pengujian.

Hasil verifikasi setelah perubahan: **100/100 tes frontend lulus**, ESLint lulus, dan build TypeScript/Vite lulus. Pengujian memakai simulasi jaringan dan render komponen; bukan pengujian klik browser menyeluruh.
