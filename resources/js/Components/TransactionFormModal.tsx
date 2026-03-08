import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useForm, router } from '@inertiajs/react';
import { X, TrendingDown, TrendingUp, ArrowRightLeft, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import TagInput from '@/Components/TagInput';
import { WalletData, CategoryData, TagData } from '@/types/dashboard';

interface EditableTransaction {
    id: number;
    date: string;
    description: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    category: string;
    wallet: { id: number; name: string } | null;
    to_wallet?: { id: number; name: string } | null;
    tags?: { id: number; name: string; slug: string; color: string | null }[];
}

interface TransactionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    wallets: WalletData[] | { id: number; name: string }[];
    categories: CategoryData[] | { id: number; name: string; type: string }[];
    userTags: TagData[] | { id: number; name: string; slug: string; color: string | null }[];
    editingTransaction?: EditableTransaction | null;
}

export default function TransactionFormModal({
    isOpen, onClose, wallets, categories, userTags, editingTransaction = null
}: TransactionFormModalProps) {
    const [inputType, setInputType] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER'>('EXPENSE');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [mounted, setMounted] = useState(false);
    const [showAdminFee, setShowAdminFee] = useState(false);
    const [payLaterEnabled, setPayLaterEnabled] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Load PayLater preference from localStorage
        const storedPref = localStorage.getItem('caph_paylater_enabled');
        if (storedPref === 'true') {
            setPayLaterEnabled(true);
        }
    }, []);

    const togglePayLaterFeature = () => {
        const newValue = !payLaterEnabled;
        setPayLaterEnabled(newValue);
        localStorage.setItem('caph_paylater_enabled', newValue.toString());
        if (!newValue) {
            setData('is_paylater', false);
        }
    };
    // Helper to find primary wallet
    const getPrimaryWalletId = () => {
        const primary = (wallets as any[]).find(w => w.is_primary);
        return primary ? primary.id.toString() : '';
    };

    const { data, setData, processing, reset } = useForm({
        wallet_id: getPrimaryWalletId(),
        to_wallet_id: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        type: 'EXPENSE' as 'INCOME' | 'EXPENSE' | 'TRANSFER',
        category: '',
        tags: [] as string[],
        admin_fee: '',
        admin_fee_from: 'sender' as 'sender' | 'receiver',
        is_paylater: false,
        paylater_lender: '',
        paylater_tenor: 1,
        paylater_due_day: new Date().getDate(),
    });

    // Prefill form when editing or resetting for new
    useEffect(() => {
        if (isOpen) {
            if (editingTransaction) {
                setInputType(editingTransaction.type);
                setSelectedTags(editingTransaction.tags?.map(t => t.name) || []);
                setData({
                    wallet_id: editingTransaction.wallet?.id?.toString() || '',
                    to_wallet_id: editingTransaction.to_wallet?.id?.toString() || '',
                    date: editingTransaction.date,
                    description: editingTransaction.description,
                    amount: Number(editingTransaction.amount).toLocaleString('id-ID'),
                    type: editingTransaction.type,
                    category: editingTransaction.category,
                    tags: editingTransaction.tags?.map(t => t.name) || [],
                    admin_fee: '',
                    admin_fee_from: 'sender' as 'sender' | 'receiver',
                    is_paylater: editingTransaction.type === 'EXPENSE' && !editingTransaction.wallet,
                    paylater_lender: '',
                    paylater_tenor: 1,
                    paylater_due_day: new Date().getDate(),
                });
            } else {
                // New transaction: ensure primary wallet is selected if available and not already set
                setData('wallet_id', getPrimaryWalletId());
            }
        }
    }, [editingTransaction, isOpen, wallets]);

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
        const payload = {
            ...data,
            type: inputType,
            amount: parseAmount(data.amount).toString(),
            tags: selectedTags,
            admin_fee: data.admin_fee ? parseAmount(data.admin_fee).toString() : '0',
            admin_fee_from: data.admin_fee_from,
        };

        const successCallback = () => {
            handleClose();
            toast.success(editingTransaction ? 'Diperbarui!' : 'Ditambahkan!');
        };

        if (editingTransaction) {
            router.put(route('transactions.update', editingTransaction.id), payload, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: successCallback,
            });
        } else {
            router.post(route('transactions.store'), payload, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: successCallback,
            });
        }
    };

    const handleClose = () => {
        onClose();
        reset();
        // Force reset wallet_id to primary wallet, as reset() uses the very initial form state values
        setData('wallet_id', getPrimaryWalletId());
        setSelectedTags([]);
        setShowAdminFee(false);
        setInputType('EXPENSE');
        setData('is_paylater', false);
    };

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity" onClick={handleClose} />
            <div className="relative w-full max-w-md glass-card rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-pop-in">
                {/* Gradient top bar */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-10" />

                {/* Header */}
                <div className="p-5 pb-0 shrink-0">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                            {editingTransaction ? 'Edit Transaksi' : 'Transaksi Baru'}
                        </h3>
                        <div className="flex items-center gap-2">
                            {/* PayLater Settings Toggle */}
                            {!editingTransaction && (
                                <div className="relative group">
                                    <button
                                        type="button"
                                        onClick={togglePayLaterFeature}
                                        className={`p-1.5 rounded-xl transition-all ${
                                            payLaterEnabled
                                                ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
                                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-700'
                                        }`}
                                        title={payLaterEnabled ? 'Matikan menu PayLater' : 'Tampilkan menu PayLater'}
                                    >
                                        <Clock className="w-5 h-5" />
                                    </button>
                                </div>
                            )}

                            <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
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
                                        is_paylater: false,
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
                            <input type="tel" inputMode="numeric" autoComplete="off" value={data.amount} onChange={(e) => handleAmountChange(e.target.value)} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-2xl text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50 text-center" placeholder="0" autoFocus required />
                        </div>

                        {!data.is_paylater && (
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Dompet</label>
                                <select value={data.wallet_id} onChange={(e) => setData('wallet_id', e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" required={!data.is_paylater}>
                                    <option value="">Pilih Dompet</option>
                                    {wallets.map(w => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* PayLater Toggle Checkbox (Hanya untuk EXPENSE dan jika fitur diaktifkan) */}
                        {inputType === 'EXPENSE' && payLaterEnabled && (
                            <div className="pt-1 pb-2 border-b border-slate-100 dark:border-slate-800">
                                <label 
                                    className="flex items-center gap-2 cursor-pointer group"
                                    onClick={() => setData('is_paylater', !data.is_paylater)}
                                >
                                    <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${data.is_paylater ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700 group-hover:bg-slate-300 dark:group-hover:bg-slate-600'}`}>
                                        {data.is_paylater && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                                    </div>
                                    <span className={`text-sm font-medium transition-colors ${data.is_paylater ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-300'}`}>
                                        Bayar pakai PayLater / Cicil
                                    </span>
                                </label>

                                {/* PayLater Expanded Fields */}
                                {data.is_paylater && (
                                    <div className="mt-3 p-3.5 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-2xl space-y-3 animate-fade-in">
                                        <div>
                                            <label className="text-[10px] font-bold text-amber-700/70 dark:text-amber-500/70 uppercase tracking-widest block mb-1 ml-1">Nama Layanan (Kredivo, SpayLater, dll)</label>
                                            <input
                                                type="text"
                                                value={data.paylater_lender}
                                                onChange={(e) => setData('paylater_lender', e.target.value)}
                                                className="w-full px-3 py-2 border border-amber-200/60 dark:border-amber-700/40 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none text-slate-900 dark:text-white bg-white dark:bg-slate-900/50"
                                                placeholder="Cnth: Kredivo"
                                                required={data.is_paylater}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] font-bold text-amber-700/70 dark:text-amber-500/70 uppercase tracking-widest block mb-1 ml-1">Tenor Cicilan</label>
                                                <select
                                                    value={data.paylater_tenor}
                                                    onChange={(e) => setData('paylater_tenor', parseInt(e.target.value))}
                                                    className="w-full px-3 py-2 border border-amber-200/60 dark:border-amber-700/40 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none text-slate-900 dark:text-white bg-white dark:bg-slate-900/50"
                                                >
                                                    {[1, 2, 3, 6, 12, 24].map(months => (
                                                        <option key={months} value={months}>{months} Bulan</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-amber-700/70 dark:text-amber-500/70 uppercase tracking-widest block mb-1 ml-1">Tgl Jatuh Tempo</label>
                                                <select
                                                    value={data.paylater_due_day}
                                                    onChange={(e) => setData('paylater_due_day', parseInt(e.target.value))}
                                                    className="w-full px-3 py-2 border border-amber-200/60 dark:border-amber-700/40 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none text-slate-900 dark:text-white bg-white dark:bg-slate-900/50"
                                                >
                                                    {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                                                        <option key={day} value={day}>Setiap tgl {day}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        
                                        {/* Preview Cicilan */}
                                        {parseAmount(data.amount) > 0 && (
                                            <div className="mt-2 pt-2 border-t border-amber-200/50 dark:border-amber-800/30 flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium text-xs">
                                                <Clock className="w-4 h-4" />
                                                <span>Estimasi Cicilan: <strong>Rp {Math.round(parseAmount(data.amount) / data.paylater_tenor).toLocaleString('id-ID')}</strong> / bulan</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

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

                        {/* Admin Fee Toggle — tampil untuk EXPENSE dan TRANSFER, tetapi DISEMBUNYIKAN jika PayLater aktif */}
                        {(inputType === 'EXPENSE' || inputType === 'TRANSFER') && !data.is_paylater && (
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
                                        .filter((c: any) => c.type === inputType && c.name !== 'Investasi Emas')
                                        .map((cat: any) => (
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
                            <button type="button" onClick={handleClose} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors active:scale-95">Batal</button>
                            <button type="submit" disabled={processing} className={`flex-1 py-3 text-white rounded-2xl text-sm font-bold shadow-lg hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 ${data.is_paylater ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/30' : 'bg-gradient-to-r from-indigo-600 to-violet-600 shadow-indigo-500/30'}`}>
                                {processing ? 'Menyimpan...' : (data.is_paylater ? 'Simpan (PayLater 🕒)' : 'Simpan')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
}
