import { router, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    Tag as Tags, Plus, PencilSimple as Edit2, Trash as Trash2,
    TrendUp as TrendingUp, TrendDown as TrendingDown, Database, X
} from '@phosphor-icons/react';

interface Category {
    id: number;
    name: string;
    type: 'INCOME' | 'EXPENSE';
    icon: string;
    color: string;
    budget_rule?: string | null;
}

const BUDGET_RULE_LABELS: Record<string, { label: string; desc: string; color: string; dot: string }> = {
    NEEDS:   { label: 'Kebutuhan',          desc: 'Makan, tagihan, transport', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',       dot: 'bg-blue-500' },
    WANTS:   { label: 'Keinginan',          desc: 'Hiburan, gaya hidup',       color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', dot: 'bg-orange-500' },
    SAVINGS: { label: 'Tabungan & Inv.',    desc: 'Tabungan, investasi',       color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', dot: 'bg-emerald-500' },
    DEBT:    { label: 'Cicilan & Utang',    desc: 'KPR, kredit, pinjaman',     color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',           dot: 'bg-red-500' },
    SOCIAL:  { label: 'Sosial',             desc: 'Sedekah, zakat, donasi',    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', dot: 'bg-purple-500' },
};


export default function MasterTab({ categories }: { categories: Category[] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '',
        type: 'EXPENSE',
        icon: 'Tags',
        color: 'bg-blue-500',
        budget_rule: null as string | null
    });

    const openModal = (category: Category | null = null) => {
        setEditingCategory(category);
        if (category) {
            setData({
                name: category.name,
                type: category.type as any,
                icon: category.icon,
                color: category.color,
                budget_rule: category.budget_rule || null
            });
        } else {
            reset();
            setData('type', 'EXPENSE'); // Default
            setData('budget_rule', null);
        }
        clearErrors();
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
        reset();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCategory) {
            put(route('admin.master.categories.update', editingCategory.id), {
                onSuccess: () => closeModal()
            });
        } else {
            post(route('admin.master.categories.store'), {
                onSuccess: () => closeModal()
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Apakah anda yakin ingin menghapus kategori ini?')) {
            destroy(route('admin.master.categories.destroy', id));
        }
    };

    const handleSeed = () => {
        if (confirm('Generate kategori default sistem?')) {
            router.post(route('admin.master.seed'));
        }
    };

    return (
        <div className="space-y-6">
            {/* Categories Section */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Tags weight="duotone" className="w-5 h-5 text-indigo-500" /> Kategori Global
                    </h2>
                    <div className="flex gap-2">
                        {categories.length === 0 && (
                            <button
                                onClick={handleSeed}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                            >
                                <Database weight="bold" className="w-4 h-4" /> Seed Default
                            </button>
                        )}
                        <button
                            onClick={() => openModal()}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                        >
                            <Plus weight="bold" className="w-4 h-4" /> Tambah Kategori
                        </button>
                    </div>
                </div>

                {categories.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categories.map((cat) => (
                            <div key={cat.id} className="group p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md transition-all bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${cat.color ? cat.color.replace('bg-', 'bg-gradient-to-br from-').replace('-500', '-500 to-').replace('-600', '-600') + ' ' + cat.color : 'bg-slate-500'}`}>
                                        <Tags weight="fill" className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-white">{cat.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${cat.type === 'INCOME' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                                {cat.type}
                                            </p>
                                            {cat.budget_rule && BUDGET_RULE_LABELS[cat.budget_rule] && (
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${BUDGET_RULE_LABELS[cat.budget_rule].color}`}>
                                                    {BUDGET_RULE_LABELS[cat.budget_rule].label}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openModal(cat)}
                                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                    >
                                        <Edit2 weight="duotone" className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(cat.id)}
                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                    >
                                        <Trash2 weight="duotone" className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <Database weight="duotone" className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">Belum ada kategori global.</p>
                        <p className="text-xs text-slate-400">Klik "Seed Default" untuk generate kategori bawaan.</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && mounted && createPortal(
                <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-6 pb-16 lg:pb-0 animate-fade-in">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity" onClick={closeModal} />
                    <div className="relative w-full max-w-md glass-card rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-pop-in">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-10" />
                        <div className="p-5 pb-0 shrink-0 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}</h3>
                            <button type="button" onClick={closeModal} className="text-slate-400 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><X weight="bold" className="w-5 h-5" /></button>
                        </div>
                        <div className="p-5 pt-4 overflow-y-auto scrollbar-hide">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Nama Kategori</label>
                                    <input type="text" required value={data.name} onChange={(e) => setData('name', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" placeholder="Contoh: Makanan, Gaji" />
                                    {errors.name && <p className="text-xs text-red-500 mt-1 ml-1">{errors.name}</p>}
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Tipe</label>
                                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                                        <button type="button" onClick={() => { setData('type', 'INCOME'); setData('budget_rule', null); }} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${data.type === 'INCOME' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
                                            <TrendingUp weight="bold" className="w-3.5 h-3.5" /> Pemasukan
                                        </button>
                                        <button type="button" onClick={() => setData('type', 'EXPENSE')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${data.type === 'EXPENSE' ? 'bg-red-600 text-white shadow-lg shadow-red-500/30' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
                                            <TrendingDown weight="bold" className="w-3.5 h-3.5" /> Pengeluaran
                                        </button>
                                    </div>
                                    {errors.type && <p className="text-xs text-red-500 mt-1 ml-1">{errors.type}</p>}
                                </div>

                                {data.type === 'EXPENSE' && (
                                    <div className="animate-fade-in-up">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 ml-1">Kelompok Budget (Opsional)</label>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(BUDGET_RULE_LABELS).map(([key, { label, desc, color, dot }]) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => setData('budget_rule', data.budget_rule === key ? null : key)}
                                                    className={`flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                                                        data.budget_rule === key
                                                            ? `${color} border-transparent shadow-sm scale-105`
                                                            : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500'
                                                    }`}
                                                    title={desc}
                                                >
                                                    <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                                                    <span>{label}</span>
                                                </button>
                                            ))}
                                        </div>
                                        {errors.budget_rule && <p className="text-xs text-red-500 mt-1 ml-1">{errors.budget_rule}</p>}
                                    </div>
                                )}

                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Warna</label>
                                    <div className="grid grid-cols-7 gap-2 mt-1">
                                        {['bg-blue-500', 'bg-emerald-500', 'bg-red-500', 'bg-amber-500', 'bg-violet-500', 'bg-pink-500', 'bg-cyan-500'].map(color => (
                                            <button key={color} type="button" onClick={() => setData('color', color)} className={`w-full aspect-square rounded-xl ${color} shadow-sm transition-all focus:outline-none ${data.color === color ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-indigo-500 scale-110' : 'hover:scale-105 opacity-70 hover:opacity-100'}`} />
                                        ))}
                                    </div>
                                </div>

                                <div className="flex space-x-3 pt-4">
                                    <button type="button" onClick={closeModal} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors active:scale-95">Batal</button>
                                    <button type="submit" disabled={processing} className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-transform disabled:opacity-50">{processing ? '...' : (editingCategory ? 'Simpan' : 'Tambah')}</button>
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
