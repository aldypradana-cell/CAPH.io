
import CaphLogo from '@/Components/Brand/CaphLogo';
import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';

export default function Welcome({
    auth,
    laravelVersion,
    phpVersion,
}: PageProps<{ laravelVersion: string; phpVersion: string }>) {
    const handleImageError = () => {
        document
            .getElementById('screenshot-container')
            ?.classList.add('!hidden');
        document.getElementById('docs-card')?.classList.add('!row-span-1');
        document
            .getElementById('docs-card-content')
            ?.classList.add('!flex-row');
        document.getElementById('background')?.classList.add('!hidden');
    };

    return (
        <>
            <Head title="Welcome" />
            <div className="bg-gray-50 text-black/50 dark:bg-black dark:text-white/50">
                <img
                    id="background"
                    className="absolute -left-20 top-0 max-w-[877px]"
                    src="https://laravel.com/assets/img/welcome/background.svg"
                />
                <div className="relative flex min-h-screen flex-col items-center justify-center selection:bg-[#FF2D20] selection:text-white">
                    <div className="relative w-full max-w-2xl px-6 lg:max-w-7xl">
                        <header className="grid grid-cols-2 items-center gap-2 py-10 lg:grid-cols-3">
                            <div className="flex lg:col-start-2 lg:justify-center">
                                <div className="flex items-center gap-3">
                                    <CaphLogo size={52} />
                                    <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">CAPH.io</h1>
                                </div>
                            </div>
                            <nav className="-mx-3 flex flex-1 justify-end">
                                {auth.user ? (
                                    <Link
                                        href={route('dashboard')}
                                        className="rounded-md px-3 py-2 text-black ring-1 ring-transparent transition hover:text-black/70 focus:outline-none focus-visible:ring-[#FF2D20] dark:text-white dark:hover:text-white/80 dark:focus-visible:ring-white"
                                    >
                                        Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={route('login')}
                                            className="rounded-md px-3 py-2 text-black ring-1 ring-transparent transition hover:text-black/70 focus:outline-none focus-visible:ring-[#FF2D20] dark:text-white dark:hover:text-white/80 dark:focus-visible:ring-white"
                                        >
                                            Log in
                                        </Link>
                                        <Link
                                            href={route('register')}
                                            className="rounded-md px-3 py-2 text-black ring-1 ring-transparent transition hover:text-black/70 focus:outline-none focus-visible:ring-[#FF2D20] dark:text-white dark:hover:text-white/80 dark:focus-visible:ring-white"
                                        >
                                            Register
                                        </Link>
                                    </>
                                )}
                            </nav>
                        </header>

                        <main className="mt-6">
                            <div className="flex flex-col items-center justify-center text-center py-20">
                                <h2 className="text-5xl font-bold mb-6 text-slate-800 dark:text-white">Smart Wealth Management</h2>
                                <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-10">
                                    Kelola aset, pantau kekayaan, dan capai tujuan finansial Anda dengan <span className="font-bold text-[#FF2D20]">CAPH.io</span>.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10 w-full max-w-4xl">
                                    <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-zinc-100 dark:border-zinc-800">
                                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mx-auto mb-4 text-indigo-600 dark:text-indigo-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                                        </div>
                                        <h3 className="text-lg font-bold mb-2">Pencatatan Aset</h3>
                                        <p className="text-sm text-slate-500">Catat semua jenis aset mulai dari properti, kendaraan, hingga investasi.</p>
                                    </div>
                                    <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-zinc-100 dark:border-zinc-800">
                                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mx-auto mb-4 text-emerald-600 dark:text-emerald-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                                        </div>
                                        <h3 className="text-lg font-bold mb-2">Analisis Kekayaan</h3>
                                        <p className="text-sm text-slate-500">Visualisasi pertumbuhan kekayaan Anda dengan grafik yang mudah dipahami.</p>
                                    </div>
                                    <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-zinc-100 dark:border-zinc-800">
                                        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mx-auto mb-4 text-amber-600 dark:text-amber-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                        </div>
                                        <h3 className="text-lg font-bold mb-2">Keamanan Data</h3>
                                        <p className="text-sm text-slate-500">Data Anda tersimpan dengan aman dan privasi terjaga.</p>
                                    </div>
                                </div>
                            </div>
                        </main>

                        <footer className="py-16 text-center text-sm text-black dark:text-white/70">
                            CAPH.io v1.0 (Laravel v{laravelVersion} PHP v{phpVersion})
                        </footer>
                    </div>
                </div>
            </div>
        </>
    );
}
