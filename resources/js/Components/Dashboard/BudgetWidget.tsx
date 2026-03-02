import { Target, GripHorizontal, Zap } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { BudgetProgress } from '@/types/dashboard';

interface BudgetWidgetProps {
    budgets: BudgetProgress[];
    className?: string;
    style?: React.CSSProperties;
    onMouseDown?: React.MouseEventHandler;
    onMouseUp?: React.MouseEventHandler;
    onTouchEnd?: React.TouchEventHandler;
}

const formatShortIDR = (amount: number) => {
    if (amount >= 1_000_000_000) return `Rp${(amount / 1_000_000_000).toFixed(1)}M`;
    if (amount >= 1_000_000) return `Rp${(amount / 1_000_000).toFixed(1)}Jt`;
    if (amount >= 1_000) return `Rp${(amount / 1_000).toFixed(0)}K`;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

const getBudgetColor = (pct: number) => {
    if (pct >= 90) return 'bg-red-500';
    if (pct >= 70) return 'bg-amber-500';
    return 'bg-emerald-500';
};

const getBudgetColorGradient = (pct: number) => {
    if (pct >= 90) return 'from-red-500 to-rose-600';
    if (pct >= 70) return 'from-amber-500 to-orange-600';
    return 'from-emerald-500 to-teal-600';
};

const MASTER_LABELS: Record<string, { label: string; emoji: string }> = {
    NEEDS: { label: 'Kebutuhan', emoji: '🏠' },
    WANTS: { label: 'Keinginan', emoji: '🎯' },
    SAVINGS: { label: 'Tabungan', emoji: '💰' },
    INVESTMENTS: { label: 'Investasi', emoji: '📈' },
};

export default function BudgetWidget({
    budgets, className, style, onMouseDown, onMouseUp, onTouchEnd
}: BudgetWidgetProps) {
    const masterBudgets = budgets.filter(b => b.is_master);
    const manualBudgets = budgets.filter(b => !b.is_master);

    return (
        <div
            className={`glass-card p-6 rounded-[2rem] flex flex-col transition-all hover:shadow-lg duration-500 animate-fade-in-up h-full ${className || ''}`}
            style={style}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onTouchEnd={onTouchEnd}
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 group cursor-grab active:cursor-grabbing">
                    <div className="relative">
                        <Target className="w-5 h-5 text-indigo-500 group-hover:opacity-0 transition-opacity duration-200" />
                        <GripHorizontal className="w-5 h-5 text-slate-400 absolute top-0 left-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 drag-handle" />
                    </div>
                    Budget Watch
                </h3>
                <Link href={route('budgets.index')} onMouseDown={(e) => e.stopPropagation()} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Lihat</Link>
            </div>
            <div className="space-y-4 flex-1 overflow-y-auto scrollbar-hide">
                {budgets.length === 0 && (
                    <div className="flex items-center justify-center flex-1 text-slate-400 text-sm py-8">
                        Belum ada anggaran
                    </div>
                )}

                {/* Master Budgets — compact grid with mini rings */}
                {masterBudgets.length > 0 && (
                    <div>
                        <div className="flex items-center gap-1.5 mb-2">
                            <Zap className="w-3.5 h-3.5 text-indigo-500" />
                            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Alokasi Otomatis</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {masterBudgets.map((b) => {
                                const meta = MASTER_LABELS[b.category] || { label: b.category, emoji: '📊' };
                                const r = 18, stroke = 4;
                                const circ = 2 * Math.PI * r;
                                const offset = circ - (b.percentage / 100) * circ;
                                const ringColor = b.percentage >= 90 ? '#ef4444' : b.percentage >= 70 ? '#f59e0b' : '#10b981';

                                return (
                                    <div key={b.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                                        <div className="flex items-center gap-2.5">
                                            <svg width={44} height={44} className="transform -rotate-90 shrink-0">
                                                <circle cx="22" cy="22" r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-slate-200 dark:text-slate-700" />
                                                <circle cx="22" cy="22" r={r} fill="none" stroke={ringColor} strokeWidth={stroke}
                                                    strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                                                    style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
                                                <text x="22" y="22" textAnchor="middle" dominantBaseline="central"
                                                    className="fill-slate-700 dark:fill-white text-[9px] font-bold" transform="rotate(90, 22, 22)">
                                                    {b.percentage}%
                                                </text>
                                            </svg>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate">{meta.emoji} {meta.label}</p>
                                                <p className="text-[9px] text-slate-400 truncate">{formatShortIDR(b.spent)} / {formatShortIDR(b.limit)}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Manual Budgets — classic progress bars */}
                {manualBudgets.length > 0 && (
                    <div>
                        {masterBudgets.length > 0 && (
                            <div className="flex items-center gap-1.5 mb-2">
                                <Target className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Budget Manual</span>
                            </div>
                        )}
                        {manualBudgets.map((b) => (
                            <div key={b.id} className="mb-3 last:mb-0">
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{b.category}</span>
                                    <span className="text-xs font-bold text-slate-500">{b.percentage}%</span>
                                </div>
                                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className={`h-full ${getBudgetColor(b.percentage)} rounded-full transition-all duration-1000`} style={{ width: `${b.percentage}%` }} />
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                    <span>{formatShortIDR(b.spent)}</span>
                                    <span>/ {formatShortIDR(b.limit)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
