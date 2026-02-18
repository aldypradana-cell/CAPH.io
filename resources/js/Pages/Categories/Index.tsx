import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useState } from 'react';
import {
    Plus, X, Tags, Trash2, Edit2, AlertTriangle
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface Category {
    id: number;
    name: string;
    type: string;
    is_default: boolean;
}

export default function CategoriesIndex({ auth, categories }: PageProps<{ categories: Category[] }>) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');

    const { data, setData, post, put, processing, reset } = useForm({
        name: '',
        type: 'EXPENSE',
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
        setData({ name: c.name, type: c.type });
        setIsModalOpen(true);
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
                        <div key={c.id} className="glass-card rounded-2xl p-4 flex items-center justify-between group hover:shadow-lg transition-all duration-300 animate-pop-in" style={{ animationDelay: `${idx * 50}ms` }}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.type === 'INCOME' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600' : 'bg-red-100 dark:bg-red-900/40 text-red-600'} shadow-sm`}>
                                    <Tags className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800 dark:text-white">{c.name}</p>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.type === 'INCOME' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                            {c.type === 'INCOME' ? 'Masuk' : 'Keluar'}
                                        </span>
                                        {c.is_default && <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">Default</span>}
                                    </div>
                                </div>
                            </div>
                            {!c.is_default && (
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(c)} className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => setDeleteId(c.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                            )}
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
            {deleteId && (
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
                </div>
            )}

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-6 pb-16 lg:pb-0 animate-fade-in">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative w-full max-w-md glass-card rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-pop-in">
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
                                <div className="flex space-x-3 pt-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors active:scale-95">Batal</button>
                                    <button type="submit" disabled={processing} className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-transform disabled:opacity-50">{processing ? '...' : 'Simpan'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

CategoriesIndex.layout = (page: any) => (
    <AppLayout header={
        <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Kategori</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Kelola kategori transaksi</p>
        </div>
    }>
        {page}
    </AppLayout>
);
