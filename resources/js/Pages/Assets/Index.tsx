import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useState } from 'react';
import {
    Plus, X, Gem, Trash2, Edit2, AlertTriangle, Home, Car, TrendingUp, Coins
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface Asset {
    id: number;
    name: string;
    type: string;
    value: number;
    description?: string;
}

interface Summary {
    totalValue: number;
    byType: Record<string, { count: number; value: number }>;
}

const formatIDR = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

export default function AssetsIndex({ auth, assets, summary }: PageProps<{ assets: Asset[]; summary: Summary }>) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const { data, setData, post, put, processing, reset } = useForm({
        name: '',
        type: 'PROPERTY',
        value: '',
        description: '',
    });

    const handleAmountChange = (val: string) => {
        const rawValue = val.replace(/\D/g, '');
        if (!rawValue) { setData('value', ''); return; }
        setData('value', parseInt(rawValue).toLocaleString('id-ID'));
    };
    const parseAmount = (val: string) => parseFloat(val.replace(/\./g, '')) || 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { ...data, value: parseAmount(data.value).toString() };
        if (editingAsset) {
            router.put(route('assets.update', editingAsset.id), payload, {
                onSuccess: () => { setIsModalOpen(false); reset(); setEditingAsset(null); toast.success('Diperbarui!'); }
            });
        } else {
            router.post(route('assets.store'), payload, {
                onSuccess: () => { setIsModalOpen(false); reset(); toast.success('Ditambahkan!'); }
            });
        }
    };

    const handleEdit = (a: Asset) => {
        setEditingAsset(a);
        setData({ name: a.name, type: a.type, value: a.value.toLocaleString('id-ID'), description: a.description || '' });
        setIsModalOpen(true);
    };

    const getTypeConfig = (type: string) => {
        switch (type) {
            case 'PROPERTY': return { label: 'Properti', color: 'from-blue-500 to-blue-700', icon: Home };
            case 'VEHICLE': return { label: 'Kendaraan', color: 'from-emerald-500 to-emerald-700', icon: Car };
            case 'INVESTMENT': return { label: 'Investasi', color: 'from-purple-500 to-purple-700', icon: TrendingUp };
            case 'OTHER': return { label: 'Lainnya', color: 'from-amber-500 to-amber-700', icon: Coins };
            default: return { label: type, color: 'from-slate-500 to-slate-700', icon: Gem };
        }
    };

    return (
        <>
            <Head title="Aset" />
            <Toaster position="top-right" />

            <div className="space-y-6 animate-fade-in-up">
                {/* Portfolio Header */}
                <div className="glass-card p-8 rounded-[2rem] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-60 h-60 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/3" />
                    <Gem className="absolute right-8 top-8 w-16 h-16 text-indigo-500/10" />
                    <div className="relative z-10">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Nilai Aset</p>
                        <h2 className="text-4xl font-bold text-slate-800 dark:text-white">{formatIDR(summary.totalValue)}</h2>
                        <p className="text-sm text-slate-400 mt-1">{assets.length} aset terdaftar</p>

                        <div className="flex flex-wrap gap-3 mt-4">
                            {Object.entries(summary.byType).map(([type, info]) => {
                                const config = getTypeConfig(type);
                                return (
                                    <div key={type} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-full">
                                        <config.icon className="w-3.5 h-3.5 text-slate-500" />
                                        <span className="text-[10px] font-bold text-slate-500">{config.label}: {info.count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Add Button */}
                <div className="flex justify-end">
                    <button onClick={() => { setEditingAsset(null); reset(); setIsModalOpen(true); }} className="flex items-center px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl text-sm font-bold hover:shadow-lg hover:shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95">
                        <Plus className="w-4 h-4 mr-2" /> Tambah Aset
                    </button>
                </div>

                {/* Asset Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {assets.length > 0 ? assets.map((a, idx) => {
                        const config = getTypeConfig(a.type);
                        return (
                            <div key={a.id} className="glass-card rounded-[2rem] overflow-hidden hover:shadow-xl transition-all duration-300 group animate-pop-in" style={{ animationDelay: `${idx * 80}ms` }}>
                                <div className={`h-2 bg-gradient-to-r ${config.color}`} />
                                <div className="p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.color} text-white flex items-center justify-center shadow-sm`}>
                                                <config.icon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800 dark:text-white text-sm">{a.name}</h3>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{config.label}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(a)} className="p-1.5 text-slate-300 hover:text-indigo-600 rounded-lg transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => setDeleteId(a.id)} className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                    </div>
                                    {a.description && <p className="text-xs text-slate-400 mb-3 line-clamp-2">{a.description}</p>}
                                    <p className="text-xl font-bold text-slate-800 dark:text-white">{formatIDR(a.value)}</p>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="col-span-full glass-card rounded-[2rem] p-16 text-center">
                            <Gem className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                            <p className="text-lg font-bold text-slate-400">Belum ada aset terdaftar</p>
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
                        <h3 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-6">Hapus aset ini?</h3>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300">Batal</button>
                            <button onClick={() => { router.delete(route('assets.destroy', deleteId), { onSuccess: () => toast.success('Dihapus!') }); setDeleteId(null); }} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 shadow-lg shadow-red-500/30">Ya, Hapus</button>
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
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{editingAsset ? 'Edit Aset' : 'Aset Baru'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-5 pt-4 overflow-y-auto scrollbar-hide">
                            <form onSubmit={handleSubmit} className="space-y-3">
                                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Nama Aset</label><input type="text" required value={data.name} onChange={(e) => setData('name', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" placeholder="Rumah, Mobil..." /></div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Tipe</label>
                                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                                        {([{ v: 'PROPERTY', l: 'Properti' }, { v: 'VEHICLE', l: 'Kendaraan' }, { v: 'INVESTMENT', l: 'Investasi' }, { v: 'OTHER', l: 'Lainnya' }] as const).map(opt => (
                                            <button key={opt.v} type="button" onClick={() => setData('type', opt.v)}
                                                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${data.type === opt.v
                                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                                    }`}
                                            >{opt.l}</button>
                                        ))}
                                    </div>
                                </div>
                                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Nilai (Rp)</label><input type="text" required value={data.value} onChange={(e) => handleAmountChange(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" placeholder="0" /></div>
                                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Deskripsi</label><input type="text" value={data.description} onChange={(e) => setData('description', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" placeholder="Opsional" /></div>
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

AssetsIndex.layout = (page: any) => (
    <AppLayout header={
        <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Aset Saya</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Pantau portofolio aset kekayaan Anda</p>
        </div>
    }>
        {page}
    </AppLayout>
);
