import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, TrendUp, Warning, Trophy, ChartBar, Coins, CaretDown, CaretUp, Info } from '@phosphor-icons/react';
import axios from 'axios';
import WealthTreeVoxel from './WealthTreeVoxel';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

interface WealthTreePopupProps {
    isOpen: boolean;
    onClose: () => void;
}

interface WealthData {
    totalNetWorth: number;
    liquidNetWorth: number;
    netWorth?: number; // Fallback
    avgMonthlyExpense: number;
    ratio: number;
    level: number;
    progress: number;
    maxLevel: number;
    isWithering: boolean;
    neededForNext: number;
    nextLevel: number;
}

const formatIDR = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

export default function WealthTreePopup({ isOpen, onClose }: WealthTreePopupProps) {
    const [data, setData] = useState<WealthData | null>(null);
    const [loading, setLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showInfo, setShowInfo] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchData();
            setIsExpanded(false); // Reset on open
        }
    }, [isOpen]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('api.analytics.wealthTree'));
            const newData = response.data;
            
            if (data && newData.level > data.level) {
                triggerCelebration();
            }
            
            setData(newData);
        } catch (error) {
            console.error('Error fetching wealth tree data:', error);
        } finally {
            setLoading(false);
        }
    };

    const triggerCelebration = () => {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };
        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: ReturnType<typeof setInterval> = setInterval(function() {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);
            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    };

    const getLevelName = (level: number) => {
        switch (level) {
            case 1: return 'Benih Harapan';
            case 2: return 'Tunas Pertama';
            case 3: return 'Anakan Tumbuh';
            case 4: return 'Pohon Muda';
            case 5: return 'Pohon Berkembang';
            case 6: return 'Pohon Subur';
            case 7: return 'Pohon Matang';
            case 8: return 'Pohon Agung';
            case 9: return 'Pohon Berkilau';
            case 10: return 'Emas Dewa';
            default: return 'Benih';
        }
    };

    const getLevelColor = (level: number) => {
        if (data?.isWithering) return { from: 'from-amber-600', to: 'to-orange-700', text: 'text-amber-500', bg: 'bg-amber-500', shadow: 'shadow-amber-500/20' };
        switch (level) {
            case 10: return { from: 'from-yellow-300', to: 'to-amber-500', text: 'text-yellow-400', bg: 'bg-yellow-400', shadow: 'shadow-yellow-400/30' };
            case 9: return { from: 'from-yellow-400', to: 'to-amber-600', text: 'text-yellow-500', bg: 'bg-yellow-500', shadow: 'shadow-yellow-500/20' };
            case 8: return { from: 'from-emerald-300', to: 'to-teal-500', text: 'text-emerald-300', bg: 'bg-emerald-400', shadow: 'shadow-emerald-400/20' };
            case 7: return { from: 'from-emerald-400', to: 'to-teal-600', text: 'text-emerald-400', bg: 'bg-emerald-500', shadow: 'shadow-emerald-500/20' };
            case 6: return { from: 'from-emerald-400', to: 'to-green-600', text: 'text-emerald-400', bg: 'bg-emerald-500', shadow: 'shadow-emerald-500/20' };
            case 5: return { from: 'from-green-400', to: 'to-emerald-600', text: 'text-green-400', bg: 'bg-green-500', shadow: 'shadow-green-500/20' };
            case 4: return { from: 'from-green-400', to: 'to-green-600', text: 'text-green-400', bg: 'bg-green-500', shadow: 'shadow-green-500/20' };
            case 3: return { from: 'from-teal-400', to: 'to-cyan-600', text: 'text-teal-400', bg: 'bg-teal-500', shadow: 'shadow-teal-500/20' };
            case 2: return { from: 'from-teal-400', to: 'to-green-600', text: 'text-teal-400', bg: 'bg-teal-500', shadow: 'shadow-teal-500/20' };
            default: return { from: 'from-green-500', to: 'to-emerald-700', text: 'text-green-500', bg: 'bg-green-600', shadow: 'shadow-green-600/20' };
        }
    };

    const colors = getLevelColor(data?.level || 1);


    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[1000]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-500"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-3xl" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-600"
                            enterFrom="opacity-0 translate-y-24 scale-95"
                            enterTo="opacity-100 translate-y-0 scale-100"
                            leave="ease-in duration-300"
                            leaveFrom="opacity-100 translate-y-0 scale-100"
                            leaveTo="opacity-0 translate-y-24 scale-95"
                        >
                            <Dialog.Panel className="relative w-full max-w-xl rounded-[2rem] overflow-hidden">
                                {/* Action Buttons */}
                                <div className="absolute top-6 right-6 flex items-center gap-3 z-50">
                                    <button
                                        onClick={() => setShowInfo(!showInfo)}
                                        className={`p-2.5 rounded-full backdrop-blur-md transition-all border shadow-xl ${
                                            showInfo 
                                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                                            : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20 border-white/10'
                                        }`}
                                    >
                                        <Info weight="bold" className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="p-2.5 rounded-full bg-white/10 backdrop-blur-md text-white/60 hover:text-white hover:bg-white/20 transition-all border border-white/10 shadow-xl"
                                    >
                                        <X weight="bold" className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* ======= TREE SECTION ======= */}
                                <div className="relative w-full h-[550px] flex items-end justify-center pt-8">
                                    <div className={`absolute inset-0 bg-gradient-to-b ${colors.from} ${colors.to} opacity-[0.08] rounded-t-[3rem]`} />
                                    {loading ? (
                                        <div className="animate-pulse w-32 h-32 rounded-full bg-white/5 blur-3xl" />
                                    ) : (
                                        <WealthTreeVoxel level={data?.level || 1} isWithering={data?.isWithering} className="w-full h-full" />
                                    )}
                                    
                                    {/* Withering Badge */}
                                    {data?.isWithering && (
                                        <div className="absolute top-10 left-8 px-4 py-2 bg-amber-500/20 backdrop-blur-xl rounded-2xl border border-amber-500/40 flex items-center gap-2 shadow-2xl">
                                            <Warning weight="fill" className="w-5 h-5 text-amber-400" />
                                            <span className="text-xs font-black text-amber-300 tracking-wider">POHON LAYU</span>
                                        </div>
                                    )}

                                </div>

                                {/* ======= INFO OVERLAY (Full Modal Coverage) ======= */}
                                <AnimatePresence>
                                    {showInfo && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="absolute inset-0 z-40 bg-black/90 backdrop-blur-2xl rounded-[2rem] overflow-y-auto"
                                        >
                                            <div className="p-8 pt-20">
                                                <h3 className="text-lg font-black text-white tracking-tight mb-1">Panduan Evolusi</h3>
                                                <p className="text-white/50 text-xs mb-6 leading-relaxed">
                                                    Pohon ini hidup berdasarkan <strong className="text-white/70">Financial Runway</strong> — seberapa lama Anda bisa bertahan tanpa penghasilan baru.
                                                </p>

                                                <div className="space-y-4">
                                                    {/* Concept */}
                                                    <div className="bg-white/[0.04] border border-white/[0.08] p-4 rounded-2xl">
                                                        <div className="flex items-center gap-2.5 mb-2">
                                                            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                                                <ChartBar weight="duotone" className="w-3.5 h-3.5 text-emerald-400" />
                                                            </div>
                                                            <h4 className="text-white text-sm font-bold">Rumus Pertumbuhan</h4>
                                                        </div>
                                                        <p className="text-xs text-white/40 leading-relaxed ml-[38px]">
                                                            Level = <span className="text-emerald-400 font-bold bg-emerald-400/10 px-1.5 py-0.5 rounded">Net Worth ÷ Pengeluaran Bulanan</span>
                                                        </p>
                                                    </div>

                                                    {/* Target */}
                                                    <div className="bg-white/[0.04] border border-white/[0.08] p-4 rounded-2xl">
                                                        <div className="flex items-center gap-2.5 mb-3">
                                                            <div className="w-7 h-7 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                                                                <Trophy weight="duotone" className="w-3.5 h-3.5 text-yellow-500" />
                                                            </div>
                                                            <h4 className="text-white text-sm font-bold">10 Level Target</h4>
                                                        </div>
                                                        <div className="space-y-2 ml-[38px]">
                                                            <div className="flex items-start gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-white/20 mt-1.5 flex-shrink-0" />
                                                                <p className="text-xs text-white/40"><strong className="text-white/70">Lvl 1-3:</strong> Rawan. Ketahanan {'<'} 1 bulan.</p>
                                                            </div>
                                                            <div className="flex items-start gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/50 mt-1.5 flex-shrink-0" />
                                                                <p className="text-xs text-white/40"><strong className="text-white/70">Lvl 4-6:</strong> Aman. Cadangan 2-8 bulan.</p>
                                                            </div>
                                                            <div className="flex items-start gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-teal-400/70 mt-1.5 flex-shrink-0" />
                                                                <p className="text-xs text-white/40"><strong className="text-white/70">Lvl 7-9:</strong> Sangat Aman. Nafas 1-5 tahun.</p>
                                                            </div>
                                                            <div className="flex items-start gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1.5 flex-shrink-0 shadow-[0_0_6px_rgba(250,204,21,0.6)]" />
                                                                <p className="text-xs text-yellow-400/80"><strong className="text-yellow-400">Lvl 10:</strong> Merdeka Finansial (120x biaya).</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Withering */}
                                                    <div className="bg-amber-500/[0.04] border border-amber-500/15 p-4 rounded-2xl">
                                                        <div className="flex items-center gap-2.5 mb-2">
                                                            <div className="w-7 h-7 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                                                <Warning weight="duotone" className="w-3.5 h-3.5 text-amber-500" />
                                                            </div>
                                                            <h4 className="text-amber-400 text-sm font-bold">Pohon Layu</h4>
                                                        </div>
                                                        <p className="text-xs text-amber-500/50 leading-relaxed mb-2.5 ml-[38px]">
                                                            Pohon layu jika terkena krisis jangka pendek:
                                                        </p>
                                                        <div className="space-y-1.5 ml-[38px]">
                                                            <div className="flex items-start gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500/40 mt-1.5 flex-shrink-0" />
                                                                <p className="text-xs text-amber-500/50">Pengeluaran {'>'} Pemasukan bulan ini</p>
                                                            </div>
                                                            <div className="flex items-start gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500/40 mt-1.5 flex-shrink-0" />
                                                                <p className="text-xs text-amber-500/50">Saldo Dompet {'<'} Total Cicilan bulan depan</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* ======= INFO CARD (Expandable Glassmorphism) ======= */}
                                <motion.div 
                                    layout
                                    className="relative bg-white/[0.08] dark:bg-white/[0.03] backdrop-blur-3xl rounded-[2rem] border border-white/10 mx-4 -mt-12 p-5 shadow-2xl overflow-hidden cursor-pointer group"
                                    onClick={() => setIsExpanded(!isExpanded)}
                                >
                                    {/* Handle/Indicator */}
                                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors" />

                                    {/* Compact Header */}
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r ${colors.from} ${colors.to} shadow-lg ${colors.shadow}`}>
                                                <Trophy weight="fill" className="w-3.5 h-3.5 text-white" />
                                                <span className="text-[10px] font-black text-white uppercase tracking-wider">Lv.{data?.level || 1}</span>
                                            </div>
                                            <div>
                                                <h3 className="text-base font-black text-white tracking-tight leading-tight">
                                                    {getLevelName(data?.level || 1)}
                                                </h3>
                                                <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest">Wealth Tree</p>
                                            </div>
                                        </div>
                                        
                                        <motion.div 
                                            animate={{ rotate: isExpanded ? 180 : 0 }}
                                            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors"
                                        >
                                            <CaretDown weight="bold" className="w-4 h-4 text-white/40 group-hover:text-white/70" />
                                        </motion.div>
                                    </div>

                                    {/* Expanded Details */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                                animate={{ height: 'auto', opacity: 1, marginTop: 24 }}
                                                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                                className="overflow-hidden"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {/* Stats Grid */}
                                                <div className="grid grid-cols-2 gap-3 mb-5">
                                                    {/* Liquid Net Worth */}
                                                    <div className="col-span-2 bg-gradient-to-r from-white/[0.06] to-white/[0.02] rounded-2xl px-4 py-3 border border-white/[0.08]">
                                                        <div className="flex items-center gap-1.5 mb-1">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/80 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                                                            <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Aset Liquid (Tunai & Investasi)</p>
                                                        </div>
                                                        <p className="text-[15px] font-black text-white truncate pl-3">{formatIDR(data?.liquidNetWorth || data?.netWorth || 0)}</p>
                                                    </div>

                                                    {/* Avg Expense & Runway */}
                                                    <div className="bg-white/[0.04] rounded-xl px-3 py-2.5 border border-white/[0.06]">
                                                        <p className="text-[8px] font-bold text-white/25 uppercase tracking-wider mb-0.5">Rata-rata Pengeluaran</p>
                                                        <p className="text-xs font-black text-rose-300/80 truncate">{formatIDR(data?.avgMonthlyExpense || 0)}<span className="text-[8px] text-white/20 font-normal ml-1">/bln</span></p>
                                                    </div>
                                                    <div className="bg-white/[0.04] rounded-xl px-3 py-2.5 border border-white/[0.06]">
                                                        <div className="flex items-center gap-1 mb-0.5">
                                                            <p className="text-[8px] font-bold text-white/25 uppercase tracking-wider">Runway</p>
                                                            <span className="text-[7px] text-white/10 uppercase tracking-widest">(Ketahanan)</span>
                                                        </div>
                                                        <p className="text-xs font-black text-white">
                                                            {data?.ratio?.toFixed(1) || '0.0'}<span className="text-[9px] text-white/40 ml-0.5 font-bold uppercase tracking-wider">x Bln Nafas Hidup</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Progress Bar Section */}
                                                <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/[0.04]">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                                                            {data?.level === 10 ? 'Level Maksimum' : `Menuju Level ${data?.nextLevel || 2}`}
                                                        </span>
                                                        <span className={`text-[12px] font-black ${colors.text}`}>{Math.round(data?.progress || 0)}%</span>
                                                    </div>
                                                    <div className="h-2.5 w-full bg-black/20 rounded-full overflow-hidden border border-white/[0.05] mb-3">
                                                        <div
                                                            className={`h-full bg-gradient-to-r ${colors.from} ${colors.to} rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.2)]`}
                                                            style={{ width: `${data?.level === 10 ? 100 : (data?.progress || 0)}%` }}
                                                        />
                                                    </div>
                                                    
                                                    {/* Goal Hint */}
                                                    {data && data.level < 10 && (
                                                        <p className="text-[10px] text-white/40 text-center leading-relaxed">
                                                            Kumpulkan <span className={`font-black ${colors.text} bg-${colors.bg}/10 px-1 py-0.5 rounded`}>+{formatIDR(data.neededForNext)}</span> aset liquid lagi
                                                        </p>
                                                    )}
                                                    {data?.level === 10 && (
                                                        <p className="text-[10px] text-center font-black text-yellow-400/80">
                                                            🎉 Merdeka secara finansial!
                                                        </p>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>

                                {/* Bottom spacing */}
                                <div className="h-6" />
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
