import { router, useForm } from '@inertiajs/react';
import {
    ChatCircleDots, Clock, Eye, CheckCircle, XCircle, MagnifyingGlass,
    PaperPlaneTilt, Trash, CaretDown, CaretUp, Envelope, EnvelopeOpen, Warning as AlertTriangle
} from '@phosphor-icons/react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Feedback } from '@/types';

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    OPEN: { label: 'Open', icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    IN_REVIEW: { label: 'In Review', icon: Eye, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    RESOLVED: { label: 'Resolved', icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    CLOSED: { label: 'Closed', icon: XCircle, color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' },
};

const CATEGORY_LABELS: Record<string, string> = {
    SUGGESTION: 'Saran',
    BUG: 'Bug',
    QUESTION: 'Pertanyaan',
    OTHER: 'Lainnya',
};

interface FeedbacksTabProps {
    feedbacks: any;
    feedbackStats: { total: number; open: number; inReview: number; resolved: number };
    filters: { search?: string; status?: string; category?: string };
}

export default function FeedbacksTab({ feedbacks, feedbackStats, filters }: FeedbacksTabProps) {
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [search, setSearch] = useState(filters.search || '');
    const [replyingId, setReplyingId] = useState<number | null>(null);

    const replyForm = useForm({ admin_reply: '' });

    const handleFilter = (key: string, value: string) => {
        router.get(route('admin.feedbacks.index'), {
            ...filters,
            [key]: value || undefined,
        }, { preserveState: true, preserveScroll: true });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        handleFilter('search', search);
    };

    const handleReply = (feedbackId: number) => {
        replyForm.post(route('admin.feedbacks.reply', feedbackId), {
            onSuccess: () => {
                replyForm.reset();
                setReplyingId(null);
                toast.success('Balasan berhasil dikirim.');
            },
            onError: () => toast.error('Gagal mengirim balasan.'),
        });
    };

    const handleStatusChange = (feedbackId: number, newStatus: string) => {
        router.patch(route('admin.feedbacks.updateStatus', feedbackId), {
            status: newStatus,
        }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => toast.success('Status diperbarui.'),
        });
    };

    const handleDelete = (feedbackId: number) => {
        if (!confirm('Yakin ingin menghapus feedback ini?')) return;
        router.delete(route('admin.feedbacks.destroy', feedbackId), {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => toast.success('Feedback dihapus.'),
        });
    };

    const stats = feedbackStats || { total: 0, open: 0, inReview: 0, resolved: 0 };

    const statCards = [
        { label: 'Total Feedback', value: stats.total, icon: ChatCircleDots, color: 'from-indigo-600 to-violet-600', shadow: 'shadow-indigo-500/20' },
        { label: 'Open', value: stats.open, icon: Envelope, color: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/20' },
        { label: 'In Review', value: stats.inReview, icon: Eye, color: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/20' },
        { label: 'Resolved', value: stats.resolved, icon: EnvelopeOpen, color: 'from-emerald-500 to-green-500', shadow: 'shadow-emerald-500/20' },
    ];

    return (
        <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card, i) => (
                    <div key={i} className={`relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br ${card.color} text-white shadow-xl ${card.shadow} animate-fade-in-up`} style={{ animationDelay: `${i * 0.1}s` }}>
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-6 translate-x-6" />
                        <card.icon weight="duotone" className="w-8 h-8 opacity-80 mb-3" />
                        <p className="text-3xl font-bold">{card.value.toLocaleString('id-ID')}</p>
                        <p className="text-sm text-white/70 mt-1">{card.label}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <form onSubmit={handleSearch} className="flex-1 relative">
                        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari subject atau nama user..."
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </form>
                    <select
                        value={filters.status || ''}
                        onChange={(e) => handleFilter('status', e.target.value)}
                        className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">Semua Status</option>
                        <option value="OPEN">Open</option>
                        <option value="IN_REVIEW">In Review</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                    </select>
                    <select
                        value={filters.category || ''}
                        onChange={(e) => handleFilter('category', e.target.value)}
                        className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">Semua Kategori</option>
                        <option value="SUGGESTION">Saran</option>
                        <option value="BUG">Bug</option>
                        <option value="QUESTION">Pertanyaan</option>
                        <option value="OTHER">Lainnya</option>
                    </select>
                </div>
            </div>

            {/* Feedback List */}
            <div className="space-y-3">
                {(!feedbacks?.data || feedbacks.data.length === 0) ? (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                        <ChatCircleDots className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                        <p className="text-sm text-slate-400 dark:text-slate-500 font-semibold">Belum ada feedback dari pengguna.</p>
                    </div>
                ) : (
                    feedbacks.data.map((fb: Feedback) => {
                        const statusInfo = STATUS_CONFIG[fb.status] || STATUS_CONFIG.OPEN;
                        const isExpanded = expandedId === fb.id;
                        const isReplying = replyingId === fb.id;

                        return (
                            <div
                                key={fb.id}
                                className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-300 hover:shadow-md ${fb.priority === 'HIGH'
                                    ? 'border-red-200 dark:border-red-900/50'
                                    : 'border-slate-200 dark:border-slate-800'
                                }`}
                            >
                                <button
                                    onClick={() => setExpandedId(isExpanded ? null : fb.id)}
                                    className="w-full p-4 flex items-start gap-3 text-left"
                                >
                                    {/* User Avatar */}
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-xs shadow-md flex-shrink-0 mt-0.5">
                                        {fb.user_name?.charAt(0).toUpperCase() || '?'}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="font-bold text-sm text-slate-800 dark:text-white truncate">{fb.subject}</span>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusInfo.bg} ${statusInfo.color}`}>
                                                <statusInfo.icon weight="bold" className="w-3 h-3" />
                                                {statusInfo.label}
                                            </span>
                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                                                {CATEGORY_LABELS[fb.category] || fb.category}
                                            </span>
                                            {fb.priority === 'HIGH' && (
                                                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                                                    <AlertTriangle weight="bold" className="w-3 h-3" /> HIGH
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            <span className="font-semibold">{fb.user_name}</span>
                                            <span className="text-slate-400 mx-1">•</span>
                                            <span>{fb.user_email}</span>
                                            <span className="text-slate-400 mx-1">•</span>
                                            <span>{fb.created_at}</span>
                                        </p>
                                    </div>

                                    <div className="flex-shrink-0 text-slate-400 mt-1">
                                        {isExpanded ? <CaretUp className="w-4 h-4" /> : <CaretDown className="w-4 h-4" />}
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="px-4 pb-4 space-y-3 border-t border-slate-100 dark:border-slate-800 animate-fade-in">
                                        {/* User message */}
                                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 mt-3">
                                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Pesan User:</p>
                                            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{fb.message}</p>
                                        </div>

                                        {/* Existing admin reply */}
                                        {fb.admin_reply && (
                                            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 border border-indigo-100 dark:border-indigo-800/30">
                                                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                                                    💬 Balasan Admin {fb.replied_at && <span className="font-normal text-slate-400">• {fb.replied_at}</span>}
                                                </p>
                                                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{fb.admin_reply}</p>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex flex-col sm:flex-row gap-2 pt-2">
                                            {/* Reply Button */}
                                            {!fb.admin_reply && (
                                                <button
                                                    onClick={() => setReplyingId(isReplying ? null : fb.id)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                                                >
                                                    <PaperPlaneTilt weight="duotone" className="w-4 h-4" /> Balas
                                                </button>
                                            )}

                                            {/* Status Dropdown */}
                                            <select
                                                value={fb.status}
                                                onChange={(e) => handleStatusChange(fb.id, e.target.value)}
                                                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                                            >
                                                <option value="OPEN">Open</option>
                                                <option value="IN_REVIEW">In Review</option>
                                                <option value="RESOLVED">Resolved</option>
                                                <option value="CLOSED">Closed</option>
                                            </select>

                                            {/* Delete */}
                                            <button
                                                onClick={() => handleDelete(fb.id)}
                                                className="flex items-center gap-1 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors ml-auto"
                                            >
                                                <Trash weight="duotone" className="w-4 h-4" /> Hapus
                                            </button>
                                        </div>

                                        {/* Reply Form */}
                                        {isReplying && (
                                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 space-y-3 animate-fade-in">
                                                <textarea
                                                    value={replyForm.data.admin_reply}
                                                    onChange={(e) => replyForm.setData('admin_reply', e.target.value)}
                                                    placeholder="Tulis balasan untuk user..."
                                                    rows={3}
                                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                                />
                                                <div className="flex gap-2 justify-end">
                                                    <button
                                                        onClick={() => setReplyingId(null)}
                                                        className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                                                    >
                                                        Batal
                                                    </button>
                                                    <button
                                                        onClick={() => handleReply(fb.id)}
                                                        disabled={replyForm.processing || !replyForm.data.admin_reply.trim()}
                                                        className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                                    >
                                                        <PaperPlaneTilt weight="bold" className="w-3.5 h-3.5" />
                                                        {replyForm.processing ? 'Mengirim...' : 'Kirim Balasan'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination */}
            {feedbacks?.links && feedbacks.links.length > 3 && (
                <div className="flex justify-center gap-1 mt-4">
                    {feedbacks.links.map((link: any, i: number) => (
                        <button
                            key={i}
                            disabled={!link.url}
                            onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${link.active
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                            } ${!link.url ? 'opacity-30 cursor-not-allowed' : ''}`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
