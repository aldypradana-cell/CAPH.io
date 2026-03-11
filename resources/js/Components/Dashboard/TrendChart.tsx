import { useState } from 'react';
import { TrendUp as TrendingUp, ChartBar as BarChart3, DotsSix as GripHorizontal, Pulse } from '@phosphor-icons/react';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { ChartData, FilterState } from '@/types/dashboard';

interface TrendChartProps {
    data: ChartData[];
    filters: FilterState;
    activeFilter: string;
    onFilterChange: (filter: string) => void;
    onDateChange: (field: 'start' | 'end', value: string) => void;
    isLoading?: boolean;
    className?: string;
    style?: React.CSSProperties;
    onMouseDown?: React.MouseEventHandler;
    onMouseUp?: React.MouseEventHandler;
    onTouchEnd?: React.TouchEventHandler;
}

const formatIDR = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

const formatShortIDR = (amount: number) => {
    if (amount >= 1_000_000_000) return `Rp${(amount / 1_000_000_000).toFixed(1)}M`;
    if (amount >= 1_000_000) return `Rp${(amount / 1_000_000).toFixed(1)}Jt`;
    if (amount >= 1_000) return `Rp${(amount / 1_000).toFixed(0)}K`;
    return formatIDR(amount);
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 text-left cursor-auto select-text z-[9999]">
                <p className="text-sm font-bold text-slate-800 dark:text-white mb-3 text-center border-b border-slate-100 dark:border-slate-800 pb-2">{label}</p>
                <div className="space-y-2">
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-6 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full shadow-sm ring-2 ring-white dark:ring-slate-900" style={{ backgroundColor: entry.color }} />
                                <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{entry.name}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-slate-700 dark:text-slate-200 font-bold font-mono text-sm block">
                                    {formatIDR(entry.value)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

export default function TrendChart({
    data, filters, activeFilter, onFilterChange, onDateChange, isLoading,
    className, style, onMouseDown, onMouseUp, onTouchEnd
}: TrendChartProps) {
    const [chartType, setChartType] = useState<'AREA' | 'BAR'>('BAR');
    return (
        <div
            className={`glass-card p-3 sm:p-6 lg:p-8 rounded-[2rem] flex flex-col transition-all hover:shadow-lg duration-500 animate-fade-in-up h-full ${className || ''}`}
            style={style}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onTouchEnd={onTouchEnd}
        >
            <div className="flex flex-col mb-6 gap-4">
                <div className="flex flex-row items-start justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-2 sm:p-2.5 bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-xl relative group cursor-grab active:cursor-grabbing shrink-0">
                            {chartType === 'AREA' ? (
                                <TrendingUp weight="duotone" className="w-4 h-4 sm:w-5 sm:h-5 group-hover:opacity-0 transition-opacity duration-200" />
                            ) : (
                                <BarChart3 weight="duotone" className="w-4 h-4 sm:w-5 sm:h-5 group-hover:opacity-0 transition-opacity duration-200" />
                            )}
                            <GripHorizontal weight="bold" className="w-4 h-4 sm:w-5 sm:h-5 absolute top-2 sm:top-2.5 left-2 sm:left-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 drag-handle" />
                        </div>
                        <div className="min-w-0">
                            <h4 className="font-bold text-slate-800 dark:text-white text-base sm:text-lg truncate">Analisis Tren</h4>
                            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate hidden sm:block">Pemasukan vs Pengeluaran</p>
                        </div>
                    </div>
                    
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0" onMouseDown={(e) => e.stopPropagation()}>
                        <button
                                onClick={() => setChartType('BAR')}
                                title="Grafik Batang"
                                className={`p-1.5 rounded-lg transition-all active:scale-95 ${chartType === 'BAR' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                            >
                                <BarChart3 weight="duotone" className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setChartType('AREA')}
                                title="Grafik Garis Area"
                                className={`p-1.5 rounded-lg transition-all active:scale-95 ${chartType === 'AREA' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                            >
                                <TrendingUp weight="duotone" className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Row 2: Time Filter and Range */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-max overflow-x-auto scrollbar-hide">
                        {(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM'] as const).map(filter => (
                            <button
                                key={filter}
                                onClick={() => onFilterChange(filter)}
                                className={`px-2 py-1.5 sm:px-3 text-[10px] sm:text-xs font-bold rounded-lg transition-all whitespace-nowrap active:scale-95 flex-1 sm:flex-none ${activeFilter === filter
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                {filter === 'DAILY' ? 'Harian' : filter === 'WEEKLY' ? 'Mingguan' : filter === 'MONTHLY' ? 'Bulanan' : filter === 'YEARLY' ? 'Tahunan' : 'Custom'}
                            </button>
                        ))}
                    </div>
                    
                    <div className="flex justify-center gap-2" onMouseDown={(e) => e.stopPropagation()}>
                        <input type="date" value={filters.startDate} onChange={(e) => onDateChange('start', e.target.value)} className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-[10px] text-slate-500 dark:text-slate-400 px-2 py-1 outline-none font-medium flex-1 w-full sm:w-auto text-center" />
                        <span className="text-slate-300 self-center">-</span>
                        <input type="date" value={filters.endDate} onChange={(e) => onDateChange('end', e.target.value)} className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-[10px] text-slate-500 dark:text-slate-400 px-2 py-1 outline-none font-medium flex-1 w-full sm:w-auto text-center" />
                    </div>
            </div>
            <div className="flex-1 w-full min-h-0">
                {isLoading ? (
                    <div className="flex flex-col h-full px-4 pb-8 relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Pulse weight="duotone" className="w-12 h-12 text-indigo-200 dark:text-indigo-900/40 animate-pulse" />
                        </div>
                        <div className="mt-auto h-1/2 flex items-end gap-1 opacity-20">
                            {Array.from({ length: 20 }).map((_, i) => (
                                <div key={i} className="flex-1 bg-indigo-100 dark:bg-indigo-900/30 rounded-t-sm" style={{ height: `${Math.random() * 100}%` }} />
                            ))}
                        </div>
                    </div>
                ) : (
                <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'AREA' ? (
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="stroke-slate-100 dark:stroke-slate-800" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} dy={10} interval={data.length > 10 ? 'preserveStartEnd' : 0} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} tickFormatter={formatShortIDR} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} iconType="circle" />
                            <Area type="monotone" dataKey="Pemasukan" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" animationDuration={1500} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                            <Area type="monotone" dataKey="Pengeluaran" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" animationDuration={1500} dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                        </AreaChart>
                    ) : (
                        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorIncomeBar" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorExpenseBar" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="stroke-slate-100 dark:stroke-slate-800" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} dy={10} interval={data.length > 10 ? 'preserveStartEnd' : 0} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} tickFormatter={formatShortIDR} />
                            <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} iconType="circle" />
                            <Bar dataKey="Pemasukan" fill="url(#colorIncomeBar)" radius={[6, 6, 0, 0]} maxBarSize={40} animationDuration={1000} />
                            <Bar dataKey="Pengeluaran" fill="url(#colorExpenseBar)" radius={[6, 6, 0, 0]} maxBarSize={40} animationDuration={1000} />
                        </BarChart>
                    )}
                </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
