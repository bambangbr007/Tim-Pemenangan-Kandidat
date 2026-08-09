# Pantauan Pemenangan Kandidat

Aplikasi mobile-first untuk memantau data pemilih, kinerja tim, laporan lapangan, bukti foto/video, komando, notifikasi real-time, dan perbandingan kondisi lawan.

## Menjalankan lokal

1. Gunakan Node.js 22 atau lebih baru.
2. Salin `.env.example` menjadi `.env` dan isi URL serta publishable key Supabase.
3. Jalankan `npm install`, lalu `npm run dev`.

## Menyiapkan Supabase

1. Buat proyek Supabase baru di region Singapore (`ap-southeast-1`).
2. Jalankan migration `supabase/migrations/202608090001_initial_schema.sql`.
3. Aktifkan Email/Password Auth. Untuk produksi, pasang SMTP sendiri dan aktifkan konfirmasi email.
4. Pengguna pertama yang mendaftar otomatis menjadi Admin aktif. Lakukan pendaftaran Admin segera setelah deployment. Akun berikutnya berstatus menunggu persetujuan.
5. Tambahkan URL Vercel pada Auth > URL Configuration sebagai Site URL dan Redirect URL.

## Hak akses

- Admin: mengelola seluruh data, tim, akun, dan persetujuan.
- Owner: melihat laporan seluruh tim, memasukkan kondisi lawan, dan mengirim komando.
- Tim: mengelola pemilih dalam timnya, memperbarui tugas, dan mengirim laporan.

Semua tabel publik menggunakan Row Level Security. Frontend hanya menggunakan Supabase publishable key; secret/service-role key tidak digunakan.

## Deployment Vercel

Tambahkan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` ke Production, Preview, dan Development Environment Variables. Build command `npm run build`, output `dist`.

## Verifikasi

```bash
npm run check
npm run build
```

Uji alur: daftar Admin pertama, buat tim, daftar akun tim kedua, setujui akun, input pemilih, kirim laporan dengan foto, buat komando, cek pembaruan real-time, ekspor CSV, dan Cetak/PDF.
