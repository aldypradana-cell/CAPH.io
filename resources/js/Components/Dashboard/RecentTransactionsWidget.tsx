import { TrendUp as TrendingUp, TrendDown as TrendingDown, ArrowsLeftRight as ArrowRightLeft, DotsSix as GripHorizontal, Clock } from '@phosphor-icons/react';
import { Link } from '@inertiajs/react';
import { Transaction } from '@/types/dashboard';
import { formatDateDayMonth } from '@/utils/date';

interface RecentTransactionsWidgetProps {
    transactions: Transaction[];
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

export default function RecentTransactionsWidget({
    transactions, className, style, onMouseDown, onMouseUp, onTouchEnd
}: RecentTransactionsWidgetProps) {
    return (
        <div
            className={`glass-card p-3 sm:p-6 rounded-[2rem] flex flex-col transition-all hover:shadow-2xl hover:shadow-slate-500/10 duration-500 animate-fade-in-up h-full group relative overflow-hidden ${className || ''}`}
            style={style}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onTouchEnd={onTouchEnd}
        >
            {/* Ambient Glows */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -z-10 pointer-events-none">
                <div className="absolute -right-20 -top-20 w-80 h-80 bg-slate-500/10 rounded-full blur-[100px]" />
                <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 group cursor-grab active:cursor-grabbing">
                    <div className="relative">
                        <div className="p-2 bg-[#0B5F64]/10 dark:bg-[#0B5F64]/5 text-[#0B5F64] dark:text-teal-400 rounded-lg group-hover:opacity-0 transition-opacity duration-200">
                            <Clock weight="duotone" className="w-5 h-5" />
                        </div>
                        <GripHorizontal weight="bold" className="w-5 h-5 text-slate-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 drag-handle" />
                    </div>
                    Transaksi Terbaru
                </h3>
                <Link href={route('transactions.index')} onMouseDown={(e) => e.stopPropagation()} className="text-xs font-bold text-[#0B5F64] dark:text-[#B89A5D] hover:underline">Lihat</Link>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto scrollbar-hide">
                {transactions.length > 0 ? (
                    transactions.slice(0, 5).map((t) => (
                        <div key={t.id} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800 last:border-0 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30 rounded-lg px-2 -mx-2 animate-pop-in">
                            <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0 pr-2 sm:pr-0">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0 flex-shrink-0 ${t.type === 'INCOME' ? 'bg-emerald-500' : t.type === 'TRANSFER' ? 'bg-blue-500' : 'bg-red-500'}`}>
                                    {t.type === 'INCOME' ? <TrendingUp weight="bold" className="w-5 h-5" /> : t.type === 'TRANSFER' ? <ArrowRightLeft weight="bold" className="w-5 h-5" /> : <TrendingDown weight="bold" className="w-5 h-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 line-clamp-2 sm:truncate">{t.description}</p>
                                    <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
                                        <span>{t.category}</span>
                                        <span className="opacity-30">·</span>
                                        <span className="shrink-0">{formatDateDayMonth(t.date)}</span>
                                        {!t.wallet_id && (
                                            <>
                                                <span className="opacity-30">·</span>
                                                <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-0.5 shrink-0">
                                                    <Clock weight="fill" className="w-3 h-3" /> PayLater
                                                </span>
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-4 shrink-0">
                                <span className={`text-sm font-bold ${t.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : t.type === 'TRANSFER' ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {t.type === 'INCOME' ? '+' : '-'}{formatShortIDR(t.amount)}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex items-center justify-center flex-1 text-slate-400 text-sm py-8">
                        Belum ada transaksi
                    </div>
                )}
            </div>
        </div>
    );
}
