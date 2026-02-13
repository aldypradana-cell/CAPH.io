import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useState } from 'react';
import { Plus, X, Target, AlertTriangle, Trash2, Edit2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface Budget {
    id: number;
    category: string;
    limit: number;
    period: string;
    frequency: string;
    spent: number;
    remaining: number;
    percentage: number;
}

const formatIDR = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

interface Category {
    id: number;
    name: string;
    type: string;
}

export default function BudgetsIndex({ auth, budgets, categories }: PageProps<{ budgets: Budget[], categories: Category[] }>) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

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
        setData({ category: b.category, limit: b.limit.toLocaleString('id-ID'), period: b.period, frequency: b.frequency });
        setIsModalOpen(true);
    };

    const getBudgetColor = (pct: number) => {
        if (pct >= 90) return { bar: 'bg-red-500', text: 'text-red-600 dark:text-red-400', ring: 'ring-red-500/20' };
        if (pct >= 70) return { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-500/20' };
        return { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-500/20' };
    };

    const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
    const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
    const overallPct = totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0;

    return (
        <AppLayout header={
            <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Anggaran</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Pantau dan kelola batas pengeluaran Anda</p>
            </div>
        }>
            <Head title="Anggaran" />
            <Toaster position="top-right" />

            <div className="space-y-6 animate-fade-in-up">
                {/* Overall Summary */}
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
                        <button
                            onClick={() => { setEditingBudget(null); reset(); setIsModalOpen(true); }}
                            className="flex items-center px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl text-sm font-bold hover:shadow-lg hover:shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95 self-start"
                        >
                            <Plus className="w-4 h-4 mr-2" /> Tambah Anggaran
                        </button>
                    </div>
                </div>

                {/* Budget Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {budgets.length > 0 ? budgets.map((b, idx) => {
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

            {/* Delete Modal */}
            {deleteId && (
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
                </div>
            )}

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-6 pb-16 lg:pb-0 animate-fade-in">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative w-full max-w-md glass-card rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-pop-in">
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
                </div>
            )}
        </AppLayout>
    );
}
