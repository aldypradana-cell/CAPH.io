import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    Plus, Pencil, Trash2, X, Search, Filter, Download, ArrowDownUp,
    TrendingUp, TrendingDown, ArrowRightLeft, AlertTriangle, Calendar, Hash
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import TagInput from '@/Components/TagInput';

interface TagData {
    id: number;
    name: string;
    slug: string;
    color: string | null;
}

interface Transaction {
    id: number;
    date: string;
    description: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    category: string;
    wallet: { id: number; name: string };
    to_wallet?: { id: number; name: string };
    tags?: TagData[];
}

interface Wallet {
    id: number;
    name: string;
}

interface Category {
    id: number;
    name: string;
    type: string;
}

const formatIDR = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

function TransactionHeatmap({ data, month, onDateSelect }: { data: Record<string, { expense: number; income: number }>; month: string; onDateSelect: (date: string) => void }) {
    if (!month) return null;
    const [isExpanded, setIsExpanded] = useState(false);

    const [yearStr, monthStr] = month.split('-');
    const yearNum = parseInt(yearStr);
    const monthNum = parseInt(monthStr) - 1;

    const daysInMonth = new Date(yearNum, monthNum + 1, 0).getDate();
    const firstDay = new Date(yearNum, monthNum, 1).getDay();
    const startDay = firstDay === 0 ? 6 : firstDay - 1;

    const expenseDays = Object.values(data).filter(d => d.expense > 0);
    const avgExpense = expenseDays.length > 0 ? expenseDays.reduce((acc, curr) => acc + curr.expense, 0) / expenseDays.length : 0;

    const getHeatmapColor = (expense: number, income: number) => {
        if (expense === 0 && income === 0) return 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400';
        if (expense === 0 && income > 0) return 'bg-emerald-500 hover:bg-emerald-400 text-white';
        if (avgExpense === 0) return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600';
        
        const ratio = expense / avgExpense;
        if (ratio < 0.3) return 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-500 hover:bg-indigo-200';
        if (ratio <= 1.0) return 'bg-amber-200 dark:bg-amber-900/50 text-amber-700 hover:bg-amber-300';
        return 'bg-red-500 hover:bg-red-400 text-white';
    };

    const calendarDays = [];
    const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

    for (let i = 0; i < startDay; i++) {
        calendarDays.push(<div key={`empty-${i}`} className="aspect-square opacity-0"></div>);
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${yearStr}-${monthStr}-${i.toString().padStart(2, '0')}`;
        const dayData = data[dateStr] || { expense: 0, income: 0 };
        const colorClass = getHeatmapColor(dayData.expense, dayData.income);
        
        calendarDays.push(
            <div key={`cal-${dateStr}`} className="group relative">
                <button 
                    onClick={() => { onDateSelect(dateStr); setIsExpanded(false); }}
                    className={`w-full aspect-square rounded sm:rounded-md flex items-center justify-center text-[10px] font-bold transition-all hover:scale-110 active:scale-95 ${colorClass} ${
                        new Date().toISOString().split('T')[0] === dateStr ? 'ring-2 ring-offset-1 ring-indigo-500 dark:ring-offset-slate-900' : ''
                    }`}
                >
                    {i}
                </button>
                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max max-w-[150px] p-2 bg-slate-900 dark:bg-slate-800 text-white text-[10px] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    <p className="font-bold mb-1 border-b border-slate-700 pb-1">{i} {new Date(yearNum, monthNum).toLocaleString('id-ID', { month: 'short', year: 'numeric' })}</p>
                    {dayData.expense > 0 && <p className="text-red-400 flex justify-between gap-2"><span>Keluar:</span> <span>{formatIDR(dayData.expense)}</span></p>}
                    {dayData.income > 0 && <p className="text-emerald-400 flex justify-between gap-2"><span>Masuk:</span> <span>{formatIDR(dayData.income)}</span></p>}
                    {dayData.expense === 0 && dayData.income === 0 && <p className="text-slate-400">Tak ada data</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="relative inline-block z-30 mb-4 lg:mb-0 lg:ml-auto w-auto mt-4 lg:mt-0">
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all shadow-sm"
            >
                <Calendar className="w-3.5 h-3.5" />
                Aktivitas
            </button>

            {isExpanded && (
                <>
                    <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setIsExpanded(false)}></div>
                    <div className="absolute top-full mt-2 w-64 p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 z-50 animate-pop-in right-0 origin-top-right">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-xs font-bold text-slate-800 dark:text-white">{new Date(yearNum, monthNum).toLocaleString('id-ID', { month: 'short', year: 'numeric' })}</h4>
                        </div>
                        
                        <div className="grid grid-cols-7 gap-0.5">
                            {dayNames.map(name => (
                                <div key={name} className="text-center text-[9px] font-bold text-slate-400 uppercase pb-1 mb-1 border-b border-slate-100 dark:border-slate-800">{name}</div>
                            ))}
                            {calendarDays}
                        </div>

                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[9px] font-bold text-slate-500">
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-indigo-100 dark:bg-indigo-900/40"></div> Baik</div>
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-amber-200 dark:bg-amber-900/50"></div> Sedang</div>
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-red-500"></div> Boros</div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default function TransactionsIndex({
    auth, transactions, wallets, categories, filters, userTags, heatmapData, heatmapMonth
}: PageProps<{
    transactions: {
        data: Transaction[];
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
        from: number | null;
        to: number | null;
        total: number;
    };
    wallets: Wallet[];
    categories: Category[];
    filters: any;
    userTags: TagData[];
    heatmapData: Record<string, { expense: number; income: number }>;
    heatmapMonth: string;
}>) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('action') === 'add') {
                setIsModalOpen(true);
                // Clean up URL so it doesn't reopen on refresh
                const newUrl = window.location.pathname;
                window.history.replaceState({}, '', newUrl);
            }
        }
    }, []);
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [filterType, setFilterType] = useState(filters?.type || '');
    const [startDate, setStartDate] = useState(filters?.start_date || '');
    const [endDate, setEndDate] = useState(filters?.end_date || '');
    const [filterTag, setFilterTag] = useState(filters?.tag || '');

    // Debounced server-side search
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isFirstRender = useRef(true);

    useEffect(() => {
        // Skip first render to avoid unnecessary request on page load
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            router.get(route('transactions.index'), {
                search: searchTerm || undefined,
                type: filterType || undefined,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
                tag: filterTag || undefined,
            }, { preserveState: true, preserveScroll: true });
        }, 400);

        return () => {
            if (searchTimer.current) clearTimeout(searchTimer.current);
        };
    }, [searchTerm]);

    const [inputType, setInputType] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER'>('EXPENSE');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [showAdminFee, setShowAdminFee] = useState(false);

    const { data, setData, post, put, processing, reset } = useForm({
        wallet_id: '',
        to_wallet_id: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        type: 'EXPENSE' as 'INCOME' | 'EXPENSE' | 'TRANSFER',
        category: '',
        tags: [] as string[],
        admin_fee: '',
        admin_fee_from: 'sender' as 'sender' | 'receiver',
    });

    const handleAdminFeeChange = (val: string) => {
        const rawValue = val.replace(/\D/g, '');
        if (!rawValue) { setData('admin_fee', ''); return; }
        setData('admin_fee', parseInt(rawValue).toLocaleString('id-ID'));
    };

    const handleAmountChange = (val: string) => {
        const rawValue = val.replace(/\D/g, '');
        if (!rawValue) { setData('amount', ''); return; }
        setData('amount', parseInt(rawValue).toLocaleString('id-ID'));
    };

    const parseAmount = (val: string) => parseFloat(val.replace(/\./g, '')) || 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...data,
            type: inputType,
            amount: parseAmount(data.amount).toString(),
            tags: selectedTags,
            admin_fee: data.admin_fee ? parseAmount(data.admin_fee).toString() : '0',
            admin_fee_from: data.admin_fee_from,
        };

        if (editingTransaction) {
            router.put(route('transactions.update', editingTransaction.id), payload, {
                onSuccess: () => { setIsModalOpen(false); reset(); setSelectedTags([]); setEditingTransaction(null); toast.success('Diperbarui!'); }
            });
        } else {
            router.post(route('transactions.store'), payload, {
                onSuccess: () => { setIsModalOpen(false); reset(); setSelectedTags([]); toast.success('Ditambahkan!'); }
            });
        }
    };

    const handleEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setInputType(transaction.type);
        setSelectedTags(transaction.tags?.map(t => t.name) || []);
        setData({
            wallet_id: transaction.wallet.id.toString(),
            to_wallet_id: transaction.to_wallet?.id.toString() || '',
            date: transaction.date,
            description: transaction.description,
            amount: Number(transaction.amount).toLocaleString('id-ID'),
            type: transaction.type,
            category: transaction.category,
            tags: transaction.tags?.map(t => t.name) || [],
        });
        setIsModalOpen(true);
    };



    const applyFilters = () => {
        router.get(route('transactions.index'), {
            search: searchTerm || undefined,
            type: filterType || undefined,
            start_date: startDate || undefined,
            end_date: endDate || undefined,
            tag: filterTag || undefined,
        }, { preserveState: true });
    };

    const clearFilters = () => {
        setSearchTerm('');
        setFilterType('');
        setStartDate('');
        setEndDate('');
        setFilterTag('');
        router.get(route('transactions.index'), {}, { preserveState: true });
    };

    const handleExportCSV = () => {
        const csvData = filteredTransactions.map(t => ({
            Tanggal: t.date,
            Deskripsi: t.description,
            Kategori: t.category,
            Tipe: t.type,
            Jumlah: t.amount,
            Dompet: t.wallet?.name || '',
        }));
        const headers = Object.keys(csvData[0] || {}).join(',');
        const rows = csvData.map(row => Object.values(row).join(','));
        const csv = [headers, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transaksi_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Data berhasil diexport!');
    };

    // Server-side search — data already filtered from backend
    const filteredTransactions = transactions.data;

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'INCOME': return <TrendingUp className="w-4 h-4" />;
            case 'EXPENSE': return <TrendingDown className="w-4 h-4" />;
            case 'TRANSFER': return <ArrowRightLeft className="w-4 h-4" />;
            default: return null;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'INCOME': return 'bg-emerald-500 text-white';
            case 'EXPENSE': return 'bg-red-500 text-white';
            case 'TRANSFER': return 'bg-blue-500 text-white';
            default: return 'bg-slate-500 text-white';
        }
    };

    return (
        <>
            <Head title="Transaksi" />
            <Toaster position="top-right" />

            <div className="space-y-6 animate-fade-in-up">
                {/* Toolbar */}
                <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari transaksi..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 glass-card rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 dark:text-slate-200 placeholder-slate-400 border-none"
                        />
                    </div>

                    {/* Filter & Actions */}
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Type Filter */}
                        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                            >
                                <option value="">Semua Tipe</option>
                                <option value="INCOME">Pemasukan</option>
                                <option value="EXPENSE">Pengeluaran</option>
                                <option value="TRANSFER">Transfer</option>
                            </select>

                            <select
                                value={filterTag}
                                onChange={(e) => setFilterTag(e.target.value)}
                                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                            >
                                <option value="">Semua Tag</option>
                                {userTags.map(tag => (
                                    <option key={tag.id} value={tag.slug || tag.name}>#{tag.name}</option>
                                ))}
                            </select>

                            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl px-2">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-transparent border-none text-xs font-medium text-slate-600 dark:text-slate-300 focus:ring-0 p-2 w-28"
                                />
                                <span className="text-slate-400">-</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-transparent border-none text-xs font-medium text-slate-600 dark:text-slate-300 focus:ring-0 p-2 w-28"
                                />
                            </div>
                        </div>

                        <button onClick={applyFilters} className="px-4 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all active:scale-95">
                            Filter
                        </button>

                        {(filterType || startDate || endDate || filterTag) && (
                            <button onClick={clearFilters} className="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95">
                                Reset
                            </button>
                        )}

                        {/* CSV Export */}
                        <button onClick={handleExportCSV} className="p-3 glass-card rounded-2xl text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-md transition-all active:scale-95" title="Export CSV">
                            <Download className="w-4 h-4" />
                        </button>

                        {/* Heatmap Calendar Popover */}
                        <TransactionHeatmap 
                            data={heatmapData} 
                            month={heatmapMonth} 
                            onDateSelect={(date) => {
                                setStartDate(date);
                                setEndDate(date);
                                // Trigger filter immediately
                                router.get(route('transactions.index'), {
                                    ...filters,
                                    start_date: date,
                                    end_date: date,
                                }, { preserveState: true });
                            }} 
                        />

                        {/* Add Button */}
                        <button
                            onClick={() => { setEditingTransaction(null); reset(); setSelectedTags([]); setInputType('EXPENSE'); setShowAdminFee(false); setData(d => ({ ...d, admin_fee: '', admin_fee_from: 'sender' })); setIsModalOpen(true); }}
                            className="flex items-center px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl text-sm font-bold hover:shadow-lg hover:shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95"
                        >
                            <Plus className="w-4 h-4 mr-2" /> Transaksi Baru
                        </button>
                    </div>
                </div>

                {/* Transaction List */}
                <div className="space-y-3">
                    {filteredTransactions.length > 0 ? (
                        filteredTransactions.map((t, idx) => (
                            <div
                                key={t.id}
                                className="glass-card rounded-2xl p-4 flex items-center justify-between group hover:shadow-lg transition-all duration-300 animate-fade-in-up"
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    {/* Type Icon */}
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getTypeColor(t.type)} shadow-sm transition-transform group-hover:scale-110 shrink-0`}>
                                        {getTypeIcon(t.type)}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{t.description}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{t.category}</span>
                                            <span className="text-[10px] text-slate-400">{t.wallet?.name}</span>
                                            {t.type === 'TRANSFER' && t.to_wallet && (
                                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                    <ArrowRightLeft className="w-3 h-3" /> {t.to_wallet.name}
                                                </span>
                                            )}
                                            {t.tags && t.tags.length > 0 && t.tags.map(tag => (
                                                <span key={tag.id} className="inline-flex items-center gap-0.5 text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full" style={{ backgroundColor: tag.color || '#6366f1' }}>
                                                    <Hash className="w-2.5 h-2.5 opacity-70" />{tag.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Date (hidden on mobile) */}
                                    <div className="hidden md:block text-xs text-slate-400 font-medium shrink-0">
                                        {new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </div>
                                </div>

                                {/* Amount & Actions */}
                                <div className="flex items-center gap-4 shrink-0">
                                    <span className={`text-base font-bold ${t.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : t.type === 'TRANSFER' ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {t.type === 'INCOME' ? '+' : '-'}{formatIDR(t.amount)}
                                    </span>

                                    {t.category !== 'Investasi Emas' ? (
                                        <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(t)} className="p-3 sm:p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all hover:scale-110">
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setDeleteId(t.id)} className="p-3 sm:p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all hover:scale-110">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700/50">Edit via Menu Aset</div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="glass-card rounded-[2rem] p-16 text-center animate-fade-in-up">
                            <ArrowDownUp className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4 animate-pulse" />
                            <p className="text-lg font-bold text-slate-400 dark:text-slate-500 mb-1">Belum ada transaksi</p>
                            <p className="text-sm text-slate-400">Klik "Transaksi Baru" untuk memulai pencatatan</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {transactions.last_page > 1 && (
                    <div className="flex items-center justify-between glass-card rounded-2xl p-4">
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            Menampilkan {transactions.from}–{transactions.to} dari {transactions.total} transaksi
                        </p>
                        <div className="flex items-center gap-1">
                            {transactions.links.map((link, i) => {
                                if (!link.url) {
                                    return (
                                        <span
                                            key={i}
                                            className="px-3 py-2 text-xs font-medium text-slate-300 dark:text-slate-600 rounded-xl"
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    );
                                }
                                return (
                                    <button
                                        key={i}
                                        onClick={() => router.get(link.url!, {}, { preserveState: true, preserveScroll: true })}
                                        className={`px-3 py-2 text-xs font-bold rounded-xl transition-all active:scale-95 ${link.active
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                            }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteId && mounted && createPortal(
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-fade-in">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
                    <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-2xl animate-pop-in border border-slate-100 dark:border-slate-800">
                        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 mb-4 mx-auto">
                            <AlertTriangle className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-2">Hapus Transaksi?</h3>
                        <p className="text-sm text-center text-slate-500 dark:text-slate-400 mb-6 px-4">
                            Tindakan ini tidak dapat dibatalkan. Data transaksi dan saldo dompet akan diperbarui.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                Batal
                            </button>
                            <button onClick={() => {
                                router.delete(route('transactions.destroy', deleteId), {
                                    preserveState: true,
                                    preserveScroll: true,
                                    onSuccess: () => {
                                        setDeleteId(null);
                                        toast.success('Transaksi berhasil dihapus');
                                    }
                                });
                            }} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30 transition-colors">Ya, Hapus</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Add/Edit Modal */}
            {isModalOpen && mounted && createPortal(
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 animate-fade-in">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)} />

                    <div className="relative w-full max-w-md glass-card rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-pop-in">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-10" />

                        <div className="p-5 pb-0 shrink-0">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                    {editingTransaction ? 'Edit Transaksi' : 'Transaksi Baru'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-2">
                                {(['EXPENSE', 'INCOME', 'TRANSFER'] as const).map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => {
                                            setInputType(type);
                                            setShowAdminFee(false);
                                            setData(d => ({
                                                ...d,
                                                type,
                                                category: '',
                                                admin_fee: '',
                                                admin_fee_from: 'sender' as 'sender' | 'receiver',
                                            }));
                                        }}
                                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${inputType === type
                                            ? type === 'INCOME' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                                : type === 'EXPENSE' ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                                                    : 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                            }`}
                                    >
                                        {type === 'EXPENSE' ? 'KELUAR' : type === 'INCOME' ? 'MASUK' : 'TRANSFER'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-5 pt-4 overflow-y-auto scrollbar-hide">
                            <form onSubmit={handleSubmit} className="space-y-3">
                                {/* Amount First */}
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Jumlah (Rp)</label>
                                    <input type="tel" value={data.amount} onChange={(e) => handleAmountChange(e.target.value)} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-2xl text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50 text-center" placeholder="0" autoFocus required />
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Dompet</label>
                                    <select value={data.wallet_id} onChange={(e) => setData('wallet_id', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" required>
                                        <option value="">Pilih Dompet</option>
                                        {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                    </select>
                                </div>

                                {inputType === 'TRANSFER' && (
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Ke Dompet</label>
                                        <select value={data.to_wallet_id} onChange={(e) => setData('to_wallet_id', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" required>
                                            <option value="">Pilih Dompet Tujuan</option>
                                            {wallets.filter(w => w.id.toString() !== data.wallet_id).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                        </select>
                                    </div>
                                )}

                                {/* Admin Fee Toggle — tampil untuk EXPENSE dan TRANSFER */}
                                {(inputType === 'EXPENSE' || inputType === 'TRANSFER') && (
                                    <div>
                                        {!showAdminFee ? (
                                            <button
                                                type="button"
                                                onClick={() => setShowAdminFee(true)}
                                                className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors py-1 px-2 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                            >
                                                <span className="text-base leading-none">+</span> Tambah Biaya Admin
                                            </button>
                                        ) : (
                                            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl space-y-3 animate-fade-in">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">Biaya Admin</label>
                                                    <button type="button" onClick={() => { setShowAdminFee(false); setData(d => ({ ...d, admin_fee: '', admin_fee_from: 'sender' })); }}
                                                        className="text-amber-400 hover:text-amber-600 text-xs px-1.5 py-0.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors">
                                                        ✕ Batal
                                                    </button>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={data.admin_fee}
                                                    onChange={(e) => handleAdminFeeChange(e.target.value)}
                                                    className="w-full px-4 py-2.5 border border-amber-200 dark:border-amber-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-amber-500 outline-none font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900/50"
                                                    placeholder="Masukkan biaya admin (Rp)"
                                                    autoFocus
                                                />

                                                {/* Sender/Receiver Toggle — hanya untuk TRANSFER */}
                                                {inputType === 'TRANSFER' && data.admin_fee && parseAmount(data.admin_fee) > 0 && (
                                                    <div className="flex gap-2">
                                                        <button type="button" onClick={() => setData('admin_fee_from', 'sender')}
                                                            className={`flex-1 py-2 px-3 rounded-xl text-[11px] font-bold transition-all border ${
                                                                data.admin_fee_from === 'sender'
                                                                    ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/30'
                                                                    : 'border-amber-200 dark:border-amber-700 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                                                            }`}>
                                                            Potong Pengirim
                                                        </button>
                                                        <button type="button" onClick={() => setData('admin_fee_from', 'receiver')}
                                                            className={`flex-1 py-2 px-3 rounded-xl text-[11px] font-bold transition-all border ${
                                                                data.admin_fee_from === 'receiver'
                                                                    ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/30'
                                                                    : 'border-amber-200 dark:border-amber-700 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                                                            }`}>
                                                            Potong Penerima
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Summary */}
                                                {data.admin_fee && parseAmount(data.admin_fee) > 0 && (
                                                    <div className="text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 rounded-xl px-3 py-2 space-y-0.5">
                                                        {inputType === 'EXPENSE' ? (
                                                            <p>💳 {wallets.find(w => w.id.toString() === data.wallet_id)?.name || 'Dompet'} akan terpotong total <strong>Rp {(parseAmount(data.amount) + parseAmount(data.admin_fee)).toLocaleString('id-ID')}</strong></p>
                                                        ) : data.admin_fee_from === 'sender' ? (
                                                            <>
                                                                <p>💳 {wallets.find(w => w.id.toString() === data.wallet_id)?.name || 'Pengirim'} terpotong <strong>Rp {(parseAmount(data.amount) + parseAmount(data.admin_fee)).toLocaleString('id-ID')}</strong></p>
                                                                <p>💰 {wallets.find(w => w.id.toString() === data.to_wallet_id)?.name || 'Penerima'} menerima <strong>Rp {parseAmount(data.amount).toLocaleString('id-ID')}</strong></p>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <p>💳 {wallets.find(w => w.id.toString() === data.wallet_id)?.name || 'Pengirim'} terpotong <strong>Rp {parseAmount(data.amount).toLocaleString('id-ID')}</strong></p>
                                                                <p>💰 {wallets.find(w => w.id.toString() === data.to_wallet_id)?.name || 'Penerima'} menerima <strong>Rp {(parseAmount(data.amount) - parseAmount(data.admin_fee)).toLocaleString('id-ID')}</strong></p>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
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
                                                .filter(c => c.type === inputType && c.name !== 'Investasi Emas')
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
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors active:scale-95">Batal</button>
                                    <button type="submit" disabled={processing} className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-transform disabled:opacity-50">
                                        {processing ? 'Menyimpan...' : 'Simpan'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>,
                document.body
            )}

        </>
    );
}

TransactionsIndex.layout = (page: any) => (
    <AppLayout
        header={
            <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Riwayat Transaksi</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    Kelola semua transaksi keuangan Anda
                </p>
            </div>
        }
    >
        {page}
    </AppLayout>
);
