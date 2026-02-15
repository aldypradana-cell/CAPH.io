import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useState } from 'react';
import { PieChart, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import toast, { Toaster } from 'react-hot-toast';

export default function InsightsIndex({ auth }: PageProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [insight, setInsight] = useState<string | null>(null);

    const handleGenerate = async () => {
        setIsLoading(true);
        try {
            // Using axios for automatic CSRF handling
            const response = await window.axios.post(route('insights.generate'));

            const result = response.data;
            if (result.success) {
                setInsight(result.insight);
                toast.success('Analisis selesai!');
            } else {
                toast.error(result.message || 'Gagal menghasilkan analisis');
            }
        } catch (e: any) {
            console.error(e);
            toast.error(e.response?.data?.message || 'Terjadi kesalahan');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AppLayout header={
            <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Analisis AI</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Dapatkan insight cerdas dari data keuangan Anda</p>
            </div>
        }>
            <Head title="Analisis" />
            <Toaster position="top-right" />

            <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
                {/* Hero */}
                <div className="glass-card p-8 rounded-[2rem] text-center animate-fade-in-up">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-purple-500/30 animate-pulse-slow">
                        <PieChart className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Financial Insights</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                        AI akan menganalisis transaksi dan memberikan rekomendasi keuangan personal.
                    </p>
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="inline-flex items-center px-8 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {isLoading ? (
                            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Menganalisis...</>
                        ) : (
                            <><Sparkles className="w-5 h-5 mr-2" /> Generate Insights</>
                        )}
                    </button>
                </div>

                {/* Results */}
                {insight && (
                    <div className="glass-card p-6 lg:p-8 rounded-[2rem] animate-pop-in">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="w-5 h-5 text-purple-500" />
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Hasil Analisis</h3>
                        </div>
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-slate-800 dark:prose-headings:text-white prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-li:text-slate-600 dark:prose-li:text-slate-300 prose-strong:text-indigo-600 dark:prose-strong:text-indigo-400">
                            <ReactMarkdown>{insight}</ReactMarkdown>
                        </div>
                    </div>
                )}

                {/* Info */}
                {!insight && !isLoading && (
                    <div className="glass-card rounded-[2rem] p-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                        <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-3">💡 Apa yang akan dianalisis?</h3>
                        <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-transparent">📊 Pola pengeluaran dan pemasukan</div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-transparent">🎯 Evaluasi anggaran dan rekomendasi</div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-transparent">💰 Tips optimasi keuangan personal</div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-transparent">⚠️ Peringatan risiko keuangan</div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
