import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, Target, AlertTriangle, Trash2, Edit2, Sparkles, Loader2, Wallet, ShieldCheck, TrendingUp, PiggyBank } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface Budget {
    id: number;
    category: string;
    limit: number;
    period: string;
    frequency: string;
    is_master: boolean;
    spent: number;
    remaining: number;
    percentage: number;
    template_label?: string | null;
}

const formatIDR = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

interface Category {
    id: number;
    name: string;
    type: string;
}

const MASTER_LABELS: Record<string, { label: string; desc: string; icon: any; gradient: string; bgLight: string }> = {
    NEEDS:        { label: 'Kebutuhan',            desc: 'Makan, transportasi, sewa, tagihan wajib',         icon: ShieldCheck, gradient: 'from-blue-500 to-cyan-500',      bgLight: 'bg-blue-50 dark:bg-blue-900/20' },
    WANTS:        { label: 'Keinginan',            desc: 'Hiburan, gaya hidup, hobi, langganan',              icon: TrendingUp,  gradient: 'from-orange-500 to-amber-500',    bgLight: 'bg-orange-50 dark:bg-orange-900/20' },
    SAVINGS:      { label: 'Tabungan & Investasi', desc: 'Dana darurat, tabungan, investasi masa depan',      icon: PiggyBank,   gradient: 'from-emerald-500 to-teal-500',    bgLight: 'bg-emerald-50 dark:bg-emerald-900/20' },
    DEBT:         { label: 'Cicilan & Utang',      desc: 'KPR, kredit motor, pinjaman bank',                  icon: Wallet,      gradient: 'from-red-500 to-rose-500',        bgLight: 'bg-red-50 dark:bg-red-900/20' },
    SOCIAL:       { label: 'Sosial & Kebaikan',    desc: 'Sedekah, zakat, donasi',                            icon: Wallet,      gradient: 'from-purple-500 to-violet-500',   bgLight: 'bg-purple-50 dark:bg-purple-900/20' },
    LIVING:       { label: 'Biaya Hidup',          desc: 'Kebutuhan pokok + keinginan sehari-hari',           icon: ShieldCheck, gradient: 'from-blue-500 to-indigo-500',     bgLight: 'bg-blue-50 dark:bg-blue-900/20' },
    SAVINGS_PLUS: { label: 'Tabungan & Kewajiban', desc: 'Tabungan, cicilan, dan sosial digabung',            icon: PiggyBank,   gradient: 'from-emerald-500 to-cyan-500',    bgLight: 'bg-emerald-50 dark:bg-emerald-900/20' },
    OBLIGATIONS:  { label: 'Kewajiban & Sosial',   desc: 'Cicilan utang + sedekah & donasi',                  icon: Wallet,      gradient: 'from-purple-500 to-pink-500',     bgLight: 'bg-purple-50 dark:bg-purple-900/20' },
};

const TEMPLATE_OPTIONS = [
    {
        key: '50-30-20',
        title: '50 / 30 / 20',
        desc: 'Kebutuhan 50%, Keinginan 30%, Tabungan & Kewajiban 20%',
        cocokUntuk: 'Pemula atau gaji menengah yang ingin aturan simpel',
        splits: { NEEDS: 50, WANTS: 30, SAVINGS_PLUS: 20 },
        categoryLabels: {} as Record<string, string>,
    },
    {
        key: '40-30-20-10',
        title: '40 / 30 / 20 / 10',
        desc: 'Kebutuhan 40%, Cicilan 30%, Tabungan 20%, Sosial 10%',
        cocokUntuk: 'Yang punya cicilan aktif atau rutin berzakat & berdonasi',
        splits: { NEEDS: 40, DEBT: 30, SAVINGS: 20, SOCIAL: 10 },
        categoryLabels: { DEBT: 'Cicilan & Kewajiban', SOCIAL: 'Sosial & Kebaikan' } as Record<string, string>,
    },
    {
        key: '70-20-10',
        title: '70 / 20 / 10',
        desc: 'Biaya Hidup 70%, Tabungan 20%, Kewajiban & Sosial 10%',
        cocokUntuk: 'Yang ingin fleksibel di pengeluaran sehari-hari',
        splits: { LIVING: 70, SAVINGS: 20, OBLIGATIONS: 10 },
        categoryLabels: { LIVING: 'Biaya Hidup', OBLIGATIONS: 'Kewajiban & Sosial' } as Record<string, string>,
    },
];

export default function BudgetsIndex({ auth, budgets, categories, activeTemplate }: PageProps<{ budgets: Budget[], categories: Category[], activeTemplate: string | null }>) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);
    const [isAutoOpen, setIsAutoOpen] = useState(false);
    const [autoStep, setAutoStep] = useState<1 | 2>(1);
    const [selectedTemplate, setSelectedTemplate] = useState('50-30-20');
    const [autoIncome, setAutoIncome] = useState('');
    const [autoLoading, setAutoLoading] = useState(false);
    const [fetchingIncome, setFetchingIncome] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const { data, setData, post, put, processing, reset } = useForm({
        category: '',
        limit: '',
        period: 'MONTHLY',
        frequency: 'MONTHLY',
    });

    const handleAmountChange = (val: string) => {
        const rawValue = val.replace(/\D/g, '');
        if (!rawValue) { setData('limit', ''); return; }
        setData('limit', parseInt(rawValue).toLocaleString('id-ID'));
    };

    const parseAmount = (val: string) => parseFloat(val.replace(/\./g, '')) || 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { ...data, limit: parseAmount(data.limit).toString() };
        if (editingBudget) {
            router.put(route('budgets.update', editingBudget.id), payload, {
                onSuccess: () => { setIsModalOpen(false); reset(); setEditingBudget(null); toast.success('Anggaran diperbarui!'); }
            });
        } else {
            router.post(route('budgets.store'), payload, {
                onSuccess: () => { setIsModalOpen(false); reset(); toast.success('Anggaran ditambahkan!'); }
            });
        }
    };

    const handleEdit = (b: Budget) => {
        setEditingBudget(b);
        setData({ category: b.category, limit: Number(b.limit).toLocaleString('id-ID'), period: b.period, frequency: b.frequency });
        setIsModalOpen(true);
    };

    const getBudgetColor = (pct: number) => {
        if (pct >= 90) return { bar: 'bg-red-500', text: 'text-red-600 dark:text-red-400', ring: 'ring-red-500/20' };
        if (pct >= 70) return { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-500/20' };
        return { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-500/20' };
    };

    // Separate master and regular budgets
    const masterBudgets = budgets.filter(b => b.is_master);
    const regularBudgets = budgets.filter(b => !b.is_master);

    const totalBudget = regularBudgets.reduce((s, b) => s + Number(b.limit), 0);
    const totalSpent = regularBudgets.reduce((s, b) => s + Number(b.spent), 0);
    const overallPct = totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0;

    // Auto Budget handlers
    const handleAutoIncomeChange = (val: string) => {
        const raw = val.replace(/\D/g, '');
        if (!raw) { setAutoIncome(''); return; }
        setAutoIncome(parseInt(raw).toLocaleString('id-ID'));
    };

    const fetchLastMonthIncome = async () => {
        setFetchingIncome(true);
        try {
            const res = await fetch(route('budgets.last-month-income'));
            const data = await res.json();
            if (data.income > 0) {
                setAutoIncome(Math.round(data.income).toLocaleString('id-ID'));
                toast.success('Pemasukan bulan lalu ditemukan!');
            } else {
                toast.error('Tidak ada data pemasukan bulan lalu.');
            }
        } catch {
            toast.error('Gagal mengambil data.');
        } finally {
            setFetchingIncome(false);
        }
    };

    const submitAutoBudget = () => {
        const income = parseFloat(autoIncome.replace(/\./g, '')) || 0;
        if (income <= 0) { toast.error('Masukkan nominal pemasukan!'); return; }
        setAutoLoading(true);
        router.post(route('budgets.auto-generate'), { income, template: selectedTemplate }, {
            onSuccess: () => {
                setIsAutoOpen(false);
                setAutoStep(1);
                setAutoIncome('');
                setAutoLoading(false);
                toast.success('Auto-Budget berhasil diterapkan!');
            },
            onError: () => {
                setAutoLoading(false);
                toast.error('Gagal menerapkan Auto-Budget.');
            },
        });
    };

    const selectedTemplateSplits = TEMPLATE_OPTIONS.find(t => t.key === selectedTemplate)?.splits || {};

    return (
        <>
            <Head title="Anggaran" />
            <Toaster position="top-right" />

            <div className="space-y-6 animate-fade-in-up">

                {/* ═══════════════ Master Budget Section ═══════════════ */}
                {masterBudgets.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-500" />
                            <h2 className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Auto-Budget</h2>
                            {activeTemplate && (
                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-0.5 rounded-full">Aturan {activeTemplate}</span>
                            )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {masterBudgets.map((mb, idx) => {
                                const meta = MASTER_LABELS[mb.category];
                                if (!meta) return null;
                                const Icon = meta.icon;
                                const pct = mb.percentage;
                                const barColor = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : `bg-gradient-to-r ${meta.gradient}`;
                                return (
                                    <div key={mb.id} className={`glass-card rounded-[2rem] p-5 relative overflow-hidden group animate-pop-in`} style={{ animationDelay: `${idx * 80}ms` }}>
                                        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${meta.gradient}`} />
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${meta.gradient} text-white shadow-md`}>
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-800 dark:text-white text-sm">{mb.template_label || meta.label}</h3>
                                                    <p className="text-[10px] text-slate-400">Bulanan</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => setDeleteId(mb.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-baseline">
                                                <span className={`text-2xl font-bold ${pct >= 90 ? 'text-red-600 dark:text-red-400' : pct >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-white'}`}>
                                                    {pct}%
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-semibold">{formatIDR(mb.spent)} / {formatIDR(mb.limit)}</span>
                                            </div>
                                            <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div className={`h-full ${barColor} rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }} />
                                            </div>
                                            <p className="text-xs text-slate-400">Sisa: {formatIDR(mb.remaining)}</p>
                                        </div>
                                        {pct >= 90 && (
                                            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2.5 py-1.5 rounded-xl">
                                                <AlertTriangle className="w-3 h-3" /> Hampir melebihi batas!
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ═══════════════ Overall Summary (Regular Budgets) ═══════════════ */}
                <div className="glass-card p-8 rounded-[2rem] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ringkasan Anggaran</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-slate-800 dark:text-white">{formatIDR(totalSpent)}</span>
                                <span className="text-sm text-slate-400">/ {formatIDR(totalBudget)}</span>
                            </div>
                            <div className="w-full max-w-sm mt-3">
                                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className={`h-full ${overallPct >= 90 ? 'bg-red-500' : overallPct >= 70 ? 'bg-amber-500' : 'bg-indigo-500'} rounded-full transition-all duration-1000`} style={{ width: `${overallPct}%` }} />
                                </div>
                                <p className="text-xs text-slate-400 mt-1">{overallPct}% terpakai bulan ini</p>
                            </div>
                        </div>
                        <div className="flex gap-3 self-start">
                            <button
                                onClick={() => { setIsAutoOpen(true); setAutoStep(1); }}
                                className="flex items-center px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl text-sm font-bold hover:shadow-lg hover:shadow-orange-500/30 transition-all hover:scale-105 active:scale-95"
                            >
                                <Sparkles className="w-4 h-4 mr-2" /> Auto Budget
                            </button>
                            <button
                                onClick={() => { setEditingBudget(null); reset(); setIsModalOpen(true); }}
                                className="flex items-center px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl text-sm font-bold hover:shadow-lg hover:shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95"
                            >
                                <Plus className="w-4 h-4 mr-2" /> Tambah Anggaran
                            </button>
                        </div>
                    </div>
                </div>

                {/* ═══════════════ Regular Budget Cards ═══════════════ */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {regularBudgets.length > 0 ? regularBudgets.map((b, idx) => {
                        const colors = getBudgetColor(b.percentage);
                        return (
                            <div key={b.id} className={`glass-card p-5 rounded-[2rem] hover:shadow-lg transition-all duration-300 group animate-pop-in`} style={{ animationDelay: `${idx * 80}ms` }}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.bar} text-white shadow-sm`}>
                                            <Target className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 dark:text-white text-sm">{b.category}</h3>
                                            <p className="text-[10px] text-slate-400 capitalize">{b.period?.toLowerCase()}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(b)} className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => setDeleteId(b.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className={`text-2xl font-bold ${colors.text}`}>{b.percentage}%</span>
                                        <span className="text-xs text-slate-400">{formatIDR(b.spent)} / {formatIDR(b.limit)}</span>
                                    </div>
                                    <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className={`h-full ${colors.bar} rounded-full transition-all duration-1000`} style={{ width: `${b.percentage}%` }} />
                                    </div>
                                    <p className="text-xs text-slate-400">Sisa: {formatIDR(b.remaining)}</p>
                                </div>
                                {b.percentage >= 90 && (
                                    <div className="mt-3 flex items-center gap-1.5 text-[10px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2.5 py-1.5 rounded-xl">
                                        <AlertTriangle className="w-3 h-3" /> Hampir melebihi batas!
                                    </div>
                                )}
                            </div>
                        );
                    }) : (
                        <div className="col-span-full glass-card rounded-[2rem] p-16 text-center">
                            <Target className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                            <p className="text-lg font-bold text-slate-400">Belum ada anggaran</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ═══════════════ Delete Modal ═══════════════ */}
            {deleteId && mounted && createPortal(
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-fade-in">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
                    <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-2xl animate-pop-in border border-slate-100 dark:border-slate-800">
                        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 mb-4 mx-auto"><AlertTriangle className="w-7 h-7" /></div>
                        <h3 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-2">Hapus Anggaran?</h3>
                        <p className="text-sm text-center text-slate-500 mb-6 px-4">Tindakan ini tidak dapat dibatalkan.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 transition-colors">Batal</button>
                            <button onClick={() => {
                                router.delete(route('budgets.destroy', deleteId), {
                                    preserveState: true,
                                    preserveScroll: true,
                                    onSuccess: () => {
                                        setDeleteId(null);
                                        toast.success('Dihapus!');
                                    }
                                });
                            }} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 shadow-lg shadow-red-500/30 transition-colors">Ya, Hapus</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ═══════════════ Add/Edit Budget Modal ═══════════════ */}
            {isModalOpen && mounted && createPortal(
                <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-6 pb-16 lg:pb-0 animate-fade-in">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative w-full max-w-md glass-card rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-pop-in">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-10" />
                        <div className="p-5 pb-0 shrink-0 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{editingBudget ? 'Edit Anggaran' : 'Anggaran Baru'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-5 pt-4 overflow-y-auto scrollbar-hide">
                            <form onSubmit={handleSubmit} className="space-y-3">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Kategori</label>
                                    <select
                                        value={data.category}
                                        onChange={(e) => setData('category', e.target.value)}
                                        className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50"
                                        required
                                    >
                                        <option value="">Pilih Kategori</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Batas (Rp)</label>
                                        <input type="text" required value={data.limit} onChange={(e) => handleAmountChange(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" placeholder="0" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Periode</label>
                                        <select value={data.period} onChange={(e) => setData('period', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm bg-slate-50 dark:bg-slate-900/50 outline-none font-medium text-slate-900 dark:text-white">
                                            <option value="MONTHLY">Bulanan</option>
                                            <option value="WEEKLY">Mingguan</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex space-x-3 pt-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors active:scale-95">Batal</button>
                                    <button type="submit" disabled={processing} className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-transform disabled:opacity-50">{processing ? 'Menyimpan...' : 'Simpan'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ═══════════════ Auto Budget Modal ═══════════════ */}
            {isAutoOpen && mounted && createPortal(
                <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-6 pb-16 lg:pb-0 animate-fade-in">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => { setIsAutoOpen(false); setAutoStep(1); }} />
                    <div className="relative w-full max-w-lg glass-card rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-pop-in">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 z-10" />
                        <div className="p-5 pb-0 shrink-0 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-amber-500" />
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Auto Budget</h3>
                            </div>
                            <button onClick={() => { setIsAutoOpen(false); setAutoStep(1); }} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-5 pt-4 overflow-y-auto scrollbar-hide">
                            {autoStep === 1 && (
                                <div className="space-y-4">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Pilih aturan pembagian budget yang sesuai dengan gaya hidup Anda:</p>
                                    <div className="space-y-3">
                                        {TEMPLATE_OPTIONS.map(opt => (
                                            <button
                                                key={opt.key}
                                                type="button"
                                                onClick={() => setSelectedTemplate(opt.key)}
                                                className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${selectedTemplate === opt.key
                                                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 shadow-md shadow-amber-500/10'
                                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-bold text-slate-800 dark:text-white">{opt.title}</h4>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{opt.desc}</p>
                                                    </div>
                                                    <div className={`w-5 h-5 rounded-full border-2 flex shrink-0 items-center justify-center ${selectedTemplate === opt.key ? 'border-amber-500 bg-amber-500' : 'border-slate-300 dark:border-slate-600'}`}>
                                                        {selectedTemplate === opt.key && <div className="w-2 h-2 bg-white rounded-full" />}
                                                    </div>
                                                </div>

                                                {/* "Cocok untuk siapa?" badge */}
                                                <div className="flex items-center gap-1.5 mt-2">
                                                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">💡 {opt.cocokUntuk}</span>
                                                </div>

                                                {/* Visual percentage bar */}
                                                <div className="flex gap-1 mt-3 h-2 rounded-full overflow-hidden">
                                                    {Object.entries(opt.splits).map(([rule, pct]) => {
                                                        const meta = MASTER_LABELS[rule];
                                                        const displayLabel = opt.categoryLabels[rule] || meta?.label || rule;
                                                        return (
                                                            <div key={rule} className={`bg-gradient-to-r ${meta?.gradient || 'from-slate-400 to-slate-500'} rounded-full`} style={{ width: `${pct}%` }} title={`${displayLabel}: ${pct}%`} />
                                                        );
                                                    })}
                                                </div>

                                                {/* Category chips */}
                                                <div className="flex flex-wrap gap-1.5 mt-2.5">
                                                    {Object.entries(opt.splits).map(([rule, pct]) => {
                                                        const meta = MASTER_LABELS[rule];
                                                        const displayLabel = opt.categoryLabels[rule] || meta?.label || rule;
                                                        return (
                                                            <span key={rule} className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta?.bgLight || 'bg-slate-100 dark:bg-slate-800'} text-slate-600 dark:text-slate-300`}>
                                                                <span>{displayLabel}</span>
                                                                <span className="opacity-60">{pct}%</span>
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setAutoStep(2)}
                                        className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-orange-500/30 hover:scale-105 active:scale-95 transition-transform mt-2"
                                    >
                                        Lanjut →
                                    </button>
                                </div>
                            )}

                            {autoStep === 2 && (
                                <div className="space-y-4">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Masukkan total pemasukan bulanan Anda:</p>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Pemasukan (Rp)</label>
                                        <input
                                            type="text"
                                            value={autoIncome}
                                            onChange={(e) => handleAutoIncomeChange(e.target.value)}
                                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-lg focus:ring-2 focus:ring-amber-500 outline-none font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50"
                                            placeholder="10.000.000"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={fetchLastMonthIncome}
                                        disabled={fetchingIncome}
                                        className="w-full py-2.5 text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-2xl hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {fetchingIncome ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                                        {fetchingIncome ? 'Mengambil data...' : 'Pakai Pemasukan Bulan Lalu'}
                                    </button>

                                    {/* Preview */}
                                    {autoIncome && (() => {
                                        const activeTemplate = TEMPLATE_OPTIONS.find(t => t.key === selectedTemplate);
                                        return (
                                            <div className="glass-card rounded-2xl p-4 space-y-3">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preview Alokasi</p>
                                                {Object.entries(selectedTemplateSplits).map(([rule, pct]) => {
                                                    const meta = MASTER_LABELS[rule];
                                                    const Icon = meta?.icon;
                                                    const income = parseFloat(autoIncome.replace(/\./g, '')) || 0;
                                                    const amount = Math.round(income * (pct as number) / 100);
                                                    const displayLabel = activeTemplate?.categoryLabels?.[rule] || meta?.label || rule;
                                                    return (
                                                        <div key={rule} className="flex items-center gap-3">
                                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br ${meta?.gradient} text-white shadow-sm shrink-0`}>
                                                                {Icon && <Icon className="w-4 h-4" />}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-baseline justify-between gap-2">
                                                                    <span className="text-sm font-bold text-slate-800 dark:text-white truncate">{displayLabel} <span className="text-xs font-normal text-slate-400">({pct as number}%)</span></span>
                                                                    <span className="text-sm font-bold text-slate-800 dark:text-white shrink-0">{formatIDR(amount)}</span>
                                                                </div>
                                                                <p className="text-[10px] text-slate-400 truncate mt-0.5">{meta?.desc}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()}

                                    <div className="flex gap-3 pt-2">
                                        <button type="button" onClick={() => setAutoStep(1)} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors active:scale-95">← Kembali</button>
                                        <button
                                            type="button"
                                            onClick={submitAutoBudget}
                                            disabled={autoLoading || !autoIncome}
                                            className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-orange-500/30 hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {autoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                            {autoLoading ? 'Menerapkan...' : 'Terapkan'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

BudgetsIndex.layout = (page: any) => (
    <AppLayout header={
        <div className="flex flex-col min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-white tracking-tight truncate">Anggaran</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">Pantau dan kelola batas pengeluaran Anda</p>
        </div>
    }>
        {page}
    </AppLayout>
);
