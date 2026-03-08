import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import GoldTab from './GoldTab';

interface Wallet {
    id: number;
    name: string;
    balance: number;
}

export default function AssetsIndex({ auth, assets, summary, goldPurchases, goldPriceToday, grandTotalValue, wallets }: PageProps<{ assets: Asset[]; summary: Summary; goldPurchases: any[]; goldPriceToday: number; grandTotalValue: number; wallets: Wallet[] }>) {
    const [activeTab, setActiveTab] = useState<'assets' | 'gold'>('assets');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        
        // Sync activeTab with URL parameter on load
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        if (tab === 'gold' || tab === 'assets') {
            setActiveTab(tab as 'assets' | 'gold');
        }
    }, []);

    const handleTabChange = (tab: 'assets' | 'gold') => {
        setActiveTab(tab);
        // Concatenate manually to avoid TS argument count issues with Ziggy/Inertia signatures
        router.visit(route('assets.index') + '?tab=' + tab, {
            replace: true,
            preserveState: true,
            preserveScroll: true
        });
    };

    const { data, setData, post, put, processing, reset } = useForm({
        name: '',
        type: 'PROPERTY',
        value: '',
        description: '',
    });

    const handleAmountChange = (val: string) => {
        const rawValue = val.replace(/\D/g, '');
        if (!rawValue) { setData('value', ''); return; }
        setData('value', new Intl.NumberFormat('id-ID').format(parseInt(rawValue)));
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
        setData({ name: a.name, type: a.type, value: Number(a.value).toLocaleString('id-ID'), description: a.description || '' });
        setIsModalOpen(true);
    };

    const getTypeConfig = (type: string) => {
        switch (type) {
            case 'PROPERTY': return { label: 'Properti', color: 'from-blue-500 to-blue-700', hex: '#3b82f6', icon: Home };
            case 'VEHICLE': return { label: 'Kendaraan', color: 'from-emerald-500 to-emerald-700', hex: '#10b981', icon: Car };
            case 'INVESTMENT': return { label: 'Investasi', color: 'from-purple-500 to-purple-700', hex: '#8b5cf6', icon: TrendingUp };
            case 'OTHER': return { label: 'Lainnya', color: 'from-amber-500 to-amber-700', hex: '#f59e0b', icon: Coins };
            default: return { label: type, color: 'from-slate-500 to-slate-700', hex: '#64748b', icon: Gem };
        }
    };

    // Prepare chart data
    const chartData = Object.entries(summary.byType)
        .filter(([_, info]) => info.value > 0)
        .map(([type, info]) => {
            const config = getTypeConfig(type);
            return {
                name: config.label,
                value: Number(info.value),
                color: config.hex
            };
        })
        .sort((a, b) => b.value - a.value);

    // Sort assets by value descending for Bento Grid
    const sortedAssets = [...assets].sort((a, b) => Number(b.value) - Number(a.value));

    const formatCompactIDR = (value: number) => {
        if (value >= 1_000_000_000_000) return `Rp ${(value / 1_000_000_000_000).toFixed(2).replace(/\.00$/, '')} Triliun`;
        if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(2).replace(/\.00$/, '')} Miliar`;
        if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(2).replace(/\.00$/, '')} Juta`;
        return formatIDR(value);
    };

    return (
        <>
            <Head title="Aset" />
            <Toaster position="top-right" />



            <div className="space-y-6 animate-fade-in-up">
                
                {/* GLOBAL HERO SECTION - Combined Total Assets + Gold */}
                <div className="glass-card p-6 md:p-8 rounded-[2rem] relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6 border-0 ring-1 ring-slate-200/50 dark:ring-slate-700/50 shadow-xl shadow-slate-200/20 dark:shadow-none" style={{ background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(248, 250, 252, 0.8) 100%)' }}>
                    
                    {/* Dark mode overlay */}
                    <div className="absolute inset-0 bg-slate-900/40 hidden dark:block" />
                    
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[20rem] h-[20rem] bg-gradient-to-tr from-emerald-500/10 to-transparent rounded-full -translate-x-1/2 translate-y-1/2 blur-2xl z-0 pointer-events-none" />

                    <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5 w-full">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
                            <Gem className="w-8 h-8 text-white" />
                        </div>
                        
                        <div className="flex-1 text-center sm:text-left flex flex-col justify-center">
                            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Grand Total Aset</h2>
                            {/* Compact Formatting for extremely large numbers */}
                            <div className="group relative inline-block">
                                <h3 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-br from-slate-900 via-slate-700 to-slate-800 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent tracking-tight leading-tight">
                                    {grandTotalValue >= 1_000_000_000 ? formatCompactIDR(grandTotalValue) : formatIDR(grandTotalValue)}
                                </h3>
                                {grandTotalValue >= 1_000_000_000 && (
                                    <div className="absolute top-full left-1/2 sm:left-0 -translate-x-1/2 sm:translate-x-0 mt-2 p-2 bg-slate-800 text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                                        {formatIDR(grandTotalValue)}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="hidden lg:block w-px h-16 bg-slate-200 dark:bg-slate-700/50 mx-4 shrink-0" />
                        
                        <div className="hidden lg:flex flex-col shrink-0 text-right">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Komposisi</p>
                             <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                 Fiat & Properti +<br/>Investasi Emas Antam
                             </p>
                        </div>
                    </div>
                </div>

                {/* Premium Tab Selector */}
                <div className="flex justify-center my-6 relative z-20">
                    <div className="bg-slate-100 dark:bg-slate-800/80 backdrop-blur-md p-1.5 rounded-2xl flex items-center gap-2 border border-slate-200 shadow-sm dark:border-slate-700/50">
                        <button 
                            onClick={() => handleTabChange('assets')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'assets' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                        >
                            <Gem className="w-4 h-4" /> Aset Umum
                        </button>
                        <button 
                            onClick={() => handleTabChange('gold')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'gold' ? 'bg-white dark:bg-slate-700 text-amber-500 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                        >
                            <Coins className="w-4 h-4" /> Emas Antam
                        </button>
                    </div>
                </div>

                {activeTab === 'assets' ? (
                    <>
                        <div className="flex flex-col lg:flex-row gap-6 mb-8">
                            <div className="w-full flex justify-between items-center sm:hidden px-4 mb-2">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Aset Tunai & Properti</h3>
                                <button onClick={() => { setEditingAsset(null); reset(); setIsModalOpen(true); }} className="p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-1">
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>

                    {/* Tab 1 Structure - Donut Chart on Left, Add Button aside */}
                    <div className="hidden sm:flex flex-col lg:flex-row w-full gap-6">
                        <div className="relative z-10 w-full lg:w-1/2 xl:w-2/5 flex flex-col sm:flex-row items-center gap-6 justify-center bg-white/40 dark:bg-slate-900/40 p-6 rounded-[2rem] border border-white/50 dark:border-slate-800/50 backdrop-blur-md">
                             {chartData.length > 0 ? (
                                <>
                                    <div className="w-[160px] h-[160px] shrink-0 relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={chartData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius="75%"
                                                    outerRadius="100%"
                                                    paddingAngle={4}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {chartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip 
                                                    formatter={(value: number | string | Array<number | string> | undefined) => formatIDR(Number(value || 0))}
                                                    contentStyle={{ borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', padding: '12px 20px', fontWeight: 'bold' }}
                                                    itemStyle={{ color: '#0f172a', fontSize: '15px' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex-1 w-full grid grid-cols-2 gap-3 sm:gap-4">
                                         {chartData.slice(0, 4).map((data, idx) => {
                                             const percentage = summary.totalValue > 0 ? ((data.value / summary.totalValue) * 100).toFixed(1) : '0';
                                             return (
                                                <div key={idx} className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider line-clamp-1">{data.name}</span>
                                                    </div>
                                                    <span className="text-[15px] font-bold text-slate-800 dark:text-white leading-none">{percentage}%</span>
                                                </div>
                                             )
                                         })}
                                    </div>
                                </>
                             ) : (
                                 <div className="w-full flex items-center justify-center gap-4 text-slate-400">
                                     <div className="w-16 h-16 rounded-full border-4 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center">
                                         <Gem className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                                     </div>
                                     <p className="text-sm font-medium">Data portofolio kosong</p>
                                 </div>
                             )}
                        </div>

                        {/* Add Action Mini Card */}
                        <div className="relative z-10 w-full lg:flex-1 p-6 md:p-8 rounded-[2rem] border border-white/50 dark:border-slate-800/50 flex flex-col items-center sm:items-start justify-center text-center sm:text-left shadow-sm hover:shadow-lg transition-all" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)' }}>
                            <div className="w-12 h-12 rounded-xl bg-indigo-500 text-white flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
                                <Gem className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Kelola Portofolio Aset Umum</h3>
                            <p className="text-sm text-slate-500 mb-6">Tambahkan instrumen seperti reksadana, saham, deposito, atau properti untuk dipantau secara statis.</p>
                            
                            <button onClick={() => { setEditingAsset(null); reset(); setIsModalOpen(true); }} className="px-6 py-3.5 bg-slate-900 border dark:border-none dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold shadow-xl shadow-slate-900/20 dark:shadow-white/10 hover:-translate-y-1 transition-all active:scale-95 group flex items-center">
                                <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-300" /> Tambah Instrumen Baru
                            </button>
                        </div>
                    </div>
                </div>

                {/* Asset Cards - Dynamic Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {sortedAssets.length > 0 ? sortedAssets.map((a, idx) => {
                        const config = getTypeConfig(a.type);
                        const percentage = summary.totalValue > 0 ? (Number(a.value) / summary.totalValue) * 100 : 0;
                        
                        // Dynamic Col Span Logic based on Rank and Total Array Length
                        let colSpan = 'col-span-1';
                        let isLargeBento = false;
                        
                        if (assets.length === 1) {
                            colSpan = 'md:col-span-2 lg:col-span-3 xl:col-span-4'; // Fill entire row if only 1 item
                            isLargeBento = true;
                        } else if (assets.length === 2) {
                            colSpan = 'md:col-span-1 lg:col-span-3 xl:col-span-2'; // 50/50 split on large screens
                            if (idx === 0) isLargeBento = true;
                        } else {
                            if (idx === 0) {
                                colSpan = 'md:col-span-2 lg:col-span-2 xl:col-span-2'; // Top item is always 2-span
                                isLargeBento = true;
                            } else if (assets.length % 3 === 2 && idx === assets.length - 1) {
                                // If the last item is orphaned on a 3-col grid, make it span the remaining space
                                colSpan = 'md:col-span-1 lg:col-span-2 xl:col-span-1';
                            }
                        }
                        
                        return (
                            <div key={a.id} className={`glass-card rounded-[2rem] overflow-hidden hover:shadow-2xl transition-all duration-300 group animate-pop-in relative flex flex-col ${colSpan}`} style={{ animationDelay: `${idx * 80}ms` }}>
                                {/* Subtle Background Wave for Large Bentos */}
                                {isLargeBento && (
                                     <div className="absolute -bottom-24 -right-24 w-64 h-64 opacity-5 bg-gradient-to-tl from-current to-transparent rounded-full blur-3xl pointer-events-none" style={{ color: config.hex }} />
                                )}
                                
                                <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${config.color}`} />
                                <div className={`p-6 pl-8 flex-1 flex flex-col gap-4 sm:gap-6 ${isLargeBento ? 'sm:flex-row sm:items-center sm:justify-between' : ''}`}>
                                    
                                    {/* Component Top/Left: Icon & Name */}
                                    <div className="flex items-start justify-between w-full sm:w-auto sm:flex-1">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${config.color} text-white flex items-center justify-center shadow-lg shadow-${config.color.split('-')[1]}-500/20 shrink-0`}>
                                                <config.icon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800 dark:text-white text-base max-w-[200px] truncate">{a.name}</h3>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{config.label}</p>
                                            </div>
                                        </div>
                                        
                                        {/* Mobile Friendly Actions - Positioned absolutely on large bento or relative on small bento */}
                                        <div className={`flex gap-1 opacity-60 hover:opacity-100 transition-opacity bg-slate-50 dark:bg-slate-800/50 rounded-xl p-1 z-10 ${isLargeBento ? 'absolute top-6 right-6 sm:relative sm:top-0 sm:right-0 ml-4' : ''}`}>
                                            <button onClick={() => handleEdit(a)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                                            <button onClick={() => setDeleteId(a.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                    
                                    {/* Component Bottom/Right: Value & Progress */}
                                    <div className={`flex shrink-0 flex-col justify-end ${isLargeBento ? 'sm:w-[300px] sm:pr-4' : 'mt-auto pt-2'}`}>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gradient-to-r ${config.color} text-white shadow-sm shadow-${config.color.split('-')[1]}-500/30`}>
                                                {percentage.toFixed(1)}% PORTFOLIO
                                            </div>
                                        </div>
                                        <p className="font-black text-slate-800 dark:text-white tracking-tight text-3xl truncate" title={formatIDR(a.value)}>
                                            {formatIDR(a.value)}
                                        </p>
                                        {a.description && <p className={`text-slate-500 mt-2 line-clamp-2 text-sm ${isLargeBento && 'hidden sm:block'}`}>{a.description}</p>}
                                    </div>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="col-span-full glass-card rounded-[2rem] p-24 text-center">
                            <Gem className="w-20 h-20 text-slate-200 dark:text-slate-800 mx-auto mb-6" />
                            <h3 className="text-2xl font-bold text-slate-400 mb-2">Belum Ada Aset Terdaftar</h3>
                            <p className="text-slate-500">Mulai tambahkan instrumen aset kekayaan Anda untuk memonitor portofolio finansial.</p>
                        </div>
                    )}
                </div>
                </>
                ) : (
                    <GoldTab purchases={goldPurchases} currentPrice={goldPriceToday} wallets={wallets} />
                )}
            </div>

            {/* Delete Modal */}
            {deleteId && mounted && createPortal(
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
                </div>,
                document.body
            )}
        </>
    );
}

AssetsIndex.layout = (page: any) => (
    <AppLayout header={
        <div className="flex flex-col min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-white tracking-tight truncate">Aset Saya</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">Pantau portofolio aset kekayaan Anda</p>
        </div>
    }>
        {page}
    </AppLayout>
);
