# Task

## Checklist
- [done] Review komponen Sankey saat ini
- [done] Tambahkan kalkulasi density/layout adaptif
- [done] Update tinggi chart dan node padding secara aman
- [done] Verifikasi tidak merusak tooltip/click/filter state
- [done] Jalankan build/check yang relevan (catatan: build gagal di file lain yang tidak disentuh)
- [done] Tambahkan logging diagnosis recurring transaction
- [done] Tambahkan notifikasi error recurring yang lebih jelas untuk user
- [done] Verifikasi build tetap lolos
- [done] Perbaiki label notifikasi reminder cicilan agar non-PayLater tidak disebut PayLater
- [done] Verifikasi build tetap lolos setelah perbaikan notif cicilan
- [done] Rapikan notifikasi sukses/gagal cicilan agar label konsisten
- [done] Verifikasi build tetap lolos setelah perapian notif cicilan

## Validation Steps
- Buka halaman Analytics
- Coba range data kecil
- Coba range data besar
- Pastikan node dompet tetap terlihat
- Pastikan klik node dompet masih memunculkan transfer internal terkait
- Pastikan tooltip link/node masih tampil
- Jalankan recurring processor manual
- Pastikan error recurring tercatat di log
- Pastikan user menerima notifikasi kegagalan yang lebih informatif

## User Check
- Cek tampilan Sankey untuk bulan dengan transaksi padat
- Klik beberapa dompet berbeda
- Pastikan tidak ada node penting yang hilang
- Pastikan tampilan data sedikit tetap enak dilihat
- Cek notifikasi jika recurring expense gagal
