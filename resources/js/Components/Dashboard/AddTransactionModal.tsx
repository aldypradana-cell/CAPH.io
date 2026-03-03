import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useForm, router } from '@inertiajs/react'; // Ensure router is imported for Inertia v1 or useForm's post
import { X, TrendingDown, TrendingUp, ArrowRightLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import TagInput from '@/Components/TagInput'; // Assuming this exists based on original file
import { WalletData, CategoryData, TagData } from '@/types/dashboard';

interface AddTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    wallets: WalletData[];
    categories: CategoryData[];
    userTags: TagData[];
}

export default function AddTransactionModal({
    isOpen, onClose, wallets, categories, userTags
}: AddTransactionModalProps) {
    const [inputType, setInputType] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER'>('EXPENSE');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [mounted, setMounted] = useState(false);
    const [showAdminFee, setShowAdminFee] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // We use inertia useForm for easy submission handling
    const { data, setData, post: inertiaPost, processing, reset } = useForm({
        wallet_id: '',
        to_wallet_id: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        type: 'EXPENSE' as 'INCOME' | 'EXPENSE' | 'TRANSFER',
        category: '',
        tags: [] as string[],
        admin_fee: '',
        admin_fee_from: 'sender' as 'sender' | 'receiver',
    });

    const handleAmountChange = (val: string) => {
        const rawValue = val.replace(/\D/g, '');
        if (!rawValue) { setData('amount', ''); return; }
        setData('amount', parseInt(rawValue).toLocaleString('id-ID'));
    };

    const handleAdminFeeChange = (val: string) => {
        const rawValue = val.replace(/\D/g, '');
        if (!rawValue) { setData('admin_fee', ''); return; }
        setData('admin_fee', parseInt(rawValue).toLocaleString('id-ID'));
    };

    const parseAmount = (val: string) => parseFloat(val.replace(/\./g, '')) || 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Construct payload manually to ensure type and amount are correct before sending
        // Note: Inertia useForm's transform could also be used, but manual payload with router.post 
        // was used in the original file. Let's stick to useForm's post if possible, 
        // or match the original logic if it used router.post explicitly.
        // Original used router.post inside handleSubmit. We can do the same to match behavior closely.

        const payload = {
            ...data,
            type: inputType,
            amount: parseAmount(data.amount).toString(),
            tags: selectedTags,
            admin_fee: data.admin_fee ? parseAmount(data.admin_fee).toString() : '0',
            admin_fee_from: data.admin_fee_from,
        };

        router.post(route('transactions.store'), payload, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                onClose();
                reset();
                setSelectedTags([]);
                toast.success('Transaksi berhasil ditambahkan!');
            }
        });
    };

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative w-full max-w-md glass-card rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-pop-in">
                {/* Gradient top bar */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-10" />

                {/* Header */}
                <div className="p-5 pb-0 shrink-0">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Transaksi Baru</h3>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Type Toggle */}
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-2">
                        {(['EXPENSE', 'INCOME', 'TRANSFER'] as const).map(type => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => {
                                    setInputType(type);
                                    setShowAdminFee(false);
                                    setData(d => ({
                                        ...d,
                                        type,
                                        category: '',
                                        admin_fee: '',
                                        admin_fee_from: 'sender' as 'sender' | 'receiver',
                                    }));
                                }}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${inputType === type
                                    ? type === 'INCOME' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                        : type === 'EXPENSE' ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                                            : 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                    }`}
                            >
                                {type === 'EXPENSE' ? <><TrendingDown className="w-3 h-3" /> KELUAR</> :
                                    type === 'INCOME' ? <><TrendingUp className="w-3 h-3" /> MASUK</> :
                                        <><ArrowRightLeft className="w-3 h-3" /> TRANSFER</>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Form */}
                <div className="p-5 pt-4 overflow-y-auto scrollbar-hide">
                    <form onSubmit={handleSubmit} className="space-y-3">
                        {/* Amount First */}
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Jumlah (Rp)</label>
                            <input type="text" value={data.amount} onChange={(e) => handleAmountChange(e.target.value)} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-2xl text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50 text-center" placeholder="0" autoFocus required />
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Dompet</label>
                            <select value={data.wallet_id} onChange={(e) => setData('wallet_id', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" required>
                                <option value="">Pilih Dompet</option>
                                {wallets.map(w => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>

                        {inputType === 'TRANSFER' && (
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Ke Dompet</label>
                                <select value={data.to_wallet_id} onChange={(e) => setData('to_wallet_id', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" required>
                                    <option value="">Pilih Dompet Tujuan</option>
                                    {wallets.filter(w => w.id.toString() !== data.wallet_id).map(w => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Admin Fee Toggle — tampil untuk EXPENSE dan TRANSFER */}
                        {(inputType === 'EXPENSE' || inputType === 'TRANSFER') && (
                            <div>
                                {!showAdminFee ? (
                                    <button
                                        type="button"
                                        onClick={() => setShowAdminFee(true)}
                                        className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors py-1 px-2 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                    >
                                        <span className="text-base leading-none">+</span> Tambah Biaya Admin
                                    </button>
                                ) : (
                                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl space-y-3 animate-fade-in">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">Biaya Admin</label>
                                            <button type="button" onClick={() => { setShowAdminFee(false); setData(d => ({ ...d, admin_fee: '', admin_fee_from: 'sender' })); }}
                                                className="text-amber-400 hover:text-amber-600 text-xs px-1.5 py-0.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors">
                                                ✕ Batal
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            value={data.admin_fee}
                                            onChange={(e) => handleAdminFeeChange(e.target.value)}
                                            className="w-full px-4 py-2.5 border border-amber-200 dark:border-amber-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-amber-500 outline-none font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900/50"
                                            placeholder="Masukkan biaya admin (Rp)"
                                            autoFocus
                                        />

                                        {/* Sender/Receiver Toggle — hanya untuk TRANSFER */}
                                        {inputType === 'TRANSFER' && data.admin_fee && parseAmount(data.admin_fee) > 0 && (
                                            <div className="flex gap-2">
                                                <button type="button" onClick={() => setData('admin_fee_from', 'sender')}
                                                    className={`flex-1 py-2 px-3 rounded-xl text-[11px] font-bold transition-all border ${
                                                        data.admin_fee_from === 'sender'
                                                            ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/30'
                                                            : 'border-amber-200 dark:border-amber-700 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                                                    }`}>
                                                    Potong Pengirim
                                                </button>
                                                <button type="button" onClick={() => setData('admin_fee_from', 'receiver')}
                                                    className={`flex-1 py-2 px-3 rounded-xl text-[11px] font-bold transition-all border ${
                                                        data.admin_fee_from === 'receiver'
                                                            ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/30'
                                                            : 'border-amber-200 dark:border-amber-700 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                                                    }`}>
                                                    Potong Penerima
                                                </button>
                                            </div>
                                        )}

                                        {/* Summary */}
                                        {data.admin_fee && parseAmount(data.admin_fee) > 0 && (
                                            <div className="text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 rounded-xl px-3 py-2 space-y-0.5">
                                                {inputType === 'EXPENSE' ? (
                                                    <p>💳 {wallets.find(w => w.id.toString() === data.wallet_id)?.name || 'Dompet'} akan terpotong total <strong>Rp {(parseAmount(data.amount) + parseAmount(data.admin_fee)).toLocaleString('id-ID')}</strong></p>
                                                ) : data.admin_fee_from === 'sender' ? (
                                                    <>
                                                        <p>💳 {wallets.find(w => w.id.toString() === data.wallet_id)?.name || 'Pengirim'} terpotong <strong>Rp {(parseAmount(data.amount) + parseAmount(data.admin_fee)).toLocaleString('id-ID')}</strong></p>
                                                        <p>💰 {wallets.find(w => w.id.toString() === data.to_wallet_id)?.name || 'Penerima'} menerima <strong>Rp {parseAmount(data.amount).toLocaleString('id-ID')}</strong></p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p>💳 {wallets.find(w => w.id.toString() === data.wallet_id)?.name || 'Pengirim'} terpotong <strong>Rp {parseAmount(data.amount).toLocaleString('id-ID')}</strong></p>
                                                        <p>💰 {wallets.find(w => w.id.toString() === data.to_wallet_id)?.name || 'Penerima'} menerima <strong>Rp {(parseAmount(data.amount) - parseAmount(data.admin_fee)).toLocaleString('id-ID')}</strong></p>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Kategori</label>
                                <select
                                    value={data.category}
                                    onChange={(e) => setData('category', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50"
                                    required
                                >
                                    <option value="">Pilih</option>
                                    {categories
                                        .filter(c => c.type === inputType)
                                        .map(cat => (
                                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                                        ))
                                    }
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Tanggal</label>
                                <input type="date" value={data.date} onChange={(e) => setData('date', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" required />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Deskripsi</label>
                            <input type="text" value={data.description} onChange={(e) => setData('description', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" placeholder="Makan siang" required />
                        </div>

                        <TagInput
                            availableTags={userTags || []}
                            selectedTags={selectedTags}
                            onChange={setSelectedTags}
                        />

                        <div className="flex space-x-3 pt-4">
                            <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors active:scale-95">Batal</button>
                            <button type="submit" disabled={processing} className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-transform disabled:opacity-50">
                                {processing ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
}
