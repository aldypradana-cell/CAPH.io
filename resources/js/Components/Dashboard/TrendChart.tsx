import { BarChart3, GripHorizontal } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { ChartData, FilterState } from '@/types/dashboard';

interface TrendChartProps {
    data: ChartData[];
    filters: FilterState;
    activeFilter: string;
    onFilterChange: (filter: string) => void;
    onDateChange: (field: 'start' | 'end', value: string) => void;
    className?: string; // Allow passing styles/classes for grid layout
    style?: React.CSSProperties; // Allow passing styles directly
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
    data, filters, activeFilter, onFilterChange, onDateChange,
    className, style, onMouseDown, onMouseUp, onTouchEnd
}: TrendChartProps) {
    return (
        <div
            className={`glass-card p-6 lg:p-8 rounded-[2rem] flex flex-col transition-all hover:shadow-lg duration-500 animate-fade-in-up h-full ${className || ''}`}
            style={style}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onTouchEnd={onTouchEnd}
        >
            <div className="flex flex-col justify-between mb-6 gap-4">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-xl relative group cursor-grab active:cursor-grabbing">
                            <BarChart3 className="w-5 h-5 group-hover:opacity-0 transition-opacity duration-200" />
                            <GripHorizontal className="w-5 h-5 absolute top-2.5 left-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 drag-handle" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 dark:text-white text-lg">Analisis Tren</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Pemasukan vs Pengeluaran</p>
                        </div>
                    </div>
                    {/* Filters */}
                    <div className="flex flex-wrap gap-2 items-center" onMouseDown={(e) => e.stopPropagation()}>
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto scrollbar-hide">
                            {(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM'] as const).map(filter => (
                                <button
                                    key={filter}
                                    onClick={() => onFilterChange(filter)}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap active:scale-95 ${activeFilter === filter
                                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                >
                                    {filter === 'DAILY' ? 'Harian' : filter === 'WEEKLY' ? 'Mingguan' : filter === 'MONTHLY' ? 'Bulanan' : filter === 'YEARLY' ? 'Tahunan' : 'Custom'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-700 w-fit" onMouseDown={(e) => e.stopPropagation()}>
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Range:</span>
                    <input type="date" value={filters.startDate} onChange={(e) => onDateChange('start', e.target.value)} className="bg-transparent font-medium text-slate-900 dark:text-slate-100 focus:outline-none text-xs" />
                    <span className="text-slate-300">-</span>
                    <input type="date" value={filters.endDate} onChange={(e) => onDateChange('end', e.target.value)} className="bg-transparent font-medium text-slate-900 dark:text-slate-100 focus:outline-none text-xs" />
                </div>
            </div>
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="stroke-slate-100 dark:stroke-slate-800" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} dy={10} interval={data.length > 10 ? 'preserveStartEnd' : 0} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} tickFormatter={formatShortIDR} />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            content={<CustomTooltip />}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} iconType="circle" />
                        <Bar dataKey="Pemasukan" fill="url(#colorIncome)" radius={[6, 6, 0, 0]} maxBarSize={40} animationDuration={1000} />
                        <Bar dataKey="Pengeluaran" fill="url(#colorExpense)" radius={[6, 6, 0, 0]} maxBarSize={40} animationDuration={1000} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
