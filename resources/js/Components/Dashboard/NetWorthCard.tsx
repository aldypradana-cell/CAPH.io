import React from 'react';
import { Gem } from 'lucide-react';

interface NetWorthCardProps {
    amount: number;
}

const formatIDR = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

export default function NetWorthCard({ amount }: NetWorthCardProps) {
    return (
        <div className="bg-gradient-to-r from-[#2e1065] via-[#4c1d95] to-[#7c3aed] p-5 px-8 rounded-[2rem] shadow-2xl shadow-violet-900/40 flex items-center gap-6 hover:scale-[1.01] transition-all duration-500 animate-fade-in-up group relative overflow-hidden h-fit w-full md:w-auto md:min-w-[380px] border border-violet-500/20">
            {/* Background Effects */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute -right-10 -top-20 w-40 h-40 bg-fuchsia-500 rounded-full blur-3xl group-hover:bg-fuchsia-400 transition-colors duration-500" />
                <div className="absolute -left-10 -bottom-20 w-40 h-40 bg-indigo-500 rounded-full blur-3xl group-hover:bg-indigo-400 transition-colors duration-500" />
            </div>

            {/* Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out" />

            <div className="p-3.5 bg-gradient-to-br from-white/20 to-white/5 text-white rounded-2xl backdrop-blur-md relative z-10 shadow-inner border border-white/10">
                <Gem className="w-6 h-6 text-violet-100" />
            </div>

            <div className="relative z-10 flex flex-col">
                <p className="text-[11px] font-bold text-violet-200 uppercase tracking-[0.2em] mb-1 opacity-90 drop-shadow-sm">Total Kekayaan Bersih</p>
                <div className="flex items-baseline gap-1">
                    <p className="text-3xl font-black text-white tracking-tight drop-shadow-lg filter">{formatIDR(amount)}</p>
                </div>
            </div>

            <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-black/10 to-transparent pointer-events-none" />
        </div>
    );
}
