import { Repeat, Sparkles, CalendarClock, GripHorizontal } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { RecurringTransaction } from '@/types/dashboard';

interface RecurringWidgetProps {
    transactions: RecurringTransaction[];
    className?: string; // Allow passing styles/classes for grid layout
    style?: React.CSSProperties; // Allow passing styles directly
    onMouseDown?: React.MouseEventHandler;
    onMouseUp?: React.MouseEventHandler;
    onTouchEnd?: React.TouchEventHandler;
}

const formatIDR = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

const formatShortIDR = (amount: number) => {
    if (amount >= 1_000_000_000) return `Rp${(amount / 1_000_000_000).toFixed(1)}M`;
    if (amount >= 1_000_000) return `Rp${(amount / 1_000_000).toFixed(1)}Jt`;
    if (amount >= 1_000) return `Rp${(amount / 1_000).toFixed(0)}K`;
    return formatIDR(amount);
};

export default function RecurringWidget({
    transactions, className, style, onMouseDown, onMouseUp, onTouchEnd
}: RecurringWidgetProps) {
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
                        <Repeat className="w-5 h-5 text-indigo-500 group-hover:opacity-0 transition-opacity duration-200" />
                        <GripHorizontal className="w-5 h-5 text-slate-400 absolute top-0 left-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 drag-handle" />
                    </div>
                    Transaksi Rutin
                </h3>
                <Link href={route('debts.index')} onMouseDown={(e) => e.stopPropagation()} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Lihat Semua</Link>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto scrollbar-hide">
                {transactions.length > 0 ? (
                    transactions.map((rt) => {
                        const nextDate = new Date(rt.next_run_date);
                        const now = new Date();
                        const diffTime = nextDate.getTime() - now.getTime();
                        const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        const isToday = daysUntil === 0;
                        const isOverdue = daysUntil < 0;
                        const isSoon = daysUntil > 0 && daysUntil <= 3;

                        return (
                            <div key={rt.id} className="group relative p-3 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-900 transition-all hover:shadow-md hover:scale-[1.02]">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm ${rt.type === 'EXPENSE' ? 'bg-gradient-to-br from-rose-500 to-pink-600' :
                                            rt.type === 'INCOME' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
                                                'bg-gradient-to-br from-blue-500 to-indigo-600'
                                            }`}>
                                            {rt.frequency === 'MONTHLY' ? <span className="text-xs font-bold">BLN</span> : <Repeat className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 dark:text-white line-clamp-1">{rt.name}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{rt.category}</span>
                                                {rt.auto_cut && (
                                                    <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-[9px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5">
                                                        <Sparkles className="w-2 h-2" /> Auto
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-bold ${rt.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                            {formatShortIDR(rt.amount)}
                                        </p>

                                    </div>
                                </div>

                                {/* Date Indicator */}
                                <div className={`flex items-center justify-between text-[10px] font-bold px-2 py-1 rounded-lg ${isToday ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' :
                                    isOverdue ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' :
                                        isSoon ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                                            'bg-slate-100 text-slate-500 dark:bg-slate-700/50 dark:text-slate-400'
                                    }`}>
                                    <span className="flex items-center gap-1">
                                        <CalendarClock className="w-3 h-3" />
                                        {nextDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                    </span>
                                    <span>
                                        {isToday ? 'Hari Ini!' : isOverdue ? `Lewat ${Math.abs(daysUntil)} hari` : `H-${daysUntil}`}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center flex-1 text-slate-400 py-8">
                        <Repeat className="w-12 h-12 mb-2 opacity-20" />
                        <span className="text-sm">Belum ada transaksi rutin</span>
                    </div>
                )}
            </div>
        </div>
    );
}
