# Task

## Checklist
- [done] Finalkan arah UX onboarding bersama user
- [done] Tambahkan logic status onboarding di backend/global share
- [done] Buat komponen onboarding dashboard/floating
- [done] Balikkan layout dashboard desktop ke struktur semula
- [done] Pindahkan onboarding ke floating global via AppLayout
- [done] Samakan panel agar muncul lintas halaman dan mobile
- [done] Ubah posisi panel ke tengah atas dan tambahkan drag + minimize
- [in_progress] Rapikan minimize agar jadi state compact yang jelas dan hapus close button
- [pending] Build final dan review perilaku panel

## Validation Steps
- Pastikan panel tidak punya tombol close
- Pastikan panel bisa minimize dan expand kembali
- Pastikan state minimized tetap terlihat jelas sebagai panel compact
- Pastikan drag desktop tetap aman
- Pastikan `npm run build` lolos

## User Check
- Cek apakah state minimized sudah terasa jelas
- Cek apakah panel tetap tidak mengganggu setelah diminimize
- Putuskan apakah posisi drag perlu disimpan atau tidak
