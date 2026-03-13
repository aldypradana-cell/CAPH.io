import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, TrendUp, Warning, Trophy, ChartBar, Coins, CaretDown, CaretUp } from '@phosphor-icons/react';
import axios from 'axios';
import WealthTreeVoxel from './WealthTreeVoxel';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

interface WealthTreePopupProps {
    isOpen: boolean;
    onClose: () => void;
}

interface WealthData {
    netWorth: number;
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
                            <Dialog.Panel className="relative w-full max-w-lg overflow-hidden">
                                {/* Close Button */}
                                <button
                                    onClick={onClose}
                                    className="absolute top-6 right-6 p-2.5 rounded-full bg-white/10 backdrop-blur-md text-white/60 hover:text-white hover:bg-white/20 transition-all z-50 border border-white/10 shadow-xl"
                                >
                                    <X weight="bold" className="w-5 h-5" />
                                </button>

                                {/* ======= TREE SECTION ======= */}
                                <div className="relative w-full h-[450px] flex items-end justify-center pt-8">
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

                                {/* ======= INFO CARD (Glassmorphism) ======= */}
                                <motion.div 
                                    layout
                                    className="relative bg-white/[0.08] dark:bg-white/[0.03] backdrop-blur-3xl rounded-[2rem] border border-white/10 mx-4 -mt-12 p-6 shadow-2xl overflow-hidden cursor-pointer group"
                                    onClick={() => setIsExpanded(!isExpanded)}
                                >
                                    {/* Handle/Indicator */}
                                    <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors" />

                                    {/* Compact Header */}
                                    <div className="flex flex-col items-center text-center">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r ${colors.from} ${colors.to} text-white text-[9px] font-black uppercase tracking-[0.2em] mb-3 shadow-xl ${colors.shadow}`}>
                                            <Trophy weight="fill" className="w-3 h-3" />
                                            Level {data?.level || 1}
                                        </div>
                                        <h3 className="text-xl font-black text-white tracking-tight mb-0.5">
                                            {getLevelName(data?.level || 1)}
                                        </h3>
                                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-5">
                                            Evolusi Kekayaan
                                        </p>

                                        {/* Simplified Progress */}
                                        <div className="w-full mb-2">
                                            <div className="flex justify-between items-center mb-2 px-1">
                                                <span className="text-[10px] font-black text-white/30 tracking-widest uppercase">Progress Berikutnya</span>
                                                <span className={`text-sm font-black ${colors.text}`}>{Math.round(data?.progress || 0)}%</span>
                                            </div>
                                            <div className="h-2.5 w-full bg-white/[0.05] rounded-full overflow-hidden border border-white/[0.08]">
                                                <div 
                                                    className={`h-full bg-gradient-to-r ${colors.from} ${colors.to} rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(16,185,129,0.5)]`}
                                                    style={{ width: `${data?.progress || 0}%` }}
                                                />
                                            </div>
                                        </div>

                                        {!isExpanded && (
                                            <div className="flex items-center gap-1.5 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mt-2 group-hover:text-white/50 transition-colors">
                                                Lihat Detail <CaretDown weight="bold" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Expanded Details */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.4, ease: "circOut" }}
                                                className="mt-8 space-y-6"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {/* Stats Grid */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] transition-colors">
                                                        <div className="flex items-center gap-2 text-white/30 text-[9px] font-black uppercase tracking-wider mb-2">
                                                            <ChartBar weight="duotone" className="w-4 h-4" /> Net Worth
                                                        </div>
                                                        <p className="text-[15px] font-black text-white truncate">
                                                            {formatIDR(data?.netWorth || 0)}
                                                        </p>
                                                    </div>
                                                    <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] transition-colors">
                                                        <div className="flex items-center gap-2 text-white/30 text-[9px] font-black uppercase tracking-wider mb-2">
                                                            <TrendUp weight="duotone" className="w-4 h-4" /> Skor Rasio
                                                        </div>
                                                        <p className="text-[15px] font-black text-white">
                                                            {data?.ratio?.toFixed(1) || '0.0'}x Biaya
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Goal Section */}
                                                {data && data.level < 5 && (
                                                    <div className={`p-5 rounded-[2rem] bg-gradient-to-br ${colors.from} ${colors.to} shadow-2xl ${colors.shadow} flex items-center justify-between group/goal`}>
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 animate-pulse">
                                                                <Trophy weight="fill" className="w-5 h-5 text-white" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/70">Mencapai Level {data.nextLevel}</p>
                                                                <p className="text-sm font-black text-white truncate max-w-[150px]">+{formatIDR(data.neededForNext)}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right flex-shrink-0 bg-black/10 px-3 py-1.5 rounded-xl border border-white/10">
                                                            <p className="text-[11px] font-black text-white uppercase tracking-tighter">LV.{data.nextLevel}</p>
                                                            <p className="text-[8px] text-white/60 font-black uppercase">Next</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {data?.level === 5 && (
                                                    <div className="p-6 rounded-[2rem] bg-gradient-to-r from-yellow-400 to-amber-600 shadow-2xl shadow-yellow-500/30 flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                                                            <Coins weight="fill" className="w-6 h-6 text-white" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/80">Puncak Kekayaan</p>
                                                            <p className="text-[15px] font-black text-white">Financial Freedom Terwujud! 🎉</p>
                                                        </div>
                                                    </div>
                                                )}

                                                <button 
                                                    onClick={() => setIsExpanded(false)}
                                                    className="w-full py-3 flex items-center justify-center gap-2 text-[10px] font-black text-white/20 uppercase tracking-[0.3em] hover:text-white/40 transition-colors mt-2"
                                                >
                                                    Luncurkan Kembali <CaretUp weight="bold" />
                                                </button>
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
