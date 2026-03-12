import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import {
    ChatCircleDots, PaperPlaneTilt, Bug, Lightbulb, Question, DotsThreeCircle,
    Clock, Eye, CheckCircle, XCircle, CaretDown, CaretUp
} from '@phosphor-icons/react';
import { useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Feedback } from '@/types';

const CATEGORIES = [
    { value: 'SUGGESTION', label: 'Saran', icon: Lightbulb, color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
    { value: 'BUG', label: 'Bug / Masalah', icon: Bug, color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800' },
    { value: 'QUESTION', label: 'Pertanyaan', icon: Question, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
    { value: 'OTHER', label: 'Lainnya', icon: DotsThreeCircle, color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700' },
];

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
    OPEN: { label: 'Menunggu', icon: Clock, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    IN_REVIEW: { label: 'Ditinjau', icon: Eye, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    RESOLVED: { label: 'Dijawab', icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    CLOSED: { label: 'Ditutup', icon: XCircle, color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
};

export default function FeedbackIndex() {
    const { feedbacks } = usePage().props as any;
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const { data, setData, post, processing, reset, errors } = useForm({
        category: 'SUGGESTION',
        subject: '',
        message: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('feedback.store'), {
            onSuccess: () => {
                reset();
                toast.success('Feedback berhasil dikirim! Terima kasih 🎉');
            },
            onError: () => {
                toast.error('Gagal mengirim feedback. Silakan coba lagi.');
            },
        });
    };

    const selectedCat = CATEGORIES.find(c => c.value === data.category) || CATEGORIES[0];

    return (
        <>
            <Head title="Kotak Saran" />
            <Toaster position="top-right" />

            <div className="space-y-8 max-w-3xl mx-auto animate-fade-in-up">

                {/* Hero Section */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-2xl shadow-lg shadow-indigo-500/30 mb-3">
                        <ChatCircleDots weight="duotone" className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Kotak Saran & Laporan</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                        Punya saran, menemukan bug, atau ada pertanyaan? Kirimkan kepada kami dan admin akan segera merespon.
                    </p>
                </div>

                {/* Submit Form */}
                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-5">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <PaperPlaneTilt weight="duotone" className="w-5 h-5 text-indigo-500" />
                        Kirim Feedback Baru
                    </h3>

                    {/* Category Selector */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Kategori</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {CATEGORIES.map((cat) => {
                                const isActive = data.category === cat.value;
                                return (
                                    <button
                                        key={cat.value}
                                        type="button"
                                        onClick={() => setData('category', cat.value)}
                                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 ${isActive
                                            ? `${cat.color} ring-2 ring-offset-1 ring-indigo-400 dark:ring-offset-slate-900 scale-[1.02]`
                                            : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        <cat.icon weight={isActive ? 'fill' : 'duotone'} className="w-4 h-4" />
                                        {cat.label}
                                    </button>
                                );
                            })}
                        </div>
                        {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
                    </div>

                    {/* Subject */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Subjek</label>
                        <input
                            type="text"
                            value={data.subject}
                            onChange={(e) => setData('subject', e.target.value)}
                            placeholder="Judul singkat feedback Anda..."
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                        {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject}</p>}
                    </div>

                    {/* Message */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Pesan</label>
                        <textarea
                            value={data.message}
                            onChange={(e) => setData('message', e.target.value)}
                            placeholder="Tuliskan detail saran, laporan, atau pertanyaan Anda..."
                            rows={5}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                        />
                        {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message}</p>}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={processing || !data.subject.trim() || !data.message.trim()}
                        className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                        <PaperPlaneTilt weight="bold" className="w-5 h-5" />
                        {processing ? 'Mengirim...' : 'Kirim Feedback'}
                    </button>
                </form>

                {/* Feedback History */}
                <div className="space-y-4">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Clock weight="duotone" className="w-5 h-5 text-indigo-500" />
                        Riwayat Feedback Anda
                        {feedbacks?.data?.length > 0 && (
                            <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold">
                                {feedbacks.total ?? feedbacks.data.length}
                            </span>
                        )}
                    </h3>

                    {(!feedbacks?.data || feedbacks.data.length === 0) ? (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center">
                            <ChatCircleDots className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                            <p className="text-sm text-slate-400 dark:text-slate-500">Belum ada feedback yang dikirim.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {feedbacks.data.map((fb: Feedback) => {
                                const statusInfo = STATUS_CONFIG[fb.status] || STATUS_CONFIG.OPEN;
                                const catInfo = CATEGORIES.find(c => c.value === fb.category) || CATEGORIES[0];
                                const isExpanded = expandedId === fb.id;

                                return (
                                    <div
                                        key={fb.id}
                                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300 hover:shadow-md"
                                    >
                                        <button
                                            onClick={() => setExpandedId(isExpanded ? null : fb.id)}
                                            className="w-full p-4 flex items-start gap-3 text-left"
                                        >
                                            <div className={`p-2 rounded-lg ${catInfo.color} mt-0.5 flex-shrink-0`}>
                                                <catInfo.icon weight="duotone" className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <h4 className="font-bold text-sm text-slate-800 dark:text-white truncate">
                                                        {fb.subject}
                                                    </h4>
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusInfo.color}`}>
                                                        <statusInfo.icon weight="bold" className="w-3 h-3" />
                                                        {statusInfo.label}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{fb.message}</p>
                                                <p className="text-[10px] text-slate-400 mt-1">{fb.created_at}</p>
                                            </div>
                                            <div className="flex-shrink-0 text-slate-400 mt-1">
                                                {isExpanded ? <CaretUp className="w-4 h-4" /> : <CaretDown className="w-4 h-4" />}
                                            </div>
                                        </button>

                                        {isExpanded && (
                                            <div className="px-4 pb-4 pt-0 space-y-3 animate-fade-in border-t border-slate-100 dark:border-slate-800">
                                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 mt-3">
                                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Pesan Anda:</p>
                                                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{fb.message}</p>
                                                </div>

                                                {fb.admin_reply && (
                                                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 border border-indigo-100 dark:border-indigo-800/30">
                                                        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                                                            💬 Balasan Admin {fb.replied_at && <span className="font-normal text-slate-400">• {fb.replied_at}</span>}
                                                        </p>
                                                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{fb.admin_reply}</p>
                                                    </div>
                                                )}

                                                {!fb.admin_reply && (
                                                    <p className="text-xs text-slate-400 dark:text-slate-500 italic text-center py-2">
                                                        Belum ada balasan dari admin.
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

FeedbackIndex.layout = (page: any) => (
    <AppLayout header={
        <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-xl">
                <ChatCircleDots weight="duotone" className="w-6 h-6" />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Kotak Saran</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    Kirim saran, laporan, atau pertanyaan
                </p>
            </div>
        </div>
    }>
        {page}
    </AppLayout>
);
