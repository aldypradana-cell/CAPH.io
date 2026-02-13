import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useState } from 'react';
import {
    Plus, Trash2, X, Wallet as WalletIcon, CreditCard, Banknote,
    Edit2, AlertTriangle
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface Wallet {
    id: number;
    name: string;
    type: string;
    balance: number;
}

const formatIDR = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

export default function WalletsIndex({ auth, wallets }: PageProps<{ wallets: Wallet[] }>) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const { data, setData, post, put, processing, reset } = useForm({
        name: '',
        type: 'CASH' as 'CASH' | 'BANK' | 'E-WALLET',
        balance: '',
    });

    const handleAmountChange = (val: string) => {
        const rawValue = val.replace(/\D/g, '');
        if (!rawValue) { setData('balance', ''); return; }
        setData('balance', parseInt(rawValue).toLocaleString('id-ID'));
    };

    const parseAmount = (val: string) => parseFloat(val.replace(/\./g, '')) || 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { ...data, balance: parseAmount(data.balance).toString() };

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
        setData({ name: wallet.name, type: wallet.type as any, balance: wallet.balance.toLocaleString('id-ID') });
        setIsModalOpen(true);
    };

    const confirmDelete = () => {
        if (deleteId) {
            router.delete(route('wallets.destroy', deleteId), {
                onSuccess: () => toast.success('Dompet berhasil dihapus')
            });
            setDeleteId(null);
        }
    };

    const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

    const getWalletGradient = (type: string) => {
        switch (type) {
            case 'BANK': return 'from-blue-600 via-blue-700 to-blue-900';
            case 'E-WALLET': return 'from-purple-600 via-indigo-700 to-indigo-900';
            case 'CASH': return 'from-emerald-600 via-teal-700 to-teal-900';
            default: return 'from-slate-600 to-slate-800';
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
        <AppLayout
            header={
                <div className="flex flex-col">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Dompet Saya</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Kelola sumber dana keuangan Anda</p>
                </div>
            }
        >
            <Head title="Dompet" />
            <Toaster position="top-right" />

            <div className="space-y-6 animate-fade-in-up">
                {/* Total Balance Header */}
                <div className="bg-gradient-to-br from-indigo-700 to-indigo-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-300 animate-fade-in-up">
                    <WalletIcon className="absolute right-[-20px] bottom-[-20px] w-64 h-64 opacity-10 group-hover:scale-110 transition-transform duration-700" />
                    <p className="text-indigo-100 font-medium mb-1 opacity-80 uppercase tracking-widest text-xs">Total Saldo Semua Dompet</p>
                    <h2 className="text-4xl font-bold">{formatIDR(totalBalance)}</h2>
                    <p className="text-indigo-200 text-sm mt-2">{wallets.length} dompet terdaftar</p>
                </div>

                {/* Wallet Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wallets.map((wallet, idx) => {
                        const Icon = getWalletIcon(wallet.type);
                        return (
                            <div
                                key={wallet.id}
                                className={`bg-gradient-to-br ${getWalletGradient(wallet.type)} rounded-2xl p-6 text-white relative h-56 flex flex-col justify-between overflow-hidden shadow-xl hover:shadow-2xl hover:scale-[1.03] hover:-translate-y-1 transition-all duration-500 group cursor-default animate-pop-in`}
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
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">{wallet.type.replace('-', ' ')}</p>
                                        <h3 className="text-xl font-bold mt-1">{wallet.name}</h3>
                                    </div>
                                    <Icon className="w-8 h-8 opacity-60" />
                                </div>

                                {/* Card Chip (simulated) */}
                                <div className="relative z-10">
                                    <div className="w-10 h-7 bg-gradient-to-br from-amber-300 to-amber-500 rounded-md opacity-80" />
                                </div>

                                {/* Bottom Row */}
                                <div className="relative z-10 flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] font-medium opacity-60 uppercase tracking-widest mb-0.5">Saldo</p>
                                        <p className="text-2xl font-bold">{formatIDR(wallet.balance)}</p>
                                    </div>
                                    {/* Action buttons on hover */}
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(wallet)} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors" title="Edit">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => setDeleteId(wallet.id)} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors" title="Hapus">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Mastercard-style circles */}
                                <div className="absolute bottom-4 right-4 flex opacity-20 group-hover:opacity-30 transition-opacity">
                                    <div className="w-6 h-6 rounded-full bg-red-400" />
                                    <div className="w-6 h-6 rounded-full bg-orange-400 -ml-2" />
                                </div>
                            </div>
                        );
                    })}

                    {/* Add Card */}
                    <div
                        onClick={() => { setEditingWallet(null); reset(); setIsModalOpen(true); }}
                        className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl h-56 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all group animate-pop-in"
                        style={{ animationDelay: `${wallets.length * 100}ms` }}
                    >
                        <Plus className="w-10 h-10 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors mb-2" />
                        <p className="text-sm font-bold text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Tambah Dompet</p>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-fade-in">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
                    <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-2xl animate-pop-in border border-slate-100 dark:border-slate-800">
                        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 mb-4 mx-auto">
                            <AlertTriangle className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-2">Hapus Dompet?</h3>
                        <p className="text-sm text-center text-slate-500 dark:text-slate-400 mb-6 px-4">Semua transaksi terkait dompet ini juga akan dihapus.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Batal</button>
                            <button onClick={confirmDelete} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30 transition-colors">Ya, Hapus</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-6 animate-fade-in">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative w-full max-w-md glass-card rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-pop-in">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-10" />
                        <div className="p-5 pb-0 shrink-0">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white text-center">
                                {editingWallet ? 'Edit Dompet' : 'Tambah Dompet Baru'}
                            </h3>
                        </div>
                        <div className="p-5 pt-4 overflow-y-auto scrollbar-hide">
                            <form onSubmit={handleSubmit} className="space-y-3">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Nama Dompet</label>
                                    <input type="text" required value={data.name} onChange={(e) => setData('name', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" placeholder="Contoh: BCA, GoPay" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Tipe</label>
                                        <select value={data.type} onChange={(e) => setData('type', e.target.value as any)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm bg-slate-50 dark:bg-slate-900/50 outline-none cursor-pointer font-medium text-slate-900 dark:text-white">
                                            <option value="CASH">Tunai</option>
                                            <option value="BANK">Bank</option>
                                            <option value="E-WALLET">E-Wallet</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Saldo (Rp)</label>
                                        <input type="text" required value={data.balance} onChange={(e) => handleAmountChange(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" placeholder="0" />
                                    </div>
                                </div>
                                <div className="flex space-x-3 pt-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors active:scale-95">Batal</button>
                                    <button type="submit" disabled={processing} className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-100 hover:scale-105 active:scale-95 transition-transform disabled:opacity-50">
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
