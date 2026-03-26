import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    Plus, Trash as Trash2, X, Wallet as WalletIcon, CreditCard, Money as Banknote,
    PencilSimple as Edit2, Warning as AlertTriangle, ArrowUpRight, ArrowDownRight, Star
} from '@phosphor-icons/react';
import toast, { Toaster } from 'react-hot-toast';

interface Wallet {
    id: number;
    name: string;
    type: string;
    balance: number;
    monthly_income: number;
    monthly_expense: number;
    is_primary: boolean;
    is_archived: boolean;
    transactions_count: number;
    min_balance_alert?: number;
}

const formatIDR = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

const formatShortIDR = (n: number) => {
    if (n >= 1_000_000_000) return `Rp${(n / 1_000_000_000).toFixed(1)}M`;
    if (n >= 1_000_000) return `Rp${(n / 1_000_000).toFixed(1)}jt`;
    if (n >= 1_000) return `Rp${(n / 1_000).toFixed(0)}rb`;
    return `Rp${n}`;
};

export default function WalletsIndex({ auth, wallets }: PageProps<{ wallets: Wallet[] }>) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [archiveId, setArchiveId] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const { data, setData, post, put, processing, reset } = useForm({
        name: '',
        type: 'CASH' as 'CASH' | 'BANK' | 'E-WALLET',
        balance: '',
        min_balance_alert: '',
    });

    const handleAmountChange = (val: string, field: 'balance' | 'min_balance_alert' = 'balance') => {
        const rawValue = val.replace(/\D/g, '');
        if (!rawValue) { setData(field, ''); return; }
        setData(field, parseInt(rawValue).toLocaleString('id-ID'));
    };

    const parseAmount = (val: string) => parseFloat(val.replace(/\./g, '')) || 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { 
            ...data, 
            balance: parseAmount(data.balance).toString(),
            min_balance_alert: parseAmount(data.min_balance_alert).toString()
        };

        if (editingWallet) {
            router.put(route('wallets.update', editingWallet.id), payload, {
                onSuccess: () => {
                    setIsModalOpen(false); reset(); setEditingWallet(null);
                    toast.success('Dompet berhasil diperbarui!');
                }
            });
        } else {
            router.post(route('wallets.store'), payload, {
                onSuccess: () => {
                    setIsModalOpen(false); reset();
                    toast.success('Dompet berhasil ditambahkan!');
                }
            });
        }
    };

    const handleEdit = (wallet: Wallet) => {
        setEditingWallet(wallet);
        setData({ 
            name: wallet.name, 
            type: wallet.type as any, 
            balance: Number(wallet.balance).toLocaleString('id-ID'),
            min_balance_alert: wallet.min_balance_alert ? Number(wallet.min_balance_alert).toLocaleString('id-ID') : ''
        });
        setIsModalOpen(true);
    };

    const confirmDelete = () => {
        if (deleteId) {
            router.delete(route('wallets.destroy', deleteId), {
                onSuccess: () => toast.success('Dompet berhasil dihapus permanen'),
                onError: (err: any) => err.message && toast.error(err.message)
            });
            setDeleteId(null);
        }
    };

    const confirmArchive = () => {
        if (archiveId) {
            router.put(route('wallets.archive', archiveId), {}, {
                onSuccess: () => toast.success('Dompet diarsipkan. Transaksi masa lalu aman.'),
                onError: (err: any) => err.message && toast.error(err.message)
            });
            setArchiveId(null);
        }
    };

    const confirmUnarchive = (id: number) => {
        router.put(route('wallets.unarchive', id), {}, {
            onSuccess: () => toast.success('Dompet berhasil dikembalikan dari arsip.'),
            onError: (err: any) => err.message && toast.error(err.message)
        });
    };

    const handleSetPrimary = (walletId: number) => {
        router.post(route('wallets.setPrimary', walletId), {}, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => toast.success('Dompet utama berhasil diubah')
        });
    };

    const safeParseFloat = (val: string | number | undefined | null) => {
        if (val === undefined || val === null) return 0;
        if (typeof val === 'number') return val;
        return parseFloat(val.toString()) || 0;
    };

    // Filter out SAVING wallets — they have their own page
    const dailyWallets = wallets.filter(w => w.type !== 'SAVING');
    const activeWallets = dailyWallets.filter(w => !w.is_archived);
    const archivedWallets = dailyWallets.filter(w => w.is_archived);
    
    // Only count balance from active wallets
    const totalBalance = activeWallets.reduce((sum, w) => sum + safeParseFloat(w.balance), 0);

    const getWalletGradient = (type: string) => {
        switch (type) {
            case 'BANK': return 'from-[#1e3a8a] via-[#2563eb] to-[#3b82f6] shadow-blue-500/20'; // Modern Blue
            case 'E-WALLET': return 'from-[#7c3aed] via-[#8b5cf6] to-[#a78bfa] shadow-violet-500/20'; // Vibrant Violet
            case 'CASH': return 'from-[#059669] via-[#10b981] to-[#34d399] shadow-emerald-500/20'; // Fresh Emerald
            default: return 'from-slate-700 via-slate-800 to-slate-900 shadow-slate-500/20';
        }
    };

    const getWalletIcon = (type: string) => {
        switch (type) {
            case 'BANK': return CreditCard;
            case 'E-WALLET': return WalletIcon;
            case 'CASH': return Banknote;
            default: return WalletIcon;
        }
    };

    return (
        <>
            <Head title="Dompet" />
            <Toaster position="top-right" />

            <div className="space-y-4 sm:space-y-6 animate-fade-in-up">
                {/* Total Balance Header */}
                <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 p-5 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-300 animate-fade-in-up border border-[#C5A059]/10">
                    <WalletIcon weight="duotone" className="absolute right-[-20px] bottom-[-20px] w-64 h-64 text-[#C5A059] opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-700" />
                    <p className="text-emerald-100 font-medium mb-1 opacity-80 uppercase tracking-widest text-xs">Total Saldo Semua Dompet</p>
                    <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-100 drop-shadow-sm">{formatIDR(totalBalance)}</h2>
                    <p className="text-emerald-200 text-sm mt-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-pulse"></span>
                        {dailyWallets.length} dompet terdaftar
                    </p>
                </div>

                {/* Active Wallet Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeWallets.map((wallet, idx) => {
                        const Icon = getWalletIcon(wallet.type);
                        return (
                            <div
                                key={wallet.id}
                                onClick={() => router.visit(route('transactions.index', { wallet_id: wallet.id }))}
                                className={`bg-gradient-to-br ${getWalletGradient(wallet.type)} rounded-2xl p-4 sm:p-6 text-white relative h-56 flex flex-col justify-between overflow-hidden shadow-xl hover:shadow-2xl hover:scale-[1.03] hover:-translate-y-1 transition-all duration-500 group cursor-pointer animate-pop-in`}
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                {/* Background pattern */}
                                <div className="absolute inset-0 opacity-10">
                                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white rounded-full" />
                                    <div className="absolute -right-5 -top-5 w-32 h-32 bg-white/20 rounded-full" />
                                </div>

                                {/* Top Row */}
                                <div className="relative z-10 flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-1.5 opacity-60">
                                            <p className="text-[10px] font-bold uppercase tracking-widest">{wallet.type.replace('-', ' ')}</p>
                                            {wallet.is_primary && (
                                                <div className="flex items-center bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider border border-amber-400/30">
                                                    <Star weight="fill" className="w-2.5 h-2.5 mr-0.5 fill-amber-300" /> UTAMA
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="text-xl font-bold mt-1">{wallet.name}</h3>
                                    </div>
                                    <Icon weight="duotone" className="w-8 h-8 opacity-60" />
                                </div>

                                {/* Monthly Cashflow Summary */}
                                <div className="relative z-10 flex items-center gap-2">
                                    <div className="flex items-center gap-1 px-2 py-1 bg-white/10 backdrop-blur-sm rounded-lg">
                                        <ArrowUpRight weight="bold" className="w-3 h-3 text-emerald-300" />
                                        <span className="text-[10px] font-bold text-emerald-200">
                                            {formatShortIDR(wallet.monthly_income || 0)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 px-2 py-1 bg-white/10 backdrop-blur-sm rounded-lg">
                                        <ArrowDownRight weight="bold" className="w-3 h-3 text-red-300" />
                                        <span className="text-[10px] font-bold text-red-200">
                                            {formatShortIDR(wallet.monthly_expense || 0)}
                                        </span>
                                    </div>
                                </div>

                                {/* Bottom Row */}
                                <div className="relative z-10 flex justify-between items-end">
                                    <div className="w-full">
                                        <p className="text-[10px] font-medium opacity-80 uppercase tracking-widest mb-1">Saldo</p>
                                        <p className="text-2xl font-bold break-words tracking-tight leading-tight">
                                            {formatIDR(safeParseFloat(wallet.balance))}
                                        </p>
                                    </div>
                                    {/* Action buttons: Always visible on mobile, hover on desktop */}
                                    <div className="relative z-20 flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300">
                                        {!wallet.is_primary && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleSetPrimary(wallet.id); }} 
                                                className="p-2 sm:p-2 bg-white/20 sm:bg-white/10 hover:bg-white/30 rounded-xl transition-colors text-amber-200 hover:text-amber-100" 
                                                title="Jadikan Utama"
                                            >
                                                <Star weight="fill" className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleEdit(wallet); }} 
                                            className="p-2 sm:p-2 bg-white/20 sm:bg-white/10 hover:bg-white/30 rounded-xl transition-colors" 
                                            title="Edit"
                                        >
                                            <Edit2 weight="duotone" className="w-4 h-4" />
                                        </button>
                                        
                                        {/* Show Archive if it has transactions, otherwise show Hard Delete */}
                                        {wallet.transactions_count > 0 ? (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setArchiveId(wallet.id); }} 
                                                className="p-2 sm:p-2 bg-white/20 sm:bg-white/10 hover:bg-white/30 hover:bg-amber-500/30 hover:text-amber-100 rounded-xl transition-colors" 
                                                title="Arsipkan"
                                            >
                                                <WalletIcon weight="duotone" className="w-4 h-4" />
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setDeleteId(wallet.id); }} 
                                                className="p-2 sm:p-2 bg-white/20 sm:bg-white/10 hover:bg-white/30 hover:bg-red-500/30 hover:text-red-100 rounded-xl transition-colors" 
                                                title="Hapus Permanen"
                                            >
                                                <Trash2 weight="duotone" className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Mastercard-style circles */}
                                <div className="absolute bottom-4 right-4 flex opacity-20 group-hover:opacity-30 transition-opacity pointer-events-none">
                                    <div className="w-6 h-6 rounded-full bg-red-400" />
                                    <div className="w-6 h-6 rounded-full bg-orange-400 -ml-2" />
                                </div>
                            </div>
                        );
                    })}

                    {/* Add Card */}
                    <div
                        onClick={() => { setEditingWallet(null); reset(); setIsModalOpen(true); }}
                        className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl h-56 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500/50 dark:hover:border-emerald-500/50 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-all group animate-pop-in"
                        style={{ animationDelay: `${dailyWallets.length * 100}ms` }}
                    >
                        <Plus weight="bold" className="w-10 h-10 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-colors mb-2" />
                        <p className="text-sm font-bold text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Tambah Dompet</p>
                    </div>
                </div>

                {/* Archived Wallets Section */}
                {archivedWallets.length > 0 && (
                    <div className="pt-8 border-t border-slate-200 dark:border-slate-800/60 mt-8 animate-fade-in-up">
                        <div className="flex items-center gap-3 mb-6">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Arsip Dompet</h3>
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                Disembunyikan
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75 grayscale-[30%] hover:grayscale-0 transition-all duration-300">
                            {archivedWallets.map((wallet) => {
                                const Icon = getWalletIcon(wallet.type);
                                return (
                                    <div
                                        key={wallet.id}
                                        className="bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 sm:p-6 text-slate-600 dark:text-slate-300 relative h-48 flex flex-col justify-between overflow-hidden shadow-sm"
                                    >
                                        <div className="relative z-10 flex justify-between items-start">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{wallet.type.replace('-', ' ')}</p>
                                                <h3 className="text-lg font-bold mt-1 max-w-[150px] truncate">{wallet.name}</h3>
                                            </div>
                                            <Icon weight="duotone" className="w-8 h-8 opacity-40" />
                                        </div>
                                        <div className="relative z-10 flex justify-between items-end">
                                            <div className="w-full">
                                                <p className="text-[10px] font-medium opacity-60 uppercase tracking-widest mb-1">Saldo Terakhir</p>
                                                <p className="text-xl font-bold tracking-tight">{formatIDR(safeParseFloat(wallet.balance))}</p>
                                            </div>
                                            <div className="relative z-20 shrink-0 ml-2">
                                                <button 
                                                    onClick={() => confirmUnarchive(wallet.id)} 
                                                    className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-800/50 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold transition-colors"
                                                >
                                                    Aktifkan
                                                </button>
                                            </div>
                                        </div>
                                    </div>
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
                        <h3 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-2">Hapus Permanen?</h3>
                        <p className="text-sm text-center text-slate-500 dark:text-slate-400 mb-6 px-4">Dompet ini tidak memiliki transaksi sehingga aman dihapus selamanya.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Batal</button>
                            <button onClick={confirmDelete} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30 transition-colors">Ya, Hapus</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Archive Confirmation Modal */}
            {archiveId && mounted && createPortal(
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-fade-in">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setArchiveId(null)} />
                    <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-2xl animate-pop-in border border-slate-100 dark:border-slate-800">
                        <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4 mx-auto">
                            <WalletIcon weight="fill" className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-2">Arsipkan Dompet?</h3>
                        <p className="text-sm text-center text-slate-500 dark:text-slate-400 mb-6 px-4">
                            Dompet ini memiliki riwayat transaksi aktif. Mengarsipkan dompet akan mengamankan saldo historis tanpa merusak grafik, tapi dompet ini tidak bisa digunakan lagi untuk transaksi baru.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setArchiveId(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Batal</button>
                            <button onClick={confirmArchive} className="flex-1 py-3 rounded-xl font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/30 transition-colors">Ya, Arsipkan</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Add/Edit Modal */}
            {isModalOpen && mounted && createPortal(
                <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-6 pb-16 lg:pb-0 animate-fade-in">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative w-full max-w-md glass-card rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-pop-in">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-[#C5A059] to-emerald-700 z-10" />
                        <div className="p-5 pb-0 shrink-0">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white text-center">
                                {editingWallet ? 'Edit Dompet' : 'Tambah Dompet Baru'}
                            </h3>
                        </div>
                        <div className="p-5 pt-4 overflow-y-auto scrollbar-hide">
                            <form onSubmit={handleSubmit} className="space-y-3">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Nama Dompet</label>
                                    <input type="text" required value={data.name} onChange={(e) => setData('name', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50 focus:border-[#C5A059]/30 transition-all" placeholder="Contoh: BCA, GoPay" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Tipe</label>
                                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                                        {([{ v: 'CASH', l: 'Tunai' }, { v: 'BANK', l: 'Bank' }, { v: 'E-WALLET', l: 'E-Wallet' }] as const).map(opt => (
                                            <button key={opt.v} type="button" onClick={() => setData('type', opt.v as any)}
                                                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${data.type === opt.v
                                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 ring-1 ring-[#C5A059]/30'
                                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                                    }`}
                                            >{opt.l}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Saldo (Rp)</label>
                                    <input type="text" required value={data.balance} onChange={(e) => handleAmountChange(e.target.value, 'balance')} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50 focus:border-[#C5A059]/30 transition-all" placeholder="0" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1 flex items-center gap-1">Peringatan Saldo Kritis (Rp) <span className="text-[8px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 lowercase">opsional</span></label>
                                    <input type="text" value={data.min_balance_alert} onChange={(e) => handleAmountChange(e.target.value, 'min_balance_alert')} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-amber-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" placeholder="Biarkan kosong jika tidak perlu" />
                                </div>
                                <div className="flex space-x-3 pt-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors active:scale-95">Batal</button>
                                    <button type="submit" disabled={processing} className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 ring-1 ring-[#C5A059]/30">
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

WalletsIndex.layout = (page: any) => (
    <AppLayout
        header={
            <div className="flex flex-col min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-white tracking-tight truncate">Dompet Saya</h1>
                <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">Kelola sumber dana keuangan Anda</p>
            </div>
        }
    >
        {page}
    </AppLayout>
);
