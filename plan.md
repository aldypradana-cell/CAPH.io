# Small Change Plan

## Objective
Perbaiki diagram Sankey agar node dompet/kategori tetap terlihat dan tetap bisa diklik saat jumlah node banyak, tanpa merusak tooltip, filter tanggal, transfer internal, atau rendering data yang sudah ada.

## Scope
- Ubah perilaku layout pada komponen frontend Sankey.
- Tidak mengubah kontrak API backend.
- Tidak mengubah struktur data `nodes/links`.

## Assumptions
- Masalah utama berasal dari kompresi layout Recharts saat `nodePadding` besar dan tinggi chart fixed.
- Fitur yang harus tetap aman: tooltip, klik node dompet, filtering transfer internal, loading state, empty state.

## Proposed Approach
1. Hitung kompleksitas node per depth/kolom dari data yang sudah ada.
2. Jadikan `nodePadding`, tinggi chart, dan margin lebih adaptif terhadap kepadatan node.
3. Pertahankan perilaku klik dompet dan tooltip yang sudah ada.
4. Hindari perubahan pada backend/API agar risiko regresi kecil.

## Definition of Done
- Pada data besar, node tetap terlihat secara visual.
- Node dompet tetap bisa diklik.
- Tooltip tetap muncul normal.
- Empty state dan loading state tetap bekerja.
- Tidak ada perubahan kontrak API.

## Verification Plan
- Build/check TypeScript frontend.
- Review visual untuk data sedikit dan data banyak.
- Verifikasi klik node dompet masih memfilter transfer internal.
