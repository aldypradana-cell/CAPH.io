import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import {
    MagnifyingGlass as Search,
    CaretDown as ChevronDown,
    ChatCircle as MessageCircle,
    EnvelopeSimple as Mail,
    Question as HelpCircle,
    BookOpen,
    Rocket,
    Receipt,
    Lightning,
    Sparkle,
    Fire,
    ChartBar,
    ChartLine,
    TrendUp,
    Target,
    CheckSquare,
    Repeat,
    Tag,
    Gear,
    Export,
    ArrowRight,
    Shield,
    Info,
    User,
    Wallet,
    PiggyBank,
    Diamond as Gem,
    TrendDown,
    Bell,
    ChatCircleDots,
} from '@phosphor-icons/react';

// ============================================================
// TYPES
// ============================================================

type FaqCategory = 'ALL' | 'GENERAL' | 'TRANSACTIONS' | 'AI_FEATURES' | 'BUDGET' | 'ACCOUNT' | 'SECURITY';
type TabId = 'faq' | 'panduan' | 'kontak';

interface FaqItem {
    question: string;
    answer: string;
    category: Exclude<FaqCategory, 'ALL'>;
}

interface GuideFeature {
    id: string;
    title: string;
    description: string;
    icon: React.ElementType;
    steps: { title: string; content: string }[];
}

interface OnboardingTask {
    title: string;
    description: string;
    route?: string;
    routeLabel?: string;
}

// ============================================================
// FAQ DATA
// ============================================================

const FAQ_CATEGORIES: { id: FaqCategory; label: string; icon: React.ElementType }[] = [
    { id: 'ALL', label: 'Semua', icon: HelpCircle },
    { id: 'GENERAL', label: 'Umum', icon: Info },
    { id: 'TRANSACTIONS', label: 'Transaksi', icon: Receipt },
    { id: 'AI_FEATURES', label: 'Fitur AI', icon: Sparkle },
    { id: 'BUDGET', label: 'Budget', icon: ChartBar },
    { id: 'ACCOUNT', label: 'Akun', icon: User },
    { id: 'SECURITY', label: 'Keamanan', icon: Shield },
];

const FAQS: FaqItem[] = [
    // -------- GENERAL --------
    {
        question: 'Apa itu CAPH.io?',
        answer: 'CAPH.io adalah aplikasi manajemen keuangan pribadi yang menggunakan kecerdasan buatan (AI) untuk membantu Anda mencatat, menganalisis, dan merencanakan keuangan dengan lebih cerdas dan efisien. Dengan CAPH.io, Anda bisa melacak pengeluaran, mengatur budget, dan mendapatkan insight keuangan berbasis AI.',
        category: 'GENERAL',
    },
    {
        question: 'Apakah aplikasi ini gratis?',
        answer: 'Ya, CAPH.io dapat digunakan sepenuhnya secara gratis dengan fitur-fitur dasar dan AI integration. Kami terus menambahkan fitur baru untuk meningkatkan pengalaman pengelolaan keuangan Anda.',
        category: 'GENERAL',
    },
    {
        question: 'Apakah CAPH.io tersedia di mobile?',
        answer: 'Saat ini CAPH.io adalah aplikasi web yang dapat diakses melalui browser di desktop maupun mobile. Pastikan menggunakan browser versi terbaru seperti Chrome, Firefox, Safari, atau Edge untuk pengalaman terbaik.',
        category: 'GENERAL',
    },
    {
        question: 'Browser apa yang didukung?',
        answer: 'CAPH.io mendukung browser modern: Chrome (direkomendasikan), Firefox, Safari, dan Edge versi terbaru. Kami sarankan menggunakan Chrome untuk performa terbaik dan kompatibilitas penuh dengan semua fitur.',
        category: 'GENERAL',
    },
    {
        question: 'Bagaimana cara memulai menggunakan CAPH.io?',
        answer: 'Cukup daftar dengan email dan password, lalu langsung bisa mulai mencatat transaksi. Ikuti checklist onboarding di menu Bantuan untuk panduan langkah demi langkah dalam 5 menit pertama.',
        category: 'GENERAL',
    },
    {
        question: 'Apa saja fitur utama CAPH.io?',
        answer: 'Fitur utama meliputi: Pencatatan transaksi manual & AI Smart Entry, Dompet (multi-akun), Budget & perencanaan bulanan, Tabungan & Goals, AI Insights & AI Roasting untuk insight keuangan, Habit Tracker di Dashboard, Analisis Arus Kas (Sankey Chart), Wealth Tree (visualisasi 3D), Aset & Emas Antam, Utang & Tagihan, Recurring Transaction, Export data, Kotak Saran, dan masih banyak lagi.',
        category: 'GENERAL',
    },
    {
        question: 'Apakah ada batas penyimpanan transaksi?',
        answer: 'Tidak ada batas. Anda bisa menyimpan sebanyak mungkin transaksi tanpa batasan. Kami sarankan rutin mengekspor data secara berkala untuk backup.',
        category: 'GENERAL',
    },
    {
        question: 'Di mana saya bisa lihat Wealth Tree?',
        answer: 'Wealth Tree adalah visualisasi 3D voxel yang bisa diakses dari Dashboard. Klik kartu "Net Worth" di bagian atas Dashboard untuk membuka popup Wealth Tree interaktif.',
        category: 'GENERAL',
    },

    // -------- TRANSACTIONS --------
    {
        question: 'Bagaimana cara menambahkan transaksi baru?',
        answer: 'Ada tiga cara: (1) Klik tombol "+" di Dashboard, (2) Gunakan menu "Input AI" dan ketik transaksi dalam bahasa sehari-hari, (3) Import dari file CSV/Excel melalui menu Export.',
        category: 'TRANSACTIONS',
    },
    {
        question: 'Apa itu AI Smart Entry dan bagaimana cara kerjanya?',
        answer: 'AI Smart Entry adalah fitur yang memungkinkan Anda mencatat transaksi hanya dengan mengetikkan deskripsi dalam bahasa sehari-hari. Contoh: "Makan siang nasi goreng 25rb". AI akan otomatis mendeteksi kategori, jumlah, dan tanggal transaksi. Mendukung juga input suara via microphone.',
        category: 'TRANSACTIONS',
    },
    {
        question: 'Apakah saya bisa edit transaksi yang sudah disimpan?',
        answer: 'Tentu. Pergi ke menu "Riwayat", cari transaksi yang ingin diubah, lalu klik ikon pensil (Edit) di sebelah kanan baris transaksi tersebut. Anda bisa mengubah jumlah, kategori, tanggal, atau keterangan lainnya.',
        category: 'TRANSACTIONS',
    },
    {
        question: 'Bagaimana cara menghapus transaksi?',
        answer: 'Di halaman Riwayat, klik ikon pensil pada transaksi yang ingin dihapus. Di mode edit, Anda akan menemukan tombol "Hapus Transaksi" berwarna merah di bagian bawah. Konfirmasi untuk menghapus permanen.',
        category: 'TRANSACTIONS',
    },
    {
        question: 'Bisakah saya import transaksi dari bank atau e-wallet?',
        answer: 'Ya. Gunakan menu "Export" untuk mengimpor data transaksi dari file CSV atau Excel. Format kolom: Tanggal, Dompet, Kategori, Jumlah, Tipe.',
        category: 'TRANSACTIONS',
    },
    {
        question: 'Bagaimana cara membedakan income dan expense?',
        answer: 'Saat menambahkan transaksi, cukup pilih tipe: "Pemasukan" atau "Pengeluaran". Untuk AI Smart Entry, Anda bisa langsung tulis misalnya "Gaji 10 juta" (pemasukan) atau "Beli makan 50rb" (pengeluaran), AI akan otomatis mendeteksi tipenya.',
        category: 'TRANSACTIONS',
    },
    {
        question: 'Bisakah saya menambah kategori transaksi sendiri?',
        answer: 'Ya. Buka menu "Kategori & Tags" untuk menambah, mengedit, atau menghapus kategori. Anda juga bisa memilih icon dan warna untuk setiap kategori.',
        category: 'TRANSACTIONS',
    },
    {
        question: 'Apakah transaksi bisa ditandai dengan tags?',
        answer: 'Ya. Saat menambah atau mengedit transaksi, Anda bisa menambahkan satu atau lebih tags. Tags berguna untuk filtro tambahan — contoh: #liburan, #urgent, #kantor.',
        category: 'TRANSACTIONS',
    },
    {
        question: 'Apa itu Recurring Transaction?',
        answer: 'Recurring Transaction adalah transaksi berulang yang bisa dijadwalkan. Contoh: tagihan internet bulanan, langganan streaming, atau gaji masuk. Kelola di menu "Utang & Tagihan" — tab Transaksi Berulang.',
        category: 'TRANSACTIONS',
    },
    {
        question: 'Bisakah saya filter transaksi berdasarkan periode waktu?',
        answer: 'Ya. Di halaman Riwayat, gunakan filter tanggal untuk menampilkan transaksi dalam rentang waktu tertentu — harian, mingguan, bulanan, atau custom range.',
        category: 'TRANSACTIONS',
    },
    {
        question: 'Apa itu Wealth Tree?',
        answer: 'Wealth Tree adalah visualisasi 3D voxel interaktif yang menampilkan distribusi kekayaan Anda berdasarkan kategori dan sub-kategori. Klik kartu Net Worth di Dashboard untuk membuka popup Wealth Tree.',
        category: 'TRANSACTIONS',
    },

    // -------- AI FEATURES --------
    {
        question: 'Apa bedanya AI Smart Entry, AI Analisis, dan AI Roasting?',
        answer: 'Tiga fitur AI berbeda di menu "Insights": (1) AI Smart Entry — mencatat transaksi lewat teks atau suara bahasa sehari-hari. (2) AI Analisis — memberikan Health Score, cash flow analysis, spending alerts, dan action items. (3) AI Roasting — "curhat" jujur dan humoris tentang kebiasaan keuangan Anda. Smart Entry ada di menu terpisah, Analisis dan Roasting ada di halaman Insights yang sama.',
        category: 'AI_FEATURES',
    },
    {
        question: 'Apakah AI Smart Entry mendukung semua bahasa?',
        answer: 'AI Smart Entry dirancang untuk memahami Bahasa Indonesia sehari-hari. Mendukung juga input suara via microphone. Untuk hasil terbaik, gunakan deskripsi yang jelas: "Makan siang di warteg 35rb".',
        category: 'AI_FEATURES',
    },
    {
        question: 'Apa yang dianalisis oleh AI Analisis?',
        answer: 'AI Analisis di halaman Insights memberikan: Health Score (skor kesehatan keuangan), Cash Flow analysis (income vs expense bulanan), Emergency Fund readiness, Budget Compliance, Spending Alerts (peringatan pengeluaran tidak biasa), dan Action Items prioritas tinggi.',
        category: 'AI_FEATURES',
    },
    {
        question: 'Seberapa sering AI Analisis diperbarui?',
        answer: 'AI Analisis diperbarui setiap kali Anda menambahkan transaksi baru. Klik tombol "Generate Insights" untuk minta analisis ulang kapan saja.',
        category: 'AI_FEATURES',
    },
    {
        question: 'Bagaimana cara menggunakan AI Roasting?',
        answer: 'Di halaman Insights, gulir ke bagian Roasting. Pilih level: Halus, Medium, atau Brutal — lalu klik "Roast Me". AI akan memberikan candaan berdasarkan data transaksi Anda. Setiap roasting dilengkapi Waste Score dan challenge untuk perbaikan.',
        category: 'AI_FEATURES',
    },
    {
        question: 'Apakah hasil AI bisa salah?',
        answer: 'Seperti alat AI lainnya, hasil AI Analisis dan AI Roasting adalah saran berbasis pola data dan tidak selalu 100% akurat. Selalu gunakan penilaian Anda sendiri dalam mengambil keputusan keuangan.',
        category: 'AI_FEATURES',
    },

    // -------- BUDGET --------
    {
        question: 'Bagaimana cara membuat budget bulanan?',
        answer: 'Buka menu "Budget", lalu klik "Tambah Budget". Pilih kategori pengeluaran, masukkan nominal batas bulanan. Anda juga bisa klik "Auto-Generate" untuk membuat budget otomatis berdasarkan rata-rata pengeluaran 3 bulan terakhir.',
        category: 'BUDGET',
    },
    {
        question: 'Bisakah saya membuat budget per kategori?',
        answer: 'Ya. Anda bisa membuat beberapa budget sekaligus, masing-masing untuk kategori berbeda. Contoh: Food & Dining Rp1.500.000, Transportasi Rp500.000, Hiburan Rp300.000, dan seterusnya.',
        category: 'BUDGET',
    },
    {
        question: 'Bagaimana cara kerja Auto-Generate Budget?',
        answer: 'Klik tombol "Auto-Generate" di halaman Budget. Sistem akan menganalisis rata-rata pengeluaran per kategori dari 3 bulan terakhir dan membuat budget otomatis berdasarkan data historis tersebut.',
        category: 'BUDGET',
    },
    {
        question: 'Apa itu Goal / Target Tabungan?',
        answer: 'Goal Tabungan di menu Tabungan memungkinkan Anda menetapkan target keuangan jangka pendek atau jangka panjang. Contoh: "Liburan Rp5.000.000" atau "DP Rumah Rp50.000.000". CAPH.io melacak progress dan menghitung estimasi waktu tercapai.',
        category: 'BUDGET',
    },
    {
        question: 'Apa itu Saving Wallet dan Vault?',
        answer: 'Saving Wallet di menu Tabungan adalah rekening tabungan terpisah. Ada 3 tipe: Tabungan (fleksibel), Deposito (tersimpan lebih lama), dan Vault (terkunci sampai tanggal jatuh tempo tertentu).',
        category: 'BUDGET',
    },

    // -------- ACCOUNT --------
    {
        question: 'Bagaimana cara reset password?',
        answer: 'Klik "Lupa Password" di halaman login, masukkan email Anda, dan kami akan kirimkan link reset password. Jika tidak menerima email, periksa folder Spam atau hubungi support@caph.io.',
        category: 'ACCOUNT',
    },
    {
        question: 'Bagaimana cara ganti password?',
        answer: 'Buka menu "Profil" > "Update Password". Masukkan password lama, password baru dua kali untuk konfirmasi. Pastikan password baru minimal 8 karakter.',
        category: 'ACCOUNT',
    },
    {
        question: 'Apa itu Dompet dan bagaimana cara pakainya?',
        answer: 'Dompet adalah akun keuangan terpisah — bisa cash, rekening bank, atau e-wallet. Setiap transaksi perlu dipilih dompetnya. Buka menu Dompet untuk menambah, edit, archive, atau set dompet utama.',
        category: 'ACCOUNT',
    },
    {
        question: 'Apakah bisa login dari beberapa perangkat?',
        answer: 'Ya, Anda bisa login dari beberapa perangkat sekaligus. Namun untuk keamanan, kami sarankan rutin memeriksa aktivitas login dan logout dari perangkat yang tidak dikenali.',
        category: 'ACCOUNT',
    },

    // -------- SECURITY & DATA --------
    {
        question: 'Apakah data keuangan saya aman?',
        answer: 'Ya. Data Anda disimpan secara aman di server dengan enkripsi. Kami mengikuti praktik keamanan industry standar. Namun, kami tetap menyarankan Anda untuk tidak membagikan login akun kepada orang lain.',
        category: 'SECURITY',
    },
    {
        question: 'Apakah data saya dibagikan ke pihak lain?',
        answer: 'Tidak. Data keuangan Anda adalah milik Anda sepenuhnya. Kami tidak menjual, membagikan, atau menggunakan data Anda untuk keperluan marketing. Privasi Anda adalah prioritas kami.',
        category: 'SECURITY',
    },
    {
        question: 'Bagaimana cara backup data?',
        answer: 'Buka menu "Export" dan pilih format backup yang diinginkan — CSV atau Excel. Kami sarankan melakukan backup rutin sebulan sekali agar data selalu aman dan up-to-date.',
        category: 'SECURITY',
    },
    {
        question: 'Apakah bisa restore data dari backup?',
        answer: 'Ya. Dari menu "Export", pilih opsi "Import Data" dan upload file backup Anda. Sistem akan membaca dan mengembalikan transaksi sesuai data di file backup.',
        category: 'SECURITY',
    },
    {
        question: 'Apa yang terjadi jika saya lupa logout di perangkat lain?',
        answer: 'Anda bisa logout dari semua sesi melalui menu Profil > Keamanan > "Logout dari Semua Perangkat". Ini akan mengakhiri semua sesi aktif di perangkat lain secara otomatis.',
        category: 'SECURITY',
    },
];

// ============================================================
// PANDUAN DATA
// ============================================================

const GUIDE_FEATURES: GuideFeature[] = [
    {
        id: 'getting-started',
        title: 'Memulai',
        description: 'Pelajari dasar-dasar CAPH.io dalam 5 menit pertama.',
        icon: Rocket,
        steps: [
            { title: 'Daftar Akun', content: 'Klik "Daftar" di halaman utama. Masukkan nama, email aktif, dan password. Verifikasi email jika diperlukan.' },
            { title: 'Tambah Dompet', content: 'Buka menu Dompet untuk menambah akun dompet pertama Anda — bisa cash, bank, atau e-wallet. Dompet ini akan digunakan untuk mencatat transaksi.' },
            { title: 'Pahami Dashboard', content: 'Dashboard menampilkan ringkasan keuangan: Total aset, Net Worth, grafik pengeluaran, habit tracker, dan transaksi terbaru. Luangkan 1 menit untuk mengeksplor setiap widget.' },
            { title: 'Catat Transaksi Pertama', content: 'Gunakan AI Smart Entry dan ketik: "Gaji 10 juta" untuk pemasukan pertama. AI otomatis mendeteksi tipe, kategori, dan tanggal.' },
            { title: 'Buat Budget Pertama', content: 'Pergi ke menu Budget, klik "Tambah Budget", pilih kategori utama seperti "Makanan" dengan nominal Rp1.000.000. Mulai dari yang sederhana.' },
        ],
    },
    {
        id: 'transactions',
        title: 'Transaksi',
        description: 'Cara mencatat, mengedit, dan mengelola transaksi keuangan.',
        icon: Receipt,
        steps: [
            { title: 'Menambah Transaksi Manual', content: 'Klik tombol "+" di Dashboard atau menu Transaksi. Pilih tipe (Pemasukan/Pengeluaran), pilih dompet, masukkan jumlah, pilih kategori, tentukan tanggal, dan simpan.' },
            { title: 'Mengedit Transaksi', content: 'Buka halaman Riwayat, cari transaksi, klik ikon pensil. Ubah field yang diperlukan dan simpan.' },
            { title: 'Menghapus Transaksi', content: 'Di mode edit transaksi, scroll ke bawah dan klik tombol "Hapus Transaksi" berwarna merah. Konfirmasi untuk menghapus permanen.' },
            { title: 'Filter & Pencarian', content: 'Gunakan filter tanggal di halaman Riwayat untuk melihat transaksi harian, mingguan, atau bulanan. Gunakan search bar untuk mencari transaksi spesifik.' },
            { title: 'Bulk Actions', content: 'Di halaman Riwayat, centang beberapa transaksi lalu gunakan menu bulk action — hapus banyak sekaligus atau export yang dipilih.' },
        ],
    },
    {
        id: 'ai-smart-entry',
        title: 'AI Smart Entry',
        description: 'Catat transaksi cepat dengan bahasa sehari-hari.',
        icon: Lightning,
        steps: [
            { title: 'Buka AI Smart Entry', content: 'Klik menu "Input AI" di sidebar. Anda akan melihat field teks besar dan tombol microphone untuk voice input.' },
            { title: 'Ketik atau Suara', content: 'Tulis transaksi seperti bercerita: "Makan siang nasi goreng 25rb". Atau klik ikon microphone untuk input suara — AI akan mengkonversi suara ke teks dan memproses.' },
            { title: 'Review Hasil Parsing', content: 'AI menampilkan hasil parsing: kategori terdeteksi, jumlah, tipe (pemasukan/pengeluaran), dan tanggal. Review dan edit jika perlu.' },
            { title: 'Simpan Langsung', content: 'Klik "Konfirmasi" untuk langsung menyimpan transaksi. Semua transaksi masuk ke halaman Riwayat dan memengaruhi dashboard.' },
            { title: 'Contoh Penggunaan', content: 'Pemasukan: "Gaji bulan ini 15 juta". Pengeluaran: "Beli bensin 150rb Shell". Tagihan: "Bayar cicilan motor 2 juta".' },
        ],
    },
    {
        id: 'ai-insights',
        title: 'AI Insights & Roasting',
        description: 'Insight keuangan berbasis AI dan candaan blak-blakan.',
        icon: Sparkle,
        steps: [
            { title: 'Buka Menu Insights', content: 'Navigasi ke menu "Insights" dari sidebar. Satu halaman berisi semua: AI Analisis dan AI Roasting.' },
            { title: 'AI Analisis — Health Score', content: 'Lihat skor kesehatan keuangan Anda (Health Score) beserta label: Excellent, Good, Cautious, Warning, atau Critical berdasarkan pola cash flow.' },
            { title: 'AI Analisis — Rincian', content: 'AI menampilkan: Cash Flow (income vs expense), Emergency Fund readiness, Budget Compliance per kategori, Spending Alerts, dan Action Items prioritas tinggi.' },
            { title: 'AI Roasting', content: 'Gulir ke bagian Roasting. Pilih level: Halus, Medium, atau Brutal — lalu klik "Roast Me". AI akan memberikan "curhat" jujur dan humoris tentang kebiasaan keuangan Anda berdasarkan data nyata.' },
            { title: 'Waste Score', content: 'Setiap roasting dilengkapi Waste Score: skor 0-100 yang menunjukkan seberapa banyak pengeluaran yang bisa dianggap "pemborosan". Accompanying badge nama lucu, misalnya: "Raja Impulse Buyer".' },
            { title: 'Challenge', content: 'Setelah roasting, AI memberikan Challenge — saran konkret untuk mengurangi waste. Contoh: "Kurangi nongkrong 2x seminggu, hemat Rp300rb/bulan".' },
        ],
    },
    {
        id: 'analytics',
        title: 'Analisis Arus Kas',
        description: 'Visualisasi Sankey chart untuk memahami aliran dana.',
        icon: ChartLine,
        steps: [
            { title: 'Buka Analisis Arus Kas', content: 'Navigasi ke menu "Analytics" dari sidebar. Pilih periode tanggal di bagian atas untuk menyesuaikan rentang waktu analisis.' },
            { title: 'Sankey Chart', content: 'Sankey Chart menampilkan aliran dana secara visual — semakin besar alirannya, semakin besar proporsi dana di kategori tersebut. Ini membantu memahami money flow bulanan.' },
            { title: 'Atur Periode', content: 'Gunakan date picker untuk memilih rentang tanggal — harian, mingguan, atau custom range. Data akan otomatis refresh dengan animasi.' },
            { title: 'Refresh Data', content: 'Klik tombol refresh di pojok kanan atas untuk memperbarui data Sankey secara manual.' },
        ],
    },
    {
        id: 'dashboard',
        title: 'Dashboard',
        description: 'Kelola Net Worth, Wealth Tree, dan Habit Tracker.',
        icon: TrendUp,
        steps: [
            { title: 'Net Worth Card', content: 'Klik kartu Net Worth di bagian atas Dashboard untuk membuka popup Wealth Tree — visualisasi 3D voxel distribusi kekayaan Anda.' },
            { title: 'Wealth Tree (3D Voxel)', content: 'Wealth Tree menampilkan distribusi kekayaan dalam format visual unik berbasis voxel. Anda bisa mengeksplorasi kategori dan sub-kategori kekayaan dengan interaksi klik.' },
            { title: 'Habit Tracker Widget', content: 'Habit Tracker widget menampilkan kebiasaan keuangan harian — centang setiap kebiasaan yang sudah dilakukan. Streak counter menghitung konsistensi harian dan mingguan.' },
            { title: 'Stats Cards', content: 'Stats cards menampilkan ringkasan: saldo dompet, total transaksi bulan ini, budget tersisa, dan Net Worth terbaru.' },
            { title: 'Budget Widget', content: 'Widget Budget menampilkan progress budget bulanan per kategori — hijau (aman), kuning (80%+), merah (melebihi batas).' },
            { title: 'Customize Layout', content: 'Dashboard menggunakan grid layout responsif yang bisa di-drag dan resize. Atur widget sesuai preferensi Anda.' },
        ],
    },
    {
        id: 'wallets',
        title: 'Dompet',
        description: 'Kelola berbagai akun dompet: cash, bank, dan e-wallet.',
        icon: Wallet,
        steps: [
            { title: 'Tambah Dompet Baru', content: 'Buka menu Dompet, klik "Tambah Dompet". Pilih tipe: Tunai, Rekening Bank, atau E-Wallet. Beri nama dan saldo awal.' },
            { title: 'Set Dompet Utama', content: 'Tandai salah satu dompet sebagai Dompet Utama (primary). Transaksi baru secara default menggunakan dompet ini.' },
            { title: 'Edit & Archive', content: 'Edit nama atau tipe dompet kapan saja. Archiving dompet menyembunyikannya dari daftar aktif tanpa menghapus data transaksi.' },
            { title: 'Balance per Dompet', content: 'Setiap dompet menampilkan saldo otomatis yang dihitung dari semua transaksi terkait. Saldo berwarna hijau jika positif, merah jika negatif.' },
            { title: 'Alokasi Penghasilan', content: 'Setiap dompet bisa diatur alokasi penghasilan bulanan — berguna untuk budgeting berbasis dompet (envelope budgeting method).' },
        ],
    },
    {
        id: 'budget',
        title: 'Budget',
        description: 'Atur batas pengeluaran bulanan per kategori.',
        icon: ChartBar,
        steps: [
            { title: 'Buat Budget Baru', content: 'Di menu Budget, klik "Tambah Budget". Pilih kategori pengeluaran, masukkan nominal batas bulanan.' },
            { title: 'Auto-Generate Budget', content: 'Gunakan tombol "Auto-Generate" — sistem akan membuat budget berdasarkan rata-rata pengeluaran kategori 3 bulan terakhir.' },
            { title: 'Pantau Progress', content: 'Dashboard menampilkan progress budget per kategori — warna hijau (aman), kuning (80%+), merah (melebihi batas). Progress bar visual setiap saat.' },
            { title: 'Budget Bulanan Otomatis', content: 'Budget berjalan per periode bulanan. Di awal bulan baru, budget akan reset dan mulai lagi dari nol.' },
            { title: 'Review Performa', content: 'Di akhir bulan, review performa budget: kategori mana yang paling overrun, mana yang underspend. Gunakan insight ini untuk planning bulan depan.' },
        ],
    },
    {
        id: 'savings',
        title: 'Tabungan & Goals',
        description: 'Kelola tabungan dan target keuangan jangka panjang.',
        icon: PiggyBank,
        steps: [
            { title: 'Buat Saving Wallet', content: 'Di menu Tabungan, klik "Tambah Tabungan". Beri nama, pilih tipe: Tabungan, Deposito, atau Vault. Vault adalah tabungan yang terkunci sampai tanggal tertentu.' },
            { title: 'Buat Goal Baru', content: 'Di bagian Goals, klik "Tambah Goal". Beri nama target, nominal yang ingin dicapai, dan deadline. Pilih warna dan icon untuk visualisasi.' },
            { title: 'Top Up Tabungan', content: 'Klik "Top Up" di saving wallet untuk menambahkan saldo. Pilih sumber dari dompet utama dan jumlah yang ditransfer.' },
            { title: 'Withdraw', content: 'Klik "Withdraw" untuk menarik saldo dari tabungan. Vault hanya bisa di-withdraw setelah melewati tanggal jatuh tempo.' },
            { title: 'Track Progress Goal', content: 'Goal menampilkan progress bar otomatis. Sistem menghitung estimasi waktu tercapai berdasarkan rata-rata top up bulanan.' },
        ],
    },
    {
        id: 'assets',
        title: 'Aset & Emas',
        description: 'Pantau portofolio aset dan investasi emas.',
        icon: Gem,
        steps: [
            { title: 'Tambah Aset', content: 'Buka menu Aset, klik "Tambah Instrumen". Pilih tipe: Properti, Kendaraan, Investasi, atau Lainnya. Masukkan nama, nilai saat ini, dan deskripsi.' },
            { title: 'Pie Chart Portofolio', content: 'Dashboard Aset menampilkan pie chart distribusi nilai aset per kategori. Persentase portofolio dihitung otomatis dari total.' },
            { title: 'Tab Emas Antam', content: 'Gunakan tab "Emas Antam" untuk mencatat pembelian dan harga emas. Tabungan emas Anda akan di-track dengan harga live.' },
            { title: 'Grand Total', content: 'Grand Total Aset di bagian atas menjumlahkan semua: Fiat + Properti + Investasi + Emas. Nilainya diformat otomatis — jutaan, miliaran, atau triliun.' },
            { title: 'Edit & Hapus', content: 'Klik ikon pensil untuk edit nama/nilai aset. Klik ikon trash untuk menghapus aset. Hapus tidak memengaruhi transaksi.' },
        ],
    },
    {
        id: 'debts',
        title: 'Utang & Tagihan',
        description: 'Kelola utang, piutang, tagihan, dan transaksi berulang.',
        icon: TrendDown,
        steps: [
            { title: 'Tab Utang/Piutang', content: 'Di halaman Utang, gunakan tab "Utang" untuk mencatat uang yang Anda pinjam atau "Piutang" untuk uang yang harus diterima dari orang lain. Masukkan nama, jumlah, dan tanggal jatuh tempo.' },
            { title: 'Tab Tagihan (Bills)', content: 'Tab "Tagihan" untuk tagihan rutin seperti listrik, air, internet. Berbeda dari recurring transaction — tagihan ini perlu dibayar manual.' },
            { title: 'Tab Transaksi Berulang', content: 'Tab "Transaksi Berulang" untuk mengatur recurring transaction — contoh: gaji masuk bulanan, langganan streaming, cicilan. Atur frekuensi dan tanggal mulai.' },
            { title: 'Tab Cicilan', content: 'Tab "Cicilan" untuk mengelola pinjaman dengan jadwal pembayaran tetap. Sistem menampilkan progress cicilan dan estimasi tanggal lunas.' },
            { title: 'Bayar Utang/Tagihan', content: 'Klik tombol "Bayar" di item utang atau tagihan. Masukkan jumlah yang dibayar. Sistem otomatis mengurangi sisa utang dan mencatat sebagai transaksi.' },
            { title: 'Proyeksi Bebas Hutang', content: 'Chart "Proyeksi Bebas Hutang" menampilkan estimasi kapan semua utang akan lunas berdasarkan kecepatan pembayaran saat ini.' },
        ],
    },
    {
        id: 'categories',
        title: 'Kategori & Tags',
        description: 'Organisir transaksi dengan kategori dan tags.',
        icon: Tag,
        steps: [
            { title: 'Default Kategori', content: 'CAPH.io sudah menyediakan kategori default: Makanan, Transportasi, Hiburan, Kesehatan, Belanja, dll. Langsung bisa dipakai tanpa setup.' },
            { title: 'Buat Kategori Baru', content: 'Di menu Kategori, klik "Tambah Kategori". Beri nama, pilih icon dari library Phosphor Icons, dan tentukan warna. Ini membantu visualisasi di laporan.' },
            { title: 'Hide Kategori', content: 'Klik toggle untuk menyembunyikan kategori yang tidak digunakan. Kategori tersembunyi tidak muncul di dropdown transaksi tapi data historis tetap aman.' },
            { title: 'Tags di Transaksi', content: 'Saat menambah transaksi, tambahkan tags opsional. Tags berguna untuk filtro tambahan — contoh: #liburan, #urgent, #kantor.' },
        ],
    },
    {
        id: 'export',
        title: 'Export & Import',
        description: 'Backup dan eksport data keuangan Anda.',
        icon: Export,
        steps: [
            { title: 'Pilih Periode', content: 'Di menu Export, pilih rentang tanggal untuk data yang ingin diexport — bulanan, kuartalan, atau custom range.' },
            { title: 'Pilih Dompet', content: 'Secara default semua dompet diexport. Anda bisa filter hanya dompet tertentu dengan memilih dari dropdown.' },
            { title: 'Preview Data', content: 'Klik "Preview" untuk melihat ringkasan data: jumlah transaksi, total income, expense, dan net sebelum mendownload.' },
            { title: 'Export Excel', content: 'Download dalam format Excel (.xlsx) — paling direkomendasikan untuk analisis data lebih lanjut. File berisi semua transaksi dengan kolom lengkap.' },
            { title: 'Export PDF', content: 'Download laporan dalam format PDF untuk keperluan arsip atau dokumentasi formal.' },
            { title: 'Import Data', content: 'Gunakan menu Import untuk mengembalikan data dari file backup. Pastikan format kolom sesuai template: Tanggal, Dompet, Kategori, Jumlah, Tipe.' },
        ],
    },
    {
        id: 'notifications',
        title: 'Notifikasi',
        description: 'Kelola semua notifikasi dan pengingat.',
        icon: Bell,
        steps: [
            { title: 'Lihat Semua Notifikasi', content: 'Navigasi ke menu Notifikasi untuk melihat semua notifikasi: budget alert, recurring reminder, tagihan jatuh tempo, dan update sistem.' },
            { title: 'Tandai Sudah Baca', content: 'Klik ikon notifikasi untuk menandai sebagai sudah dibaca. Gunakan "Tandai Semua Baca" untuk reset seluruh daftar.' },
            { title: 'Filter Notifikasi', content: 'Gunakan tab "Semua" atau "Belum Dibaca" untuk filtro cepat. Badge counter menampilkan jumlah notifikasi yang belum dibaca.' },
            { title: 'Jenis Notifikasi', content: 'Notifikasi meliputi: WARNING (peringatan budget), ALERT (tagihan jatuh tempo), SUCCESS (transaksi berhasil), dan INFO (update fitur baru).' },
        ],
    },
    {
        id: 'profile-settings',
        title: 'Profil & Pengaturan',
        description: 'Kelola akun, preferensi, dan keamanan.',
        icon: Gear,
        steps: [
            { title: 'Edit Profil', content: 'Buka menu Profil untuk mengubah nama, email, dan informasi personal lainnya.' },
            { title: 'Preferensi Aplikasi', content: 'Di menu Pengaturan, atur preferensi: mata uang, zona waktu, bahasa, dan tema tampilan (light/dark/system).' },
            { title: 'Profil Keuangan', content: 'Di halaman Profil, lengkapi Profil Keuangan: Monthly Income, Monthly Expense, dan Monthly Savings Goals. Data ini membantu AI memberikan insight yang lebih akurat.' },
            { title: 'Ganti Password', content: 'Di halaman Profil, klik "Update Password". Masukkan password lama, password baru, dan konfirmasi. Minimum 8 karakter.' },
            { title: 'Delete Account', content: 'Di bagian bawah halaman Profil, tersedia opsi untuk menghapus akun. Perhatian: aksi ini permanen dan tidak bisa dibatalkan — semua data akan dihapus.' },
        ],
    },
    {
        id: 'feedback',
        title: 'Kotak Saran',
        description: 'Kirim saran, laporan bug, atau pertanyaan ke tim kami.',
        icon: ChatCircleDots,
        steps: [
            { title: 'Buka Kotak Saran', content: 'Navigasi ke menu "Kotak Saran" dari sidebar. Formulir tersedia tanpa perlu login khusus — semua user bisa mengirim feedback.' },
            { title: 'Pilih Kategori', content: 'Pilih kategori feedback: Saran, Bug/Masalah, Pertanyaan, atau Lainnya. Ini membantu tim admin memprioritaskan respons.' },
            { title: 'Isi Formulir', content: 'Masukkan subjek dan pesan lengkap. Semakin detail, semakin mudah tim kami membantu.' },
            { title: 'Submit', content: 'Klik "Kirim". Feedback akan masuk ke sistem admin. Admin bisa membalas dan mengubah status: Menunggu, Ditinjau, Dijawab, atau Ditutup.' },
            { title: 'Lihat Status', content: 'Setelah submit, status feedback akan update di halaman yang sama: Menunggu → Ditinjau → Dijawab. Admin bisa meninggalkan balasan yang bisa Anda baca.' },
        ],
    },
];

const ONBOARDING_TASKS: OnboardingTask[] = [
    { title: 'Tambah Dompet Pertama', description: 'Tambahkan minimal 1 dompet — cash, bank, atau e-wallet — sebelum mulai mencatat transaksi.', route: 'wallets.index', routeLabel: 'Tambah Dompet' },
    { title: 'Catat Transaksi Pertama', description: 'Gunakan AI Smart Entry untuk mencatat transaksi pertama — pemasukan atau pengeluaran.', route: 'smart-entry.index', routeLabel: 'Input AI' },
    { title: 'Setup Budget Bulanan', description: 'Buat minimal 3 budget: Makanan, Transportasi, dan Kebutuhan Harian.', route: 'budgets.index', routeLabel: 'Setup Budget' },
    { title: 'Jelajahi AI Insights', description: 'Buka menu Insights untuk melihat health score dan cicipi AI Roasting pertama Anda.', route: 'insights.index', routeLabel: 'Buka Insights' },
    { title: 'Pantau Wealth Tree', description: 'Klik kartu Net Worth di Dashboard untuk membuka visualisasi Wealth Tree 3D.', route: 'dashboard', routeLabel: 'Buka Dashboard' },
    { title: 'Export Data Pertama', description: 'Lakukan backup pertama — export data ke file Excel untuk jaga-jaga.', route: 'export.index', routeLabel: 'Export Sekarang' },
];

// ============================================================
// TABS
// ============================================================

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'faq', label: 'FAQ', icon: HelpCircle },
    { id: 'panduan', label: 'Panduan', icon: BookOpen },
    { id: 'kontak', label: 'Kontak', icon: MessageCircle },
];

// ============================================================
// HELP CENTER COMPONENT
// ============================================================

export default function HelpCenter() {
    // Tab state
    const [activeTab, setActiveTab] = useState<TabId>('faq');

    // FAQ state
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<FaqCategory>('ALL');
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

    // Panduan state
    const [activeGuideIndex, setActiveGuideIndex] = useState<number>(0);
    const [openGuideStepIndex, setOpenGuideStepIndex] = useState<number | null>(null);

    // Filtered FAQs
    const filteredFaqs = FAQS.filter(faq => {
        const matchesSearch =
            searchTerm === '' ||
            faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory =
            activeCategory === 'ALL' || faq.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    // Auto-open first result when searching
    const effectiveOpenFaqIndex =
        searchTerm !== '' || activeCategory !== 'ALL'
            ? filteredFaqs.length > 0 ? 0 : null
            : openFaqIndex;

    const activeGuide = GUIDE_FEATURES[activeGuideIndex];

    return (
        <>
            <Head title="Bantuan & FAQ" />

            <div className="space-y-8 animate-fade-in-up">
                {/* Hero */}
                <div className="relative bg-gradient-to-r from-emerald-600 to-teal-700 rounded-[2.5rem] p-10 text-center text-white overflow-hidden shadow-xl ring-1 ring-[#C5A059]/30">
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl" />
                    <div className="relative z-10 max-w-2xl mx-auto">
                        <h2 className="text-3xl font-bold mb-4">Bagaimana kami bisa membantu?</h2>
                        <p className="text-emerald-100 mb-8">
                            Temukan jawaban cepat untuk pertanyaan umum, pelajari fitur, atau hubungi tim support kami.
                        </p>
                        <div className="relative group">
                            <Search weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                            <input
                                type="text"
                                placeholder="Cari pertanyaan atau topik..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-6 py-4 rounded-2xl text-slate-800 focus:outline-none focus:ring-4 focus:ring-white/30 shadow-lg placeholder:text-slate-400 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex items-center justify-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 max-w-md mx-auto">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                type="button"
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex-1 justify-center ${
                                    isActive
                                        ? 'bg-emerald-600 text-white shadow-md'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                <Icon weight={isActive ? 'fill' : 'regular'} className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* ===================== FAQ TAB ===================== */}
                {activeTab === 'faq' && (
                    <div className="space-y-6">
                        {/* Category Filter */}
                        <div className="flex items-center gap-2 flex-wrap px-2">
                            {FAQ_CATEGORIES.map((cat) => {
                                const Icon = cat.icon;
                                const isActive = activeCategory === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id)}
                                        type="button"
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                            isActive
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400'
                                        }`}
                                    >
                                        <Icon weight={isActive ? 'fill' : 'regular'} className="w-3.5 h-3.5" />
                                        {cat.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* FAQ List */}
                        {filteredFaqs.length === 0 ? (
                            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                                <HelpCircle weight="duotone" className="w-14 h-14 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500 dark:text-slate-400 font-medium mb-2">
                                    Tidak ada hasil ditemukan.
                                </p>
                                <button
                                    onClick={() => { setSearchTerm(''); setActiveCategory('ALL'); }}
                                    type="button"
                                    className="text-sm text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                                >
                                    Reset pencarian
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {searchTerm && (
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 px-2">
                                        Ditemukan {filteredFaqs.length} hasil untuk "{searchTerm}"
                                    </p>
                                )}
                                {filteredFaqs.map((faq, index) => {
                                    const Icon = FAQ_CATEGORIES.find(c => c.id === faq.category)?.icon || HelpCircle;
                                    const isOpen = effectiveOpenFaqIndex === index;
                                    return (
                                        <div
                                            key={index}
                                            className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-300 overflow-hidden ${
                                                isOpen
                                                    ? 'border-emerald-300 dark:border-emerald-700 shadow-md'
                                                    : 'border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-200 dark:hover:border-emerald-800'
                                            }`}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                                                aria-expanded={isOpen}
                                                className="w-full flex items-center justify-between p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-2xl"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`p-2 rounded-lg shrink-0 ${
                                                        isOpen
                                                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                                    }`}>
                                                        <Icon weight="duotone" className="w-4 h-4" />
                                                    </div>
                                                    <span className={`font-bold text-sm leading-snug ${
                                                        isOpen
                                                            ? 'text-emerald-900 dark:text-white'
                                                            : 'text-slate-700 dark:text-slate-200'
                                                    }`}>
                                                        {faq.question}
                                                    </span>
                                                </div>
                                                <ChevronDown
                                                    weight="bold"
                                                    className={`w-5 h-5 text-slate-400 transition-transform duration-300 shrink-0 ml-3 ${
                                                        isOpen ? 'rotate-180 text-emerald-500' : ''
                                                    }`}
                                                />
                                            </button>
                                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                                                isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                            }`}>
                                                <div className="px-5 pb-5 pl-[4.5rem] text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                                    {faq.answer}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ===================== PANDUAN TAB ===================== */}
                {activeTab === 'panduan' && (
                    <div className="space-y-6">
                        {/* Feature Navigation */}
                        <div className="flex items-center gap-2 flex-wrap px-2">
                            {GUIDE_FEATURES.map((guide, index) => {
                                const Icon = guide.icon;
                                const isActive = activeGuideIndex === index;
                                return (
                                    <button
                                        key={guide.id}
                                        onClick={() => { setActiveGuideIndex(index); setOpenGuideStepIndex(null); }}
                                        type="button"
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                            isActive
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400'
                                        }`}
                                    >
                                        <Icon weight={isActive ? 'fill' : 'regular'} className="w-3.5 h-3.5" />
                                        {guide.title}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Active Guide Content */}
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                            {/* Steps List */}
                            <div className="lg:col-span-2 space-y-2">
                                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                                            <activeGuide.icon weight="duotone" className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 dark:text-white">{activeGuide.title}</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{activeGuide.description}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        {activeGuide.steps.map((step, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                onClick={() => setOpenGuideStepIndex(openGuideStepIndex === index ? null : index)}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-sm ${
                                                    openGuideStepIndex === index
                                                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                }`}
                                            >
                                                <span className={`text-xs font-black w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                                                    openGuideStepIndex === index
                                                        ? 'bg-emerald-600 text-white'
                                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                                                }`}>
                                                    {index + 1}
                                                </span>
                                                <span className="font-bold">{step.title}</span>
                                                <ChevronDown
                                                    weight="bold"
                                                    className={`w-3.5 h-3.5 ml-auto transition-transform duration-200 shrink-0 ${
                                                        openGuideStepIndex === index ? 'rotate-180' : ''
                                                    }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Step Detail */}
                            <div className="lg:col-span-3">
                                {openGuideStepIndex !== null ? (
                                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-800 shadow-md p-6 animate-fade-in-up">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="bg-emerald-600 text-white text-xs font-black w-7 h-7 rounded-full flex items-center justify-center">
                                                {openGuideStepIndex + 1}
                                            </span>
                                            <h4 className="font-bold text-lg text-slate-800 dark:text-white">
                                                {activeGuide.steps[openGuideStepIndex].title}
                                            </h4>
                                        </div>
                                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                            {activeGuide.steps[openGuideStepIndex].content}
                                        </p>
                                        {openGuideStepIndex < activeGuide.steps.length - 1 && (
                                            <button
                                                type="button"
                                                onClick={() => setOpenGuideStepIndex(openGuideStepIndex + 1)}
                                                className="mt-5 flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                                            >
                                                Langkah selanjutnya
                                                <ArrowRight weight="bold" className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center h-full flex flex-col items-center justify-center min-h-[300px]">
                                        <activeGuide.icon weight="duotone" className="w-16 h-16 text-slate-200 dark:text-slate-700 mb-4" />
                                        <p className="text-slate-400 dark:text-slate-500 font-medium text-sm">
                                            Pilih langkah di sebelah kiri untuk melihat detail
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Onboarding Checklist */}
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-3xl border border-amber-200 dark:border-amber-800/50 p-6 mt-4">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
                                    <CheckSquare weight="duotone" className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-white">Onboarding Checklist</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Selesaikan langkah-langkah ini untuk memaksimalkan CAPH.io</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {ONBOARDING_TASKS.map((task, index) => (
                                    <div
                                        key={index}
                                        className="bg-white dark:bg-slate-900/80 rounded-xl p-4 border border-amber-100 dark:border-amber-800/30 hover:border-amber-300 dark:hover:border-amber-700 transition-all group"
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                                {index + 1}
                                            </span>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                                                    {task.title}
                                                </h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                                    {task.description}
                                                </p>
                                                {task.route && (
                                                    <button
                                                        type="button"
                                                        className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-2 hover:underline"
                                                    >
                                                        {task.routeLabel} →
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ===================== KONTAK TAB ===================== */}
                {activeTab === 'kontak' && (
                    <div className="max-w-2xl mx-auto space-y-6">
                        <div className="text-center mb-8">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                                Still Need Help?
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Tim support kami siap membantu Anda. Hubungi kami melalui渠道 di bawah ini.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Email */}
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all group">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                                    <Mail weight="duotone" className="w-7 h-7" />
                                </div>
                                <h4 className="font-bold text-slate-800 dark:text-white mb-1">Email Support</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Respon dalam 24 jam kerja</p>
                                <a
                                    href="mailto:support@caph.io"
                                    className="text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:underline break-all"
                                >
                                    support@caph.io
                                </a>
                            </div>

                            {/* Live Chat */}
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all group">
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                                    <MessageCircle weight="duotone" className="w-7 h-7" />
                                </div>
                                <h4 className="font-bold text-slate-800 dark:text-white mb-1">Live Chat</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                                    Senin - Jumat, 09:00 - 17:00 WIB
                                </p>
                                <button
                                    type="button"
                                    className="text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-not-allowed opacity-70"
                                    title="Coming soon"
                                >
                                    Segera hadir
                                </button>
                            </div>
                        </div>

                        {/* FAQ Quick Links */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                            <h4 className="font-bold text-slate-800 dark:text-white mb-4">Pertanyaan Populer</h4>
                            <div className="space-y-2">
                                {FAQS.slice(0, 5).map((faq, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => {
                                            setActiveTab('faq');
                                            const targetFaq = FAQS.findIndex(f => f.question === faq.question);
                                            setOpenFaqIndex(targetFaq);
                                            setActiveCategory('ALL');
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                                    >
                                        <HelpCircle weight="regular" className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors shrink-0" />
                                        <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">
                                            {faq.question}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tips */}
                        <div className="bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800/50 p-5 text-center">
                            <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                                💡 <strong>Tips:</strong> Sebelum menghubungi support, coba cari jawaban di tab FAQ di atas. Kemungkinan pertanyaan Anda sudah terjawab!
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

// Layout wrapper
HelpCenter.layout = (page: any) => (
    <AppLayout header={
        <div className="flex flex-col min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-white tracking-tight truncate">
                Bantuan & Panduan
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">
                Temukan jawaban, pelajari fitur, dan dapatkan bantuan
            </p>
        </div>
    }>
        {page}
    </AppLayout>
);
