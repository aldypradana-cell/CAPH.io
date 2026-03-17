# Small Change Plan

## Objective
Menambahkan identitas visual CAPH.io ke aplikasi dengan memasang logo pada PWA/mobile assets dan menampilkan logo di UI dashboard/layout.

## Scope
- Buat komponen logo reusable untuk frontend.
- Pasang logo ke dashboard/header dan area brand di layout aplikasi.
- Perbarui aset PWA dasar (manifest, apple touch icon, Android icons) agar tidak lagi memakai branding placeholder lama.
- Pertahankan perubahan tetap kecil dan mudah direview.

## Assumptions
- Implementasi awal memakai versi logo v1 yang sudah disetujui user sebagai base concept.
- Aset PWA bisa dimulai dari placeholder serius yang konsisten dengan branding baru.
- Tidak mengubah flow bisnis aplikasi.

## Proposed Approach
1. Buat komponen SVG/React untuk brand CAPH.io.
2. Gunakan komponen itu di AppLayout dan dashboard header.
3. Generate icon PNG sederhana yang konsisten untuk `192`, `512`, dan Apple touch icon.
4. Update manifest dan meta tag agar menunjuk ke aset baru.

## Definition of Done
- Logo terlihat di area dashboard/layout.
- Manifest dan meta PWA memakai branding CAPH.io.
- Aset icon dasar tersedia di `public/`.

## Verification Plan
- Review file frontend dan manifest yang berubah.
- Cek referensi asset PWA tidak menunjuk ke file lama/placeholder.
- Jika memungkinkan, sarankan build/test visual setelah review.
