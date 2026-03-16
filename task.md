# Task

## Checklist
- [done] Audit current admin access ke transaksi user
- [done] Rumuskan policy privasi admin panel
- [done] Siapkan plan implementasi bertahap yang minim risiko
- [done] Implementasikan Phase 1 (hide/redirect transaksi mentah admin)
- [done] Tambahkan kolom waktu aktivitas yang aman di tabel user
- [done] Implementasikan Phase 2 metrik agregat aman di overview admin
- [done] Verifikasi route handling aman (redirect tanpa merusak flow)
- [pending] Siapkan desain audit support-access untuk fase lanjutan
- [done] Verifikasi build tetap lolos setelah Phase 2

## Validation Steps
- Review file admin yang terdampak
- Pastikan tidak ada fitur non-admin yang ikut terseret
- Pastikan Phase 1 bisa dilakukan tanpa mengubah data user
- Pastikan pendekatan baru tidak memutus flow admin penting

## User Check
- Review plan sebelum implementasi
- Putuskan apakah Phase 1 langsung hide+redirect atau hide+deny
- Putuskan apakah fase agregat dikerjakan langsung setelah hardening awal
- Putuskan apakah support-access audited perlu masuk scope sekarang atau nanti
