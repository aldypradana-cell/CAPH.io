import AppLayout from '@/Layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    Plus, PencilSimple as Pencil, Trash as Trash2, X, MagnifyingGlass as Search, Faders as Filter, DownloadSimple as Download, ArrowsDownUp as ArrowDownUp,
    TrendUp as TrendingUp, TrendDown as TrendingDown, ArrowsLeftRight as ArrowRightLeft, Warning as AlertTriangle, CalendarBlank as Calendar, Hash, Clock,
    Checks, Check, ListChecks
} from '@phosphor-icons/react';
import toast, { Toaster } from 'react-hot-toast';
import TransactionFormModal from '@/Components/TransactionFormModal';
import AdvancedFilterSheet from '@/Components/AdvancedFilterSheet';
import { todayString, formatDateDayMonth, formatDateShort, formatMonthYear, formatMonthYearLong } from '@/utils/date';

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
        if (ratio < 0.3) return 'bg-[#0E3D42]/10 dark:bg-[#0E3D42]/5 text-[#0E3D42] dark:text-teal-400 hover:bg-[#0E3D42]/20';
        if (ratio <= 1.0) return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 hover:bg-amber-200';
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
                        todayString() === dateStr ? 'ring-2 ring-offset-1 ring-[#0E3D42] dark:ring-teal-400 dark:ring-offset-slate-900' : ''
                    }`}
                >
                    {i}
                </button>
                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max max-w-[150px] p-2 bg-slate-900 dark:bg-slate-800 text-white text-[10px] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    <p className="font-bold mb-1 border-b border-slate-700 pb-1">{i} {formatMonthYear({ year: yearNum, month: monthNum })}</p>
                    {dayData.expense > 0 && <p className="text-red-400 flex justify-between gap-2"><span>Keluar:</span> <span>{formatIDR(dayData.expense)}</span></p>}
                    {dayData.income > 0 && <p className="text-emerald-400 flex justify-between gap-2"><span>Masuk:</span> <span>{formatIDR(dayData.income)}</span></p>}
                    {dayData.expense === 0 && dayData.income === 0 && <p className="text-slate-400">Tak ada data</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="relative inline-block z-30">
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-[#0E3D42] dark:text-[#C5A059] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all shadow-sm"
            >
                <Calendar weight="duotone" className="w-3.5 h-3.5" />
                Aktivitas
            </button>

            {isExpanded && (
                <>
                    {/* Desktop: absolute dropdown */}
                    <div className="hidden lg:block absolute top-full mt-2 w-64 p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 z-50 animate-pop-in right-0 origin-top-right">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-xs font-bold text-slate-800 dark:text-white">{formatMonthYear({ year: yearNum, month: monthNum })}</h4>
                            <button onClick={() => setIsExpanded(false)} className="p-1 lg:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors">
                                <X weight="bold" className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-7 gap-0.5">
                            {dayNames.map(name => (
                                <div key={`d-${name}`} className="text-center text-[9px] font-bold text-slate-400 uppercase pb-1 mb-1 border-b border-slate-100 dark:border-slate-800">{name}</div>
                            ))}
                            {calendarDays}
                        </div>

                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[9px] font-bold text-slate-500">
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-[#0E3D42]/20 dark:bg-[#0E3D42]/10"></div> Baik</div>
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-amber-100 dark:bg-amber-900/30"></div> Sedang</div>
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-red-500"></div> Boros</div>
                        </div>
                    </div>

                    {/* Mobile: centered fixed modal using Portal to avoid clipping */}
                    {typeof document !== 'undefined' && createPortal(
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 lg:hidden">
                            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsExpanded(false)}></div>
                            <div className="relative w-full max-w-[300px] p-5 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 animate-pop-in" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">{formatMonthYearLong({ year: yearNum, month: monthNum })}</h4>
                                    <button onClick={() => setIsExpanded(false)} className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors active:scale-95">
                                        <X weight="bold" className="w-4 h-4" />
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-7 gap-1">
                                    {dayNames.map(name => (
                                        <div key={`m-${name}`} className="text-center text-[10px] font-bold text-slate-400 uppercase pb-2 mb-1 border-b border-slate-100 dark:border-slate-800">{name}</div>
                                    ))}
                                    {calendarDays}
                                </div>

                                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-500">
                                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-[#0E3D42]/20 dark:bg-[#0E3D42]/10"></div> Baik</div>
                                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-amber-100 dark:bg-amber-900/30"></div> Sedang</div>
                                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-red-500"></div> Boros</div>
                                </div>
                            </div>
                        </div>,
                        document.body
                    )}
                </>
            )}
        </div>
    );
}

export default function TransactionsIndex({
    auth, transactions, wallets, allWallets, categories, filters, userTags, heatmapData, heatmapMonth, filterStats, suggestions
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
    allWallets: Wallet[];
    categories: Category[];
    filters: any;
    userTags: TagData[];
    heatmapData: Record<string, { expense: number; income: number }>;
    heatmapMonth: string;
    filterStats: {
        income: number;
        expense: number;
        net: number;
    };
    suggestions: Record<string, string[]>;
}>) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
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
    const [filterWallet, setFilterWallet] = useState(filters?.wallet_id?.toString() || '');
    const [filterCategory, setFilterCategory] = useState(filters?.category || '');

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
                wallet_id: filterWallet || undefined,
                category: filterCategory || undefined,
            }, { preserveState: true, preserveScroll: true });
        }, 400);

        return () => {
            if (searchTimer.current) clearTimeout(searchTimer.current);
        };
    }, [searchTerm]);

    const handleEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setIsModalOpen(true);
    };



    const applyFilters = () => {
        router.get(route('transactions.index'), {
            search: searchTerm || undefined,
            type: filterType || undefined,
            start_date: startDate || undefined,
            end_date: endDate || undefined,
            tag: filterTag || undefined,
            wallet_id: filterWallet || undefined,
            category: filterCategory || undefined,
        }, { preserveState: true });
    };

    const clearFilters = () => {
        setSearchTerm('');
        setFilterType('');
        setStartDate('');
        setEndDate('');
        setFilterTag('');
        setFilterWallet('');
        setFilterCategory('');
        router.get(route('transactions.index'), {}, { preserveState: true });
    };

    const handleAdvancedFilterApply = (advFilters: { type: string; wallet_id: string; category: string; tag: string }) => {
        setFilterType(advFilters.type);
        setFilterWallet(advFilters.wallet_id);
        setFilterCategory(advFilters.category);
        setFilterTag(advFilters.tag);
        setSelectedIds([]); // Clear selection when filtering
        router.get(route('transactions.index'), {
            search: searchTerm || undefined,
            type: advFilters.type || undefined,
            start_date: startDate || undefined,
            end_date: endDate || undefined,
            tag: advFilters.tag || undefined,
            wallet_id: advFilters.wallet_id || undefined,
            category: advFilters.category || undefined,
        }, { preserveState: true });
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
        a.download = `transaksi_${todayString()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Data berhasil diexport!');
    };

    // Server-side search — data already filtered from backend
    const filteredTransactions = transactions.data;

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'INCOME': return <TrendingUp weight="bold" className="w-4 h-4" />;
            case 'EXPENSE': return <TrendingDown weight="bold" className="w-4 h-4" />;
            case 'TRANSFER': return <ArrowRightLeft weight="bold" className="w-4 h-4" />;
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

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredTransactions.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredTransactions.map(t => t.id));
        }
    };

    const handleSelect = (id: number) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = () => {
        router.post(route('transactions.bulk-destroy'), { ids: selectedIds }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setSelectedIds([]);
                setIsBulkDeleteModalOpen(false);
                toast.success(`${selectedIds.length} transaksi berhasil dihapus`);
            }
        });
    };

    return (
        <>
            <Head title="Transaksi" />
            <Toaster position="top-right" />

            <div className="space-y-3 sm:space-y-6 animate-fade-in-up">
                {/* Toolbar */}
                <div className="flex flex-col 2xl:flex-row gap-3 sm:gap-4 items-stretch 2xl:items-center justify-between mb-2 sm:mb-0">
                    {/* Search + Mobile Action Buttons row */}
                    <div className="flex items-center gap-2 flex-1 w-full 2xl:max-w-md">
                        <div className="relative flex-1">
                            <Search weight="bold" className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari transaksi..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 glass-card rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#0E3D42] font-medium text-slate-700 dark:text-slate-200 placeholder-slate-400 border-none"
                            />
                        </div>

                        {/* Mobile-only: CSV Export */}
                        <button onClick={handleExportCSV} className="flex sm:hidden items-center justify-center py-2.5 px-2.5 glass-card rounded-xl text-slate-500 hover:text-[#0B5F64] dark:hover:text-[#B89A5D] hover:shadow-md transition-all active:scale-95 shrink-0" title="Export CSV">
                            <Download weight="bold" className="w-4 h-4" />
                        </button>

                        {/* Mobile-only: Selection Mode Toggle */}
                        {filteredTransactions.length > 0 && (
                            <button 
                                onClick={() => {
                                    setIsSelectionMode(!isSelectionMode);
                                    if (isSelectionMode) setSelectedIds([]);
                                }} 
                                className={`flex sm:hidden items-center justify-center py-2.5 px-2.5 rounded-xl transition-all active:scale-95 shrink-0 ${isSelectionMode ? 'bg-[#0B5F64]/10 dark:bg-[#0B5F64]/5 text-[#0B5F64] dark:text-teal-400 border border-[#0B5F64]/20 dark:border-teal-900/30' : 'glass-card text-slate-500 hover:text-[#0B5F64] dark:hover:text-[#B89A5D] hover:shadow-md'}`} 
                                title="Pilih Beberapa"
                            >
                                <ListChecks weight={isSelectionMode ? "fill" : "bold"} className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Filter & Actions */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        {/* Date Range Picker (always visible — primary filter) */}
                        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl px-2 min-w-max">
                            <Calendar weight="duotone" className="w-4 h-4 text-slate-400" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-transparent border-none text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-300 focus:ring-0 p-1.5 sm:p-2 w-[90px] sm:w-28"
                            />
                            <span className="text-slate-400">-</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-transparent border-none text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-300 focus:ring-0 p-1.5 sm:p-2 w-[90px] sm:w-28"
                            />
                        </div>

                        <button onClick={applyFilters} className="px-3 py-1.5 sm:px-4 sm:py-2 bg-[#0E3D42] text-white rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold hover:bg-[#0A2E31] transition-all active:scale-95 shrink-0">
                            Cari
                        </button>

                        {/* Advanced Filter Sheet (Tipe, Dompet, Kategori, Tag) */}
                        <AdvancedFilterSheet
                            wallets={wallets.map(w => ({ value: w.id.toString(), label: w.name }))}
                            categories={categories.map(c => ({ value: c.name, label: c.name }))}
                            tags={userTags.map(t => ({ value: t.slug || t.name, label: t.name }))}
                            filterType={filterType}
                            filterWallet={filterWallet}
                            filterCategory={filterCategory}
                            filterTag={filterTag}
                            onApply={handleAdvancedFilterApply}
                        />

                        {(filterType || filterWallet || filterCategory || filterTag || startDate || endDate) && (
                            <button onClick={clearFilters} className="px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold hover:text-[#0E3D42] dark:hover:text-[#C5A059] transition-all active:scale-95 shrink-0">
                                Reset
                            </button>
                        )}

                        {/* CSV Export — desktop only */}
                        <button onClick={handleExportCSV} className="hidden sm:flex p-2 sm:p-3 glass-card rounded-xl sm:rounded-2xl text-slate-500 hover:text-[#0B5F64] dark:hover:text-[#B89A5D] hover:shadow-md transition-all active:scale-95" title="Export CSV">
                            <Download weight="bold" className="w-4 h-4" />
                        </button>

                        {/* Selection Mode Toggle — desktop only */}
                        {filteredTransactions.length > 0 && (
                            <button 
                                onClick={() => {
                                    setIsSelectionMode(!isSelectionMode);
                                    if (isSelectionMode) setSelectedIds([]);
                                }} 
                                className={`hidden sm:flex p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all active:scale-95 ${isSelectionMode ? 'bg-[#0B5F64]/10 dark:bg-[#0B5F64]/5 text-[#0B5F64] dark:text-teal-400 border border-[#0B5F64]/20 dark:border-teal-900/30' : 'glass-card text-slate-500 hover:text-[#0B5F64] dark:hover:text-[#B89A5D] hover:shadow-md'}`} 
                                title="Pilih Beberapa"
                            >
                                <ListChecks weight={isSelectionMode ? "fill" : "bold"} className="w-4 h-4" />
                            </button>
                        )}

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
                            onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }}
                            className="hidden sm:flex items-center px-5 py-3 bg-gradient-to-r from-[#0E3D42] to-[#134E4A] text-white rounded-2xl text-sm font-bold hover:shadow-lg hover:shadow-[#0E3D42]/30 transition-all hover:scale-105 active:scale-95"
                        >
                            <Plus weight="bold" className="w-4 h-4 mr-2" /> Transaksi Baru
                        </button>
                    </div>
                </div>

                {/* Bulk Actions Bar */}
                {filteredTransactions.length > 0 && isSelectionMode && (
                    <div className="flex items-center justify-between px-4 py-2 bg-[#0E3D42]/10 dark:bg-[#0E3D42]/5 rounded-xl border border-[#0E3D42]/20 dark:border-teal-900/30 shadow-sm animate-fade-in-up">
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={toggleSelectAll}
                                className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${
                                    selectedIds.length > 0 && selectedIds.length === filteredTransactions.length
                                    ? 'bg-[#0E3D42] border-[#0E3D42] text-white'
                                    : selectedIds.length > 0
                                    ? 'bg-[#0E3D42]/20 border-[#0E3D42] text-[#0E3D42]'
                                    : 'border-slate-300 dark:border-slate-700 hover:border-[#0E3D42]'
                                }`}
                            >
                                {selectedIds.length === filteredTransactions.length ? <Checks weight="bold" className="w-3.5 h-3.5" /> : selectedIds.length > 0 ? <div className="w-2 h-0.5 bg-[#0E3D42] rounded-full" /> : null}
                            </button>
                            <span className="text-[10px] sm:text-xs font-bold text-slate-500">
                                {selectedIds.length > 0 ? `${selectedIds.length} terpilih` : 'Pilih Semua'}
                            </span>
                        </div>

                        {selectedIds.length > 0 ? (
                            <button 
                                onClick={() => setIsBulkDeleteModalOpen(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 shadow-md shadow-red-500/20 transition-all active:scale-95"
                            >
                                <Trash2 weight="bold" className="w-3.5 h-3.5" /> Hapus
                            </button>
                        ) : (
                            <button 
                                onClick={() => setIsSelectionMode(false)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-all active:scale-95"
                            >
                                Batal
                            </button>
                        )}
                    </div>
                )}

                {/* Filter Stats Widget (Inline Pill Bar) */}
                {typeof filterStats !== 'undefined' && (
                    <div className="flex flex-wrap items-center gap-3 sm:gap-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3 shadow-sm animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                                <TrendingUp weight="bold" className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-[10px] sm:text-xs font-medium text-slate-500 mb-0.5">Pemasukan</p>
                                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">{formatIDR(filterStats.income)}</p>
                            </div>
                        </div>

                        <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-slate-800"></div>

                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
                                <TrendingDown weight="bold" className="w-3 h-3 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <p className="text-[10px] sm:text-xs font-medium text-slate-500 mb-0.5">Pengeluaran</p>
                                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">{formatIDR(filterStats.expense)}</p>
                            </div>
                        </div>

                        <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-slate-800"></div>

                        <div className="flex items-center gap-2 sm:ml-auto">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${filterStats.net >= 0 ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400' : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'}`}>
                                <ArrowRightLeft weight="bold" className="w-3 h-3" />
                            </div>
                            <div>
                                <p className="text-[10px] sm:text-xs font-medium text-slate-500 mb-0.5">Arus Bersih</p>
                                <p className={`text-xs sm:text-sm font-bold ${filterStats.net >= 0 ? 'text-[#0E3D42] dark:text-teal-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {filterStats.net > 0 ? '+' : ''}{formatIDR(filterStats.net)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Transaction List */}
                <div className="space-y-3">
                    {filteredTransactions.length > 0 ? (
                        filteredTransactions.map((t, idx) => (
                            <div
                                key={t.id}
                                onClick={() => { if (isSelectionMode) handleSelect(t.id); }}
                                className={`glass-card rounded-2xl p-4 flex items-center justify-between group transition-all duration-300 animate-fade-in-up ${isSelectionMode ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50' : ''} ${selectedIds.includes(t.id) ? 'ring-2 ring-[#0E3D42] bg-[#0E3D42]/5 shadow-md' : 'hover:shadow-lg'}`}
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                    {/* Checkbox (Individual) */}
                                    {isSelectionMode && (
                                        <div 
                                            className={`w-5 h-5 mt-2.5 sm:mt-0 rounded flex items-center justify-center border-2 shrink-0 transition-all ${
                                                selectedIds.includes(t.id)
                                                ? 'bg-[#0E3D42] border-[#0E3D42] text-white'
                                                : 'border-slate-300 dark:border-slate-700 group-hover:border-[#0E3D42] bg-white dark:bg-slate-900'
                                            }`}
                                        >
                                            {selectedIds.includes(t.id) && <Check weight="bold" className="w-3.5 h-3.5" />}
                                        </div>
                                    )}

                                    {/* Type Icon */}
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getTypeColor(t.type)} shadow-sm transition-transform group-hover:scale-110 shrink-0`}>
                                        {getTypeIcon(t.type)}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0 pr-2 sm:pr-0">
                                        <p className="text-sm font-bold text-slate-800 dark:text-white line-clamp-2 sm:truncate">{t.description}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                            <span className="md:hidden text-[10px] font-medium text-slate-400">
                                                {formatDateDayMonth(t.date)}
                                            </span>
                                            <span className="md:hidden text-[10px] text-slate-300">•</span>
                                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{t.category}</span>
                                            {t.wallet ? (
                                                <span className="text-[10px] text-slate-400">{t.wallet.name}</span>
                                            ) : (
                                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <Clock weight="fill" className="w-2.5 h-2.5" /> PayLater
                                                </span>
                                            )}
                                            {t.type === 'TRANSFER' && t.to_wallet && (
                                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                    <ArrowRightLeft weight="bold" className="w-3 h-3" /> {t.to_wallet.name}
                                                </span>
                                            )}
                                            {t.tags && t.tags.length > 0 && t.tags.map(tag => (
                                                <span key={tag.id} className="inline-flex items-center gap-0.5 text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full" style={{ backgroundColor: tag.color || '#6366f1' }}>
                                                    <Hash weight="bold" className="w-2.5 h-2.5 opacity-70" />{tag.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Date (hidden on mobile) */}
                                    <div className="hidden md:block text-xs text-slate-400 font-medium shrink-0 pr-12 lg:pr-20">
                                        {formatDateShort(t.date)}
                                    </div>
                                </div>

                                {/* Amount & Actions */}
                                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-4 shrink-0">
                                    <span className={`text-base font-bold flex items-center gap-1 ${
                                        t.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 
                                        t.type === 'TRANSFER' ? 'text-blue-600 dark:text-blue-400' : 
                                        !t.wallet ? 'text-amber-500 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                                    }`}>
                                        {!t.wallet && t.type === 'EXPENSE' && <Clock weight="duotone" className="w-4 h-4" />}
                                        {t.type === 'INCOME' ? '+' : (!t.wallet ? '' : '-')}{formatIDR(t.amount)}
                                    </span>

                                    {!isSelectionMode && (
                                        t.category !== 'Investasi Emas' ? (
                                            <div className="flex items-center gap-2 sm:gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                <button onClick={(e) => { e.stopPropagation(); handleEdit(t); }} className="p-2 text-[#0E3D42] dark:text-[#C5A059] sm:text-slate-300 md:hover:text-[#0E3D42] bg-[#0E3D42]/10 dark:bg-[#0E3D42]/5 sm:bg-transparent md:hover:bg-[#0E3D42]/10 md:dark:hover:bg-[#0E3D42]/5 rounded-lg transition-all md:hover:scale-110 active:scale-90 flex items-center justify-center">
                                                    <Pencil weight="duotone" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); setDeleteId(t.id); }} className="p-2 text-red-500 dark:text-red-400 sm:text-slate-300 md:hover:text-red-500 bg-red-50/50 dark:bg-red-900/20 sm:bg-transparent md:hover:bg-red-50 md:dark:hover:bg-red-900/30 rounded-lg transition-all md:hover:scale-110 active:scale-90 flex items-center justify-center">
                                                    <Trash2 weight="duotone" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700/50">Edit via Menu Aset</div>
                                        )
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="glass-card rounded-[2rem] p-8 sm:p-16 text-center animate-fade-in-up">
                            <ArrowDownUp weight="duotone" className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4 animate-pulse" />
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
                                                ? 'bg-[#0E3D42] text-white shadow-lg shadow-[#0E3D42]/30'
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
                            <AlertTriangle weight="fill" className="w-7 h-7" />
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

            {/* Bulk Delete Confirmation Modal */}
            {isBulkDeleteModalOpen && mounted && createPortal(
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-fade-in">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsBulkDeleteModalOpen(false)} />
                    <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-2xl animate-pop-in border border-slate-100 dark:border-slate-800">
                        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 mb-4 mx-auto">
                            <Trash2 weight="fill" className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-2">Hapus {selectedIds.length} Transaksi?</h3>
                        <p className="text-sm text-center text-slate-500 dark:text-slate-400 mb-6 px-4">
                            Semua transaksi yang dipilih akan dihapus permanen. Tindakan ini akan mengupdate saldo seluruh dompet terkait.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setIsBulkDeleteModalOpen(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                Batal
                            </button>
                            <button onClick={handleBulkDelete} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30 transition-colors">Ya, Hapus Semua</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Add/Edit Modal — Unified Component */}
            <TransactionFormModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingTransaction(null); }}
                wallets={wallets}
                allWallets={allWallets}
                categories={categories}
                userTags={userTags}
                editingTransaction={editingTransaction}
                suggestions={suggestions}
            />

        </>
    );
}

TransactionsIndex.layout = (page: any) => (
    <AppLayout
        header={
            <div className="flex flex-col min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-[#EDEDD6] tracking-tight truncate">Riwayat Transaksi</h1>
                <p className="hidden sm:block text-xs text-[#8F7442] dark:text-[#C5A059] font-medium mt-0.5 truncate">
                    Kelola semua transaksi keuangan Anda
                </p>
            </div>
        }
    >
        {page}
    </AppLayout>
);
