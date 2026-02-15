import { router } from '@inertiajs/react';
import { useState } from 'react';
import {
    Activity, Shield, ShieldOff, UserMinus, FileText, Search,
    Database, Plus, Pencil, Trash2, Sprout, Filter, ChevronLeft, ChevronRight
} from 'lucide-react';

interface LogEntry {
    id: number;
    admin_name: string;
    action: string;
    target: string;
    details: any;
    created_at: string;
}

interface PaginatedLogs {
    data: LogEntry[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

const actionConfig: Record<string, { label: string; color: string; icon: typeof Activity }> = {
    SUSPEND_USER: { label: 'Suspend User', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: ShieldOff },
    ACTIVATE_USER: { label: 'Aktifkan User', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: Shield },
    DELETE_USER: { label: 'Hapus User', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: UserMinus },
    SEED_CATEGORIES: { label: 'Seed Kategori', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400', icon: Sprout },
    CREATE_CATEGORY: { label: 'Buat Kategori', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Plus },
    UPDATE_CATEGORY: { label: 'Update Kategori', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', icon: Pencil },
    DELETE_CATEGORY: { label: 'Hapus Kategori', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: Trash2 },
};

const allActions = Object.keys(actionConfig);

export default function LogsTab({ logs, filters = {} }: { logs: PaginatedLogs; filters?: any }) {
    const [action, setAction] = useState(filters.action || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const applyFilters = () => {
        const params: Record<string, string> = {};
        if (action) params.action = action;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        router.get(route('admin.logs.index'), params, { preserveState: true, preserveScroll: true });
    };

    const clearFilters = () => {
        setAction('');
        setDateFrom('');
        setDateTo('');
        router.get(route('admin.logs.index'), {}, { preserveState: true, preserveScroll: true });
    };

    const goToPage = (url: string | null) => {
        if (url) router.get(url, {}, { preserveState: true, preserveScroll: true });
    };

    const hasFilters = action || dateFrom || dateTo;

    return (
        <div className="space-y-4 animate-fade-in-up">

            {/* ── Filters ── */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-4 h-4 text-indigo-500" />
                    <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200">Filter Log</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <select value={action} onChange={e => setAction(e.target.value)}
                        className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-white">
                        <option value="">Semua Aksi</option>
                        {allActions.map(a => (
                            <option key={a} value={a}>{actionConfig[a]?.label || a}</option>
                        ))}
                    </select>
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} placeholder="Dari"
                        className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-white" />
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} placeholder="Sampai"
                        className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-white" />
                    <div className="flex gap-2">
                        <button onClick={applyFilters}
                            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors">
                            <Search className="w-3.5 h-3.5" /> Cari
                        </button>
                        {hasFilters && (
                            <button onClick={clearFilters}
                                className="px-3 py-2.5 text-slate-500 hover:text-red-500 rounded-xl text-sm font-bold transition-colors border border-slate-200 dark:border-slate-700">
                                Reset
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Stats bar ── */}
            <div className="flex items-center justify-between px-1">
                <p className="text-xs font-bold text-slate-400">
                    {logs.total} log ditemukan {hasFilters && '(filtered)'}
                </p>
                <p className="text-xs text-slate-400">
                    Halaman {logs.current_page} dari {logs.last_page}
                </p>
            </div>

            {/* ── Log Entries ── */}
            {logs.data.length > 0 ? logs.data.map((log, idx) => {
                const config = actionConfig[log.action] || { label: log.action, color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400', icon: Activity };
                const IconComponent = config.icon;
                return (
                    <div key={log.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.color}`}>
                                <IconComponent className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-bold text-slate-800 dark:text-white">{config.label}</p>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${config.color}`}>{log.action}</span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                    oleh <span className="font-bold text-slate-500">{log.admin_name}</span> → <span className="font-bold text-slate-500">{log.target}</span>
                                </p>
                                {log.details && typeof log.details === 'object' && Object.keys(log.details).length > 0 && (
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        {Object.entries(log.details).slice(0, 3).map(([key, val]) => (
                                            <span key={key} className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">
                                                {key}: {String(val)}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full whitespace-nowrap">
                            {log.created_at}
                        </span>
                    </div>
                );
            }) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-16 text-center">
                    <FileText className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                    <p className="text-lg font-bold text-slate-400">Belum ada log aktivitas</p>
                    <p className="text-sm text-slate-300 dark:text-slate-600 mt-1">Log akan muncul saat admin melakukan aksi seperti suspend user atau kelola kategori</p>
                </div>
            )}

            {/* ── Pagination ── */}
            {logs.last_page > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                    <button onClick={() => goToPage(logs.links[0]?.url)} disabled={!logs.links[0]?.url}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    {logs.links.slice(1, -1).map((link, i) => (
                        <button key={i} onClick={() => goToPage(link.url)}
                            className={`min-w-[36px] h-9 rounded-xl text-sm font-bold transition-colors ${link.active
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                    : 'border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}>
                            {link.label}
                        </button>
                    ))}
                    <button onClick={() => goToPage(logs.links[logs.links.length - 1]?.url)} disabled={!logs.links[logs.links.length - 1]?.url}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
