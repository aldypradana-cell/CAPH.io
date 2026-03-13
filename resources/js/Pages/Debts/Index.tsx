import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useState, FormEventHandler, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, HandCoins, Warning as AlertTriangle, Trash as Trash2, PencilSimple as Edit2, Check, CalendarBlank as Calendar,
    TrendUp as TrendingUp, TrendDown as TrendingDown, Receipt, Repeat, Wallet, Clock, CheckCircle, ArrowRight, CreditCard
} from '@phosphor-icons/react';
import toast, { Toaster } from 'react-hot-toast';
import InstallmentTab from './Partials/InstallmentTab';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { todayString, formatDateShort, toDateString } from '@/utils/date';

// --- Types ---
interface RecurringTransaction {
    id: number;
    name: string;
    amount: number;
    wallet_id: number;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    category: string;
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    start_date: string;
    next_run_date: string;
    auto_cut: boolean;
    is_active: boolean;
    description: string | null;
    wallet: { id: number; name: string };
}

interface DebtPaymentRecord {
    id: number;
    amount: number;
    date: string;
    notes: string | null;
    wallet_name: string;
}

interface Debt {
    id: number;
    type: 'DEBT' | 'RECEIVABLE' | 'BILL';
    person: string;
    amount: number;
    description?: string;
    due_date?: string;
    is_paid: boolean;
    paid_amount: number;
    remaining_amount: number;
    progress_percentage: number;
    payments: DebtPaymentRecord[];
}

interface Wallet {
    id: number;
    name: string;
    balance: number;
}

interface Category {
    id: number;
    name: string;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
}

interface Summary {
    totalDebt: number;
    totalReceivable: number;
    totalBill: number;
    paidCount: number;
    unpaidCount: number;
}

interface Props extends PageProps {
    debts: { data: Debt[] };
    recurring: { data: RecurringTransaction[] };
    dueRecurring: RecurringTransaction[];
    wallets: Wallet[];
    categories: Category[];
    summary: Summary;
    installments: { data: any[] };
    installmentSummary: any;
    debtProjection: { month: string; remaining: number }[];
    filters: any;
}

// --- Components ---
function DebtFreedomCountdown({ data }: { data: { month: string; remaining: number }[] }) {
    if (!data || data.length === 0) return null;

    const isFree = data[data.length - 1].remaining === 0;
    const freedomDate = isFree ? data[data.length - 1].month : 'Belum Terprediksi';

    return (
        <div className="glass-card rounded-3xl p-4 sm:p-5 overflow-hidden relative group animate-fade-in-up h-full flex flex-col justify-between shadow-sm">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
            
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between mb-3 gap-3">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-0.5">
                        <TrendingDown weight="bold" className="w-4 h-4 text-indigo-500" />
                        Proyeksi Bebas Hutang
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Berdasarkan kecepatan pembayaran saat ini
                    </p>
                </div>
                {isFree && (
                    <div className="bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-xl border border-emerald-100 dark:border-emerald-800 shrink-0">
                        <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-0.5">Bebas Finansial Pada</p>
                        <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">{freedomDate}</p>
                    </div>
                )}
            </div>

            <div className="h-[120px] w-full mt-auto">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorRemaining" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis 
                            dataKey="month" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                            dy={10}
                            minTickGap={20}
                        />
                        <YAxis hide domain={[0, 'auto']} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
                            formatter={(value: any) => [new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(value)), 'Sisa Tagihan']}
                            labelStyle={{ color: '#64748b', fontWeight: 'bold', marginBottom: '4px' }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="remaining" 
                            stroke="#8b5cf6" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorRemaining)" 
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

// --- Helpers ---
const formatIDR = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

const formatDate = formatDateShort;

export default function DebtsIndex({ auth, debts, recurring, dueRecurring, wallets, categories, summary, installments, installmentSummary, debtProjection, filters }: Props) {
    const [activeTab, setActiveTab] = useState<'RECURRING' | 'INSTALLMENT' | 'DEBT'>('RECURRING');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // --- DEBT STATES & FORM ---
    const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
    const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
    const [deleteDebtId, setDeleteDebtId] = useState<number | null>(null);
    const [payingDebt, setPayingDebt] = useState<Debt | null>(null);
    const [expandedDebtId, setExpandedDebtId] = useState<number | null>(null);

    const debtForm = useForm({
        type: 'DEBT' as string,
        person: '',
        amount: '',
        description: '',
        due_date: '',
    });

    const paymentForm = useForm({
        wallet_id: '',
        amount: '',
        date: todayString(),
        notes: '',
    });


    // --- RECURRING STATES & FORM ---
    const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
    const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null);
    const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
    const [selectedProcessRecurring, setSelectedProcessRecurring] = useState<RecurringTransaction | null>(null);

    const recurringForm = useForm({
        name: '',
        amount: '',
        wallet_id: '',
        type: 'EXPENSE',
        category: '',
        frequency: 'MONTHLY',
        start_date: todayString(),
        next_run_date: '',
        auto_cut: true,
        description: '',
    });

    const processForm = useForm({
        amount: '',
        wallet_id: '',
        date: todayString(),
    });

    // --- AMOUNT FORMATTER ---
    const formatInputAmount = (val: string) => {
        const rawValue = val.replace(/\D/g, '');
        if (!rawValue) return '';
        return parseInt(rawValue).toLocaleString('id-ID');
    };
    const parseAmount = (val: string) => parseFloat(val.replace(/\./g, '')) || 0;

    // --- DEBT HANDLERS ---
    const handleDebtAmountChange = (val: string) => {
        debtForm.setData('amount', formatInputAmount(val));
    };

    const handleDebtSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { ...debtForm.data, amount: parseAmount(debtForm.data.amount as string).toString() };
        if (editingDebt) {
            router.put(route('debts.update', editingDebt.id), payload, {
                onSuccess: () => { setIsDebtModalOpen(false); debtForm.reset(); setEditingDebt(null); toast.success('Diperbarui!'); }
            });
        } else {
            router.post(route('debts.store'), payload, {
                onSuccess: () => { setIsDebtModalOpen(false); debtForm.reset(); toast.success('Ditambahkan!'); }
            });
        }
    };

    const openDebtModal = (d?: Debt) => {
        if (d) {
            setEditingDebt(d);
            debtForm.setData({
                type: d.type,
                person: d.person,
                amount: Number(d.amount).toLocaleString('id-ID'),
                description: d.description || '',
                due_date: d.due_date ? toDateString(d.due_date) : ''
            });
        } else {
            setEditingDebt(null);
            debtForm.setData({
                type: 'DEBT',
                person: '',
                amount: '',
                description: '',
                due_date: ''
            });
        }
        setIsDebtModalOpen(true);
    };



    const openPayModal = (d: Debt) => {
        setPayingDebt(d);
        paymentForm.setData({
            wallet_id: '',
            amount: Number(d.remaining_amount ?? d.amount).toLocaleString('id-ID'),
            date: todayString(),
            notes: '',
        });
    };

    const handlePaySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!payingDebt) return;
        const payload = { ...paymentForm.data, amount: parseAmount(paymentForm.data.amount) };
        router.post(route('debts.pay', payingDebt.id), payload, {
            onSuccess: () => { setPayingDebt(null); toast.success('Pembayaran berhasil!'); },
        });
    };


    const getDebtTypeConfig = (type: string) => {
        switch (type) {
            case 'DEBT': return { label: 'Hutang', color: 'bg-red-500', badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400', icon: TrendingDown };
            case 'RECEIVABLE': return { label: 'Piutang', color: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400', icon: TrendingUp };
            case 'BILL': return { label: 'Tagihan', color: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400', icon: Receipt };
            default: return { label: type, color: 'bg-slate-500', badge: 'bg-slate-100 text-slate-700', icon: HandCoins };
        }
    };

    // --- RECURRING HANDLERS ---
    const openRecurringModal = (item?: RecurringTransaction) => {
        if (item) {
            setEditingRecurring(item);
            recurringForm.setData({
                name: item.name,
                amount: Number(item.amount).toLocaleString('id-ID'),
                wallet_id: item.wallet_id.toString(),
                type: item.type,
                category: item.category,
                frequency: item.frequency,
                start_date: item.start_date ? toDateString(item.start_date) : todayString(),
                next_run_date: item.next_run_date ? toDateString(item.next_run_date) : '',
                auto_cut: item.auto_cut,
                description: item.description || '',
            });
        } else {
            setEditingRecurring(null);
            recurringForm.reset();
            recurringForm.setData({
                name: '', amount: '', wallet_id: '', type: 'EXPENSE', category: '',
                frequency: 'MONTHLY', start_date: todayString(),
                next_run_date: '', auto_cut: true, description: ''
            });
        }
        setIsRecurringModalOpen(true);
    };

    const handleRecurringSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        
        // If editing and start_date changed, aggressively sync next_run_date
        let finalNextRunDate = recurringForm.data.next_run_date;
        if (editingRecurring && recurringForm.data.start_date !== editingRecurring.start_date) {
            finalNextRunDate = recurringForm.data.start_date;
        }

        const payload = { 
            ...recurringForm.data, 
            amount: parseAmount(recurringForm.data.amount as string).toString(),
            next_run_date: finalNextRunDate
        };
        
        if (editingRecurring) {
            router.put(route('recurring.update', editingRecurring.id), payload, {
                onSuccess: () => setIsRecurringModalOpen(false),
            });
        } else {
            router.post(route('recurring.store'), payload, {
                onSuccess: () => setIsRecurringModalOpen(false),
            });
        }
    };

    const handleRecurringDelete = () => {
        if (!editingRecurring) return;
        if (confirm('Yakin ingin menghapus jadwal ini?')) {
            recurringForm.delete(route('recurring.destroy', editingRecurring.id), {
                onSuccess: () => setIsRecurringModalOpen(false),
            });
        }
    };

    const openProcessModal = (item: RecurringTransaction) => {
        setSelectedProcessRecurring(item);
        processForm.setData({
            amount: Number(item.amount).toLocaleString('id-ID'),
            wallet_id: item.wallet_id.toString(),
            date: todayString(),
        });
        setIsProcessModalOpen(true);
    };

    const handleProcessSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!selectedProcessRecurring) return;
        const payload = { ...processForm.data, amount: parseAmount(processForm.data.amount as string).toString() };
        router.post(route('recurring.process', selectedProcessRecurring.id), payload, {
            onSuccess: () => setIsProcessModalOpen(false),
        });
    };

    const availableCategories = categories.filter(c => c.type === recurringForm.data.type);

    return (
        <>
            <Head title="Jadwal & Tagihan" />
            <Toaster position="top-right" />

            <div className="space-y-4 sm:space-y-6 animate-fade-in-up">
                {/* GLOBAL DASHBOARD WIDGET */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                    {/* Summary Cards */}
                    <div className="xl:col-span-1 flex flex-col gap-5">
                        <div className="glass-card p-5 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 group flex-1">
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-3 bg-gradient-to-br from-red-500 to-rose-600 text-white rounded-2xl shadow-lg">
                                    <TrendingDown weight="bold" className="w-5 h-5" />
                                </div>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Kewajiban (Hutang + Cicilan)</p>
                            <p className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">{formatIDR(summary.totalDebt + (installmentSummary?.totalRemaining || 0))}</p>
                        </div>
                        <div className="glass-card p-5 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 group flex-1">
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl shadow-lg">
                                    <TrendingUp weight="bold" className="w-5 h-5" />
                                </div>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Piutang</p>
                            <p className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">{formatIDR(summary.totalReceivable)}</p>
                        </div>
                    </div>
                    
                    {/* Debt Freedom Chart */}
                    <div className="xl:col-span-2">
                        <DebtFreedomCountdown data={debtProjection} />
                    </div>
                </div>

                {/* DUE BILLS WIDGET (EXPENSE) */}
                {dueRecurring.filter(r => r.type !== 'INCOME').length > 0 && (
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/10 rounded-[2rem] p-6 border border-orange-100 dark:border-orange-500/20 shadow-lg shadow-orange-500/5">
                        <h3 className="text-lg font-bold text-orange-800 dark:text-orange-400 mb-4 flex items-center">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded-xl mr-3">
                                <AlertTriangle weight="fill" className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            Tagihan Jatuh Tempo ({dueRecurring.filter(r => r.type !== 'INCOME').length})
                        </h3>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {dueRecurring.filter(r => r.type !== 'INCOME').map(bill => (
                                <div key={bill.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-orange-100 dark:border-slate-800 flex flex-col justify-between group hover:shadow-lg transition-all">
                                    <div className="mb-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/30 px-2 py-1 rounded-lg">
                                                {formatDate(bill.next_run_date)}
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                <Repeat weight="bold" className="w-4 h-4" />
                                            </div>
                                        </div>
                                        <h4 className="font-bold text-slate-800 dark:text-white text-lg mb-1">{bill.name}</h4>
                                        <div className="text-2xl font-bold text-slate-900 dark:text-gray-100">{formatIDR(bill.amount)}</div>
                                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                                            <Wallet weight="duotone" className="w-3 h-3" /> {bill.wallet.name}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => openProcessModal(bill)}
                                        className="w-full justify-center bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl py-3 flex items-center transition-colors"
                                    >
                                        Bayar Sekarang <ArrowRight weight="bold" className="w-4 h-4 ml-2" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* DUE INCOMES WIDGET */}
                {dueRecurring.filter(r => r.type === 'INCOME').length > 0 && (
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/10 rounded-[2rem] p-6 border border-emerald-100 dark:border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                        <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-400 mb-4 flex items-center">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl mr-3">
                                <AlertTriangle weight="fill" className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            Pemasukan Terjadwal ({dueRecurring.filter(r => r.type === 'INCOME').length})
                        </h3>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {dueRecurring.filter(r => r.type === 'INCOME').map(income => (
                                <div key={income.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-emerald-100 dark:border-slate-800 flex flex-col justify-between group hover:shadow-lg transition-all">
                                    <div className="mb-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-lg">
                                                {formatDate(income.next_run_date)}
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                <TrendingUp weight="bold" className="w-4 h-4 text-emerald-500" />
                                            </div>
                                        </div>
                                        <h4 className="font-bold text-slate-800 dark:text-white text-lg mb-1">{income.name}</h4>
                                        <div className="text-2xl font-bold text-slate-900 dark:text-gray-100">{formatIDR(income.amount)}</div>
                                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                                            <Wallet weight="duotone" className="w-3 h-3" /> {income.wallet.name}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => openProcessModal(income)}
                                        className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl py-3 flex items-center transition-colors"
                                    >
                                        Terima Sekarang <Check weight="bold" className="w-4 h-4 ml-2" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TABS NAVIGATION */}
                <div className="flex space-x-2 overflow-x-auto bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl w-fit mx-auto lg:mx-0 scrollbar-hide">
                    <button
                        onClick={() => setActiveTab('RECURRING')}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === 'RECURRING'
                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm scale-105'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        <Repeat weight="bold" className="w-4 h-4" /> Rutin & Langganan
                    </button>
                    <button
                        onClick={() => setActiveTab('INSTALLMENT')}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === 'INSTALLMENT'
                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm scale-105'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        <CreditCard weight="duotone" className="w-4 h-4" /> Cicilan
                    </button>
                    <button
                        onClick={() => setActiveTab('DEBT')}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === 'DEBT'
                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm scale-105'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        <HandCoins weight="duotone" className="w-4 h-4" /> Hutang & Piutang
                    </button>
                </div>

                {/* TAB CONTENT: INSTALLMENT */}
                {activeTab === 'INSTALLMENT' && (
                    <InstallmentTab installments={installments} wallets={wallets} summary={installmentSummary} />
                )}

                {/* TAB CONTENT: RECURRING */}
                {activeTab === 'RECURRING' && (
                    <div className="animate-fade-in-up">
                        <div className="flex justify-end mb-4">
                            <button onClick={() => openRecurringModal()} className="flex items-center px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl text-sm font-bold hover:shadow-lg hover:shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95">
                                <Plus weight="bold" className="w-4 h-4 mr-2" /> Tambah Jadwal
                            </button>
                        </div>

                        {recurring.data.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {recurring.data.map((item) => (
                                    <div key={item.id} className="glass-card p-5 rounded-[2rem] hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
                                        <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 ${item.type === 'EXPENSE' ? 'bg-red-500' : 'bg-emerald-500'}`}></div>

                                        <div className="flex justify-between items-start mb-4 relative z-10">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${item.type === 'EXPENSE' ? 'bg-gradient-to-br from-red-500 to-rose-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'}`}>
                                                <Repeat weight="bold" className="w-6 h-6" />
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.auto_cut ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                                {item.auto_cut ? (item.type === 'INCOME' ? 'Auto Income' : 'Auto Cut') : 'Manual'}
                                            </div>
                                        </div>

                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{item.name}</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-1">
                                            <Clock weight="duotone" className="w-3 h-3" /> {item.frequency} • {item.category}
                                        </p>

                                        <div className="mb-6">
                                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{formatIDR(item.amount)}</p>
                                            <p className="text-xs text-slate-400 mt-1">Berikutnya: {formatDate(item.next_run_date)}</p>
                                        </div>

                                        <div className="flex gap-2">
                                            <button onClick={() => openRecurringModal(item)} className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                                                Edit
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="glass-card rounded-[2rem] p-8 sm:p-16 text-center">
                                <Repeat weight="duotone" className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                                <p className="text-lg font-bold text-slate-400">Belum ada jadwal transaksi rutin</p>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB CONTENT: DEBT */}
                {activeTab === 'DEBT' && (
                    <div className="animate-fade-in-up">
                        <div className="flex justify-end mb-4">
                            <button onClick={() => openDebtModal()} className="flex items-center px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl text-sm font-bold hover:shadow-lg hover:shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95">
                                <Plus weight="bold" className="w-4 h-4 mr-2" /> Tambah Catatan
                            </button>
                        </div>

                        <div className="space-y-3">
                            {debts.data.length > 0 ? debts.data.map((d) => {
                                const config = getDebtTypeConfig(d.type);
                                const isOverdue = d.due_date && new Date(d.due_date) < new Date() && !d.is_paid;
                                const hasCicilan = (d.paid_amount ?? 0) > 0 && !d.is_paid;
                                const isExpanded = expandedDebtId === d.id;
                                return (
                                    <div key={d.id} className={`glass-card rounded-2xl overflow-hidden group hover:shadow-lg transition-all duration-300 ${d.is_paid ? 'opacity-60' : ''}`}>
                                        <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                                            <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0 w-full sm:w-auto">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.color} text-white shadow-sm shrink-0 mt-1 sm:mt-0`}>
                                                    <config.icon weight="bold" className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap mb-1 sm:mb-0">
                                                        <p className={`text-sm font-bold text-slate-800 dark:text-white ${d.is_paid ? 'line-through' : ''}`}>{d.person}</p>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${config.badge}`}>{config.label}</span>
                                                        {isOverdue && <span className="text-[10px] font-bold text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full flex items-center gap-0.5"><AlertTriangle weight="fill" className="w-3 h-3" /> Jatuh Tempo</span>}
                                                        {d.is_paid && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full flex items-center gap-0.5"><Check weight="bold" className="w-3 h-3" /> Lunas</span>}
                                                    </div>
                                                    {d.description && <p className="text-xs sm:text-[10px] text-slate-500 sm:text-slate-400 line-clamp-2 sm:truncate mt-1 sm:mt-0.5 pr-2 sm:pr-0">{d.description}</p>}
                                                    {d.due_date && <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1 sm:mt-0.5"><Calendar weight="duotone" className="w-3 h-3" /> {formatDate(d.due_date)}</p>}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 w-full sm:w-auto border-t border-slate-100 dark:border-slate-800 sm:border-0 pt-3 sm:pt-0 mt-1 sm:mt-0">
                                                <div className="text-left sm:text-right flex-1 sm:flex-none">
                                                    <p className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">{formatIDR(d.amount)}</p>
                                                    {hasCicilan && <p className="text-[10px] text-slate-400">Sisa {formatIDR(d.remaining_amount)}</p>}
                                                </div>
                                                <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                    {!d.is_paid && (
                                                        <button onClick={() => openPayModal(d)} className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-all hover:scale-110 text-xs font-bold" title="Bayar/Cicil">
                                                            <CheckCircle weight="fill" className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button onClick={() => openDebtModal(d)} className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all hover:scale-110"><Edit2 weight="duotone" className="w-4 h-4" /></button>
                                                    <button onClick={() => setDeleteDebtId(d.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all hover:scale-110"><Trash2 weight="duotone" className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        {!d.is_paid && (d.paid_amount ?? 0) > 0 && (
                                            <div className="px-4 pb-3">
                                                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                                    <span>Terbayar {formatIDR(d.paid_amount)}</span>
                                                    <span>{d.progress_percentage}%</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
                                                        style={{ width: `${d.progress_percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Payment History (expandable) */}
                                        {d.payments && d.payments.length > 0 && (
                                            <div className="border-t border-slate-100 dark:border-slate-800">
                                                <button
                                                    onClick={() => setExpandedDebtId(isExpanded ? null : d.id)}
                                                    className="w-full text-left px-4 py-2 text-[10px] font-bold text-slate-400 hover:text-indigo-500 flex items-center justify-between transition-colors"
                                                >
                                                    <span>Riwayat Cicilan ({d.payments.length}x)</span>
                                                    <span>{isExpanded ? '▲' : '▼'}</span>
                                                </button>
                                                {isExpanded && (
                                                    <div className="px-4 pb-3 space-y-1.5">
                                                        {d.payments.map(p => (
                                                            <div key={p.id} className="flex justify-between items-center text-xs text-slate-500">
                                                                <span>{formatDate(p.date)} • {p.wallet_name}{p.notes ? ` — ${p.notes}` : ''}</span>
                                                                <span className="font-bold text-slate-700 dark:text-slate-300">{formatIDR(p.amount)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            }) : (
                                <div className="glass-card rounded-[2rem] p-8 sm:p-16 text-center">
                                    <HandCoins weight="duotone" className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                                    <p className="text-lg font-bold text-slate-400">Belum ada data hutang/piutang</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* --- MODALS --- */}

            {/* PAYMENT MODAL (Bayar / Cicil) */}
            {payingDebt && mounted && createPortal(
                <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4 animate-fade-in">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setPayingDebt(null)} />
                    <div className="relative w-full max-w-md glass-card rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-pop-in">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-violet-500 z-10" />
                        <div className="p-5 pb-0 shrink-0">
                            <div className="flex justify-between items-center mb-1">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {payingDebt.type === 'RECEIVABLE' ? 'Terima Piutang' : 'Bayar Utang'}
                                </h2>
                                <button onClick={() => setPayingDebt(null)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><X weight="bold" className="w-5 h-5" /></button>
                            </div>
                            <p className="text-xs text-slate-400 mb-4">{payingDebt.person} • Total {formatIDR(payingDebt.amount)} • Sisa {formatIDR(payingDebt.remaining_amount)}</p>
                        </div>
                        <div className="p-5 pt-0 overflow-y-auto scrollbar-hide">
                            <form onSubmit={handlePaySubmit} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Nominal Bayar (Rp)</label>
                                    <input
                                        type="tel" autoFocus
                                        value={paymentForm.data.amount}
                                        onChange={e => paymentForm.setData('amount', formatInputAmount(e.target.value))}
                                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-2xl text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50 text-center"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">{payingDebt.type === 'RECEIVABLE' ? 'Masuk ke Dompet' : 'Dompet Pembayaran'}</label>
                                    <select value={paymentForm.data.wallet_id} onChange={e => paymentForm.setData('wallet_id', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" required>
                                        <option value="">Pilih Dompet</option>
                                        {wallets.map(w => <option key={w.id} value={w.id}>{w.name} ({formatIDR(w.balance)})</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Tanggal</label>
                                        <input type="date" value={paymentForm.data.date} onChange={e => paymentForm.setData('date', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" required />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Catatan (Opsional)</label>
                                        <input type="text" value={paymentForm.data.notes} onChange={e => paymentForm.setData('notes', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" placeholder="Via transfer..." />
                                    </div>
                                </div>
                                <div className="flex space-x-3 pt-2">
                                    <button type="button" onClick={() => setPayingDebt(null)} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors active:scale-95">Batal</button>
                                    <button type="submit" disabled={paymentForm.processing} className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-transform disabled:opacity-50">
                                        {paymentForm.processing ? 'Memproses...' : 'Konfirmasi Bayar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>,
                document.body
            )}


            {/* DELETE DEBT MODAL */}
            {deleteDebtId && mounted && createPortal(
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-fade-in">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setDeleteDebtId(null)} />
                    <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-2xl animate-pop-in border border-slate-100 dark:border-slate-800">
                        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 mb-4 mx-auto"><AlertTriangle weight="fill" className="w-7 h-7" /></div>
                        <h3 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-6">Hapus data ini?</h3>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteDebtId(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300">Batal</button>
                            <button onClick={() => { router.delete(route('debts.destroy', deleteDebtId), { onSuccess: () => toast.success('Dihapus!') }); setDeleteDebtId(null); }} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 shadow-lg shadow-red-500/30">Ya, Hapus</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ADD/EDIT DEBT MODAL */}
            {isDebtModalOpen && mounted && createPortal(
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 animate-fade-in">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity" onClick={() => setIsDebtModalOpen(false)} />
                    <div className="relative w-full max-w-md glass-card rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-pop-in">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 to-pink-500 z-10" />

                        <div className="p-5 pb-0 shrink-0">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {editingDebt ? 'Edit Catatan' : 'Tambah Catatan Baru'}
                                </h2>
                                <button onClick={() => setIsDebtModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                    <X weight="bold" className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-2">
                                {([{ v: 'DEBT', l: 'Hutang' }, { v: 'RECEIVABLE', l: 'Piutang' }]).map(opt => (
                                    <button key={opt.v} type="button" onClick={() => debtForm.setData('type', opt.v)}
                                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${debtForm.data.type === opt.v
                                            ? opt.v === 'DEBT' ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                                                : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                            }`}
                                    >{opt.l}</button>
                                ))}
                            </div>
                        </div>

                        <div className="p-5 pt-4 overflow-y-auto scrollbar-hide">
                            <form onSubmit={handleDebtSubmit} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Jumlah (Rp)</label>
                                    <input type="tel" inputMode="numeric" autoComplete="off" value={debtForm.data.amount} onChange={(e) => handleDebtAmountChange(e.target.value)} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-2xl text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50 text-center" placeholder="0" autoFocus required />
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Nama Orang / Instansi</label>
                                        <input type="text" value={debtForm.data.person} onChange={(e) => debtForm.setData('person', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" placeholder="Contoh: Budi / PLN" required />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Jatuh Tempo</label>
                                        <input type="date" value={debtForm.data.due_date} onChange={(e) => debtForm.setData('due_date', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Keterangan (Opsional)</label>
                                        <input type="text" value={debtForm.data.description} onChange={(e) => debtForm.setData('description', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" placeholder="Catatan tambahan..." />
                                    </div>
                                </div>
                                <div className="flex space-x-3 pt-4">
                                    <button type="button" onClick={() => setIsDebtModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors active:scale-95">Batal</button>
                                    <button type="submit" disabled={debtForm.processing} className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-transform disabled:opacity-50">
                                        {editingDebt ? 'Simpan' : 'Tambah'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* RECURRING MODAL (CREATE/EDIT) */}
            {isRecurringModalOpen && mounted && createPortal(
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 animate-fade-in">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity" onClick={() => setIsRecurringModalOpen(false)} />

                    <div className="relative w-full max-w-md glass-card rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-pop-in">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 z-10" />

                        <div className="p-5 pb-0 shrink-0">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {editingRecurring ? 'Edit Jadwal Rutin' : 'Buat Jadwal Rutin Baru'}
                                </h2>
                                <button onClick={() => setIsRecurringModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                    <X weight="bold" className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-5 pt-4 overflow-y-auto scrollbar-hide">
                            <form onSubmit={handleRecurringSubmit} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Jumlah (Estimasi Rp)</label>
                                    <input type="tel" inputMode="numeric" autoComplete="off" value={recurringForm.data.amount} onChange={(e) => recurringForm.setData('amount', formatInputAmount(e.target.value))} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-2xl text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50 text-center" placeholder="0" required />
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Nama Transaksi</label>
                                    <input type="text" value={recurringForm.data.name} onChange={(e) => recurringForm.setData('name', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" placeholder="Contoh: Netflix / Internet" required />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Frekuensi</label>
                                        <select value={recurringForm.data.frequency} onChange={(e) => recurringForm.setData('frequency', e.target.value as any)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50">
                                            <option value="DAILY">Harian</option>
                                            <option value="WEEKLY">Mingguan</option>
                                            <option value="MONTHLY">Bulanan</option>
                                            <option value="YEARLY">Tahunan</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Tipe</label>
                                        <select value={recurringForm.data.type} onChange={(e) => recurringForm.setData('type', e.target.value as any)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50">
                                            <option value="EXPENSE">Pengeluaran</option>
                                            <option value="INCOME">Pemasukan</option>
                                            <option value="TRANSFER">Transfer</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Kategori</label>
                                        <select value={recurringForm.data.category} onChange={(e) => recurringForm.setData('category', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" required>
                                            <option value="">Pilih Kategori</option>
                                            {availableCategories.map(cat => (
                                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">
                                            {recurringForm.data.type === 'INCOME' ? 'Dompet Penerima' : recurringForm.data.type === 'TRANSFER' ? 'Dari Dompet' : 'Sumber Dana'}
                                        </label>
                                        <select value={recurringForm.data.wallet_id} onChange={(e) => recurringForm.setData('wallet_id', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" required>
                                            <option value="">Pilih Dompet</option>
                                            {wallets.map(w => (
                                                <option key={w.id} value={w.id}>{w.name} ({formatIDR(w.balance)})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Mulai Tanggal</label>
                                    <input type="date" value={recurringForm.data.start_date} onChange={(e) => recurringForm.setData('start_date', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" required />
                                </div>

                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" checked={recurringForm.data.auto_cut} onChange={(e) => recurringForm.setData('auto_cut', e.target.checked)} className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500" />
                                        <span className="text-sm text-indigo-900 dark:text-indigo-200 font-bold">
                                            {recurringForm.data.type === 'INCOME' ? 'Otomatis Tambah Saldo?' : recurringForm.data.type === 'TRANSFER' ? 'Otomatis Transfer?' : 'Otomatis Potong Saldo?'}
                                        </span>
                                    </label>
                                    <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-1 ml-6">
                                        {recurringForm.data.type === 'INCOME' 
                                            ? 'Jika aktif, uang otomatis ditambahkan ke dompet saat hari H. Jika tidak, akan muncul notifikasi "Jadwal Penerimaan".' 
                                            : recurringForm.data.type === 'TRANSFER'
                                            ? 'Jika aktif, dana otomatis ditransfer dari dompet sumber saat hari H. Jika tidak, akan muncul notifikasi "Jadwal Transfer".'
                                            : 'Jika aktif, transaksi dipotong otomatis saat hari H. Jika tidak, akan muncul notifikasi "Jatuh Tempo".'}
                                    </p>
                                </div>
                                <div className="mt-6 flex justify-end space-x-3">
                                    {editingRecurring && <button type="button" onClick={handleRecurringDelete} className="mr-auto text-red-500 hover:text-red-700 text-xs font-bold px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">Hapus Jadwal</button>}
                                    <button type="button" onClick={() => setIsRecurringModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors active:scale-95">Batal</button>
                                    <button type="submit" disabled={recurringForm.processing} className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-transform disabled:opacity-50">
                                        {editingRecurring ? 'Simpan' : 'Buat Jadwal'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* PROCESS PAYMENT MODAL */}
            {isProcessModalOpen && mounted && createPortal(
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 animate-fade-in">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity" onClick={() => setIsProcessModalOpen(false)} />
                    <div className="relative w-full max-w-md glass-card rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-pop-in">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-500 to-amber-500 z-10" />

                        <div className="p-5 pb-0 shrink-0">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {selectedProcessRecurring?.type === 'INCOME' ? 'Terima Pemasukan' : 'Bayar Tagihan'}: {selectedProcessRecurring?.name}
                                </h2>
                                <button onClick={() => setIsProcessModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                    <X weight="bold" className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-5 pt-4 overflow-y-auto scrollbar-hide">
                            <form onSubmit={handleProcessSubmit} className="space-y-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400 bg-slate-100 dark:bg-slate-800 p-3 rounded-xl mb-4">Silakan konfirmasi nominal aktual dan dompet pembayaran.</p>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Nominal Aktual (Rp)</label>
                                    <input type="tel" inputMode="numeric" autoComplete="off" value={processForm.data.amount} onChange={(e) => processForm.setData('amount', formatInputAmount(e.target.value))} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-2xl text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50 text-center" required />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">
                                        {selectedProcessRecurring?.type === 'INCOME' ? 'Dompet Penerima' : 'Bayar Menggunakan'}
                                    </label>
                                    <select value={processForm.data.wallet_id} onChange={(e) => processForm.setData('wallet_id', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" required>
                                        <option value="">Pilih Dompet</option>
                                        {wallets.map(w => (<option key={w.id} value={w.id}>{w.name} ({formatIDR(w.balance)})</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">
                                        {selectedProcessRecurring?.type === 'INCOME' ? 'Tanggal Penerimaan' : 'Tanggal Bayar'}
                                    </label>
                                    <input type="date" value={processForm.data.date} onChange={(e) => processForm.setData('date', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" required />
                                </div>
                                <div className="flex space-x-3 pt-4">
                                    <button type="button" onClick={() => setIsProcessModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors active:scale-95">Batal</button>
                                    <button type="submit" disabled={processForm.processing} className={`flex-1 py-3 text-white rounded-2xl text-sm font-bold shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 ${selectedProcessRecurring?.type === 'INCOME' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-500/30' : 'bg-gradient-to-r from-orange-600 to-amber-600 shadow-orange-500/30'}`}>
                                        {selectedProcessRecurring?.type === 'INCOME' ? 'Konfirmasi Pemasukan' : 'Konfirmasi Pembayaran'}
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

DebtsIndex.layout = (page: any) => (
    <AppLayout header={
        <div className="flex flex-col min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-white tracking-tight truncate">Jadwal & Tagihan</h1>
                <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">Kelola langganan rutin, hutang, dan piutang Anda</p>
        </div>
    }>
        {page}
    </AppLayout>
);
