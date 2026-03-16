# Feature Plan

## Objective
Mengeraskan privasi admin panel CAPH agar admin tidak bisa melihat transaksi mentah user secara default, sambil menjaga fungsi operasional admin tetap berjalan dan meminimalkan risiko regresi.

## Scope
- Review dan pembatasan akses tab/route transaksi admin.
- Penggantian visibilitas transaksi mentah dengan pendekatan agregat/aman.
- Menyiapkan desain bertahap untuk support access yang audited (belum tentu langsung diimplementasikan pada fase awal).
- Menjaga fitur admin lain tetap utuh: overview, users, quotas, feedback, logs, master data.

## Impact Analysis
### Files likely to be modified
- `resources/js/Pages/Admin/Dashboard.tsx`
- `app/Http/Controllers/Admin/TransactionController.php`
- `app/Http/Controllers/Admin/AdminDashboardController.php`
- `resources/js/Pages/Admin/Partials/OverviewTab.tsx`
- `routes/web.php`

### Files that may be indirectly affected
- `resources/js/Pages/Admin/Partials/TransactionsTab.tsx`
- `resources/js/Pages/Admin/Partials/UsersTab.tsx`
- `resources/js/Pages/Admin/Partials/LogsTab.tsx`
- `app/Models/SystemLog.php` atau controller admin terkait audit jika fase support-access dilanjutkan

### Flows involved
- Navigasi tab admin panel
- Route admin transactions
- Statistik overview admin
- Audit/logging admin actions

### Regression-sensitive areas
- Akses menu admin dan perpindahan tab
- Statistik overview tetap akurat
- User management (suspend, quota, delete) tetap aman
- Feedback dan logs tetap bisa diakses
- Tidak ada route/admin page yang menjadi broken link

## Assumptions
- Default policy: admin tidak boleh melihat transaksi mentah user.
- Jika di masa depan ada kebutuhan support detail, akses harus exception-based dan audited.
- Fase pertama sebaiknya fokus pada quick privacy hardening yang minim risiko.

## Proposed Approach
### Phase 1 — Quick privacy hardening
1. Sembunyikan tab transaksi dari UI admin.
2. Nonaktifkan atau redirect route transaksi admin agar tidak lagi membuka transaksi mentah.
3. Pastikan overview admin masih punya metrik sistem yang cukup.

### Phase 2 — Safe aggregate replacement
1. Ganti use-case tab transaksi dengan metrik agregat/anonymized.
2. Tampilkan indikator seperti total transaksi, flagged count, high-value count, tren global.
3. Hindari menampilkan user identity atau deskripsi transaksi.

### Phase 3 — Audited support access (optional/future)
1. Desain jalur akses khusus untuk kasus support.
2. Wajib alasan akses dan audit trail.
3. Scope akses sempit dan sementara.

## Definition of Done
- Admin tidak bisa melihat transaksi mentah user secara default.
- Navigasi admin tidak rusak.
- Overview admin tetap informatif.
- Fitur users, logs, feedback, dan master data tetap berfungsi.
- Ada rencana jelas untuk fase lanjutan tanpa memaksa perubahan berisiko sekarang.

## Verification Plan
- Manual check seluruh tab admin yang tersisa.
- Cek route admin terkait transaksi agar tidak bocor akses detail.
- Verifikasi statistik overview tetap muncul.
- Verifikasi user management, feedback, logs, dan master data tetap normal.
- Jalankan build/check setelah implementasi fase awal nanti.
