# Task Checklist

## Progress
- [x] Identifikasi akar masalah dari log 500 Wealth Tree
- [x] Tambah migration `max_wealth_level` ke tabel users
- [x] Hardening controller Wealth Tree agar update level tidak mematikan endpoint
- [ ] Review perubahan file
- [ ] Berikan langkah verifikasi ke user

## Validation Steps
- [ ] `php artisan migrate`
- [ ] Buka dashboard lalu popup Wealth Tree
- [ ] Pastikan Network `/api/analytics/wealth-tree` -> 200
- [ ] Pastikan angka wealth tree tampil sesuai data user
- [ ] Cek `storage/logs/laravel.log` tidak ada error kolom `max_wealth_level`

## User Check
- [ ] Test pada local setelah migrate
- [ ] Deploy ke hosting lalu jalankan migrate
- [ ] Re-test user yang sebelumnya selalu 0
