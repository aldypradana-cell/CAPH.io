import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    Plus, X, Tags, Trash2, Edit2, AlertTriangle, Eye, EyeOff
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface Category {
    id: number;
    name: string;
    type: string;
    is_default: boolean;
    is_hidden: boolean;
    budget_rule: string | null;
}

const BUDGET_RULE_LABELS: Record<string, { label: string; desc: string; color: string; dot: string }> = {
    NEEDS:   { label: 'Kebutuhan',          desc: 'Makan, tagihan, transport', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',       dot: 'bg-blue-500' },
    WANTS:   { label: 'Keinginan',          desc: 'Hiburan, gaya hidup',       color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', dot: 'bg-orange-500' },
    SAVINGS: { label: 'Tabungan & Inv.',    desc: 'Tabungan, investasi',       color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', dot: 'bg-emerald-500' },
    DEBT:    { label: 'Cicilan & Utang',    desc: 'KPR, kredit, pinjaman',     color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',           dot: 'bg-red-500' },
    SOCIAL:  { label: 'Sosial',             desc: 'Sedekah, zakat, donasi',    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', dot: 'bg-purple-500' },
};


export default function CategoriesIndex({ auth, categories }: PageProps<{ categories: Category[] }>) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const { data, setData, post, put, processing, reset } = useForm({
        name: '',
        type: 'EXPENSE',
        budget_rule: '' as string,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCategory) {
            put(route('categories.update', editingCategory.id), {
                onSuccess: () => { setIsModalOpen(false); reset(); setEditingCategory(null); toast.success('Diperbarui!'); }
            });
        } else {
            post(route('categories.store'), {
                onSuccess: () => { setIsModalOpen(false); reset(); toast.success('Ditambahkan!'); }
            });
        }
    };

    const handleEdit = (c: Category) => {
        setEditingCategory(c);
        setData({ name: c.name, type: c.type, budget_rule: c.budget_rule || '' });
        setIsModalOpen(true);
    };

    const handleToggleHide = (c: Category) => {
        router.patch(route('categories.toggle-hide', c.id), {}, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const filtered = categories.filter(c => activeTab === 'ALL' || c.type === activeTab);

    return (
        <>
            <Head title="Kategori" />
            <Toaster position="top-right" />

            <div className="space-y-6 animate-fade-in-up">
                {/* Tab Filter & Add Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex p-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
                        {(['ALL', 'INCOME', 'EXPENSE'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === tab
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                    }`}
                            >
                                {tab === 'ALL' ? 'Semua' : tab === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => { setEditingCategory(null); reset(); setIsModalOpen(true); }} className="flex items-center px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl text-sm font-bold hover:shadow-lg hover:shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95 self-start">
                        <Plus className="w-4 h-4 mr-2" /> Tambah Kategori
                    </button>
                </div>

                {/* Category Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.length > 0 ? filtered.map((c, idx) => (
                        <div key={c.id} className={`glass-card rounded-2xl p-4 flex items-center justify-between group hover:shadow-lg transition-all duration-300 animate-pop-in ${c.is_hidden ? 'opacity-60 grayscale-[50%]' : ''}`} style={{ animationDelay: `${idx * 50}ms` }}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.type === 'INCOME' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600' : 'bg-red-100 dark:bg-red-900/40 text-red-600'} shadow-sm ${c.is_hidden ? 'opacity-50' : ''}`}>
                                    <Tags className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800 dark:text-white">{c.name}</p>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.type === 'INCOME' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                            {c.type === 'INCOME' ? 'Masuk' : 'Keluar'}
                                        </span>
                                        {c.is_default && <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">Default</span>}
                                        {c.is_hidden && <span className="text-[10px] font-bold text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full flex items-center gap-1"><EyeOff className="w-3 h-3"/> Disembunyikan</span>}
                                        {c.budget_rule && BUDGET_RULE_LABELS[c.budget_rule] && (
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${BUDGET_RULE_LABELS[c.budget_rule].color}`}>
                                                {BUDGET_RULE_LABELS[c.budget_rule].label}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleToggleHide(c)} title={c.is_hidden ? "Tampilkan Kategori" : "Sembunyikan Kategori"} className={`p-1.5 rounded-lg transition-all ${c.is_hidden ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                    {c.is_hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </button>
                                {!c.is_default && (
                                    <>
                                        <button onClick={() => handleEdit(c)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                                        <button onClick={() => setDeleteId(c.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                                    </>
                                )}
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full glass-card rounded-[2rem] p-16 text-center">
                            <Tags className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                            <p className="text-lg font-bold text-slate-400">Tidak ada kategori</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Modal */}
            {deleteId && mounted && createPortal(
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-fade-in">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
                    <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-2xl animate-pop-in border border-slate-100 dark:border-slate-800">
                        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 mb-4 mx-auto"><AlertTriangle className="w-7 h-7" /></div>
                        <h3 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-6">Hapus kategori ini?</h3>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300">Batal</button>
                            <button onClick={() => { router.delete(route('categories.destroy', deleteId), { onSuccess: () => toast.success('Dihapus!') }); setDeleteId(null); }} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 shadow-lg shadow-red-500/30">Ya, Hapus</button>
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
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-10" />
                        <div className="p-5 pb-0 shrink-0 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{editingCategory ? 'Edit Kategori' : 'Kategori Baru'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-5 pt-4 overflow-y-auto scrollbar-hide">
                            <form onSubmit={handleSubmit} className="space-y-3">
                                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Nama</label><input type="text" required value={data.name} onChange={(e) => setData('name', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" placeholder="Makanan" /></div>
                                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Tipe</label>
                                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                                        {([{ v: 'EXPENSE', l: 'Pengeluaran', c: 'bg-red-500 text-white shadow-lg shadow-red-500/30' }, { v: 'INCOME', l: 'Pemasukan', c: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' }] as const).map(opt => (
                                            <button key={opt.v} type="button" onClick={() => setData('type', opt.v)}
                                                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${data.type === opt.v ? opt.c : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                                            >{opt.l}</button>
                                        ))}
                                    </div>
                                </div>
                                {data.type === 'EXPENSE' && (
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 ml-1">Kelompok Budget</label>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(BUDGET_RULE_LABELS).map(([key, { label, desc, color, dot }]) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => setData('budget_rule', data.budget_rule === key ? '' : key)}
                                                    className={`flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                                                        data.budget_rule === key
                                                            ? `${color} border-transparent shadow-sm scale-105`
                                                            : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500'
                                                    }`}
                                                >
                                                    <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                                                    <span>{label}</span>
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-[9px] text-slate-400 mt-1 ml-1">Opsional — untuk fitur Auto Budget</p>
                                    </div>
                                )}
                                <div className="flex space-x-3 pt-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors active:scale-95">Batal</button>
                                    <button type="submit" disabled={processing} className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-transform disabled:opacity-50">{processing ? '...' : 'Simpan'}</button>
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

CategoriesIndex.layout = (page: any) => (
    <AppLayout header={
        <div className="flex flex-col min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-white tracking-tight truncate">Kategori</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">Kelola kategori transaksi</p>
        </div>
    }>
        {page}
    </AppLayout>
);
