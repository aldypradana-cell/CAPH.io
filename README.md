# CAPH.io

CAPH.io adalah aplikasi web untuk **personal finance management** yang dibangun dengan **Laravel, Inertia.js, React, dan TypeScript**.

Project ini membantu pengguna mencatat transaksi, mengelola wallet dan aset, memantau kondisi keuangan, menyusun budgeting, melihat insight finansial, dan mengekspor data. Repo ini juga memiliki panel admin untuk kebutuhan operasional internal.

## Highlights

- Dashboard keuangan dengan statistik dan widget ringkas
- Pencatatan transaksi pemasukan dan pengeluaran
- **Smart Entry** berbasis AI untuk parsing transaksi
- Pengelolaan wallet, savings goals, budget, debt, dan installment
- Asset tracking termasuk aset emas
- Financial insights dan analytics
- Export data, feedback inbox, notifikasi, backup/restore
- Admin panel untuk user management, logs, feedback, dan master data

## Quick Start

```bash
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate
npm install
composer run dev
```

> Sebelum migrasi, pastikan konfigurasi database pada `.env` sudah benar.

## Tech Stack

### Backend
- **PHP 8.2+**
- **Laravel 12**
- Laravel Sanctum
- Barryvdh DomPDF
- Laravel Excel
- Sentry Laravel
- Google Gemini Laravel SDK

### Frontend
- **React 18**
- **TypeScript**
- **Inertia.js**
- **Vite**
- **Tailwind CSS**
- Headless UI
- Recharts
- Framer Motion

## Main Modules

Beberapa area utama yang saat ini tersedia di aplikasi:

- Dashboard
- Transactions
- Smart Entry
- Wallets
- Savings
- Budgets
- Debts / bills / receivables
- Assets & gold assets
- Categories
- Insights
- Analytics
- Export
- Feedback
- Notifications
- Settings
- Admin dashboard

Detail route implementation dapat dilihat di `routes/web.php`.

## Project Structure

```text
app/                 Backend logic: controllers, models, services, exports, policies, notifications
routes/web.php       Main web routes
resources/js/Pages/  Inertia pages
resources/js/Components/
                     Reusable React components and dashboard widgets
resources/views/     Blade/view support files
database/            Migrations, factories, seeders
public/              Public assets
deploy.bat           Local helper for build/package update
PANDUAN_UPDATE.txt   Deployment/update guide for Hostinger
```

## Requirements

Untuk menjalankan project ini secara lokal, siapkan:

- PHP 8.2 atau lebih baru
- Composer
- Node.js versi LTS terbaru disarankan
- Database sesuai konfigurasi `.env`
- Ekstensi PHP yang dibutuhkan Laravel

## Local Setup

```bash
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate
npm install
```

## Running the Project

### Option 1 — Recommended
Gunakan script dev yang sudah tersedia di `composer.json`:

```bash
composer run dev
```

Command ini menjalankan beberapa proses sekaligus:
- Laravel development server
- queue listener
- log tail (`pail`)
- Vite dev server

### Option 2 — Manual
Jika ingin menjalankan service satu per satu:

```bash
php artisan serve
php artisan queue:listen --tries=1 --timeout=0
php artisan pail --timeout=0
npm run dev
```

## Build and Test

### Build production assets
```bash
npm run build
```

### Run tests
```bash
composer test
```

Atau:

```bash
php artisan test
```

## Helpful Commands

### One-step initial setup
Repo ini menyediakan script setup cepat:

```bash
composer run setup
```

Script tersebut akan:
- install dependency PHP
- membuat `.env` jika belum ada
- generate application key
- menjalankan migrasi database
- install dependency frontend
- build asset production

## Environment Notes

Beberapa fitur membutuhkan konfigurasi environment tambahan, misalnya:

- database connection
- queue
- mail
- Sentry
- Gemini / AI integration

Sebaiknya dokumentasikan nilai env sensitif di tempat internal terpisah, dan gunakan README ini hanya untuk menjelaskan **kategori konfigurasi yang dibutuhkan**, bukan secret-nya.

## Deployment

Project ini sudah memiliki alur update manual ke Hostinger, dengan panduan utama di file `PANDUAN_UPDATE.txt`.

### Ringkasan proses deploy/update
1. Jalankan `deploy.bat` di lokal untuk build dan membuat `update.zip`
2. Upload `update.zip` ke server Hostinger
3. Extract ke folder project `caph`
4. Sinkronkan hasil build ke `public_html`
5. Jalankan migrasi jika ada perubahan schema/database
6. Bersihkan cache Laravel
7. Hard refresh browser

### Sinkronisasi build di server
```bash
cd domains/caph.io/caph
rm -rf ../public_html/build
cp -r public/build ../public_html/
rm -f ../public_html/hot
```

### Migration and cache clear
```bash
php artisan migrate --force
php artisan optimize:clear
```

## Troubleshooting

### Aset frontend tidak ter-update
Coba lakukan:
- pastikan `npm run build` sudah dijalankan
- sinkronkan ulang folder `public/build` ke `public_html`
- hapus file `hot` di server jika masih ada
- lakukan hard refresh browser (`Ctrl + Shift + R`)

### Error setelah deploy
Periksa hal berikut:
- `.env` di server sesuai
- permission file/folder benar
- migrasi database sudah dijalankan
- cache sudah dibersihkan dengan `php artisan optimize:clear`

### Error 500 di Hostinger
Mengacu ke panduan internal, cek apakah `public_html/index.php` sudah mengarah ke path project `caph` yang benar.

## Maintenance Notes

- README ini disusun berdasarkan struktur repo saat ini.
- Jika ada perubahan besar pada flow deploy, stack, atau modul utama, update README agar tetap relevan.
- Untuk detail operasional server yang lebih spesifik, tetap refer ke `PANDUAN_UPDATE.txt` atau dokumentasi internal tambahan.
