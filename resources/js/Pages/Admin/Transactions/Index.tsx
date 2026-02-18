import AppLayout from '@/Layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useState, useEffect } from 'react';
import {
    Search, Filter, ArrowUpRight, ArrowDownRight, ArrowRight,
    AlertTriangle, ShieldAlert, CheckCircle, XCircle
} from 'lucide-react';
// import { useDebounce } from 'use-debounce';

function useDebounce<T>(value: T, delay: number): [T] {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return [debouncedValue];
}

interface Transaction {
    id: number;
    user: { name: string; email: string };
    description: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    date: string;
    is_flagged: boolean;
    wallet: { name: string } | null;
    to_wallet: { name: string } | null;
}

interface Props extends PageProps {
    transactions: {
        data: Transaction[];
        links: any[];
        meta: any;
    };
    filters: {
        search?: string;
        type?: string;
        flagged?: string;
        high_value?: string;
    };
}

export default function AdminTransactionsIndex({ transactions, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [debouncedSearch] = useDebounce(search, 500);
    const [typeFilter, setTypeFilter] = useState(filters.type || '');
    const [isFlagged, setIsFlagged] = useState(filters.flagged === '1');
    const [isHighValue, setIsHighValue] = useState(filters.high_value === '1');

    // Handle search and filters
    useEffect(() => {
        router.get(
            route('admin.transactions.index'),
            {
                search: debouncedSearch,
                type: typeFilter,
                flagged: isFlagged ? '1' : '',
                high_value: isHighValue ? '1' : ''
            },
            { preserveState: true, replace: true }
        );
    }, [debouncedSearch, typeFilter, isFlagged, isHighValue]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <>
            <Head title="Admin - Transaksi" />

            <div className="space-y-6 animate-fade-in-up">
                {/* Filters */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 items-center justify-between">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari user atau deskripsi..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm py-2 px-3 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        >
                            <option value="">Semua Tipe</option>
                            <option value="INCOME">Pemasukan</option>
                            <option value="EXPENSE">Pengeluaran</option>
                            <option value="TRANSFER">Transfer</option>
                        </select>

                        <button
                            onClick={() => setIsFlagged(!isFlagged)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${isFlagged
                                ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-100'
                                }`}
                        >
                            <AlertTriangle className="w-4 h-4" /> Flagged
                        </button>

                        <button
                            onClick={() => setIsHighValue(!isHighValue)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${isHighValue
                                ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                                : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-100'
                                }`}
                        >
                            <ShieldAlert className="w-4 h-4" /> &gt; 10 Juta
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium">
                                <tr>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Deskripsi</th>
                                    <th className="px-6 py-4">Jumlah</th>
                                    <th className="px-6 py-4">Tipe</th>
                                    <th className="px-6 py-4">Tanggal</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {transactions.data.length > 0 ? transactions.data.map((trx) => (
                                    <tr key={trx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800 dark:text-white">{trx.user.name}</span>
                                                <span className="text-xs text-slate-400">{trx.user.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-slate-800 dark:text-white truncate max-w-[200px]">{trx.description}</p>
                                            <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                                                <span>{trx.wallet?.name}</span>
                                                {trx.type === 'TRANSFER' && (
                                                    <>
                                                        <ArrowRight className="w-3 h-3" />
                                                        <span>{trx.to_wallet?.name}</span>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className={`px-6 py-4 font-bold ${trx.type === 'INCOME' ? 'text-emerald-600' :
                                            trx.type === 'EXPENSE' ? 'text-red-600' : 'text-blue-600'
                                            }`}>
                                            {trx.type === 'EXPENSE' ? '-' : '+'}{formatCurrency(trx.amount)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${trx.type === 'INCOME' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' :
                                                trx.type === 'EXPENSE' ? 'bg-red-100 text-red-600 dark:bg-red-900/30' :
                                                    'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
                                                }`}>
                                                {trx.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                            {new Date(trx.date).toLocaleDateString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4">
                                            {trx.is_flagged ? (
                                                <span className="flex items-center gap-1 text-red-500 font-bold text-xs bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full w-fit">
                                                    <AlertTriangle className="w-3 h-3" /> Suspicious
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-emerald-500 font-bold text-xs bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full w-fit">
                                                    <CheckCircle className="w-3 h-3" /> Verified
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                            <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            <p>Tidak ada transaksi yang ditemukan</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination can be added here if needed, usually handles by a separate component or simple Prev/Next links from meta */}
                    {transactions.data.length > 0 && (
                        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                            <span className="text-slate-500">Menampilkan {transactions.data.length} data</span>
                            <div className="flex gap-2">
                                <button
                                    disabled={!transactions.links[0].url}
                                    onClick={() => router.get(transactions.links[0].url)}
                                    className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800"
                                >
                                    Previous
                                </button>
                                <button
                                    disabled={!transactions.links[transactions.links.length - 1].url}
                                    onClick={() => router.get(transactions.links[transactions.links.length - 1].url)}
                                    className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

AdminTransactionsIndex.layout = (page: any) => (
    <AppLayout header={
        <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Data Transaksi</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Monitoring seluruh transaksi user</p>
        </div>
    }>
        {page}
    </AppLayout>
);
