# Small Change Plan

## Objective
Mengganti README bawaan Laravel dengan README yang sesuai untuk project CAPH.io agar repo lebih mudah dipahami oleh developer/maintainer.

## Scope
- Review struktur project dan fitur utama yang terlihat dari routes, pages, dan dependencies.
- Tulis ulang `README.md` agar menjelaskan tujuan aplikasi, stack, setup lokal, perintah penting, dan alur deploy/update.
- Update `task.md` untuk tracking perubahan dokumentasi.

## Assumptions
- README ditujukan untuk developer/maintainer internal.
- Detail env sensitif tidak ditulis; hanya nama konfigurasi yang relevan.
- Tidak ada perubahan kode aplikasi, hanya dokumentasi dan planning files.

## Proposed Approach
1. Ringkas tujuan aplikasi CAPH.io dari UI/routes yang ada.
2. Susun README yang praktis: overview, fitur, stack, requirement, instalasi, command, struktur, deploy, troubleshooting.
3. Simpan perubahan tanpa commit agar bisa direview di Source Control.

## Definition of Done
- `README.md` tidak lagi berisi template Laravel bawaan.
- README menjelaskan project CAPH.io secara spesifik.
- `plan.md` dan `task.md` diperbarui untuk task ini.

## Verification Plan
- Review isi README agar konsisten dengan struktur project.
- Pastikan command yang ditulis sesuai dengan `composer.json`, `package.json`, dan panduan deploy yang ada.
