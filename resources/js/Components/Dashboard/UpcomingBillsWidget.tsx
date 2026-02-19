import { AlertTriangle, ArrowDownRight, ArrowUpRight, Receipt, Wallet as WalletIcon, GripHorizontal } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { Debt } from '@/types/dashboard';

interface UpcomingBillsWidgetProps {
    bills: Debt[];
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

export default function UpcomingBillsWidget({
    bills, className, style, onMouseDown, onMouseUp, onTouchEnd
}: UpcomingBillsWidgetProps) {
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
                        <AlertTriangle className="w-5 h-5 text-rose-500 group-hover:opacity-0 transition-opacity duration-200" />
                        <GripHorizontal className="w-5 h-5 text-slate-400 absolute top-0 left-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 drag-handle" />
                    </div>
                    Hutang & Piutang
                </h3>
                <Link href={route('debts.index')} onMouseDown={(e) => e.stopPropagation()} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Lihat Semua</Link>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto scrollbar-hide">
                {bills.length > 0 ? (
                    bills.map((bill) => {
                        const dueDate = bill.due_date ? new Date(bill.due_date) : null;
                        const isOverdue = dueDate && dueDate < new Date();
                        const isDebt = bill.type === 'DEBT';
                        const isReceivable = bill.type === 'RECEIVABLE';

                        return (
                            <div key={bill.id} className="group relative p-3 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-900 transition-all hover:shadow-md hover:scale-[1.02]">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0 ${isDebt ? 'bg-gradient-to-br from-rose-500 to-red-600' :
                                            isReceivable ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
                                                'bg-gradient-to-br from-amber-500 to-orange-600'
                                            }`}>
                                            {isDebt ? <ArrowDownRight className="w-5 h-5" /> :
                                                isReceivable ? <ArrowUpRight className="w-5 h-5" /> :
                                                    <Receipt className="w-5 h-5" />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{bill.person}</p>
                                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                {isDebt ? 'Hutang' : isReceivable ? 'Piutang' : 'Tagihan'}
                                                {dueDate && (
                                                    <span className={`flex items-center ml-1 ${isOverdue ? 'text-rose-500' : ''}`}>
                                                        • {dueDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right whitespace-nowrap pl-2">
                                        <p className={`text-sm font-bold ${isDebt ? 'text-rose-600 dark:text-rose-400' :
                                            isReceivable ? 'text-emerald-600 dark:text-emerald-400' :
                                                'text-amber-600 dark:text-amber-400'
                                            }`}>
                                            {formatShortIDR(bill.amount)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center flex-1 text-slate-400 py-8">
                        <WalletIcon className="w-12 h-12 mb-2 opacity-20" />
                        <span className="text-sm">Tidak ada tagihan aktif</span>
                    </div>
                )}
            </div>
        </div>
    );
}
