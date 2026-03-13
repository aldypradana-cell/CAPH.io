import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, TrendUp, Warning, Trophy, ChartBar, Coins } from '@phosphor-icons/react';
import axios from 'axios';
import WealthTreeVoxel from './WealthTreeVoxel';
import confetti from 'canvas-confetti';

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

    useEffect(() => {
        if (isOpen) {
            fetchData();
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
            case 1: return 'Tunas Kestabilan';
            case 2: return 'Pohon Pertumbuhan';
            case 3: return 'Rimbun Keamanan';
            case 4: return 'Hutan Kebebasan';
            case 5: return 'Emas Kemakmuran';
            default: return 'Tunas';
        }
    };

    const getLevelColor = (level: number) => {
        if (data?.isWithering) return { from: 'from-amber-600', to: 'to-orange-700', text: 'text-amber-500', bg: 'bg-amber-500', shadow: 'shadow-amber-500/20' };
        switch (level) {
            case 5: return { from: 'from-yellow-400', to: 'to-amber-500', text: 'text-yellow-500', bg: 'bg-yellow-500', shadow: 'shadow-yellow-500/20' };
            case 4: return { from: 'from-emerald-400', to: 'to-teal-600', text: 'text-emerald-400', bg: 'bg-emerald-500', shadow: 'shadow-emerald-500/20' };
            case 3: return { from: 'from-emerald-400', to: 'to-green-600', text: 'text-emerald-400', bg: 'bg-emerald-500', shadow: 'shadow-emerald-500/20' };
            case 2: return { from: 'from-teal-400', to: 'to-cyan-600', text: 'text-teal-400', bg: 'bg-teal-500', shadow: 'shadow-teal-500/20' };
            default: return { from: 'from-green-400', to: 'to-emerald-600', text: 'text-green-400', bg: 'bg-green-500', shadow: 'shadow-green-500/20' };
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
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-2xl" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-600"
                            enterFrom="opacity-0 translate-y-12 scale-90"
                            enterTo="opacity-100 translate-y-0 scale-100"
                            leave="ease-in duration-300"
                            leaveFrom="opacity-100 translate-y-0 scale-100"
                            leaveTo="opacity-0 translate-y-12 scale-90"
                        >
                            <Dialog.Panel className="relative w-full max-w-md overflow-hidden">
                                {/* Close Button */}
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 backdrop-blur-md text-white/60 hover:text-white hover:bg-white/20 transition-all z-50 border border-white/10"
                                >
                                    <X weight="bold" className="w-4 h-4" />
                                </button>

                                {/* ======= TREE SECTION (Full Width, Big) ======= */}
                                <div className="relative w-full h-[340px] flex items-center justify-center">
                                    {/* Subtle ambient background */}
                                    <div className={`absolute inset-0 bg-gradient-to-b ${colors.from} ${colors.to} opacity-[0.06] rounded-t-[2rem]`} />
                                    
                                    {loading ? (
                                        <div className="animate-pulse w-32 h-32 rounded-full bg-white/5 blur-2xl" />
                                    ) : (
                                        <WealthTreeVoxel 
                                            level={data?.level || 1} 
                                            isWithering={data?.isWithering}
                                            className="w-full h-full"
                                        />
                                    )}
                                    
                                    {/* Withering Badge */}
                                    {data?.isWithering && (
                                        <div className="absolute top-4 left-4 px-3 py-1.5 bg-amber-500/15 backdrop-blur-md rounded-xl border border-amber-500/30 flex items-center gap-2">
                                            <Warning weight="fill" className="w-4 h-4 text-amber-400" />
                                            <span className="text-[11px] font-bold text-amber-300">Pohon Layu!</span>
                                        </div>
                                    )}
                                </div>

                                {/* ======= INFO CARD (Glassmorphism) ======= */}
                                <div className="relative bg-white/[0.08] dark:bg-white/[0.04] backdrop-blur-2xl rounded-[2rem] border border-white/10 mx-2 -mt-8 p-6 pb-7 shadow-2xl">
                                    {/* Level Badge & Title */}
                                    <div className="flex flex-col items-center text-center mb-5">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r ${colors.from} ${colors.to} text-white text-[10px] font-black uppercase tracking-[0.2em] mb-2 shadow-lg ${colors.shadow}`}>
                                            <Trophy weight="fill" className="w-3 h-3" />
                                            Level {data?.level || 1}
                                        </div>
                                        <h3 className="text-xl font-black text-white tracking-tight">
                                            {getLevelName(data?.level || 1)}
                                        </h3>
                                        <p className="text-white/40 text-xs font-medium mt-0.5">
                                            Evolusi Kekayaan Berdasarkan Gaya Hidup
                                        </p>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-5">
                                        <div className="flex justify-between items-center mb-2 px-0.5">
                                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                                Menuju Level {data?.nextLevel || 2}
                                            </span>
                                            <span className={`text-sm font-black ${colors.text}`}>
                                                {Math.round(data?.progress || 0)}%
                                            </span>
                                        </div>
                                        <div className="h-2.5 w-full bg-white/[0.06] rounded-full overflow-hidden border border-white/[0.08]">
                                            <div 
                                                className={`h-full bg-gradient-to-r ${colors.from} ${colors.to} rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(16,185,129,0.4)]`}
                                                style={{ width: `${data?.progress || 0}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                                            <div className="flex items-center gap-1.5 text-white/30 text-[9px] font-black uppercase tracking-wider mb-1">
                                                <ChartBar weight="duotone" className="w-3 h-3" /> Net Worth
                                            </div>
                                            <p className="text-sm font-bold text-white truncate">
                                                {formatIDR(data?.netWorth || 0)}
                                            </p>
                                        </div>
                                        <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                                            <div className="flex items-center gap-1.5 text-white/30 text-[9px] font-black uppercase tracking-wider mb-1">
                                                <TrendUp weight="duotone" className="w-3 h-3" /> Skor Rasio
                                            </div>
                                            <p className="text-sm font-bold text-white">
                                                {data?.ratio?.toFixed(1) || '0.0'}x Biaya/Bln
                                            </p>
                                        </div>
                                    </div>

                                    {/* Goal Card */}
                                    {data && data.level < 5 && (
                                        <div className={`p-4 rounded-2xl bg-gradient-to-r ${colors.from} ${colors.to} shadow-xl ${colors.shadow} flex items-center justify-between`}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                                                    <Trophy weight="fill" className="w-4 h-4 text-white" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white/70">Target Berikutnya</p>
                                                    <p className="text-xs font-bold text-white truncate max-w-[160px]">+{formatIDR(data.neededForNext)}</p>
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0 ml-2">
                                                <p className="text-[10px] font-black text-white">LV.{data.nextLevel}</p>
                                                <p className="text-[9px] text-white/60 font-bold">NEXT</p>
                                            </div>
                                        </div>
                                    )}

                                    {data?.level === 5 && (
                                        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 shadow-xl shadow-amber-500/20 flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                                                <Coins weight="fill" className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white/70">Puncak Kekayaan</p>
                                                <p className="text-xs font-bold text-white">Kapitalis Keuangan Tercapai! 🎉</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Bottom spacing */}
                                <div className="h-2" />
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
