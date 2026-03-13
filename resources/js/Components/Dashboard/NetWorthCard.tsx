import { Diamond as Gem, Tree } from '@phosphor-icons/react';
import { useState } from 'react';
import WealthTreePopup from '../Analytics/WealthTreePopup';

interface NetWorthCardProps {
    amount: number;
}

const formatIDR = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

export default function NetWorthCard({ amount }: NetWorthCardProps) {
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    return (
        <>
            <div 
                onClick={() => setIsPopupOpen(true)}
                className="glass-premium-heavy p-4 px-4 sm:p-6 sm:px-10 rounded-[2.5rem] shadow-2xl shadow-indigo-500/30 flex items-center gap-5 sm:gap-8 hover:scale-[1.01] active:scale-[0.99] transition-all duration-700 animate-fade-in-up group relative overflow-hidden h-fit w-full md:w-auto md:min-w-[420px] isolate cursor-pointer"
                style={{ transform: 'translateZ(0)' }} // Force GPU layer for perfect clipping
            >
                {/* Elegant Background Refraction */}
                <div className="absolute inset-0 opacity-40 dark:opacity-50 -z-20">
                    <div className="absolute -right-20 -top-20 w-80 h-80 bg-fuchsia-600/30 rounded-full blur-[100px] group-hover:bg-fuchsia-500/40 transition-all duration-1000" />
                    <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-600/30 rounded-full blur-[100px] group-hover:bg-indigo-50/10 transition-all duration-1000" />
                </div>

                {/* Premium Shine Layer - Fixed Clipping with explicit container */}
                <div className="absolute inset-0 z-[-10] rounded-[2.5rem] overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 translate-y-full group-hover:translate-y-[-100%] transition-transform duration-1000 ease-in-out will-change-transform" />
                </div>

                <div className="p-3.5 sm:p-4.5 bg-gradient-to-br from-white/30 to-white/5 text-white rounded-[1.5rem] backdrop-blur-xl relative z-10 shadow-2xl ring-2 ring-white/50 dark:ring-white/20 group-hover:scale-110 transition-transform duration-500">
                    <Gem weight="duotone" className="w-8 h-8 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                </div>

                <div className="relative z-10 flex flex-col">
                    <div className="flex items-center gap-2 mb-1.5 ">
                        <p className="text-[10px] font-black text-indigo-800 dark:text-violet-100 uppercase tracking-[0.3em] opacity-80 drop-shadow-sm">Net Worth Total</p>
                        <div className="p-1 bg-white/20 rounded-md group-hover:bg-emerald-500/30 transition-colors">
                            <Tree weight="fill" className="w-2.5 h-2.5 text-white" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter drop-shadow-md select-all">{formatIDR(amount)}</p>
                    </div>
                </div>

                {/* Mirrored Edge Reflection */}
                <div className="absolute right-0 top-0 h-full w-48 bg-gradient-to-l from-white/20 dark:from-white/5 to-transparent pointer-events-none" />
            </div>

            <WealthTreePopup isOpen={isPopupOpen} onClose={() => setIsPopupOpen(false)} />
        </>
    );
}
