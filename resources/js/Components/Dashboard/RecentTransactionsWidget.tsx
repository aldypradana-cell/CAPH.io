import { TrendingUp, TrendingDown, ArrowRightLeft, GripHorizontal } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { Transaction } from '@/types/dashboard';

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
            className={`glass-card p-6 rounded-[2rem] flex flex-col transition-all hover:shadow-lg duration-500 animate-fade-in-up h-full ${className || ''}`}
            style={style}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onTouchEnd={onTouchEnd}
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 group cursor-grab active:cursor-grabbing">
                    <div className="relative">
                        <GripHorizontal className="w-5 h-5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 drag-handle" />
                    </div>
                    Transaksi Terbaru
                </h3>
                <Link href={route('transactions.index')} onMouseDown={(e) => e.stopPropagation()} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Lihat</Link>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto scrollbar-hide">
                {transactions.length > 0 ? (
                    transactions.slice(0, 5).map((t) => (
                        <div key={t.id} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800 last:border-0 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30 rounded-lg px-2 -mx-2 animate-pop-in">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm ${t.type === 'INCOME' ? 'bg-emerald-500' : t.type === 'TRANSFER' ? 'bg-blue-500' : 'bg-red-500'}`}>
                                    {t.type === 'INCOME' ? <TrendingUp className="w-4 h-4" /> : t.type === 'TRANSFER' ? <ArrowRightLeft className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 line-clamp-1">{t.description}</p>
                                    <p className="text-[10px] text-slate-400">{t.category} · {new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                                </div>
                            </div>
                            <span className={`text-sm font-bold ${t.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : t.type === 'TRANSFER' ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                                {t.type === 'INCOME' ? '+' : '-'}{formatShortIDR(t.amount)}
                            </span>
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
