import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useState, useEffect, useRef } from 'react';
import {
    Lightning as Zap, Sparkle as Sparkles, Check, X, SpinnerGap as Loader2, TrendUp as TrendingUp, TrendDown as TrendingDown, Hash, Microphone as Mic, MicrophoneSlash as MicOff
} from '@phosphor-icons/react';
import toast, { Toaster } from 'react-hot-toast';
import { formatDateLocale } from '@/utils/date';

interface Wallet { id: number; name: string; is_archived?: boolean; }
interface Category { id: number; name: string; type: string; }
interface ParsedTransaction {
    description: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    category: string;
    date: string;
    tags?: string[];
}

const formatIDR = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

export default function SmartEntryIndex({ auth, wallets, categories, aiQuota: initialAiQuota }: PageProps<{ 
    wallets: Wallet[], 
    categories: Category[],
    aiQuota?: { used: number, limit: number, resetsAt: string }
}>) {
    const [input, setInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
    const [isParsing, setIsParsing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedWallet, setSelectedWallet] = useState(wallets.length > 0 ? wallets[0].id.toString() : '');
    const [aiQuota, setAiQuota] = useState(initialAiQuota);
    const recognitionRef = useRef<any>(null);
    const originalInputRef = useRef<string>('');

    const isQuotaExceeded = aiQuota ? aiQuota.used >= aiQuota.limit : false;

    const { data, setData, post, processing } = useForm({
        transactions: [] as ParsedTransaction[],
        wallet_id: '',
    });

    // Sync state to form data to ensure single-click submission works
    useEffect(() => {
        setData(d => ({ ...d, transactions: parsedTransactions, wallet_id: selectedWallet }));
    }, [parsedTransactions, selectedWallet]);

    const handleParse = async () => {
        if (!input.trim()) return;
        setIsParsing(true);
        setError(null);
        try {
            // Gunakan timeout 30 detik agar UI tidak gantung jika AI sedang sibuk
            const response = await window.axios.post(route('smart-entry.parse'), { input }, {
                timeout: 30000,
            });

            const result = response.data;
            if (result.success) {
                setParsedTransactions(result.transactions);
                toast.success(`${result.transactions.length} transaksi terdeteksi!`);
                if (result.quota) setAiQuota(result.quota);
            } else {
                setError(result.message || 'Gagal memproses input');
                if (result.quota) setAiQuota(result.quota);
            }
        } catch (e: any) {
            console.error(e);
            // Deteksi timeout secara spesifik agar pesan error lebih membantu
            if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
                setError('⏱️ Koneksi ke AI timeout. AI sedang sibuk atau internet lambat. Silakan coba lagi.');
            } else if (e.response?.status === 422) {
                setError(e.response.data?.errors?.message?.[0] || e.response.data?.message || 'Input tidak valid.');
            } else if (e.response?.status === 429) {
                setError(e.response?.data?.message || '⚡ Terlalu banyak permintaan. Mohon tunggu sebentar sebelum mencoba lagi.');
                if (e.response?.data?.used !== undefined) {
                    setAiQuota({ used: e.response.data.used, limit: e.response.data.limit, resetsAt: e.response.data.resetsAt });
                }
            } else {
                setError(e.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.');
            }
        } finally {
            setIsParsing(false);
        }
    };

    const handleConfirm = () => {
        if (!selectedWallet) {
            toast.error('Pilih dompet terlebih dahulu!');
            return;
        }
        // Data is already synced via useEffect
        post(route('smart-entry.confirm'), {
            onSuccess: () => {
                setParsedTransactions([]);
                setInput('');
                toast.success('Semua transaksi berhasil disimpan!');
            },
            onError: (errs) => {
                if (errs.message) toast.error(errs.message);
                else toast.error('Gagal menyimpan transaksi. Periksa kembali saldo dompet atau input Anda.');
            }
        });
    };

    const handleRemoveTransaction = (indexToRemove: number) => {
        setParsedTransactions(prev => prev.filter((_, i) => i !== indexToRemove));
    };

    const toggleListening = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            toast.error('Browser Anda tidak mendukung fitur input suara.');
            return;
        }

        if (isListening) {
            setIsListening(false);
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            return;
        }

        const SpeechRecognition: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        originalInputRef.current = input;

        recognition.lang = 'id-ID';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
            let sessionText = '';
            
            for (let i = 0; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                const currentTextTrimmed = sessionText.trim().toLowerCase();
                const newTranscriptTrimmed = transcript.trim().toLowerCase();

                // Android Chrome cumulative fix: 
                // Jika hasil baru diawali dengan hasil sebelumnya (prefix), kita gunakan yang baru saja.
                // Ini mencegah duplikasi teks yang sering terjadi di Android.
                if (currentTextTrimmed && newTranscriptTrimmed.startsWith(currentTextTrimmed)) {
                    sessionText = transcript;
                } else {
                    sessionText += (sessionText ? ' ' : '') + transcript;
                }
            }

            const base = originalInputRef.current;
            const currentSessionText = sessionText.trimStart();
            const separator = base.trim() && currentSessionText ? ' ' : '';
            setInput(base + separator + currentSessionText);
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            if (event.error === 'not-allowed') {
                toast.error('Izin microphone ditolak.');
            } else if (event.error !== 'aborted') {
                toast.error('Terjadi kesalahan pada input suara.');
            }
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        setIsListening(true);
        recognition.start();
    };

    return (
        <>
            <Head title="Input AI" />
            <Toaster position="top-right" />

            <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 animate-fade-in-up">
                {/* Hero - Hidden on mobile to prioritize input */}
                <div className="hidden md:block glass-card p-8 rounded-[2rem] text-center animate-fade-in-up">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-indigo-500/30">
                        <Sparkles weight="duotone" className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">AI Smart Entry</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                        Ketik transaksi dengan bahasa sehari-hari, AI akan otomatis memisahkan dan mengkategorikan!
                    </p>
                </div>

                {/* Input Area */}
                <div className="glass-card rounded-[2rem] p-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 ml-1">Tulis Transaksi Anda</label>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Contoh: beli nasi goreng 25ribu, kopi 10rb, bensin 50000"
                        rows={4}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50 resize-none"
                    />
                    <div className="flex items-center justify-between mt-3">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-bold">
                                <Sparkles weight="fill" className="w-3 h-3 text-indigo-500" /> Powered by Gemini
                            </span>
                            {aiQuota && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${isQuotaExceeded ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                    {isQuotaExceeded ? (
                                        <>🔴 Kuota Habis · Reset besok pukul 00:00</>
                                    ) : (
                                        <>{aiQuota.limit === 999999 ? '👑 Admin: Tanpa Batas' : `${aiQuota.used}/${aiQuota.limit} dipakai hari ini`}</>
                                    )}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleListening}
                                type="button"
                                className={`flex items-center justify-center w-10 h-10 rounded-2xl transition-all shadow-sm ${
                                    isListening 
                                        ? 'bg-red-500 text-white animate-pulse shadow-red-500/30' 
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                                title={isListening ? "Hentikan mendengarkan" : "Ketik pakai suara"}
                            >
                                {isListening ? <MicOff weight="duotone" className="w-5 h-5" /> : <Mic weight="duotone" className="w-5 h-5" />}
                            </button>
                            <button
                                onClick={handleParse}
                                disabled={isParsing || !input.trim() || isQuotaExceeded}
                                className={`flex items-center px-5 py-2.5 rounded-2xl text-sm font-bold transition-all transition-transform ${isQuotaExceeded ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'}`}
                            >
                                {isParsing ? (
                                    <><Loader2 weight="bold" className="w-4 h-4 mr-2 animate-spin" /> Memproses...</>
                                ) : (
                                    <><Zap weight="fill" className="w-4 h-4 mr-2" /> Analisis</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-center justify-between gap-3 animate-pop-in">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
                                <X weight="bold" className="w-4 h-4 text-red-500" />
                            </div>
                            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                        </div>
                        <button 
                            onClick={handleParse} 
                            disabled={isParsing || isQuotaExceeded}
                            className="px-3 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0"
                        >
                            Coba Lagi
                        </button>
                    </div>
                )}

                {/* Results */}
                {parsedTransactions.length > 0 && (
                    <div className="glass-card rounded-[2rem] p-6 space-y-4 animate-pop-in">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center">
                            <Check weight="bold" className="w-5 h-5 mr-2 text-emerald-500" />
                            Transaksi Terdeteksi ({parsedTransactions.length})
                        </h3>

                        <div className="space-y-3">
                            {parsedTransactions.map((t, idx) => (
                                <div key={idx} className={`flex items-center justify-between p-4 rounded-2xl border-l-4 ${t.type === 'INCOME' ? 'border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-l-red-500 bg-red-50/50 dark:bg-red-900/10'} transition-all animate-pop-in`} style={{ animationDelay: `${idx * 80}ms` }}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${t.type === 'INCOME' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600' : 'bg-red-100 dark:bg-red-900/40 text-red-600'}`}>
                                            {t.type === 'INCOME' ? <TrendingUp weight="bold" className="w-4 h-4" /> : <TrendingDown weight="bold" className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 dark:text-white">{t.description}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                <span className="text-[10px] text-slate-400">{t.category} · {formatDateLocale(t.date)}</span>
                                                {t.tags && t.tags.length > 0 && t.tags.map((tag, ti) => (
                                                    <span key={ti} className="inline-flex items-center gap-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded-full">
                                                        <Hash weight="bold" className="w-2.5 h-2.5" />{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className={`text-base font-bold ${t.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {t.type === 'INCOME' ? '+' : '-'}{formatIDR(t.amount)}
                                        </span>
                                        <button 
                                            onClick={() => handleRemoveTransaction(idx)}
                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all active:scale-95"
                                            title="Batal tambahkan transaksi ini"
                                        >
                                            <X weight="bold" className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">Simpan ke Dompet</label>
                                <select value={selectedWallet} onChange={(e) => setSelectedWallet(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50" required>
                                    <option value="">Pilih Dompet</option>
                                    {wallets.filter(w => !w.is_archived).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setParsedTransactions([])} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors active:scale-95">Batal</button>
                                <button onClick={handleConfirm} disabled={processing} className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-transform disabled:opacity-50">
                                    {processing ? 'Menyimpan...' : 'Konfirmasi & Simpan'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Examples */}
                <div className="glass-card rounded-[2rem] p-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-3">💡 Contoh Input:</h3>
                    <div className="space-y-2">
                        {[
                            'beli nasi goreng 25ribu, kopi susu 15rb #nongkrong, parkir 5000',
                            'terima gaji 5 juta, bonus 500ribu #rezeki',
                            'beli rokok surya 30rb #boros, bayar listrik 300rb'
                        ].map((ex, i) => (
                            <div key={i} onClick={() => setInput(ex)} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-sm text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800">
                                "{ex}"
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

SmartEntryIndex.layout = (page: any) => (
    <AppLayout header={
        <div className="flex flex-col min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-white tracking-tight truncate">Input Cerdas AI</h1>
                <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">Masukkan transaksi dengan bahasa natural</p>
        </div>
    }>
        {page}
    </AppLayout>
);
