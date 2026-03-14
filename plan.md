# Small Change Plan

## Objective
Memperbaiki fitur Wealth Tree yang gagal membaca data karena endpoint `/api/analytics/wealth-tree` error 500 saat mengakses kolom `users.max_wealth_level` yang belum ada.

## Scope
- Tambah migration untuk kolom `max_wealth_level` pada tabel `users`
- Hardening ringan pada `AnalyticsController::wealthTreeDataApi()` agar kegagalan update max level tidak menjatuhkan seluruh endpoint
- Tidak mengubah rumus wealth tree atau UI besar-besaran

## Assumptions
- Database local dan hosting sama-sama belum memiliki kolom `max_wealth_level`
- Frontend sudah benar memanggil endpoint wealth tree, masalah utama ada di backend/schema

## Proposed Approach
1. Tambah migration baru untuk `users.max_wealth_level` dengan default `1`
2. Ubah logika update max level menjadi aman dengan `try/catch` + logging
3. Pastikan response tetap memakai fallback `maxLevel` yang aman
4. Beri langkah verifikasi untuk local dan hosting

## Definition of Done
- Endpoint `/api/analytics/wealth-tree` tidak lagi 500 karena kolom `max_wealth_level`
- Wealth Tree kembali menampilkan data user
- Perubahan siap direview di VS Code Source Control

## Verification Plan
- Jalankan `php artisan migrate`
- Buka dashboard dan klik Wealth Tree popup
- Pastikan request `/api/analytics/wealth-tree` status 200
- Pastikan data bukan lagi fallback 0 palsu
- Cek log tidak ada lagi error unknown column `max_wealth_level`
