# Feature Plan

## Objective
Menambahkan onboarding user baru di dashboard CAPH.io dengan fokus 3 langkah awal: buat wallet, tambah saldo awal, dan catat transaksi pertama.

## Scope
- Tambah data onboarding status dari backend dashboard.
- Tampilkan onboarding dengan perilaku berbeda untuk desktop vs mobile:
  - desktop: panel onboarding ringan di area kanan atas dashboard
  - mobile: card onboarding inline di atas Net Worth
- CTA harus mengarahkan ke aksi relevan (wallet / saldo awal / transaksi pertama).
- Menjaga layout dashboard lama tetap stabil, terutama di desktop.

## Impact Analysis
### Files likely to be modified
- `app/Http/Controllers/DashboardController.php`
- `resources/js/Pages/Dashboard.tsx`
- `resources/js/Components/Dashboard/NetWorthCard.tsx` (jika perlu penyesuaian layout ringan)
- file komponen baru untuk onboarding dashboard

### Files that may be indirectly affected
- alur wallet / transaksi bila CTA perlu membuka halaman atau modal yang sudah ada
- styling dashboard responsif

### UX rules agreed
- 3 langkah onboarding:
  1. Buat wallet pertama
  2. Tambahkan saldo awal
  3. Catat transaksi pertama
- Mobile-first
- Desktop tidak boleh merusak layout dashboard utama
- Desktop menggunakan panel onboarding ringan di kanan atas
- Mobile menggunakan card inline di atas Net Worth

## Assumptions
- Step 1 complete jika user memiliki minimal 1 wallet.
- Step 2 complete sementara dianggap jika total saldo wallet > 0.
- Step 3 complete jika user memiliki minimal 1 transaksi.
- Setelah semua step selesai, onboarding tidak perlu ditampilkan lagi.

## Proposed Approach
1. Tambahkan payload onboarding dari backend.
2. Buat komponen onboarding reusable dengan mode desktop/mobile.
3. Pasang komponen di dashboard tanpa menggeser layout desktop secara agresif.
4. Sambungkan CTA ke route yang paling relevan dan sudah ada.
5. Verifikasi build dan responsivitas dasar.

## Definition of Done
- User baru melihat onboarding 3 langkah di dashboard.
- Desktop layout utama tetap rapi.
- Mobile menampilkan onboarding sebelum Net Worth.
- CTA jelas dan mengarah ke aksi yang tepat.
- Onboarding hilang saat semua step selesai.

## Verification Plan
- Review tampilan desktop dan mobile.
- Verifikasi state 0/3, 1/3, 2/3, dan selesai.
- Jalankan build frontend untuk memastikan perubahan aman.
