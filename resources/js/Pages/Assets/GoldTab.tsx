import { useState, useMemo } from 'react';
import { useForm, router } from '@inertiajs/react';
import { Plus, Edit2, Trash2, Coins, TrendingUp, AlertCircle, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface GoldPurchase {
    id: number;
    user_id: number;
    grams: string;
    price_per_gram: string;
    purchased_at: string;
    notes: string | null;
}

interface Props {
    purchases: GoldPurchase[];
    currentPrice: number;
}

const formatIDR = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

const formatGram = (grams: number) => 
    new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 3 }).format(grams);

export default function GoldTab({ purchases, currentPrice }: Props) {
    const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Price Update Form
    const priceForm = useForm({ price: currentPrice.toString() });

    // Purchase Form
    const form = useForm({
        grams: '',
        price_per_gram: '',
        purchased_at: new Date().toISOString().split('T')[0],
        notes: '',
    });

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
                onSuccess: () => { setIsFormModalOpen(false); form.reset(); setEditingId(null); toast.success('Data diperbarui!'); }
            });
        } else {
            router.post(route('gold.store'), payload, {
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
        <div className="space-y-6 animate-fade-in-up">
            {/* HERO SECTION */}
            <div className="glass-card p-6 md:p-10 rounded-[2rem] relative overflow-hidden flex flex-col lg:flex-row gap-6 lg:gap-10 border border-amber-500/20">
                <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-gradient-to-br from-amber-500/10 to-orange-500/5 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl pointer-events-none" />
                
                {/* Value Info */}
                <div className="relative z-10 flex-1 w-full text-center lg:text-left flex flex-col justify-center">
                    <div className="inline-flex items-center justify-center lg:justify-start gap-2 mb-2 lg:mb-4">
                        <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                            <Coins className="w-4 h-4 text-amber-500" />
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Estimasi Nilai Emas</p>
                    </div>
                    
                    <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold bg-gradient-to-br from-slate-900 via-slate-700 to-slate-800 dark:from-white dark:via-amber-100 dark:to-amber-200 bg-clip-text text-transparent tracking-tight leading-tight mb-2">
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
                            <Plus className="w-5 h-5 mr-3 group-hover:rotate-90 transition-transform duration-300" /> Tambah Transaksi Emas
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
                                <Edit2 className="w-3 h-3 mr-1" /> Edit
                            </button>
                        </div>
                        <p className="text-2xl font-black text-slate-800 dark:text-white">{formatIDR(currentPrice)}<span className="text-sm font-bold text-slate-400">/gr</span></p>
                    </div>

                    {/* Floating P/L Box */}
                    <div className="bg-white/50 dark:bg-slate-900/50 p-5 rounded-3xl border border-white/50 dark:border-slate-800/50 backdrop-blur-md">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Floating Profit/Loss</p>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${stats.profitLoss >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                <TrendingUp className={`w-5 h-5 ${stats.profitLoss < 0 ? 'rotate-180' : ''}`} />
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
                    <table className="w-full text-left border-collapse">
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
                                            <div className="flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(p)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(p.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={6} className="p-16 text-center">
                                        <div className="w-16 h-16 rounded-full border-4 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto mb-4">
                                            <Coins className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                                        </div>
                                        <p className="text-slate-500 font-medium">Belum ada riwayat pembelian emas.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Price Edit Modal */}
            {isPriceModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
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
                </div>
            )}

            {/* Add/Edit Modal */}
            {isFormModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 lg:p-8 w-full max-w-lg shadow-2xl border border-slate-100 dark:border-slate-800 animate-pop-in">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">{editingId ? 'Edit Tabungan Emas' : 'Tambah Tabungan Emas'}</h3>
                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Bobot / Gram</label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        required
                                        value={form.data.grams}
                                        onChange={(e) => form.setData('grams', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 transition-all"
                                        placeholder="Contoh: 5.5"
                                    />
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
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 transition-all font-mono"
                                        placeholder="Rp 1.400.000"
                                    />
                                    {form.errors.price_per_gram && <span className="text-xs text-rose-500 mt-1">{form.errors.price_per_gram}</span>}
                                </div>
                            </div>
                            
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
                                    <Save className="w-4 h-4" /> Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
