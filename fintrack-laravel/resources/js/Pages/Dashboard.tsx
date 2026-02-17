import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useState } from 'react';
import {
    Plus, Sparkles, TrendingUp, TrendingDown, Wallet as WalletIcon,
    ArrowUpRight, ArrowDownRight, BarChart3, Target,
    CalendarClock, AlertTriangle, ChevronDown, X, ArrowRightLeft,
    Filter, Calendar, PieChart as PieChartIcon, Tag as TagIcon
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import toast, { Toaster } from 'react-hot-toast';
import TagInput from '@/Components/TagInput';

interface TagData {
    id: number;
    name: string;
    color: string | null;
}

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

const CustomTooltip = ({ active, payload, label, total }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 text-left">
                <p className="text-sm font-bold text-slate-800 dark:text-white mb-3 text-center border-b border-slate-100 dark:border-slate-800 pb-2">{label}</p>
                <div className="space-y-2">
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-6 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full shadow-sm ring-2 ring-white dark:ring-slate-900" style={{ backgroundColor: entry.color }} />
                                <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{entry.name}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-slate-700 dark:text-slate-200 font-bold font-mono text-sm block">
                                    {formatIDR(entry.value)}
                                </span>
                                {total && (
                                    <span className="text-[10px] text-slate-400 font-bold">
                                        {((entry.value / total) * 100).toFixed(1)}%
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};


interface ChartData {
    name: string;
    Pemasukan: number;
    Pengeluaran: number;
    fullDate?: string;
}

interface PieData {
    name: string;
    value: number;
}

interface TopTagData {
    name: string;
    total: number;
    color: string | null;
    percentage: number;
}

export default function Dashboard({
    auth, stats, trendData: chartData, pieData, budgetProgress, recentTransactions, wallets, upcomingBills, topTags, categories, userTags, filters
}: PageProps<{
    stats: Stats;
    trendData: ChartData[];
    pieData: PieData[];
    budgetProgress: BudgetProgress[];
    recentTransactions: Transaction[];
    wallets: WalletData[];
    upcomingBills: Debt[];
    topTags: TopTagData[];
    categories: CategoryData[];
    userTags: TagData[];
    filters: { startDate: string; endDate: string; mode: string; trendCategory: string; pieStartDate?: string; pieEndDate?: string };
}>) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [inputType, setInputType] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER'>('EXPENSE');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    const { data, setData, post, processing, reset } = useForm({
        wallet_id: '',
        to_wallet_id: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        type: 'EXPENSE' as 'INCOME' | 'EXPENSE' | 'TRANSFER',
        category: '',
        tags: [] as string[],
    });

    const handleAmountChange = (val: string) => {
        const rawValue = val.replace(/\D/g, '');
        if (!rawValue) { setData('amount', ''); return; }
        setData('amount', parseInt(rawValue).toLocaleString('id-ID'));
    };

    const parseAmount = (val: string) => parseFloat(val.replace(/\./g, '')) || 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { ...data, type: inputType, amount: parseAmount(data.amount).toString(), tags: selectedTags };
        router.post(route('transactions.store'), payload, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setIsAddModalOpen(false);
                reset();
                setSelectedTags([]);
                toast.success('Transaksi berhasil ditambahkan!');
            }
        });
    };

    // --- QUERY STATE ---
    const [activeFilter, setActiveFilter] = useState<string>(filters.mode);
    const [trendCategory, setTrendCategory] = useState<string>(filters.trendCategory || 'ALL');

    // Helper for formatting local date strings
    const getLocalDateString = (date: Date = new Date()) => {
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offset).toISOString().split('T')[0];
    };

    // chartData comes pre-aggregated from the server (trendData prop aliased as chartData above)

    const updateParams = (newParams: Record<string, any>) => {
        router.get(route('dashboard'), { ...filters, ...newParams }, {
            preserveState: true,
            preserveScroll: true,
            only: ['stats', 'trendData', 'pieData', 'filters']
        });
    };

    const handleFilterChange = (filter: string) => {
        setActiveFilter(filter);
        if (filter === 'CUSTOM') return;

        const now = new Date();
        let start = new Date();
        let end = new Date();
        let mode = 'DAILY';

        if (filter === 'DAILY') {
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
            mode = 'DAILY';
        }
        else if (filter === 'WEEKLY') {
            start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
            end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
            mode = 'WEEKLY';
        }
        else if (filter === 'MONTHLY') {
            start = new Date(now.getFullYear(), 0, 1);
            end = new Date(now.getFullYear(), 11, 31);
            mode = 'MONTHLY';
        }
        else if (filter === 'YEARLY') {
            start = new Date(now.getFullYear() - 4, 0, 1);
            end = new Date(now.getFullYear(), 11, 31);
            mode = 'YEARLY';
        }

        updateParams({
            startDate: getLocalDateString(start),
            endDate: getLocalDateString(end),
            mode
        });
    };

    const handleDateChange = (field: 'start' | 'end', value: string) => {
        updateParams({
            [field === 'start' ? 'startDate' : 'endDate']: value,
            mode: 'DAILY' // Custom range implies detailed view usually
        });
        setActiveFilter('CUSTOM');
    };

    const handlePieDateChange = (field: 'start' | 'end', value: string) => {
        router.get(route('dashboard'), {
            ...filters,
            [field === 'start' ? 'pieStartDate' : 'pieEndDate']: value
        }, {
            preserveState: true,
            preserveScroll: true,
            only: ['pieData', 'filters']
        });
    };

    // Derived data for display
    const totalCategoryExpense = pieData.reduce((a, b) => a + b.value, 0);
    const PIE_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#64748b'];

    // Categories needed for forms
    const cats = categories || [];

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
                                <input type="date" value={filters.startDate} onChange={(e) => handleDateChange('start', e.target.value)} className="bg-transparent font-medium text-slate-900 dark:text-slate-100 focus:outline-none text-xs" />
                                <span className="text-slate-300">-</span>
                                <input type="date" value={filters.endDate} onChange={(e) => handleDateChange('end', e.target.value)} className="bg-transparent font-medium text-slate-900 dark:text-slate-100 focus:outline-none text-xs" />
                            </div>
                        </div>
                        <div className="flex-1 w-full min-h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} dy={10} interval={chartData.length > 10 ? 'preserveStartEnd' : 0} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} tickFormatter={formatShortIDR} />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        content={<CustomTooltip />}
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
                            <input type="date" value={filters.pieStartDate || filters.startDate} onChange={(e) => handlePieDateChange('start', e.target.value)} className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-[10px] text-slate-500 dark:text-slate-400 px-2 py-1 outline-none" />
                            <input type="date" value={filters.pieEndDate || filters.endDate} onChange={(e) => handlePieDateChange('end', e.target.value)} className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-[10px] text-slate-500 dark:text-slate-400 px-2 py-1 outline-none" />
                        </div>
                        {pieData.length > 0 ? (
                            <>
                                <div className="flex-1 min-h-[300px] flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={4} dataKey="value" cornerRadius={6} animationDuration={800}>
                                                {pieData.map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} strokeWidth={0} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip total={totalCategoryExpense} />} />
                                            <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

                    {/* Top Expense Tags */}
                    <div className="glass-card p-6 rounded-[2rem] flex flex-col transition-all hover:shadow-lg duration-500 animate-fade-in-up" style={{ animationDelay: '900ms' }}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center">
                                <TagIcon className="w-5 h-5 mr-2 text-violet-500" /> Fokus Pengeluaran
                            </h3>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bulan Ini</span>
                        </div>
                        <div className="space-y-4 flex-1">
                            {topTags.length > 0 ? (
                                topTags.map((tag, idx) => {
                                    const tagColor = tag.color || ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6'][idx % 5];
                                    return (
                                        <div key={tag.name}>
                                            <div className="flex justify-between items-center mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tagColor }} />
                                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[140px]">{tag.name}</span>
                                                </div>
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{formatShortIDR(tag.total)}</span>
                                            </div>
                                            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-1000 ease-out"
                                                    style={{ width: `${tag.percentage}%`, backgroundColor: tagColor }}
                                                />
                                            </div>
                                            <div className="flex justify-end mt-0.5">
                                                <span className="text-[10px] text-slate-400 font-bold">{tag.percentage}%</span>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="flex flex-col items-center justify-center flex-1 text-slate-300 dark:text-slate-600 py-8">
                                    <TagIcon className="w-12 h-12 mb-2 opacity-20" />
                                    <p className="text-sm font-medium">Belum ada pengeluaran bertag bulan ini</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modern Add Transaction Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 animate-fade-in">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity" onClick={() => setIsAddModalOpen(false)} />
                    <div className="relative w-full max-w-md glass-card rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-pop-in">
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
                                {/* Amount First */}
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Jumlah (Rp)</label>
                                    <input type="text" value={data.amount} onChange={(e) => handleAmountChange(e.target.value)} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-2xl text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50 text-center" placeholder="0" autoFocus required />
                                </div>

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

                                <TagInput
                                    availableTags={userTags || []}
                                    selectedTags={selectedTags}
                                    onChange={setSelectedTags}
                                />

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
