import { Wallet as WalletIcon, ArrowUpRight, ArrowDownRight, TrendUp as TrendingUp, TrendDown as TrendingDown } from '@phosphor-icons/react';
import { Stats } from '@/types/dashboard';

interface StatsCardsProps {
    stats: Stats;
}

const formatIDR = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

export default function StatsCards({ stats }: StatsCardsProps) {
    return (
        <div className="-mx-6 px-6 flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide md:mx-0 md:px-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:pb-0">
            {/* Balance */}
            <div className="min-w-[220px] sm:min-w-[280px] snap-center md:min-w-0 glass-premium p-4 sm:p-5 md:p-7 rounded-[2.5rem] hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 group relative overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <div className="absolute inset-0 opacity-40 dark:opacity-20">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#F0FDFA] via-[#CCFBF1] to-transparent blur-3xl -z-10" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <div className="p-3 bg-[#0B5F64]/10 text-[#0B5F64] dark:text-[#5EEAD4] rounded-2xl backdrop-blur-md shadow-inner ring-1 ring-white/30 dark:ring-white/10">
                            <WalletIcon weight="duotone" className="w-7 h-7" />
                        </div>
                        <span className="flex items-center text-[10px] font-black px-2.5 py-1.5 rounded-xl bg-white/60 dark:bg-white/5 text-[#0B5F64] dark:text-[#5EEAD4] backdrop-blur-md shadow-sm ring-1 ring-white/50 dark:ring-white/10 italic tracking-tighter">
                            {stats.netFlow >= 0 ? <ArrowUpRight weight="bold" className="w-3 h-3 mr-1" /> : <ArrowDownRight weight="bold" className="w-3 h-3 mr-1" />}
                            {stats.transactionCount} TXN
                        </span>
                    </div>
                    <p className="text-[10px] font-black text-[#8F7442] dark:text-[#B89A5D] uppercase tracking-[0.2em] mb-1.5 opacity-70">Sisa Saldo</p>
                    <p className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tighter break-words drop-shadow-sm">{formatIDR(stats.balance)}</p>
                </div>
            </div>

            {/* Income */}
            <div className="min-w-[220px] sm:min-w-[280px] snap-center md:min-w-0 glass-premium p-4 sm:p-5 md:p-7 rounded-[2.5rem] hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 group relative overflow-hidden animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <div className="absolute inset-0 opacity-20 dark:opacity-30">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0B5F64] via-teal-500 to-transparent blur-3xl -z-10" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <div className="p-3 bg-[#0B5F64]/15 text-[#0B5F64] dark:text-teal-200 rounded-2xl backdrop-blur-md shadow-inner ring-1 ring-white/30 dark:ring-white/10">
                            <TrendingUp weight="duotone" className="w-7 h-7" />
                        </div>
                        <span className="flex items-center text-[10px] font-black px-2.5 py-1.5 rounded-xl bg-white/40 dark:bg-white/5 text-[#0B5F64] dark:text-teal-100 backdrop-blur-md shadow-sm ring-1 ring-white/50 dark:ring-white/10 italic tracking-tighter">
                            <ArrowUpRight weight="bold" className="w-3 h-3 mr-1" /> MASUK
                        </span>
                    </div>
                    <p className="text-[10px] font-black text-[#8F7442] dark:text-[#B89A5D] uppercase tracking-[0.2em] mb-1.5 opacity-70">Pemasukan Bulan Ini</p>
                    <p className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tighter break-words drop-shadow-sm">{formatIDR(stats.totalIncome)}</p>
                </div>
            </div>

            {/* Expense */}
            <div className="min-w-[220px] sm:min-w-[280px] snap-center md:min-w-0 glass-premium p-4 sm:p-5 md:p-7 rounded-[2.5rem] hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 group relative overflow-hidden animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                <div className="absolute inset-0 opacity-20 dark:opacity-40">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#67074e] via-[#4a0536] to-transparent blur-3xl -z-10" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <div className="p-3 bg-slate-800 text-slate-200 dark:bg-slate-700 rounded-2xl backdrop-blur-md shadow-inner ring-1 ring-white/20">
                            <TrendingDown weight="duotone" className="w-7 h-7" />
                        </div>
                        <span className="flex items-center text-[10px] font-black px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 dark:bg-slate-700 backdrop-blur-md shadow-sm ring-1 ring-white/10 italic tracking-tighter">
                            <ArrowDownRight weight="bold" className="w-3 h-3 mr-1" /> KELUAR
                        </span>
                    </div>
                    <p className="text-[10px] font-black text-[#8F7442] dark:text-[#B89A5D] uppercase tracking-[0.2em] mb-1.5 opacity-70">Pengeluaran Bulan Ini</p>
                    <p className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tighter break-words drop-shadow-sm">{formatIDR(stats.totalExpense)}</p>
                </div>
            </div>
        </div>
    );
}
