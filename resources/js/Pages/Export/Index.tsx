import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useState, useEffect, useCallback } from 'react';
import {
    FileDown, Calendar, FileSpreadsheet, FileText,
    CheckCircle2, Loader2, Wallet, TrendingUp, TrendingDown, ArrowRightLeft,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface WalletOption {
    id: number;
    name: string;
}

interface PreviewData {
    count: number;
    income: number;
    expense: number;
    net: number;
}

interface ExportPageProps extends PageProps {
    wallets: WalletOption[];
}

export default function ExportPage({ wallets }: ExportPageProps) {
    const [startDate, setStartDate] = useState(() => {
        const d = new Date(); d.setDate(1);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [format, setFormat] = useState<'excel' | 'pdf'>('excel');
    const [walletId, setWalletId] = useState<string>('');
    const [isExporting, setIsExporting] = useState(false);
    const [preview, setPreview] = useState<PreviewData | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [previewError, setPreviewError] = useState(false);

    // ── Live Preview ──
    const fetchPreview = useCallback(async () => {
        if (!startDate || !endDate) return;
        setLoadingPreview(true);
        try {
            const previewUrl = new URL(route('export.preview'));
            previewUrl.searchParams.set('start_date', startDate);
            previewUrl.searchParams.set('end_date', endDate);
            if (walletId) previewUrl.searchParams.set('wallet_id', walletId);

            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const res = await fetch(previewUrl.toString(), {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken,
                },
                credentials: 'same-origin',
            });
            if (res.ok) {
                const data = await res.json();
                setPreview(data);
                setPreviewError(false);
            } else {
                console.warn('Preview failed:', res.status);
                setPreviewError(true);
            }
        } catch (err) {
            console.warn('Preview fetch error:', err);
            setPreviewError(true);
        } finally {
            setLoadingPreview(false);
        }
    }, [startDate, endDate, walletId]);

    useEffect(() => {
        const timer = setTimeout(fetchPreview, 400);
        return () => clearTimeout(timer);
    }, [fetchPreview]);

    // ── Download ──
    const handleExport = async () => {
        setIsExporting(true);
        try {
            const downloadUrl = new URL(route('export.download'));
            downloadUrl.searchParams.set('start_date', startDate);
            downloadUrl.searchParams.set('end_date', endDate);
            downloadUrl.searchParams.set('format', format);
            if (walletId) downloadUrl.searchParams.set('wallet_id', walletId);
            window.location.href = downloadUrl.toString();

            // Give time for download to start
            await new Promise(resolve => setTimeout(resolve, 2000));
            toast.success(`Laporan ${format.toUpperCase()} sedang diunduh!`);
        } catch {
            toast.error('Gagal mengunduh laporan.');
        } finally {
            setIsExporting(false);
        }
    };

    const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
    const fmtCompact = (n: number) => new Intl.NumberFormat('id-ID', { notation: 'compact', compactDisplay: 'short' }).format(n);

    return (

        <>
            <Head title="Export Laporan" />
            <Toaster position="top-right" />

            <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* ── Controls ── */}
                    <div className="md:col-span-2 space-y-6">

                        {/* Date Range */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
                            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center">
                                <Calendar className="w-4 h-4 mr-2 text-indigo-500" /> Rentang Tanggal
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Dari</label>
                                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-white font-medium transition-colors" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Sampai</label>
                                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-white font-medium transition-colors" />
                                </div>
                            </div>
                        </div>

                        {/* Wallet Filter */}
                        {wallets.length > 0 && (
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
                                <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center">
                                    <Wallet className="w-4 h-4 mr-2 text-purple-500" /> Filter Dompet
                                </h3>
                                <select value={walletId} onChange={e => setWalletId(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-white font-medium transition-colors">
                                    <option value="">Semua Dompet</option>
                                    {wallets.map(w => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Format */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
                            <h3 className="font-bold text-slate-800 dark:text-white mb-4">Format File</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setFormat('excel')}
                                    className={`flex items-center justify-center p-4 rounded-xl border-2 transition-all active:scale-95 ${format === 'excel'
                                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 shadow-lg shadow-emerald-500/10'
                                        : 'border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-500 dark:text-slate-400'
                                        }`}>
                                    <FileSpreadsheet className="w-6 h-6 mr-2" />
                                    <span className="font-bold">Excel (.xlsx)</span>
                                    {format === 'excel' && <CheckCircle2 className="w-5 h-5 ml-auto text-emerald-600 dark:text-emerald-400" />}
                                </button>
                                <button onClick={() => setFormat('pdf')}
                                    className={`flex items-center justify-center p-4 rounded-xl border-2 transition-all active:scale-95 ${format === 'pdf'
                                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 shadow-lg shadow-red-500/10'
                                        : 'border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-500 dark:text-slate-400'
                                        }`}>
                                    <FileText className="w-6 h-6 mr-2" />
                                    <span className="font-bold">PDF Report</span>
                                    {format === 'pdf' && <CheckCircle2 className="w-5 h-5 ml-auto text-red-600 dark:text-red-400" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── Summary Preview ── */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl">
                            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">Ringkasan Laporan</h3>

                            {loadingPreview && (
                                <div className="flex items-center justify-center py-6">
                                    <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                                </div>
                            )}

                            {!loadingPreview && preview && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center pb-4 border-b border-slate-700">
                                        <span className="text-slate-400 text-sm flex items-center gap-1.5">
                                            <ArrowRightLeft className="w-3.5 h-3.5" /> Total Transaksi
                                        </span>
                                        <span className="font-bold text-lg">{preview.count}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-emerald-400 text-sm flex items-center gap-1.5">
                                            <TrendingUp className="w-3.5 h-3.5" /> Pemasukan
                                        </span>
                                        <span className="font-bold text-emerald-400">+ {fmtCompact(preview.income)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-red-400 text-sm flex items-center gap-1.5">
                                            <TrendingDown className="w-3.5 h-3.5" /> Pengeluaran
                                        </span>
                                        <span className="font-bold text-red-400">- {fmtCompact(preview.expense)}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-3 border-t border-slate-700">
                                        <span className="text-slate-300 text-sm font-semibold">Arus Bersih</span>
                                        <span className={`font-bold text-lg ${preview.net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {preview.net >= 0 ? '+' : ''}{fmtCompact(preview.net)}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {!loadingPreview && !preview && !previewError && (
                                <p className="text-slate-500 text-sm text-center py-4">Pilih tanggal untuk melihat ringkasan</p>
                            )}

                            {!loadingPreview && previewError && (
                                <div className="text-center py-4">
                                    <p className="text-amber-400 text-sm mb-2">Gagal memuat ringkasan</p>
                                    <button onClick={fetchPreview} className="text-xs text-indigo-400 hover:text-indigo-300 underline">Coba lagi</button>
                                </div>
                            )}

                            <div className="mt-8">
                                <button onClick={handleExport}
                                    disabled={isExporting || !startDate || !endDate}
                                    className="w-full py-3.5 bg-white text-slate-900 rounded-xl font-bold hover:bg-indigo-50 transition-all shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-95">
                                    {isExporting
                                        ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Memproses...</>
                                        : <><FileDown className="w-5 h-5 mr-2" /> Download {format.toUpperCase()}</>
                                    }
                                </button>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-xl border border-blue-100 dark:border-blue-800">
                            <p className="font-bold mb-1">ℹ️ Tentang Format</p>
                            <ul className="space-y-1 text-blue-600 dark:text-blue-400">
                                <li>• <strong>Excel</strong> — 2 sheet: Data Transaksi + Ringkasan</li>
                                <li>• <strong>PDF</strong> — Laporan visual siap cetak</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

ExportPage.layout = (page: any) => (
    <AppLayout header={
        <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-xl">
                <FileDown className="w-6 h-6" />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Export Laporan</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Unduh riwayat transaksi dalam format Excel atau PDF</p>
            </div>
        </div>
    }>
        {page}
    </AppLayout>
);

