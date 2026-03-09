import AppLayout from '@/Layouts/AppLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    Plus, Trash as Trash2, X, PencilSimple as Edit2, ArrowDownRight, ArrowUpRight,
    Target, PiggyBank, Vault, TrendUp as TrendingUp, CalendarBlank as Calendar, Warning as AlertTriangle,
    CaretRight as ChevronRight, SpinnerGap as Loader2, Money as Banknote
} from '@phosphor-icons/react';
import toast, { Toaster } from 'react-hot-toast';

interface SavingWallet {
    id: number;
    name: string;
    type: string;
    balance: number;
    monthly_in: number;
    monthly_out: number;
}

interface GoalData {
    id: number;
    name: string;
    target_amount: number;
    deadline: string | null;
    current_amount: number;
    color: string | null;
    icon: string | null;
}

interface DailyWallet {
    id: number;
    name: string;
    type: string;
    balance: number;
}

const formatIDR = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

const formatShortIDR = (n: number) => {
    if (n >= 1_000_000_000) return `Rp${(n / 1_000_000_000).toFixed(1)}M`;
    if (n >= 1_000_000) return `Rp${(n / 1_000_000).toFixed(1)}jt`;
    if (n >= 1_000) return `Rp${(n / 1_000).toFixed(0)}rb`;
    return `Rp${n}`;
};

const GOAL_COLORS = [
    { name: 'Emerald', value: 'emerald', gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
    { name: 'Blue', value: 'blue', gradient: 'from-blue-500 to-indigo-600', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
    { name: 'Purple', value: 'purple', gradient: 'from-purple-500 to-violet-600', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
    { name: 'Rose', value: 'rose', gradient: 'from-rose-500 to-pink-600', bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400' },
    { name: 'Amber', value: 'amber', gradient: 'from-amber-500 to-orange-600', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
];

const getGoalColor = (color: string | null) => GOAL_COLORS.find(c => c.value === color) || GOAL_COLORS[0];

export default function SavingsIndex({ auth, savingWallets, goals, dailyWallets }: PageProps<{
    savingWallets: SavingWallet[];
    goals: GoalData[];
    dailyWallets: DailyWallet[];
}>) {
    const [activeTab, setActiveTab] = useState<'savings' | 'goals'>('savings');
    const [mounted, setMounted] = useState(false);
    const [showSavingModal, setShowSavingModal] = useState(false);
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState<{ type: 'topup' | 'withdraw'; walletId: number; walletName: string } | null>(null);
    const [editingGoal, setEditingGoal] = useState<GoalData | null>(null);
    const [deleteGoalId, setDeleteGoalId] = useState<number | null>(null);
    const [editingSaving, setEditingSaving] = useState<SavingWallet | null>(null);
    const [deleteSavingId, setDeleteSavingId] = useState<number | null>(null);

    useEffect(() => { setMounted(true); }, []);

    // Saving wallet form
    const savingForm = useForm({ name: '', type: 'SAVING' as const, balance: '' });
    // Goal form
    const goalForm = useForm({ name: '', target_amount: '', deadline: '', current_amount: '', color: 'emerald', icon: '' });
    // Transfer form
    const transferForm = useForm({ from_wallet_id: '', to_wallet_id: '', amount: '', description: '' });

    const handleAmountChange = (val: string, setter: (field: string, value: string) => void, field: string) => {
        const raw = val.replace(/\D/g, '');
        if (!raw) { setter(field, ''); return; }
        setter(field, parseInt(raw).toLocaleString('id-ID'));
    };
    const parseAmount = (val: string) => parseFloat(val.replace(/\./g, '')) || 0;

    const totalSavings = savingWallets.reduce((sum, w) => sum + w.balance, 0);

    // --- Save Saving Wallet ---
    const handleSaveSaving = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { ...savingForm.data, balance: parseAmount(savingForm.data.balance).toString() };
        if (editingSaving) {
            router.put(route('wallets.update', editingSaving.id), payload, {
                onSuccess: () => { setShowSavingModal(false); savingForm.reset(); setEditingSaving(null); toast.success('Tabungan berhasil diperbarui!'); },
                onError: (e: any) => toast.error(e.message || 'Gagal menyimpan'),
            });
        } else {
            router.post(route('wallets.store'), payload, {
                onSuccess: () => { setShowSavingModal(false); savingForm.reset(); toast.success('Tabungan berhasil ditambahkan!'); },
                onError: (e: any) => toast.error(e.message || 'Gagal menyimpan'),
            });
        }
    };

    const handleEditSaving = (w: SavingWallet) => {
        setEditingSaving(w);
        savingForm.setData({ name: w.name, type: 'SAVING', balance: Number(w.balance).toLocaleString('id-ID') });
        setShowSavingModal(true);
    };

    const confirmDeleteSaving = () => {
        if (deleteSavingId) {
            router.delete(route('wallets.destroy', deleteSavingId), {
                onSuccess: () => toast.success('Tabungan berhasil dihapus'),
                onError: (e: any) => toast.error(e.message || 'Gagal menghapus'),
            });
            setDeleteSavingId(null);
        }
    };

    // --- Save Goal ---
    const handleSaveGoal = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            name: goalForm.data.name,
            target_amount: parseAmount(goalForm.data.target_amount).toString(),
            deadline: goalForm.data.deadline || null,
            current_amount: parseAmount(goalForm.data.current_amount).toString(),
            color: goalForm.data.color,
            icon: goalForm.data.icon,
        };
        if (editingGoal) {
            router.put(route('savings.goals.update', editingGoal.id), payload, {
                onSuccess: () => { setShowGoalModal(false); goalForm.reset(); setEditingGoal(null); toast.success('Target diperbarui!'); },
                onError: (e: any) => toast.error(e.message || 'Gagal menyimpan'),
            });
        } else {
            router.post(route('savings.goals.store'), payload, {
                onSuccess: () => { setShowGoalModal(false); goalForm.reset(); toast.success('Target ditambahkan!'); },
                onError: (e: any) => toast.error(e.message || 'Gagal menyimpan'),
            });
        }
    };

    const handleEditGoal = (g: GoalData) => {
        setEditingGoal(g);
        goalForm.setData({
            name: g.name,
            target_amount: Number(g.target_amount).toLocaleString('id-ID'),
            deadline: g.deadline ? g.deadline.split('T')[0] : '',
            current_amount: Number(g.current_amount).toLocaleString('id-ID'),
            color: g.color || 'emerald',
            icon: g.icon || '',
        });
        setShowGoalModal(true);
    };

    const confirmDeleteGoal = () => {
        if (deleteGoalId) {
            router.delete(route('savings.goals.destroy', deleteGoalId), {
                onSuccess: () => toast.success('Target berhasil dihapus!'),
            });
            setDeleteGoalId(null);
        }
    };

    // --- Transfer (Topup / Withdraw) ---
    const handleTransfer = (e: React.FormEvent) => {
        e.preventDefault();
        if (!showTransferModal) return;
        const payload = {
            from_wallet_id: transferForm.data.from_wallet_id,
            to_wallet_id: transferForm.data.to_wallet_id,
            amount: parseAmount(transferForm.data.amount).toString(),
            description: transferForm.data.description,
        };
        const routeName = showTransferModal.type === 'topup' ? 'savings.topup' : 'savings.withdraw';
        router.post(route(routeName), payload, {
            onSuccess: () => {
                setShowTransferModal(null); transferForm.reset();
                toast.success(showTransferModal.type === 'topup' ? 'Berhasil menyetor!' : 'Berhasil menarik!');
            },
            onError: (errors: any) => {
                const msg = errors.message || 'Gagal memproses transfer';
                toast.error(msg);
            },
        });
    };

    const openTopup = (wallet: SavingWallet) => {
        setShowTransferModal({ type: 'topup', walletId: wallet.id, walletName: wallet.name });
        transferForm.setData({ from_wallet_id: dailyWallets.length > 0 ? dailyWallets[0].id.toString() : '', to_wallet_id: wallet.id.toString(), amount: '', description: '' });
    };

    const openWithdraw = (wallet: SavingWallet) => {
        setShowTransferModal({ type: 'withdraw', walletId: wallet.id, walletName: wallet.name });
        transferForm.setData({ from_wallet_id: wallet.id.toString(), to_wallet_id: dailyWallets.length > 0 ? dailyWallets[0].id.toString() : '', amount: '', description: '' });
    };

    const getGoalProgress = (goal: GoalData) => {
        if (goal.target_amount <= 0) return 0;
        return Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
    };

    const getGoalMonthsRemaining = (goal: GoalData) => {
        if (!goal.deadline) return null;
        const now = new Date();
        const deadline = new Date(goal.deadline);
        const months = (deadline.getFullYear() - now.getFullYear()) * 12 + (deadline.getMonth() - now.getMonth());
        return Math.max(0, months);
    };

    const getGoalMonthlyRequired = (goal: GoalData) => {
        const months = getGoalMonthsRemaining(goal);
        if (!months || months <= 0) return null;
        const remaining = goal.target_amount - goal.current_amount;
        if (remaining <= 0) return 0;
        return Math.ceil(remaining / months);
    };

    return (
        <>
            <Head title="Tabungan & Impian" />
            <Toaster position="top-right" />

            <div className="space-y-4 sm:space-y-6 animate-fade-in-up">
                {/* Hero Header */}
                <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800 p-5 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                    <Vault weight="duotone" className="absolute right-[-20px] bottom-[-20px] w-64 h-64 opacity-10 group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white opacity-5 rounded-full blur-3xl -translate-y-20 translate-x-20 pointer-events-none" />
                    <div className="relative z-10">
                        <p className="text-emerald-100 font-medium mb-1 opacity-80 uppercase tracking-widest text-xs">Total Simpanan</p>
                        <h2 className="text-3xl sm:text-4xl font-bold">{formatIDR(totalSavings)}</h2>
                        <p className="text-emerald-200 text-sm mt-2">{savingWallets.length} kantong tabungan • {goals.length} target impian</p>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex p-1.5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <button
                        onClick={() => setActiveTab('savings')}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'savings'
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/30'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                            }`}
                    >
                        <PiggyBank weight="duotone" className="w-4 h-4" />
                        Kantong Tabungan
                    </button>
                    <button
                        onClick={() => setActiveTab('goals')}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'goals'
                            ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-500/30'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                            }`}
                    >
                        <Target weight="duotone" className="w-4 h-4" />
                        Target & Impian
                    </button>
                </div>

                {/* =========> TAB 1: SAVINGS WALLETS <========= */}
                {activeTab === 'savings' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
                        {savingWallets.map((wallet, idx) => (
                            <div
                                key={wallet.id}
                                className="bg-gradient-to-br from-slate-800 via-slate-700 to-emerald-900 rounded-2xl p-5 sm:p-6 text-white relative h-60 flex flex-col justify-between overflow-hidden shadow-xl hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-500 group animate-pop-in"
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                {/* Background pattern */}
                                <div className="absolute inset-0 opacity-10">
                                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-400 rounded-full blur-xl" />
                                    <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-teal-400 rounded-full blur-xl" />
                                </div>
                                {/* Vault Watermark */}
                                <div className="absolute bottom-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                                    <Vault weight="duotone" className="w-20 h-20" />
                                </div>

                                {/* Top Row */}
                                <div className="relative z-10 flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-1.5 opacity-60">
                                            <p className="text-[10px] font-bold uppercase tracking-widest">TABUNGAN</p>
                                        </div>
                                        <h3 className="text-xl font-bold mt-1">{wallet.name}</h3>
                                    </div>
                                    <PiggyBank weight="duotone" className="w-8 h-8 opacity-60" />
                                </div>

                                {/* Monthly Cashflow */}
                                <div className="relative z-10 flex items-center gap-2">
                                    <div className="flex items-center gap-1 px-2 py-1 bg-white/10 backdrop-blur-sm rounded-lg">
                                        <ArrowDownRight weight="bold" className="w-3 h-3 text-emerald-300" />
                                        <span className="text-[10px] font-bold text-emerald-200">
                                            {formatShortIDR(wallet.monthly_in)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 px-2 py-1 bg-white/10 backdrop-blur-sm rounded-lg">
                                        <ArrowUpRight weight="bold" className="w-3 h-3 text-red-300" />
                                        <span className="text-[10px] font-bold text-red-200">
                                            {formatShortIDR(wallet.monthly_out)}
                                        </span>
                                    </div>
                                </div>

                                {/* Bottom Row */}
                                <div className="relative z-10 flex justify-between items-end">
                                    <div className="w-full">
                                        <p className="text-[10px] font-medium opacity-80 uppercase tracking-widest mb-1">Saldo</p>
                                        <p className="text-2xl font-bold break-words tracking-tight leading-tight">{formatIDR(wallet.balance)}</p>
                                    </div>
                                    {/* Quick Actions */}
                                    <div className="relative z-20 flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300">
                                        <button onClick={(e) => { e.stopPropagation(); openTopup(wallet); }} className="p-2 bg-emerald-500/30 hover:bg-emerald-500/50 rounded-xl transition-colors text-emerald-200 hover:text-white" title="Setor">
                                            <ArrowDownRight weight="bold" className="w-4 h-4" />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); openWithdraw(wallet); }} className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-xl transition-colors text-red-200 hover:text-white" title="Tarik">
                                            <ArrowUpRight weight="bold" className="w-4 h-4" />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleEditSaving(wallet); }} className="p-2 bg-white/10 hover:bg-white/30 rounded-xl transition-colors" title="Edit">
                                            <Edit2 weight="duotone" className="w-4 h-4" />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); setDeleteSavingId(wallet.id); }} className="p-2 bg-white/10 hover:bg-white/30 rounded-xl transition-colors" title="Hapus">
                                            <Trash2 weight="duotone" className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Add Card */}
                        <div
                            onClick={() => { setEditingSaving(null); savingForm.reset(); savingForm.setData('type', 'SAVING'); setShowSavingModal(true); }}
                            className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl h-60 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-all group animate-pop-in"
                            style={{ animationDelay: `${savingWallets.length * 100}ms` }}
                        >
                            <Plus weight="bold" className="w-10 h-10 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-colors mb-2" />
                            <p className="text-sm font-bold text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Buat Tabungan Baru</p>
                        </div>
                    </div>
                )}

                {/* =========> TAB 2: GOALS <========= */}
                {activeTab === 'goals' && (
                    <div className="space-y-6 animate-fade-in-up">
                        {goals.length === 0 ? (
                            <div className="text-center py-16">
                                <Target weight="duotone" className="w-16 h-16 mx-auto mb-4 text-slate-200 dark:text-slate-700" />
                                <h3 className="text-lg font-bold text-slate-500 dark:text-slate-400 mb-2">Belum ada target finansial</h3>
                                <p className="text-sm text-slate-400 dark:text-slate-500 mb-6">Impikan sesuatu dan mulai menabung untuk mewujudkannya!</p>
                                <button
                                    onClick={() => { setEditingGoal(null); goalForm.reset(); goalForm.setData('color', 'emerald'); setShowGoalModal(true); }}
                                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-2xl text-sm font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all hover:scale-105 active:scale-95"
                                >
                                    <Plus weight="bold" className="w-4 h-4 inline mr-2" /> Tambah Impian Pertama
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {goals.map((goal, idx) => {
                                        const progress = getGoalProgress(goal);
                                        const monthsLeft = getGoalMonthsRemaining(goal);
                                        const monthlyReq = getGoalMonthlyRequired(goal);
                                        const colorScheme = getGoalColor(goal.color);
                                        const isComplete = progress >= 100;

                                        return (
                                            <div
                                                key={goal.id}
                                                className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all duration-300 group animate-pop-in relative overflow-hidden"
                                                style={{ animationDelay: `${idx * 100}ms` }}
                                            >
                                                {/* Completion glow */}
                                                {isComplete && <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 pointer-events-none" />}

                                                <div className="relative z-10">
                                                    {/* Header */}
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-xl ${colorScheme.bg} ${colorScheme.text} flex items-center justify-center`}>
                                                                <Target weight="duotone" className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-bold text-slate-800 dark:text-white">{goal.name}</h3>
                                                                {goal.deadline && (
                                                                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                                                                        <Calendar weight="duotone" className="w-3 h-3" />
                                                                        <span>{new Date(goal.deadline).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                                                        {monthsLeft !== null && <span className="ml-1 font-bold">({monthsLeft} bln lagi)</span>}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => handleEditGoal(goal)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                                                <Edit2 weight="duotone" className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button onClick={() => setDeleteGoalId(goal.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                                                <Trash2 weight="duotone" className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Amounts */}
                                                    <div className="flex items-baseline gap-1 mb-3">
                                                        <span className="text-xl font-bold text-slate-800 dark:text-white">{formatIDR(goal.current_amount)}</span>
                                                        <span className="text-sm text-slate-400">/ {formatIDR(goal.target_amount)}</span>
                                                    </div>

                                                    {/* Progress Bar */}
                                                    <div className="relative h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
                                                        <div
                                                            className={`absolute inset-y-0 left-0 bg-gradient-to-r ${colorScheme.gradient} rounded-full transition-all duration-1000 ease-out`}
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                        {isComplete && <div className="absolute inset-0 bg-emerald-400/20 animate-pulse rounded-full" />}
                                                    </div>

                                                    {/* Footer Stats */}
                                                    <div className="flex items-center justify-between">
                                                        <span className={`text-xs font-bold ${isComplete ? 'text-emerald-600 dark:text-emerald-400' : colorScheme.text}`}>
                                                            {isComplete ? '🎉 Tercapai!' : `${progress}%`}
                                                        </span>
                                                        {!isComplete && monthlyReq !== null && monthlyReq > 0 && (
                                                            <span className="text-[11px] text-slate-400 font-medium">
                                                                Perlu {formatShortIDR(monthlyReq)}/bulan
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Add Goal Button */}
                                <div className="flex justify-center">
                                    <button
                                        onClick={() => { setEditingGoal(null); goalForm.reset(); goalForm.setData('color', 'emerald'); setShowGoalModal(true); }}
                                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-2xl text-sm font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all hover:scale-105 active:scale-95"
                                    >
                                        <Plus weight="bold" className="w-4 h-4 inline mr-2" /> Tambah Target Baru
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* ========= MODALS ========= */}

            {/* Saving Wallet Modal */}
            {showSavingModal && mounted && createPortal(
                <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-6 pb-16 lg:pb-0 animate-fade-in">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setShowSavingModal(false)} />
                    <div className="relative w-full max-w-md glass-card rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-pop-in">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 z-10" />
                        <div className="p-5 pb-0 shrink-0">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white text-center">
                                {editingSaving ? 'Edit Tabungan' : 'Buat Tabungan Baru'}
                            </h3>
                        </div>
                        <div className="p-5 pt-4 overflow-y-auto scrollbar-hide">
                            <form onSubmit={handleSaveSaving} className="space-y-3">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Nama Tabungan</label>
                                    <input type="text" required value={savingForm.data.name} onChange={e => savingForm.setData('name', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" placeholder="Contoh: Dana Darurat, Tabungan Liburan" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Saldo Awal (Rp)</label>
                                    <input type="text" required value={savingForm.data.balance} onChange={e => handleAmountChange(e.target.value, (f, v) => savingForm.setData(f as any, v), 'balance')} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" placeholder="0" />
                                </div>
                                <div className="flex space-x-3 pt-4">
                                    <button type="button" onClick={() => setShowSavingModal(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors active:scale-95">Batal</button>
                                    <button type="submit" disabled={savingForm.processing} className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-emerald-100 hover:scale-105 active:scale-95 transition-transform disabled:opacity-50">
                                        {savingForm.processing ? 'Menyimpan...' : 'Simpan'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Goal Modal */}
            {showGoalModal && mounted && createPortal(
                <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-6 pb-16 lg:pb-0 animate-fade-in">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setShowGoalModal(false)} />
                    <div className="relative w-full max-w-md glass-card rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-pop-in">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 z-10" />
                        <div className="p-5 pb-0 shrink-0">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white text-center">
                                {editingGoal ? 'Edit Target' : 'Tambah Target Baru'}
                            </h3>
                        </div>
                        <div className="p-5 pt-4 overflow-y-auto scrollbar-hide">
                            <form onSubmit={handleSaveGoal} className="space-y-3">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Nama Impian</label>
                                    <input type="text" required value={goalForm.data.name} onChange={e => goalForm.setData('name', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-purple-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" placeholder="Contoh: Beli Rumah, Liburan Bali" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Target Nominal (Rp)</label>
                                    <input type="text" required value={goalForm.data.target_amount} onChange={e => handleAmountChange(e.target.value, (f, v) => goalForm.setData(f as any, v), 'target_amount')} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-purple-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" placeholder="50.000.000" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Tenggat Waktu (Opsional)</label>
                                    <input type="date" value={goalForm.data.deadline} onChange={e => goalForm.setData('deadline', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-purple-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Sudah Terkumpul (Rp)</label>
                                    <input type="text" value={goalForm.data.current_amount} onChange={e => handleAmountChange(e.target.value, (f, v) => goalForm.setData(f as any, v), 'current_amount')} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-purple-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" placeholder="0" />
                                </div>
                                {/* Color Picker */}
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 ml-1">Warna Tema</label>
                                    <div className="flex gap-2">
                                        {GOAL_COLORS.map(c => (
                                            <button key={c.value} type="button" onClick={() => goalForm.setData('color', c.value)}
                                                className={`w-8 h-8 rounded-full bg-gradient-to-br ${c.gradient} transition-all ${goalForm.data.color === c.value ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900 scale-110' : 'opacity-60 hover:opacity-100'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="flex space-x-3 pt-4">
                                    <button type="button" onClick={() => setShowGoalModal(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors active:scale-95">Batal</button>
                                    <button type="submit" disabled={goalForm.processing} className="flex-1 py-3 bg-purple-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-purple-100 hover:scale-105 active:scale-95 transition-transform disabled:opacity-50">
                                        {goalForm.processing ? 'Menyimpan...' : 'Simpan'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Topup / Withdraw Transfer Modal */}
            {showTransferModal && mounted && createPortal(
                <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-6 pb-16 lg:pb-0 animate-fade-in">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setShowTransferModal(null)} />
                    <div className="relative w-full max-w-md glass-card rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-pop-in">
                        <div className={`absolute top-0 left-0 w-full h-1.5 ${showTransferModal.type === 'topup' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'} z-10`} />
                        <div className="p-5 pb-0 shrink-0">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white text-center">
                                {showTransferModal.type === 'topup' ? `Setor ke ${showTransferModal.walletName}` : `Tarik dari ${showTransferModal.walletName}`}
                            </h3>
                        </div>
                        <div className="p-5 pt-4 overflow-y-auto scrollbar-hide">
                            <form onSubmit={handleTransfer} className="space-y-3">
                                {showTransferModal.type === 'topup' ? (
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Dari Dompet</label>
                                        <select value={transferForm.data.from_wallet_id} onChange={e => transferForm.setData('from_wallet_id', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" required>
                                            <option value="">Pilih Dompet</option>
                                            {dailyWallets.map(w => (
                                                <option key={w.id} value={w.id}>{w.name} ({formatIDR(w.balance)})</option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Ke Dompet</label>
                                        <select value={transferForm.data.to_wallet_id} onChange={e => transferForm.setData('to_wallet_id', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-amber-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" required>
                                            <option value="">Pilih Dompet Tujuan</option>
                                            {dailyWallets.map(w => (
                                                <option key={w.id} value={w.id}>{w.name} ({formatIDR(w.balance)})</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Nominal (Rp)</label>
                                    <input type="text" required value={transferForm.data.amount} onChange={e => handleAmountChange(e.target.value, (f, v) => transferForm.setData(f as any, v), 'amount')} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" placeholder="0" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Catatan (Opsional)</label>
                                    <input type="text" value={transferForm.data.description} onChange={e => transferForm.setData('description', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" placeholder="Setor bulanan" />
                                </div>
                                <div className="flex space-x-3 pt-4">
                                    <button type="button" onClick={() => setShowTransferModal(null)} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors active:scale-95">Batal</button>
                                    <button type="submit" disabled={transferForm.processing} className={`flex-1 py-3 text-white rounded-2xl text-sm font-bold shadow-lg hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 ${showTransferModal.type === 'topup' ? 'bg-emerald-600 shadow-emerald-100' : 'bg-amber-600 shadow-amber-100'}`}>
                                        {transferForm.processing ? 'Memproses...' : showTransferModal.type === 'topup' ? '↓ Setor' : '↑ Tarik'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Delete Saving Confirmation */}
            {deleteSavingId && mounted && createPortal(
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-fade-in">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setDeleteSavingId(null)} />
                    <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-2xl animate-pop-in border border-slate-100 dark:border-slate-800">
                        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 mb-4 mx-auto">
                            <AlertTriangle weight="fill" className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-2">Hapus Tabungan?</h3>
                        <p className="text-sm text-center text-slate-500 dark:text-slate-400 mb-6 px-4">Seluruh saldo tabungan ini juga akan dihapus.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteSavingId(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Batal</button>
                            <button onClick={confirmDeleteSaving} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30 transition-colors">Ya, Hapus</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Delete Goal Confirmation */}
            {deleteGoalId && mounted && createPortal(
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-fade-in">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setDeleteGoalId(null)} />
                    <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-2xl animate-pop-in border border-slate-100 dark:border-slate-800">
                        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 mb-4 mx-auto">
                            <AlertTriangle weight="fill" className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-2">Hapus Target?</h3>
                        <p className="text-sm text-center text-slate-500 dark:text-slate-400 mb-6 px-4">Target impian ini akan dihapus secara permanen.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteGoalId(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Batal</button>
                            <button onClick={confirmDeleteGoal} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30 transition-colors">Ya, Hapus</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

SavingsIndex.layout = (page: any) => (
    <AppLayout
        header={
            <div className="flex flex-col min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-white tracking-tight truncate">Tabungan & Impian</h1>
                <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">Kelola simpanan dan target finansial Anda</p>
            </div>
        }
    >
        {page}
    </AppLayout>
);
