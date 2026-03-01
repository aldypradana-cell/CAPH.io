import { Head } from '@inertiajs/react';

interface ErrorPageProps {
    status: number;
}

const titles: Record<number, string> = {
    403: 'Akses Ditolak',
    404: 'Halaman Tidak Ditemukan',
    419: 'Sesi Kedaluwarsa',
    429: 'Terlalu Banyak Permintaan',
    500: 'Terjadi Kesalahan Server',
    503: 'Layanan Tidak Tersedia',
};

const descriptions: Record<number, string> = {
    403: 'Anda tidak memiliki izin untuk mengakses halaman ini.',
    404: 'Halaman yang Anda cari tidak ditemukan atau telah dipindahkan.',
    419: 'Sesi Anda telah berakhir. Silakan refresh halaman dan coba lagi.',
    429: 'Anda mengirim terlalu banyak permintaan. Silakan tunggu sebentar.',
    500: 'Maaf, terjadi kesalahan di server kami. Tim kami sudah diberi tahu.',
    503: 'Aplikasi sedang dalam pemeliharaan. Silakan coba beberapa saat lagi.',
};

export default function ErrorPage({ status }: ErrorPageProps) {
    const title = titles[status] || 'Terjadi Kesalahan';
    const description = descriptions[status] || 'Maaf, terjadi kesalahan yang tidak terduga.';

    return (
        <>
            <Head title={`${status} — ${title}`} />
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-900 dark:to-zinc-950 px-4">
                <div className="text-center max-w-md">
                    <p className="text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 mb-4">
                        {status}
                    </p>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">
                        {title}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                        {description}
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => window.history.back()}
                            className="px-5 py-2.5 rounded-lg border border-slate-300 dark:border-zinc-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-sm font-medium"
                        >
                            ← Kembali
                        </button>
                        <a
                            href="/"
                            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 transition-all text-sm font-medium shadow-md"
                        >
                            Halaman Utama
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}
