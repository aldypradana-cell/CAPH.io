import { Target, GripHorizontal } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { BudgetProgress } from '@/types/dashboard';

interface BudgetWidgetProps {
    budgets: BudgetProgress[];
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

const getBudgetColor = (pct: number) => {
    if (pct >= 90) return 'bg-red-500';
    if (pct >= 70) return 'bg-amber-500';
    return 'bg-emerald-500';
};

export default function BudgetWidget({
    budgets, className, style, onMouseDown, onMouseUp, onTouchEnd
}: BudgetWidgetProps) {
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
                {budgets.length > 0 ? (
                    budgets.map((b) => (
                        <div key={b.id}>
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
                    ))
                ) : (
                    <div className="flex items-center justify-center flex-1 text-slate-400 text-sm py-8">
                        Belum ada anggaran
                    </div>
                )}
            </div>
        </div>
    );
}
