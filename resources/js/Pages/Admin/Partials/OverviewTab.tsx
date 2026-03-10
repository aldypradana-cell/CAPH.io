import { router } from '@inertiajs/react';
import {
    Users, Pulse as Activity,
    ShieldCheck, UserCheck, Warning as AlertTriangle, FileText
} from '@phosphor-icons/react';

export default function OverviewTab({ stats, recentLogs }: { stats: any, recentLogs: any[] }) {
    const statCards = [
        { label: 'Total Pengguna', value: stats.totalUsers, icon: Users, color: 'from-blue-600 to-indigo-600', shadowColor: 'shadow-blue-500/20' },
        { label: 'Pengguna Aktif', value: stats.activeUsers, icon: UserCheck, color: 'from-emerald-600 to-green-600', shadowColor: 'shadow-emerald-500/20' },
        { label: 'Total Transaksi', value: stats.totalTransactions, icon: Activity, color: 'from-violet-600 to-purple-600', shadowColor: 'shadow-violet-500/20' },
        { label: 'Flagged', value: stats.flaggedTransactions, icon: AlertTriangle, color: 'from-red-600 to-rose-600', shadowColor: 'shadow-red-500/20' },
    ];

    const getActionColor = (action: string) => {
        if (action.includes('DELETE')) return 'text-red-600 bg-red-50 dark:bg-red-900/10';
        if (action.includes('UPDATE') || action.includes('SUSPEND')) return 'text-blue-600 bg-blue-50 dark:bg-blue-900/10';
        return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10';
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card, i) => (
                    <div key={i} className={`relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br ${card.color} text-white shadow-xl ${card.shadowColor} animate-fade-in-up`} style={{ animationDelay: `${i * 0.1}s` }}>
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-6 translate-x-6" />
                        <card.icon weight="duotone" className="w-8 h-8 opacity-80 mb-3" />
                        <p className="text-3xl font-bold">{card.value.toLocaleString('id-ID')}</p>
                        <p className="text-sm text-white/70 mt-1">{card.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Actions / Shortcuts - Using router.visit with preserveState to switch tabs if we were using state/query based tabs, 
                    but here we are redirecting to routes. If we consolidate, we need to change these to use link or just switch tab state.
                    For now, assuming we will use query params ?tab=users */}
                <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center"><ShieldCheck weight="duotone" className="w-4 h-4 mr-2 text-indigo-500" /> Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => router.visit(route('admin.dashboard', { tab: 'users' }))} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3 group">
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg group-hover:scale-110 transition-transform"><Users weight="duotone" className="w-5 h-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-slate-800 dark:text-white">Kelola User</p>
                                <p className="text-xs text-slate-500">Lihat & edit pengguna</p>
                            </div>
                        </button>
                        <button onClick={() => router.visit(route('admin.dashboard', { tab: 'logs' }))} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3 group">
                            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg group-hover:scale-110 transition-transform"><FileText weight="duotone" className="w-5 h-5" /></div>
                            <div className="text-left">
                                <p className="font-bold text-slate-800 dark:text-white">System Logs</p>
                                <p className="text-xs text-slate-500">Audit aktivitas sistem</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Quick Logs */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center"><FileText weight="duotone" className="w-4 h-4 mr-2 text-indigo-500" /> Log Terbaru</h3>
                        <button onClick={() => router.visit(route('admin.dashboard', { tab: 'logs' }))} className="text-xs font-bold text-indigo-600 hover:underline">Lihat Semua</button>
                    </div>
                    <div className="space-y-3">
                        {recentLogs.length > 0 ? recentLogs.slice(0, 5).map(log => (
                            <div key={log.id} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <div className={`p-1.5 rounded-lg mt-0.5 ${getActionColor(log.action)}`}>
                                    <Activity weight="bold" className="w-3 h-3" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                                        {typeof log.details === 'object' && log.details !== null ? JSON.stringify(log.details) : (log.details || log.action)}
                                    </p>
                                    <p className="text-[10px] text-slate-400">{log.admin_name || 'System'} • {log.created_at}</p>
                                </div>
                            </div>
                        )) : (
                            <p className="text-center text-xs text-slate-400 py-4">Belum ada log aktivitas.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
