# Keadaan data ketika API gagal

Perbaikan ini berada di frontend dan tidak membutuhkan perubahan database.

## Alur yang digunakan

1. Fungsi API menunggu respons backend. Gangguan jaringan dan respons HTTP gagal diteruskan sebagai error, tanpa menggantinya dengan `[]`, `null`, atau saldo nol.
2. `apiArray` dan `apiObject` memeriksa bentuk dasar payload respons sukses. Saldo juga harus berisi angka yang valid; status langganan wajib memiliki penanda `is_premium`.
3. TanStack Query menyimpan keadaan pemuatan, keberhasilan, atau error. Komponen menampilkan skeleton ketika memuat, pesan error beserta **Coba Lagi** ketika gagal, dan pesan kosong hanya ketika respons berhasil tidak memiliki data.

Penerapannya mencakup katalog pura, jadwal piodalan, susunan acara, kas, master pilihan pencarian, rincian Wariga/padewasan, ringkasan dashboard, langganan, riwayat pembayaran, dan artikel milik pengguna. `QueryErrorState` menjadi komponen pesan gagal bersama agar perilakunya konsisten.

## Kasus khusus

- Pencarian piodalan dapat memakai pencocokan dari kalender dan master pura resmi yang sudah tersedia. Jika sumber lain gagal saat hasil tersebut ditampilkan, halaman memberi tahu bahwa sebagian sumber belum berhasil diperbarui.
- Pencarian alias keterangan tetap boleh dilakukan ketika kategori lama mengembalikan 404. Gangguan server pada kategori diteruskan sebagai error.
- Profil resmi tetap wajib berhasil sebelum sesi login dibuat. Gangguan pemeriksaan langganan ditandai dengan `subscriptionUnavailable`; halaman Premium menampilkan **Belum dapat diperiksa**. Sinkronisasi gagal mempertahankan data terakhir dan tidak mengubahnya menjadi status gratis.
- Hasil sinkronisasi langganan dari akun lama tidak boleh mengubah akun yang sudah berganti.
- Pemeriksaan susunan acara yang gagal menghentikan pembukaan konfirmasi hapus piodalan, sehingga jumlah acara tidak diasumsikan nol.

## Pengujian

Jalankan dari direktori `frontend-reactjs`:

```sh
node --test --test-force-exit tests/apiErrors.test.mjs tests/authProfile.test.mjs
npm run lint
npm run build
```

Tes menggunakan fungsi API dan interceptor asli dengan adapter jaringan simulasi. Kasus mencakup HTTP 401/403/503, gangguan jaringan, respons kosong yang sah, payload wajib yang tidak lengkap, tampilan error/retry, loading kas, dan sinkronisasi langganan antar sesi. Tidak ada pembayaran atau data pengguna sungguhan yang diubah.
