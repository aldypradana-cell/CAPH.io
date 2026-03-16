# Task

## Checklist
- [done] Review komponen Sankey saat ini
- [done] Tambahkan kalkulasi density/layout adaptif
- [done] Update tinggi chart dan node padding secara aman
- [done] Verifikasi tidak merusak tooltip/click/filter state
- [done] Jalankan build/check yang relevan (catatan: build gagal di file lain yang tidak disentuh)

## Validation Steps
- Buka halaman Analytics
- Coba range data kecil
- Coba range data besar
- Pastikan node dompet tetap terlihat
- Pastikan klik node dompet masih memunculkan transfer internal terkait
- Pastikan tooltip link/node masih tampil

## User Check
- Cek tampilan Sankey untuk bulan dengan transaksi padat
- Klik beberapa dompet berbeda
- Pastikan tidak ada node penting yang hilang
- Pastikan tampilan data sedikit tetap enak dilihat
