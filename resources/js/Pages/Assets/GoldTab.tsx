import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useForm, router } from '@inertiajs/react';
import { 
    Plus, PencilSimple as Edit2, Trash as Trash2, Coins, TrendUp as TrendingUp, WarningCircle as AlertCircle, FloppyDisk as Save 
} from '@phosphor-icons/react';
import toast from 'react-hot-toast';

interface GoldPurchase {
    id: number;
    user_id: number;
    grams: string;
    price_per_gram: string;
    purchased_at: string;
    notes: string | null;
}

interface Wallet {
    id: number;
    name: string;
    balance: number;
}

interface Props {
    purchases: GoldPurchase[];
    currentPrice: number;
    wallets: Wallet[];
}

const formatIDR = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

const formatGram = (grams: number) => 
    new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 3 }).format(grams);

export default function GoldTab({ purchases, currentPrice, wallets }: Props) {
    const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Price Update Form
    const priceForm = useForm({ price: currentPrice.toString() });

    // Purchase Form
    const form = useForm({
        grams: '',
        price_per_gram: '',
        purchased_at: new Date().toISOString().split('T')[0],
        notes: '',
        wallet_id: '',
    });

    // Sync currentPrice to priceForm whenever it changes from backend
    useEffect(() => {
        priceForm.setData('price', currentPrice.toLocaleString('id-ID'));
    }, [currentPrice]);

    const handlePriceSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { price: parseFloat(priceForm.data.price.replace(/\D/g, '')) };
        router.post(route('gold.updatePrice'), payload, {
            preserveScroll: true,
            onSuccess: () => { setIsPriceModalOpen(false); toast.success('Harga referensi emas diupdate!'); }
        });
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...form.data,
            grams: parseFloat(form.data.grams.replace(/,/g, '.')),
            price_per_gram: parseFloat(form.data.price_per_gram.replace(/\D/g, '')),
        };

        if (editingId) {
            router.put(route('gold.update', editingId), payload, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => { setIsFormModalOpen(false); form.reset(); setEditingId(null); toast.success('Data diperbarui!'); }
            });
        } else {
            router.post(route('gold.store'), payload, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => { setIsFormModalOpen(false); form.reset(); toast.success('Data ditambahkan!'); }
            });
        }
    };

    const handleEdit = (gp: GoldPurchase) => {
        setEditingId(gp.id);
        form.setData({
            grams: gp.grams,
            price_per_gram: parseInt(gp.price_per_gram).toLocaleString('id-ID'),
            purchased_at: gp.purchased_at,
            notes: gp.notes || '',
        });
        setIsFormModalOpen(true);
    };

    const handleDelete = (id: number) => {
        if (confirm('Yakin ingin menghapus riwayat ini?')) {
            router.delete(route('gold.destroy', id), {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => toast.success('Riwayat dihapus')
            });
        }
    };

    // Calculate Dashboard Stats
    const stats = useMemo(() => {
        let totalGrams = 0;
        let totalCapital = 0;
        
        purchases.forEach(p => {
            const gr = parseFloat(p.grams);
            const price = parseFloat(p.price_per_gram);
            totalGrams += gr;
            totalCapital += (gr * price);
        });

        const currentValue = totalGrams * currentPrice;
        const profitLoss = currentValue - totalCapital;
        const profitLossPercentage = totalCapital > 0 ? (profitLoss / totalCapital) * 100 : 0;

        return { totalGrams, totalCapital, currentValue, profitLoss, profitLossPercentage };
    }, [purchases, currentPrice]);

    return (
        <>
            <div className="space-y-6 animate-fade-in-up">
                {/* HERO SECTION */}
            <div className="glass-card p-6 md:p-10 rounded-[2rem] relative overflow-hidden flex flex-col lg:flex-row gap-6 lg:gap-10 border border-amber-500/20">
                <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-gradient-to-br from-amber-500/10 to-orange-500/5 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl pointer-events-none" />
                
                {/* Value Info */}
                <div className="relative z-10 flex-1 w-full text-center lg:text-left flex flex-col justify-center">
                    <div className="inline-flex items-center justify-center lg:justify-start gap-2 mb-2 lg:mb-4">
                        <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                            <Coins weight="duotone" className="w-4 h-4 text-amber-500" />
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Estimasi Nilai Emas</p>
                    </div>
                    
                    <h2 className="text-3xl sm:text-4xl lg:text-4xl xl:text-5xl font-extrabold bg-gradient-to-br from-slate-900 via-slate-700 to-slate-800 dark:from-white dark:via-amber-100 dark:to-amber-200 bg-clip-text text-transparent tracking-tight leading-tight mb-2 shrink-0 truncate" title={formatIDR(stats.currentValue)}>
                        {formatIDR(stats.currentValue)}
                    </h2>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-6">
                        <span className="text-sm font-medium text-slate-500">
                            Total Bobot: <span className="font-bold text-slate-800 dark:text-white text-lg">{formatGram(stats.totalGrams)} gr</span>
                        </span>
                        <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                        <span className="text-sm font-medium text-slate-500">
                            Modal: <span className="font-bold text-slate-800 dark:text-white">{formatIDR(stats.totalCapital)}</span>
                        </span>
                    </div>

                    <div className="flex justify-center lg:justify-start">
                        <button onClick={() => { setEditingId(null); form.reset(); setIsFormModalOpen(true); }} className="w-full sm:w-auto flex items-center justify-center px-6 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-2xl text-sm font-bold shadow-xl shadow-amber-500/20 hover:shadow-2xl hover:shadow-amber-500/30 hover:-translate-y-0.5 transition-all active:scale-95 group">
                            <Plus weight="bold" className="w-5 h-5 mr-3 group-hover:rotate-90 transition-transform duration-300" /> Tambah Transaksi Emas
                        </button>
                    </div>
                </div>

                {/* Right Analytics Box */}
                <div className="relative z-10 w-full lg:w-[40%] flex flex-col gap-4">
                    {/* Price Ref Box */}
                    <div className="bg-white/50 dark:bg-slate-900/50 p-5 rounded-3xl border border-white/50 dark:border-slate-800/50 backdrop-blur-md">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Harga Acuan Emas</p>
                            <button onClick={() => setIsPriceModalOpen(true)} className="text-amber-500 hover:text-amber-600 dark:hover:text-amber-400 text-xs font-bold flex items-center">
                                <Edit2 weight="duotone" className="w-3 h-3 mr-1" /> Edit
                            </button>
                        </div>
                        <p className="text-xl sm:text-2xl lg:text-xl xl:text-2xl font-black text-slate-800 dark:text-white truncate" title={formatIDR(currentPrice)}>{formatIDR(currentPrice)}<span className="text-xs sm:text-sm font-bold text-slate-400">/gr</span></p>
                    </div>

                    {/* Floating P/L Box */}
                    <div className="bg-white/50 dark:bg-slate-900/50 p-5 rounded-3xl border border-white/50 dark:border-slate-800/50 backdrop-blur-md">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Floating Profit/Loss</p>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${stats.profitLoss >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                <TrendingUp weight="bold" className={`w-5 h-5 ${stats.profitLoss < 0 ? 'rotate-180' : ''}`} />
                            </div>
                            <div>
                                <p className={`text-xl font-black ${stats.profitLoss >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {stats.profitLoss > 0 ? '+' : ''}{formatIDR(stats.profitLoss)}
                                </p>
                                <p className={`text-xs font-bold ${stats.profitLoss >= 0 ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>
                                    {stats.profitLoss > 0 ? '+' : ''}{stats.profitLossPercentage.toFixed(2)}% dari modal
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* LEDGER / HISTORY */}
            <div className="glass-card rounded-[2rem] overflow-hidden">
                <div className="p-6 md:p-8 border-b border-slate-200 dark:border-slate-700/50">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Riwayat Tabungan Emas</h3>
                </div>
                
                <div className="overflow-x-auto">
                    {/* Desktop Table */}
                    <table className="w-full text-left border-collapse hidden md:table">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-200 dark:border-slate-700/50">
                                <th className="p-4 pl-6 lg:pl-8 text-xs font-bold text-slate-400 uppercase tracking-wider">Tanggal</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Bobot</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Harga Beli/gr</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Total Modal</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Profit/Loss</th>
                                <th className="p-4 pr-6 lg:pr-8 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchases.length > 0 ? purchases.map((p) => {
                                const gr = parseFloat(p.grams);
                                const buyPrice = parseFloat(p.price_per_gram);
                                const modal = gr * buyPrice;
                                const nowVal = gr * currentPrice;
                                const diff = nowVal - modal;
                                const diffPct = modal > 0 ? (diff / modal) * 100 : 0;

                                return (
                                    <tr key={p.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                        <td className="p-4 pl-6 lg:pl-8 whitespace-nowrap">
                                            <p className="font-bold text-slate-800 dark:text-white text-sm">{new Date(p.purchased_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                            {p.notes && <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[150px]">{p.notes}</p>}
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold">
                                                {formatGram(gr)} gr
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">{formatIDR(buyPrice)}</td>
                                        <td className="p-4 text-sm font-black text-slate-800 dark:text-white whitespace-nowrap">{formatIDR(modal)}</td>
                                        <td className="p-4 whitespace-nowrap">
                                            <p className={`text-sm font-bold ${diff >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {diff > 0 ? '+' : ''}{formatIDR(diff)}
                                            </p>
                                            <p className={`text-[10px] font-bold ${diff >= 0 ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>
                                                {diff > 0 ? '+' : ''}{diffPct.toFixed(1)}%
                                            </p>
                                        </td>
                                        <td className="p-4 pr-6 lg:pr-8 text-right whitespace-nowrap">
                                            <div className="flex justify-end gap-2 opacity-100 md:opacity-50 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(p)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"><Edit2 weight="duotone" className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(p.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"><Trash2 weight="duotone" className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={6} className="p-16 text-center">
                                        <div className="w-16 h-16 rounded-full border-4 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto mb-4">
                                            <Coins weight="duotone" className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                                        </div>
                                        <p className="text-slate-500 font-medium">Belum ada riwayat pembelian emas.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Mobile Card List */}
                    <div className="md:hidden flex flex-col divide-y divide-slate-100 dark:divide-slate-800/50">
                        {purchases.length > 0 ? purchases.map((p) => {
                            const gr = parseFloat(p.grams);
                            const buyPrice = parseFloat(p.price_per_gram);
                            const modal = gr * buyPrice;
                            const nowVal = gr * currentPrice;
                            const diff = nowVal - modal;
                            const diffPct = modal > 0 ? (diff / modal) * 100 : 0;

                            return (
                                <div key={p.id} className="p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-white text-sm">{new Date(p.purchased_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                            {p.notes && <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]">{p.notes}</p>}
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => handleEdit(p)} className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 dark:bg-slate-800 rounded-lg transition-all active:scale-95"><Edit2 weight="duotone" className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(p.id)} className="p-1.5 text-slate-400 hover:text-rose-500 bg-slate-50 dark:bg-slate-800 rounded-lg transition-all active:scale-95"><Trash2 weight="duotone" className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 mb-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Modal</p>
                                            <p className="text-sm font-black text-slate-800 dark:text-white">{formatIDR(modal)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Profit/Loss</p>
                                            <p className={`text-sm font-bold ${diff >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {diff > 0 ? '+' : ''}{formatIDR(diff)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="inline-flex items-center px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold">
                                            {formatGram(gr)} gr
                                        </span>
                                        <p className="text-xs font-medium text-slate-500">
                                            Harga Beli: <span className="font-bold">{formatIDR(buyPrice)}</span>/gr
                                        </p>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 rounded-full border-4 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto mb-4">
                                    <Coins weight="duotone" className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                                </div>
                                <p className="text-slate-500 font-medium text-sm">Belum ada riwayat pembelian emas.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            </div>

            {/* Price Edit Modal */}
            {isPriceModalOpen && mounted && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 lg:p-8 w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800 animate-pop-in">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Update Harga Emas Hari Ini</h3>
                        <form onSubmit={handlePriceSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Harga per Gram (Rp)</label>
                                <input
                                    type="text"
                                    required
                                    value={priceForm.data.price}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        priceForm.setData('price', val ? parseInt(val).toLocaleString('id-ID') : '');
                                    }}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3.5 text-slate-800 dark:text-white font-bold focus:ring-2 focus:ring-amber-500 transition-all font-mono"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setIsPriceModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Batal</button>
                                <button type="submit" disabled={priceForm.processing} className="px-5 py-2.5 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-lg shadow-amber-500/30 transition-all active:scale-95 disabled:opacity-50">Update</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Add/Edit Modal */}
            {isFormModalOpen && mounted && createPortal(
                <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 lg:p-8 w-full max-w-lg shadow-2xl border border-slate-100 dark:border-slate-800 animate-pop-in my-auto">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">{editingId ? 'Edit Tabungan Emas' : 'Tambah Tabungan Emas'}</h3>
                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Bobot / Gram</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.data.grams}
                                        onChange={(e) => {
                                            // Allow only numbers and comma/dot
                                            const val = e.target.value.replace(/[^0-9.,]/g, '');
                                            form.setData('grams', val);
                                        }}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-800 dark:text-white font-bold focus:ring-2 focus:ring-amber-500 transition-all font-mono"
                                        placeholder="Contoh: 1,5"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1 ml-1 italic">Gunakan koma (,) atau titik (.) untuk desimal</p>
                                    {form.errors.grams && <span className="text-xs text-rose-500 mt-1">{form.errors.grams}</span>}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Harga Beli / Gram</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.data.price_per_gram}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            form.setData('price_per_gram', val ? parseInt(val).toLocaleString('id-ID') : '');
                                        }}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-800 dark:text-white font-bold focus:ring-2 focus:ring-amber-500 transition-all font-mono"
                                        placeholder="Rp 1.400.000"
                                    />
                                    {form.errors.price_per_gram && <span className="text-xs text-rose-500 mt-1">{form.errors.price_per_gram}</span>}
                                </div>
                            </div>

                            {/* Live Calculation Info Box - Only shown when Editing */}
                            {editingId && (
                                <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/20 rounded-2xl p-4 space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600 dark:text-slate-300 font-bold">Total Modal (Uang Keluar):</span>
                                        <span className="text-amber-600 dark:text-amber-400 font-black">
                                            {formatIDR(
                                                (parseFloat(form.data.grams.replace(/,/g, '.')) || 0) * 
                                                (parseInt(form.data.price_per_gram.replace(/\D/g, '')) || 0)
                                            )}
                                        </span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center text-sm border-t border-amber-200/50 dark:border-amber-500/20 pt-3">
                                        <span className="text-slate-600 dark:text-slate-300 font-bold">Estimasi Nilai Saat Ini:</span>
                                        <span className="text-emerald-600 dark:text-emerald-400 font-black">
                                            {formatIDR((parseFloat(form.data.grams.replace(/,/g, '.')) || 0) * currentPrice)}
                                        </span>
                                    </div>

                                    <div className="text-xs text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-slate-900/50 p-3 rounded-xl leading-relaxed mt-2 border border-slate-200/50 dark:border-slate-700/50">
                                        💡 <strong>Catatan:</strong> Merubah <strong>Harga Beli</strong> saja tidak akan merubah Estimasi Nilai Saat Ini, karena estimasi dihitung berdasarkan <em>Harga Emas Hari Ini</em>.
                                    </div>
                                </div>
                            )}
                            
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tanggal Beli</label>
                                <input
                                    type="date"
                                    required
                                    value={form.data.purchased_at}
                                    onChange={(e) => form.setData('purchased_at', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 transition-all"
                                />
                                {form.errors.purchased_at && <span className="text-xs text-rose-500 mt-1">{form.errors.purchased_at}</span>}
                            </div>
                            
                            {!editingId && (
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Sumber Dana (Potong Saldo)</label>
                                    <select
                                        required
                                        value={form.data.wallet_id}
                                        onChange={(e) => form.setData('wallet_id', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 transition-all cursor-pointer"
                                    >
                                        <option value="" disabled>Pilih dompet sumber dana...</option>
                                        {wallets.map(w => (
                                            <option key={w.id} value={w.id}>{w.name} ({formatIDR(w.balance)})</option>
                                        ))}
                                    </select>
                                    {form.errors.wallet_id && <span className="text-xs text-rose-500 mt-1">{form.errors.wallet_id}</span>}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Catatan (Optional)</label>
                                <input
                                    type="text"
                                    value={form.data.notes}
                                    onChange={(e) => form.setData('notes', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 transition-all"
                                    placeholder="Contoh: Beli di Butik Antam"
                                    maxLength={255}
                                />
                                {form.errors.notes && <span className="text-xs text-rose-500 mt-1">{form.errors.notes}</span>}
                            </div>
                            
                            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                                <button type="button" onClick={() => setIsFormModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Batal</button>
                                <button type="submit" disabled={form.processing} className="px-5 py-2.5 flex items-center gap-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-lg shadow-amber-500/30 transition-all active:scale-95 disabled:opacity-50">
                                    <Save weight="bold" className="w-4 h-4" /> Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
