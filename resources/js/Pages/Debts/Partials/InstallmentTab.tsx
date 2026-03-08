import { router, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    Plus, X, Home, Car, CreditCard, Smartphone, Package,
    Calendar, Wallet, TrendingDown, AlertTriangle,
    ChevronDown, ChevronUp, Check, Edit2, Trash2, Clock, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

// --- Types ---
interface InstallmentPayment {
    id: number;
    tenor_number: number;
    amount: number;
    paid_at: string;
    wallet_id: number;
    notes?: string | null;
}

interface InstallmentItem {
    id: number;
    name: string;
    type: 'PROPERTY' | 'VEHICLE' | 'LOAN' | 'GADGET' | 'OTHER';
    interest_type: 'FLAT' | 'FLOATING' | 'MIXED' | 'NONE';
    total_amount: number;
    monthly_amount: number;
    total_tenor: number;
    paid_tenor: number;
    interest_rate: number | null;
    fixed_tenor: number | null;
    due_day: number;
    start_date: string;
    lender: string;
    wallet_id: number | null;
    wallet: { id: number; name: string } | null;
    notes: string | null;
    auto_debit: boolean;
    is_completed: boolean;
    remaining_amount: number;
    progress_percentage: number;
    remaining_tenor: number;
    payments: InstallmentPayment[];
}

interface WalletItem {
    id: number;
    name: string;
    balance: number;
}

interface InstallmentSummary {
    totalRemaining: number;
    monthlyDue: number;
    activeCount: number;
    completedCount: number;
}

interface Props {
    installments: { data: InstallmentItem[] };
    wallets: WalletItem[];
    summary: InstallmentSummary;
}

// --- Constants ---
const TYPE_CONFIG: Record<string, { label: string; icon: any; gradient: string; bg: string; badge: string }> = {
    PROPERTY: { label: 'Properti',  icon: Home,       gradient: 'from-blue-500 to-indigo-600',  bg: 'bg-blue-500',  badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    VEHICLE:  { label: 'Kendaraan', icon: Car,        gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    LOAN:     { label: 'Pinjaman',  icon: CreditCard, gradient: 'from-purple-500 to-violet-600', bg: 'bg-purple-500', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    GADGET:   { label: 'Gadget',    icon: Smartphone, gradient: 'from-orange-500 to-amber-600', bg: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    OTHER:    { label: 'Lainnya',   icon: Package,    gradient: 'from-slate-500 to-slate-600',  bg: 'bg-slate-500', badge: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400' },
};

const INTEREST_LABELS: Record<string, string> = {
    FLAT: 'Flat', FLOATING: 'Floating', MIXED: 'Campuran', NONE: 'Tanpa Bunga',
};

// --- Helpers ---
const formatIDR = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
const formatDate = (s: string) => new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

const formatInputAmount = (val: string) => {
    const rawValue = val.replace(/\D/g, '');
    if (!rawValue) return '';
    return parseInt(rawValue).toLocaleString('id-ID');
};
const parseAmount = (val: string) => parseFloat(val.replace(/\./g, '')) || 0;

// --- Progress Ring Component ---
function ProgressRing({ percentage, size = 80, stroke = 6 }: { percentage: number; size?: number; stroke?: number }) {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (percentage / 100) * circ;
    const color = percentage >= 100 ? '#10b981' : percentage >= 50 ? '#6366f1' : '#f59e0b';

    return (
        <svg width={size} height={size} className="transform -rotate-90">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-slate-200 dark:text-slate-700" />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
                strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
            <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
                className="fill-slate-800 dark:fill-white text-xs font-bold" transform={`rotate(90, ${size / 2}, ${size / 2})`}>
                {Math.round(percentage)}%
            </text>
        </svg>
    );
}

// =============================================================================
export default function InstallmentTab({ installments, wallets, summary }: Props) {
    const [mounted, setMounted] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isPayOpen, setIsPayOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InstallmentItem | null>(null);
    const [payingItem, setPayingItem] = useState<InstallmentItem | null>(null);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    useEffect(() => { setMounted(true); }, []);

    // --- Form ---
    const form = useForm({
        name: '', type: 'LOAN', interest_type: 'FLAT',
        total_amount: '', monthly_amount: '', total_tenor: '',
        paid_tenor: '0', interest_rate: '', fixed_tenor: '',
        due_day: '1', start_date: new Date().toISOString().split('T')[0],
        lender: '', wallet_id: '', notes: '', auto_debit: false,
    });

    const payForm = useForm({
        amount: '', wallet_id: '', paid_at: new Date().toISOString().split('T')[0], notes: '',
    });

    // --- Handlers ---
    const openForm = (item?: InstallmentItem) => {
        if (item) {
            setEditingItem(item);
            form.setData({
                name: item.name, type: item.type, interest_type: item.interest_type,
                total_amount: Number(item.total_amount).toLocaleString('id-ID'), monthly_amount: Number(item.monthly_amount).toLocaleString('id-ID'),
                total_tenor: item.total_tenor.toString(), paid_tenor: item.paid_tenor.toString(),
                interest_rate: item.interest_rate?.toString() || '', fixed_tenor: item.fixed_tenor?.toString() || '',
                due_day: item.due_day.toString(), start_date: item.start_date.split('T')[0],
                lender: item.lender, wallet_id: item.wallet_id?.toString() || '',
                notes: item.notes || '', auto_debit: item.auto_debit,
            });
        } else {
            setEditingItem(null);
            form.reset();
            form.setData('start_date', new Date().toISOString().split('T')[0]);
        }
        setIsFormOpen(true);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.transform((data) => ({
            ...data,
            total_amount: parseAmount(data.total_amount as string).toString(),
            monthly_amount: parseAmount(data.monthly_amount as string).toString()
        }));
        if (editingItem) {
            form.put(route('installments.update', editingItem.id), { onSuccess: () => { setIsFormOpen(false); form.reset(); toast.success('Diperbarui!'); } });
        } else {
            form.post(route('installments.store'), { onSuccess: () => { setIsFormOpen(false); form.reset(); toast.success('Ditambahkan!'); } });
        }
    };

    const openPay = (item: InstallmentItem) => {
        setPayingItem(item);
        const isFloatingNow = item.interest_type === 'FLOATING' || (item.interest_type === 'MIXED' && item.fixed_tenor && item.paid_tenor >= item.fixed_tenor);
        payForm.setData({
            amount: isFloatingNow ? '' : Number(item.monthly_amount).toLocaleString('id-ID'),
            wallet_id: item.wallet_id?.toString() || '',
            paid_at: new Date().toISOString().split('T')[0],
            notes: '',
        });
        setIsPayOpen(true);
    };

    const handlePaySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!payingItem) return;
        payForm.transform((data) => ({
            ...data,
            amount: parseAmount(data.amount as string).toString()
        }));
        payForm.post(route('installments.pay', payingItem.id), {
            onSuccess: () => { setIsPayOpen(false); payForm.reset(); toast.success('Angsuran berhasil dibayar!'); },
        });
    };

    const active = installments.data.filter(i => !i.is_completed);
    const completed = installments.data.filter(i => i.is_completed);

    return (
        <div className="animate-fade-in-up space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                    { label: 'Total Sisa Cicilan', value: summary.totalRemaining, color: 'from-red-500 to-rose-600', icon: TrendingDown, sub: `${summary.activeCount} cicilan aktif` },
                    { label: 'Angsuran Bulan Ini', value: summary.monthlyDue, color: 'from-amber-500 to-orange-600', icon: Calendar, sub: `Jatuh tempo bulan ini` },
                ].map((card, idx) => (
                    <div key={idx} className="glass-card p-6 rounded-[2rem] hover:shadow-xl transition-all duration-300 group">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 bg-gradient-to-br ${card.color} text-white rounded-2xl shadow-lg`}>
                                <card.icon className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-white">{formatIDR(card.value)}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{card.sub}</p>
                    </div>
                ))}
            </div>

            {/* Add Button */}
            <div className="flex justify-end">
                <button onClick={() => openForm()} className="flex items-center px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl text-sm font-bold hover:shadow-lg hover:shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95">
                    <Plus className="w-4 h-4 mr-2" /> Tambah Cicilan
                </button>
            </div>

            {/* Active Installments */}
            {active.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {active.map((inst) => {
                        const cfg = TYPE_CONFIG[inst.type] || TYPE_CONFIG.OTHER;
                        const Icon = cfg.icon;
                        const isExpanded = expandedId === inst.id;

                        return (
                            <div key={inst.id} className="glass-card rounded-[2rem] overflow-hidden hover:shadow-xl transition-all duration-300 group">
                                {/* Header gradient accent */}
                                <div className={`h-1.5 bg-gradient-to-r ${cfg.gradient}`} />

                                <div className="p-5">
                                    {/* Top row: icon + name + badges */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br ${cfg.gradient}`}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-slate-800 dark:text-white">{inst.name}</h3>
                                                <p className="text-xs text-slate-400">{inst.lender}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                                            {inst.wallet_id === null && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 flex items-center gap-1">
                                                    <Clock className="w-2.5 h-2.5" /> PayLater
                                                </span>
                                            )}
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${inst.auto_debit ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                                {inst.auto_debit ? 'Auto Debit' : 'Manual'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Progress + Info */}
                                    <div className="flex items-center gap-5 mb-4">
                                        <ProgressRing percentage={inst.progress_percentage} />
                                        <div className="flex-1 space-y-1.5">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-400">Tenor</span>
                                                <span className="font-bold text-slate-700 dark:text-slate-200">{inst.paid_tenor}/{inst.total_tenor} bulan</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-400">Angsuran</span>
                                                <span className="font-bold text-slate-700 dark:text-slate-200">{formatIDR(inst.monthly_amount)}/bln</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-400">Sisa</span>
                                                <span className="font-bold text-red-600 dark:text-red-400">{formatIDR(inst.remaining_amount)}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-400">Jatuh Tempo</span>
                                                <span className="font-bold text-slate-700 dark:text-slate-200">Tgl {inst.due_day} per bulan</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Interest info */}
                                    {inst.interest_rate && (
                                        <div className="text-[10px] text-slate-400 mb-3 flex items-center gap-2">
                                            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-bold">{INTEREST_LABELS[inst.interest_type]}</span>
                                            <span>{inst.interest_rate}% / tahun</span>
                                            {inst.interest_type === 'MIXED' && inst.fixed_tenor && <span>• {inst.fixed_tenor} bln flat</span>}
                                        </div>
                                    )}

                                    {/* Action buttons */}
                                    <div className="flex gap-2">
                                        <button onClick={() => openPay(inst)} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-1">
                                            <Wallet className="w-3.5 h-3.5" /> Bayar Angsuran
                                        </button>
                                        <button onClick={() => setExpandedId(isExpanded ? null : inst.id)} className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </button>
                                        <button onClick={() => openForm(inst)} className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => setDeleteId(inst.id)} className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-red-50 hover:text-red-600 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Expanded: Payment Timeline */}
                                    {isExpanded && (
                                        <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 animate-fade-in-up">
                                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Riwayat Pembayaran</h4>
                                            <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-hide">
                                                {Array.from({ length: inst.total_tenor }, (_, i) => i + 1).map(tenor => {
                                                    const payment = inst.payments.find(p => p.tenor_number === tenor);
                                                    const isCurrent = tenor === inst.paid_tenor + 1;
                                                    const isPaid = !!payment;
                                                    const isFuture = tenor > inst.paid_tenor + 1;

                                                    return (
                                                        <div key={tenor} className={`flex items-center gap-3 p-2 rounded-xl text-xs transition-all ${isCurrent ? 'bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-200 dark:ring-indigo-800' : isPaid ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : 'opacity-40'}`}>
                                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${isPaid ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-indigo-500 text-white animate-pulse' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                                                                {isPaid ? <Check className="w-3.5 h-3.5" /> : <span className="text-[10px] font-bold">{tenor}</span>}
                                                            </div>
                                                            <div className="flex-1">
                                                                <span className="font-bold text-slate-700 dark:text-slate-200">Angsuran ke-{tenor}</span>
                                                                {isPaid && <span className="text-slate-400 ml-2">• {formatDate(payment.paid_at)}</span>}
                                                                {isCurrent && !isPaid && <span className="text-indigo-600 dark:text-indigo-400 ml-2 font-bold">← Bayar sekarang</span>}
                                                            </div>
                                                            {isPaid && <span className="font-bold text-emerald-600">{formatIDR(payment.amount)}</span>}
                                                            {isFuture && <span className="font-bold text-slate-300">—</span>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="glass-card rounded-[2rem] p-16 text-center">
                    <CreditCard className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                    <p className="text-lg font-bold text-slate-400">Belum ada cicilan</p>
                    <p className="text-xs text-slate-400 mt-1">Klik "Tambah Cicilan" untuk mulai tracking.</p>
                </div>
            )}

            {/* Completed section */}
            {completed.length > 0 && (
                <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" /> Cicilan Lunas ({completed.length})
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {completed.map(inst => {
                            const cfg = TYPE_CONFIG[inst.type] || TYPE_CONFIG.OTHER;
                            const Icon = cfg.icon;
                            return (
                                <div key={inst.id} className="glass-card rounded-2xl p-4 flex items-center justify-between opacity-60 hover:opacity-100 transition-opacity">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${cfg.bg}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 dark:text-white line-through">{inst.name}</p>
                                            <p className="text-[10px] text-slate-400">{inst.lender} • {inst.total_tenor} bulan</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-emerald-600">{formatIDR(inst.total_amount)}</span>
                                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">Lunas ✓</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ============ MODALS ============ */}

            {/* DELETE MODAL */}
            {deleteId && mounted && createPortal(
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-fade-in">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
                    <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-2xl animate-pop-in border border-slate-100 dark:border-slate-800">
                        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 mb-4 mx-auto"><AlertTriangle className="w-7 h-7" /></div>
                        <h3 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-2">Hapus cicilan ini?</h3>
                        <p className="text-xs text-center text-slate-400 mb-6">Semua riwayat pembayaran juga akan dihapus.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300">Batal</button>
                            <button onClick={() => { router.delete(route('installments.destroy', deleteId), { onSuccess: () => toast.success('Dihapus!') }); setDeleteId(null); }} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 shadow-lg shadow-red-500/30">Ya, Hapus</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* PAY MODAL */}
            {isPayOpen && payingItem && mounted && createPortal(
                <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-6 pb-16 lg:pb-0 animate-fade-in">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsPayOpen(false)} />
                    <div className="relative w-full max-w-md glass-card rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-pop-in">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-10" />
                        <div className="p-5 pb-0 shrink-0 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Bayar Angsuran</h3>
                                <p className="text-xs text-slate-400">{payingItem.name} — ke-{payingItem.paid_tenor + 1}/{payingItem.total_tenor}</p>
                            </div>
                            <button onClick={() => setIsPayOpen(false)} className="text-slate-400 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-5 pt-4 overflow-y-auto scrollbar-hide">
                            <form onSubmit={handlePaySubmit} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Nominal (Rp)</label>
                                    <input type="text" inputMode="numeric" value={payForm.data.amount} onChange={e => payForm.setData('amount', formatInputAmount(e.target.value))}
                                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-2xl text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50 text-center" placeholder="0" required />
                                    {payForm.data.amount === '' && <p className="text-[9px] text-amber-500 mt-1 ml-1">Angsuran floating — masukkan nominal sesuai tagihan</p>}
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Dompet</label>
                                    <select value={payForm.data.wallet_id} onChange={e => payForm.setData('wallet_id', e.target.value)}
                                        className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" required>
                                        <option value="">Pilih Dompet</option>
                                        {wallets.map(w => <option key={w.id} value={w.id}>{w.name} ({formatIDR(w.balance)})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Tanggal Bayar</label>
                                    <input type="date" value={payForm.data.paid_at} onChange={e => payForm.setData('paid_at', e.target.value)}
                                        className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" required />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Catatan (Opsional)</label>
                                    <input type="text" value={payForm.data.notes} onChange={e => payForm.setData('notes', e.target.value)}
                                        className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" placeholder="via m-banking..." />
                                </div>
                                <div className="flex space-x-3 pt-4">
                                    <button type="button" onClick={() => setIsPayOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors active:scale-95">Batal</button>
                                    <button type="submit" disabled={payForm.processing} className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-transform disabled:opacity-50">
                                        {payForm.processing ? '...' : 'Konfirmasi Bayar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ADD/EDIT FORM MODAL */}
            {isFormOpen && mounted && createPortal(
                <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-6 pb-16 lg:pb-0 animate-fade-in">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />
                    <div className="relative w-full max-w-lg glass-card rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-pop-in">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-10" />
                        <div className="p-5 pb-0 shrink-0 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{editingItem ? 'Edit Cicilan' : 'Tambah Cicilan Baru'}</h3>
                            <button onClick={() => setIsFormOpen(false)} className="text-slate-400 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-5 pt-4 overflow-y-auto scrollbar-hide">
                            <form onSubmit={handleFormSubmit} className="space-y-4">
                                {/* Name */}
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Nama Cicilan</label>
                                    <input type="text" value={form.data.name} onChange={e => form.setData('name', e.target.value)} required
                                        className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" placeholder="KPR Rumah Serpong" />
                                </div>

                                {/* Type buttons */}
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Tipe</label>
                                    <div className="grid grid-cols-5 gap-1.5">
                                        {Object.entries(TYPE_CONFIG).map(([key, { label, icon: Ic, badge }]) => (
                                            <button key={key} type="button" onClick={() => form.setData('type', key)}
                                                className={`py-2 rounded-xl text-[10px] font-bold transition-all border flex flex-col items-center gap-1 ${form.data.type === key ? `${badge} border-transparent shadow-sm scale-105` : 'border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                                                <Ic className="w-4 h-4" /> {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Amount fields */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Total Pinjaman (Rp)</label>
                                        <input type="text" inputMode="numeric" value={form.data.total_amount} onChange={e => form.setData('total_amount', formatInputAmount(e.target.value))} required
                                            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" placeholder="150.000.000" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Angsuran / Bulan (Rp)</label>
                                        <input type="text" inputMode="numeric" value={form.data.monthly_amount} onChange={e => form.setData('monthly_amount', formatInputAmount(e.target.value))} required
                                            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" placeholder="2.500.000" />
                                    </div>
                                </div>

                                {/* Tenor fields */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Total Tenor (bln)</label>
                                        <input type="number" value={form.data.total_tenor} onChange={e => form.setData('total_tenor', e.target.value)} required min="1"
                                            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" placeholder="60" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Sudah Bayar (bln)</label>
                                        <input type="number" value={form.data.paid_tenor} onChange={e => form.setData('paid_tenor', e.target.value)} min="0"
                                            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" placeholder="0" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Tgl Jatuh Tempo</label>
                                        <input type="number" value={form.data.due_day} onChange={e => form.setData('due_day', e.target.value)} required min="1" max="31"
                                            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" placeholder="15" />
                                    </div>
                                </div>

                                {/* Interest */}
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Skema Bunga</label>
                                    <div className="grid grid-cols-4 gap-1.5">
                                        {Object.entries(INTEREST_LABELS).map(([key, label]) => (
                                            <button key={key} type="button" onClick={() => form.setData('interest_type', key)}
                                                className={`py-2 rounded-xl text-[10px] font-bold transition-all border ${form.data.interest_type === key ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-transparent shadow-sm' : 'border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {form.data.interest_type !== 'NONE' && (
                                    <div className={`grid gap-3 ${form.data.interest_type === 'MIXED' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Bunga (% / tahun)</label>
                                            <input type="number" step="0.01" value={form.data.interest_rate} onChange={e => form.setData('interest_rate', e.target.value)}
                                                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" placeholder="5.5" />
                                        </div>
                                        {form.data.interest_type === 'MIXED' && (
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Flat berapa bulan?</label>
                                                <input type="number" value={form.data.fixed_tenor} onChange={e => form.setData('fixed_tenor', e.target.value)}
                                                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" placeholder="36" />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Lender + Wallet + Start */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Pemberi Pinjaman</label>
                                        <input type="text" value={form.data.lender} onChange={e => form.setData('lender', e.target.value)} required
                                            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" placeholder="Bank BCA" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Dompet Pembayaran</label>
                                        <select value={form.data.wallet_id} onChange={e => form.setData('wallet_id', e.target.value)}
                                            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50">
                                            <option value="">Pilih (opsional)</option>
                                            {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Tanggal Mulai Cicilan</label>
                                    <input type="date" value={form.data.start_date} onChange={e => form.setData('start_date', e.target.value)} required
                                        className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" />
                                </div>

                                {/* Auto debit */}
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" checked={form.data.auto_debit} onChange={e => form.setData('auto_debit', e.target.checked)}
                                            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500" />
                                        <span className="text-sm text-indigo-900 dark:text-indigo-200 font-bold">Otomatis Potong Saldo?</span>
                                    </label>
                                    <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-1 ml-6">Jika aktif, angsuran dipotong otomatis setiap tanggal jatuh tempo.</p>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Catatan (Opsional)</label>
                                    <input type="text" value={form.data.notes} onChange={e => form.setData('notes', e.target.value)}
                                        className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" placeholder="Catatan tambahan..." />
                                </div>

                                <div className="flex space-x-3 pt-4">
                                    <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors active:scale-95">Batal</button>
                                    <button type="submit" disabled={form.processing} className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-transform disabled:opacity-50">
                                        {form.processing ? '...' : (editingItem ? 'Simpan' : 'Tambah')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
