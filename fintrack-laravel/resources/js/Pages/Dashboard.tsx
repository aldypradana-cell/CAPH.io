import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useState, useMemo } from 'react';
import {
    Plus, Sparkles, TrendingUp, TrendingDown, Wallet as WalletIcon,
    ArrowUpRight, ArrowDownRight, BarChart3, Target,
    CalendarClock, AlertTriangle, ChevronDown, X, ArrowRightLeft,
    Filter, Calendar, PieChart as PieChartIcon
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import toast, { Toaster } from 'react-hot-toast';

interface Stats {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    netFlow: number;
    transactionCount: number;
}

interface Transaction {
    id: number;
    date: string;
    description: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    category: string;
    wallet?: { id: number; name: string };
}

interface WalletData {
    id: number;
    name: string;
    type: string;
    balance: number;
}

interface BudgetProgress {
    id: number;
    category: string;
    limit: number;
    spent: number;
    percentage: number;
}

interface CategoryData {
    id: number;
    name: string;
    type: string;
}

interface Debt {
    id: number;
    type: string;
    person: string;
    amount: number;
    due_date: string;
    description?: string;
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

const formatIDR = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

const formatShortIDR = (amount: number) => {
    if (amount >= 1_000_000_000) return `Rp${(amount / 1_000_000_000).toFixed(1)}M`;
    if (amount >= 1_000_000) return `Rp${(amount / 1_000_000).toFixed(1)}Jt`;
    if (amount >= 1_000) return `Rp${(amount / 1_000).toFixed(0)}K`;
    return formatIDR(amount);
};

export default function Dashboard({
    auth, stats, expenseByCategory, budgetProgress, recentTransactions, wallets, upcomingBills, allTransactions, categories
}: PageProps<{
    stats: Stats;
    expenseByCategory: Record<string, number>;
    budgetProgress: BudgetProgress[];
    recentTransactions: Transaction[];
    wallets: WalletData[];
    upcomingBills: Debt[];
    allTransactions: Transaction[];
    categories: CategoryData[];
}>) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [inputType, setInputType] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER'>('EXPENSE');

    const { data, setData, post, processing, reset } = useForm({
        wallet_id: '',
        to_wallet_id: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        type: 'EXPENSE' as 'INCOME' | 'EXPENSE' | 'TRANSFER',
        category: '',
    });

    const handleAmountChange = (val: string) => {
        const rawValue = val.replace(/\D/g, '');
        if (!rawValue) { setData('amount', ''); return; }
        setData('amount', parseInt(rawValue).toLocaleString('id-ID'));
    };

    const parseAmount = (val: string) => parseFloat(val.replace(/\./g, '')) || 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { ...data, type: inputType, amount: parseAmount(data.amount).toString() };
        router.post(route('transactions.store'), payload, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setIsAddModalOpen(false);
                reset();
                toast.success('Transaksi berhasil ditambahkan!');
            }
        });
    };

    // --- TREND CHART STATE ---
    type FilterType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';
    const getLocalDateString = (date: Date = new Date()) => {
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offset).toISOString().split('T')[0];
    };

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [activeFilter, setActiveFilter] = useState<FilterType>('DAILY');
    const [trendMode, setTrendMode] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
    const [trendStartDate, setTrendStartDate] = useState(getLocalDateString(monthStart));
    const [trendEndDate, setTrendEndDate] = useState(getLocalDateString(now));
    const [trendCategory, setTrendCategory] = useState<string>('ALL');

    // --- PIE CHART STATE ---
    const [pieStartDate, setPieStartDate] = useState(getLocalDateString(monthStart));
    const [pieEndDate, setPieEndDate] = useState(getLocalDateString(now));

    const txns = allTransactions || [];
    const cats = categories || [];

    const handleFilterChange = (filter: FilterType) => {
        setActiveFilter(filter);
        const end = new Date();
        let start = new Date();
        if (filter === 'DAILY') { start = new Date(end.getFullYear(), end.getMonth(), 1); setTrendMode('DAILY'); }
        else if (filter === 'WEEKLY') { start.setMonth(end.getMonth() - 3); setTrendMode('WEEKLY'); }
        else if (filter === 'MONTHLY') { start = new Date(end.getFullYear(), 0, 1); setTrendMode('MONTHLY'); }
        else if (filter === 'YEARLY') { start.setFullYear(end.getFullYear() - 5); start.setMonth(0, 1); setTrendMode('MONTHLY'); }
        else if (filter === 'CUSTOM') { setTrendMode('DAILY'); return; }
        setTrendStartDate(getLocalDateString(start));
        setTrendEndDate(getLocalDateString(end));
    };

    const handleDateChange = (field: 'start' | 'end', value: string) => {
        if (field === 'start') setTrendStartDate(value); else setTrendEndDate(value);
        setActiveFilter('CUSTOM');
        setTrendMode('DAILY');
    };

    const trendData = useMemo(() => {
        const start = new Date(trendStartDate);
        const end = new Date(trendEndDate);
        const data: { name: string; Pemasukan: number; Pengeluaran: number }[] = [];

        const sumInRange = (s: Date, e: Date) => {
            const sStr = getLocalDateString(s);
            const eStr = getLocalDateString(e);
            const inRange = txns.filter(t => {
                const dateMatch = t.date >= sStr && t.date <= eStr;
                const catMatch = trendCategory === 'ALL' || t.category === trendCategory;
                return dateMatch && catMatch;
            });
            return {
                income: inRange.filter(t => t.type === 'INCOME').reduce((a, t) => a + t.amount, 0),
                expense: inRange.filter(t => t.type === 'EXPENSE').reduce((a, t) => a + t.amount, 0),
            };
        };

        if (trendMode === 'DAILY') {
            for (let d = new Date(start.getTime()); d.getTime() <= end.getTime(); d.setDate(d.getDate() + 1)) {
                const dayLabel = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                const sums = sumInRange(d, d);
                data.push({ name: dayLabel, Pemasukan: sums.income, Pengeluaran: sums.expense });
            }
        } else if (trendMode === 'WEEKLY') {
            let current = new Date(start.getTime());
            const day = current.getDay();
            current.setDate(current.getDate() - day + (day === 0 ? -6 : 1));
            while (current.getTime() <= end.getTime()) {
                const weekStart = new Date(current.getTime());
                const weekEnd = new Date(current.getTime()); weekEnd.setDate(weekEnd.getDate() + 6);
                if (weekEnd.getTime() >= start.getTime()) {
                    const label = `${weekStart.getDate()} ${weekStart.toLocaleDateString('id-ID', { month: 'short' })}`;
                    const sums = sumInRange(weekStart, weekEnd);
                    data.push({ name: label, Pemasukan: sums.income, Pengeluaran: sums.expense });
                }
                current.setDate(current.getDate() + 7);
            }
        } else if (trendMode === 'MONTHLY') {
            let current = new Date(start.getFullYear(), start.getMonth(), 1);
            while (current.getTime() <= end.getTime()) {
                const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
                const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
                if (monthEnd.getTime() >= start.getTime()) {
                    const label = current.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
                    const sums = sumInRange(monthStart, monthEnd);
                    data.push({ name: label, Pemasukan: sums.income, Pengeluaran: sums.expense });
                }
                current.setMonth(current.getMonth() + 1);
            }
        }
        return data;
    }, [txns, trendStartDate, trendEndDate, trendMode, trendCategory]);

    // --- PIE CHART DATA ---
    const categoryData = useMemo(() => {
        return txns
            .filter(t => t.type === 'EXPENSE' && t.date >= pieStartDate && t.date <= pieEndDate)
            .reduce((acc: Record<string, number>, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {})
    }, [txns, pieStartDate, pieEndDate]);

    const pieData = Object.entries(categoryData).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const totalCategoryExpense = pieData.reduce((a, b) => a + b.value, 0);

    const PIE_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#64748b'];

    // Budget colors
    const getBudgetColor = (pct: number) => {
        if (pct >= 90) return 'bg-red-500';
        if (pct >= 70) return 'bg-amber-500';
        return 'bg-emerald-500';
    };

    return (
        <AppLayout
            header={
                <div className="flex flex-col">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Dashboard Ringkasan</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        Selamat datang kembali, {auth.user.name.split(' ')[0]}!
                    </p>
                </div>
            }
        >
            <Head title="Dashboard" />
            <Toaster position="top-right" />

            <div className="space-y-8">
                {/* Quick Action Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in-up" style={{ animationDelay: '0ms' }}>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Financial Overview</h2>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                            Pantau kondisi keuangan Anda secara real-time.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('smart-entry.index')}
                            className="flex items-center px-5 py-3 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-2xl text-sm font-bold hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all border border-indigo-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
                        >
                            <Sparkles className="w-4 h-4 mr-2 text-indigo-500 dark:text-indigo-400" />
                            AI Input
                        </Link>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl text-sm font-bold hover:shadow-lg hover:shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Transaksi Baru
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Balance */}
                    <div className="glass-card p-6 rounded-[2rem] hover:shadow-xl transition-all duration-500 group relative overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-2xl transition-transform duration-500 group-hover:scale-110">
                                    <WalletIcon className="w-6 h-6" />
                                </div>
                                <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${stats.netFlow >= 0 ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400' : 'text-red-700 bg-red-100 dark:bg-red-900/40 dark:text-red-400'}`}>
                                    {stats.netFlow >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                                    {stats.transactionCount} txn
                                </span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total Saldo</p>
                            <p className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{formatShortIDR(stats.balance)}</p>
                        </div>
                    </div>

                    {/* Income */}
                    <div className="glass-card p-6 rounded-[2rem] hover:shadow-xl transition-all duration-500 group relative overflow-hidden animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-2xl transition-transform duration-500 group-hover:scale-110">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <span className="flex items-center text-xs font-bold px-2 py-1 rounded-full text-emerald-700 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400">
                                    <ArrowUpRight className="w-3 h-3 mr-1" /> Masuk
                                </span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Pemasukan Bulan Ini</p>
                            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">{formatShortIDR(stats.totalIncome)}</p>
                        </div>
                    </div>

                    {/* Expense */}
                    <div className="glass-card p-6 rounded-[2rem] hover:shadow-xl transition-all duration-500 group relative overflow-hidden animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-2xl transition-transform duration-500 group-hover:scale-110">
                                    <TrendingDown className="w-6 h-6" />
                                </div>
                                <span className="flex items-center text-xs font-bold px-2 py-1 rounded-full text-red-700 bg-red-100 dark:bg-red-900/40 dark:text-red-400">
                                    <ArrowDownRight className="w-3 h-3 mr-1" /> Keluar
                                </span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Pengeluaran Bulan Ini</p>
                            <p className="text-3xl font-bold text-red-600 dark:text-red-400 tracking-tight">{formatShortIDR(stats.totalExpense)}</p>
                        </div>
                    </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[500px]">
                    {/* Trend Bar Chart */}
                    <div className="lg:col-span-2 glass-card p-6 lg:p-8 rounded-[2rem] flex flex-col transition-all hover:shadow-lg duration-500 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                        <div className="flex flex-col justify-between mb-6 gap-4">
                            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                        <BarChart3 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-white text-lg">Analisis Tren</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Pemasukan vs Pengeluaran</p>
                                    </div>
                                </div>
                                {/* Filters */}
                                <div className="flex flex-wrap gap-2 items-center">
                                    <div className="relative">
                                        <select
                                            value={trendCategory}
                                            onChange={(e) => setTrendCategory(e.target.value)}
                                            className="appearance-none pl-3 pr-8 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 cursor-pointer max-w-[140px] transition-all hover:border-indigo-300"
                                        >
                                            <option value="ALL">Semua Kategori</option>
                                            {cats.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                        </select>
                                        <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                                    </div>
                                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto scrollbar-hide">
                                        {(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM'] as const).map(filter => (
                                            <button
                                                key={filter}
                                                onClick={() => handleFilterChange(filter)}
                                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap active:scale-95 ${activeFilter === filter
                                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                                    }`}
                                            >
                                                {filter === 'DAILY' ? 'Harian' : filter === 'WEEKLY' ? 'Mingguan' : filter === 'MONTHLY' ? 'Bulanan' : filter === 'YEARLY' ? 'Tahunan' : 'Custom'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-700 w-fit">
                                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Range:</span>
                                <input type="date" value={trendStartDate} onChange={(e) => handleDateChange('start', e.target.value)} className="bg-transparent font-medium text-slate-900 dark:text-slate-100 focus:outline-none text-xs" />
                                <span className="text-slate-300">-</span>
                                <input type="date" value={trendEndDate} onChange={(e) => handleDateChange('end', e.target.value)} className="bg-transparent font-medium text-slate-900 dark:text-slate-100 focus:outline-none text-xs" />
                            </div>
                        </div>
                        <div className="flex-1 w-full min-h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="stroke-slate-100 dark:stroke-slate-800" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} dy={10} interval={trendData.length > 10 ? 'preserveStartEnd' : 0} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} tickFormatter={formatShortIDR} />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                        formatter={(value: number | undefined) => formatIDR(value ?? 0)}
                                        labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '0.5rem' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} iconType="circle" />
                                    <Bar dataKey="Pemasukan" fill="url(#colorIncome)" radius={[6, 6, 0, 0]} maxBarSize={40} animationDuration={1000} />
                                    <Bar dataKey="Pengeluaran" fill="url(#colorExpense)" radius={[6, 6, 0, 0]} maxBarSize={40} animationDuration={1000} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Category Pie Chart */}
                    <div className="glass-card p-6 lg:p-8 rounded-[2rem] flex flex-col transition-all hover:shadow-lg duration-500 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-pink-50 dark:bg-slate-800 text-pink-600 dark:text-pink-400 rounded-xl">
                                    <PieChartIcon className="w-5 h-5" />
                                </div>
                                <h4 className="font-bold text-slate-800 dark:text-white text-lg">Distribusi</h4>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-bold bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg text-slate-500 dark:text-slate-400">
                                <Calendar className="w-3 h-3" />
                                Custom
                            </div>
                        </div>
                        <div className="flex justify-center gap-2 mb-4">
                            <input type="date" value={pieStartDate} onChange={(e) => setPieStartDate(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-[10px] text-slate-500 dark:text-slate-400 px-2 py-1 outline-none" />
                            <input type="date" value={pieEndDate} onChange={(e) => setPieEndDate(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-[10px] text-slate-500 dark:text-slate-400 px-2 py-1 outline-none" />
                        </div>
                        {pieData.length > 0 ? (
                            <>
                                <div className="flex-1 min-h-[200px] flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value" cornerRadius={6} animationDuration={800}>
                                                {pieData.map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} strokeWidth={0} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: number | undefined) => formatIDR(value ?? 0)} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                            <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-2 mt-2 max-h-[120px] overflow-y-auto scrollbar-hide">
                                    {pieData.slice(0, 5).map((item, idx) => (
                                        <div key={item.name} className="flex items-center justify-between text-xs">
                                            <div className="flex items-center">
                                                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                                                <span className="text-slate-600 dark:text-slate-300 truncate max-w-[120px]">{item.name}</span>
                                            </div>
                                            <span className="font-bold text-slate-700 dark:text-slate-200">
                                                {totalCategoryExpense > 0 ? ((item.value / totalCategoryExpense) * 100).toFixed(0) : 0}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
                                <PieChartIcon className="w-16 h-16 mb-2 opacity-20" />
                                <p className="text-sm font-medium">Belum ada data</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Widgets Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Budget Watch */}
                    <div className="glass-card p-6 rounded-[2rem] flex flex-col transition-all hover:shadow-lg duration-500 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center">
                                <Target className="w-5 h-5 mr-2 text-indigo-500" /> Budget Watch
                            </h3>
                            <Link href={route('budgets.index')} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Lihat</Link>
                        </div>
                        <div className="space-y-4 flex-1 overflow-y-auto scrollbar-hide">
                            {budgetProgress.length > 0 ? (
                                budgetProgress.map((b) => (
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

                    {/* Upcoming Bills */}
                    <div className="glass-card p-6 rounded-[2rem] flex flex-col transition-all hover:shadow-lg duration-500 animate-fade-in-up" style={{ animationDelay: '700ms' }}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center">
                                <CalendarClock className="w-5 h-5 mr-2 text-amber-500" /> Tagihan Mendatang
                            </h3>
                            <Link href={route('debts.index')} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Lihat</Link>
                        </div>
                        <div className="space-y-3 flex-1 overflow-y-auto scrollbar-hide">
                            {upcomingBills.length > 0 ? (
                                upcomingBills.map((bill) => {
                                    const dueDate = new Date(bill.due_date);
                                    const isOverdue = dueDate < new Date();
                                    return (
                                        <div key={bill.id} className={`flex items-center justify-between p-3 rounded-xl border ${isOverdue ? 'border-red-200 dark:border-red-900/50 bg-red-50/80 dark:bg-red-900/10' : 'border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'} transition-colors`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${isOverdue ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} />
                                                <div>
                                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{bill.person}</p>
                                                    <p className="text-[10px] text-slate-400">{dueDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-bold text-red-600 dark:text-red-400">{formatShortIDR(bill.amount)}</span>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="flex items-center justify-center flex-1 text-slate-400 text-sm py-8">
                                    Tidak ada tagihan
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Transactions */}
                    <div className="glass-card p-6 rounded-[2rem] flex flex-col transition-all hover:shadow-lg duration-500 animate-fade-in-up" style={{ animationDelay: '800ms' }}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Transaksi Terbaru</h3>
                            <Link href={route('transactions.index')} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Lihat</Link>
                        </div>
                        <div className="space-y-3 flex-1 overflow-y-auto scrollbar-hide">
                            {recentTransactions.length > 0 ? (
                                recentTransactions.slice(0, 5).map((t) => (
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
                </div>
            </div>

            {/* Modern Add Transaction Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-6 pb-16 lg:pb-0 animate-fade-in">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity" onClick={() => setIsAddModalOpen(false)} />
                    <div className="relative w-full max-w-md glass-card rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-pop-in">
                        {/* Gradient top bar */}
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-10" />

                        {/* Header */}
                        <div className="p-5 pb-0 shrink-0">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Transaksi Baru</h3>
                                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Type Toggle */}
                            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-2">
                                {(['EXPENSE', 'INCOME', 'TRANSFER'] as const).map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => {
                                            setInputType(type);
                                            setData(d => ({
                                                ...d,
                                                type,
                                                category: ''
                                            }));
                                        }}
                                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${inputType === type
                                            ? type === 'INCOME' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                                : type === 'EXPENSE' ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                                                    : 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                            }`}
                                    >
                                        {type === 'EXPENSE' ? <><TrendingDown className="w-3 h-3" /> KELUAR</> :
                                            type === 'INCOME' ? <><TrendingUp className="w-3 h-3" /> MASUK</> :
                                                <><ArrowRightLeft className="w-3 h-3" /> TRANSFER</>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Form */}
                        <div className="p-5 pt-4 overflow-y-auto scrollbar-hide">
                            <form onSubmit={handleSubmit} className="space-y-3">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Dompet</label>
                                    <select value={data.wallet_id} onChange={(e) => setData('wallet_id', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" required>
                                        <option value="">Pilih Dompet</option>
                                        {wallets.map(w => (
                                            <option key={w.id} value={w.id}>{w.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {inputType === 'TRANSFER' && (
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Ke Dompet</label>
                                        <select value={data.to_wallet_id} onChange={(e) => setData('to_wallet_id', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" required>
                                            <option value="">Pilih Dompet Tujuan</option>
                                            {wallets.filter(w => w.id.toString() !== data.wallet_id).map(w => (
                                                <option key={w.id} value={w.id}>{w.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Jumlah (Rp)</label>
                                    <input type="text" value={data.amount} onChange={(e) => handleAmountChange(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-2xl text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50 text-center" placeholder="0" required />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Kategori</label>
                                        <select
                                            value={data.category}
                                            onChange={(e) => setData('category', e.target.value)}
                                            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50"
                                            required
                                        >
                                            <option value="">Pilih</option>
                                            {categories
                                                .filter(c => c.type === inputType)
                                                .map(cat => (
                                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Tanggal</label>
                                        <input type="date" value={data.date} onChange={(e) => setData('date', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" required />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Deskripsi</label>
                                    <input type="text" value={data.description} onChange={(e) => setData('description', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" placeholder="Makan siang" required />
                                </div>

                                <div className="flex space-x-3 pt-4">
                                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors active:scale-95">Batal</button>
                                    <button type="submit" disabled={processing} className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-transform disabled:opacity-50">
                                        {processing ? 'Menyimpan...' : 'Simpan'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
