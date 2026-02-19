import { Wallet as WalletIcon, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from 'lucide-react';
import { Stats } from '@/types/dashboard';

interface StatsCardsProps {
    stats: Stats;
}

const formatIDR = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

export default function StatsCards({ stats }: StatsCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Balance */}
            <div className="bg-gradient-to-br from-[#1e3a8a] via-[#2563eb] to-[#3b82f6] shadow-xl shadow-blue-500/20 p-6 rounded-[2rem] hover:scale-[1.02] transition-all duration-500 group relative overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-white rounded-full blur-2xl" />
                    <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white rounded-full blur-2xl" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 text-white rounded-2xl backdrop-blur-sm">
                            <WalletIcon className="w-6 h-6" />
                        </div>
                        <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-full bg-white/20 text-white backdrop-blur-sm`}>
                            {stats.netFlow >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                            {stats.transactionCount} txn
                        </span>
                    </div>
                    <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest mb-1 opacity-80">Total Saldo</p>
                    <p className="text-3xl font-bold text-white tracking-tight break-words">{formatIDR(stats.balance)}</p>
                </div>
            </div>

            {/* Income */}
            <div className="bg-gradient-to-br from-[#059669] via-[#10b981] to-[#34d399] shadow-xl shadow-emerald-500/20 p-6 rounded-[2rem] hover:scale-[1.02] transition-all duration-500 group relative overflow-hidden animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-white rounded-full blur-2xl" />
                    <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white rounded-full blur-2xl" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 text-white rounded-2xl backdrop-blur-sm">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <span className="flex items-center text-xs font-bold px-2 py-1 rounded-full bg-white/20 text-white backdrop-blur-sm">
                            <ArrowUpRight className="w-3 h-3 mr-1" /> Masuk
                        </span>
                    </div>
                    <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest mb-1 opacity-80">Pemasukan Bulan Ini</p>
                    <p className="text-3xl font-bold text-white tracking-tight break-words">{formatIDR(stats.totalIncome)}</p>
                </div>
            </div>

            {/* Expense */}
            <div className="bg-gradient-to-br from-[#9f1239] via-[#e11d48] to-[#f43f5e] shadow-xl shadow-rose-500/20 p-6 rounded-[2rem] hover:scale-[1.02] transition-all duration-500 group relative overflow-hidden animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-white rounded-full blur-2xl" />
                    <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white rounded-full blur-2xl" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 text-white rounded-2xl backdrop-blur-sm">
                            <TrendingDown className="w-6 h-6" />
                        </div>
                        <span className="flex items-center text-xs font-bold px-2 py-1 rounded-full bg-white/20 text-white backdrop-blur-sm">
                            <ArrowDownRight className="w-3 h-3 mr-1" /> Keluar
                        </span>
                    </div>
                    <p className="text-[10px] font-bold text-rose-100 uppercase tracking-widest mb-1 opacity-80">Pengeluaran Bulan Ini</p>
                    <p className="text-3xl font-bold text-white tracking-tight break-words">{formatIDR(stats.totalExpense)}</p>
                </div>
            </div>
        </div>
    );
}
