import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendUp as TrendingUp, ChartBar as BarChart3, DotsSixVertical as GripHorizontal } from '@phosphor-icons/react';

interface NetFlowChartProps {
    data: any[];
    isLoading: boolean;
}

const formatShortIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
                <p className="font-bold text-slate-800 dark:text-white mb-3 text-sm">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
                        <div className="flex justify-between w-full min-w-[120px] gap-4">
                            <span className="text-slate-500 dark:text-slate-400 text-xs font-medium capitalize">{entry.name}</span>
                            <span className="font-bold text-slate-800 dark:text-white text-xs">
                                {formatShortIDR(entry.value)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function NetFlowChart({ data, isLoading }: NetFlowChartProps) {
    const [chartType, setChartType] = useState<'AREA' | 'BAR'>('BAR');

    return (
        <div className="flex flex-col h-full relative" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 sm:p-2.5 bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 rounded-xl relative group cursor-grab active:cursor-grabbing shrink-0">
                        {chartType === 'AREA' ? (
                            <TrendingUp weight="duotone" className="w-4 h-4 sm:w-5 sm:h-5" />
                        ) : (
                            <BarChart3 weight="duotone" className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                        <GripHorizontal weight="bold" className="w-4 h-4 sm:w-5 sm:h-5 absolute top-2 sm:top-2.5 left-2 sm:left-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-bold text-slate-800 dark:text-white text-base sm:text-lg truncate">Arus Kas Bersih</h4>
                        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate hidden sm:block">Pergerakan Net bulanan</p>
                    </div>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
                    <button
                        onClick={() => setChartType('BAR')}
                        className={`p-1.5 rounded-lg transition-all active:scale-95 ${chartType === 'BAR' ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                        <BarChart3 weight="duotone" className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setChartType('AREA')}
                        className={`p-1.5 rounded-lg transition-all active:scale-95 ${chartType === 'AREA' ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                        <TrendingUp weight="duotone" className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex-1 w-full min-h-[300px]">
                {isLoading ? (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-300"></div>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        {chartType === 'AREA' ? (
                            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="opacity-50 dark:opacity-20" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => formatShortIDR(val)} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                <Area type="monotone" dataKey="net" name="Net Flow" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorNet)" />
                            </AreaChart>
                        ) : (
                            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={12}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="opacity-50 dark:opacity-20" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => formatShortIDR(val)} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent', opacity: 0.1 }} />
                                <Bar dataKey="net" name="Net Flow" radius={[4, 4, 4, 4]}>
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.net >= 0 ? '#10b981' : '#f43f5e'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
