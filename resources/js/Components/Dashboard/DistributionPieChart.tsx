import { useState } from 'react';
import { PieChart as PieChartIcon, Calendar, GripHorizontal, LayoutGrid } from 'lucide-react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer, Treemap } from 'recharts';
import { PieData, FilterState } from '@/types/dashboard';

interface DistributionPieChartProps {
    data: PieData[];
    filters: FilterState;
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

const PIE_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#64748b'];

const CustomTooltip = ({ active, payload, total }: any) => {
    if (active && payload && payload.length) {
        const entry = payload[0];
        return (
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 text-left cursor-auto select-text z-[9999]">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full shadow-sm ring-2 ring-white dark:ring-slate-900" style={{ backgroundColor: entry.color }} />
                    <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-xs">{entry.name}</span>
                </div>
                <div className="text-right">
                    <span className="text-slate-700 dark:text-slate-200 font-bold font-mono text-sm block">
                        {formatIDR(entry.value)}
                    </span>
                    {total && (
                        <span className="text-[10px] text-slate-400 font-bold">
                            {((entry.value / total) * 100).toFixed(1)}%
                        </span>
                    )}
                </div>
            </div>
        );
    }
    return null;
};

const CustomTreemapContent = ({ root, depth, x, y, width, height, index, payload, colors, rank, name, value }: any) => {
    // Only render for depth 1 (the actual categories)
    if (depth !== 1) return null;

    // Use a solid color from the palette, matching the Donut chart behavior
    const fillColor = colors[index % colors.length];
    
    // Determine if the box is big enough for text
    const showName = width > 45 && height > 25;
    const showValue = width > 65 && height > 45;

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: fillColor,
                    stroke: 'currentColor',
                    strokeWidth: 2,
                    strokeOpacity: 0.2,
                }}
            />
            {showName && (
                <text x={x + width / 2} y={y + height / 2 - (showValue ? 6 : 0)} textAnchor="middle" fill="#ffffff" fontSize={11} fontWeight="500" className="drop-shadow-sm" style={{ pointerEvents: 'none' }}>
                    {name?.length > 10 && width < 80 ? name.substring(0, 8) + '...' : name}
                </text>
            )}
            {showValue && (
                <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill="#ffffff" fillOpacity={0.9} fontSize={10} fontWeight="normal" className="drop-shadow-sm" style={{ pointerEvents: 'none' }}>
                    {formatShortIDR(value)}
                </text>
            )}
        </g>
    );
};

const formatShortIDR = (amount: number) => {
    if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}M`;
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}Jt`;
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
    return amount.toString();
};

export default function DistributionPieChart({
    data, filters, onDateChange, isLoading,
    className, style, onMouseDown, onMouseUp, onTouchEnd
}: DistributionPieChartProps) {
    const totalCategoryExpense = data.reduce((a, b) => a + b.value, 0);
    const [chartType, setChartType] = useState<'DONUT' | 'TREEMAP'>('DONUT');
    return (
        <div
            className={`glass-card p-3 sm:p-6 lg:p-8 rounded-[2rem] flex flex-col transition-all hover:shadow-lg duration-500 animate-fade-in-up h-full ${className || ''}`}
            style={style}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onTouchEnd={onTouchEnd}
        >
            <div className="flex flex-row items-start justify-between mb-4 gap-2">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-pink-50 dark:bg-slate-800 text-pink-600 dark:text-pink-400 rounded-xl relative group cursor-grab active:cursor-grabbing">
                        {chartType === 'DONUT' ? (
                            <PieChartIcon className="w-5 h-5 group-hover:opacity-0 transition-opacity duration-200" />
                        ) : (
                            <LayoutGrid className="w-5 h-5 group-hover:opacity-0 transition-opacity duration-200" />
                        )}
                        <GripHorizontal className="w-5 h-5 absolute top-2.5 left-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 drag-handle" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 dark:text-white text-lg">Distribusi</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Berdasarkan Kategori</p>
                    </div>
                </div>
                
                <div className="flex flex-wrap gap-2 items-center justify-end" onMouseDown={(e) => e.stopPropagation()}>
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        <button
                            onClick={() => setChartType('DONUT')}
                            title="Donut Chart"
                            className={`p-1.5 rounded-lg transition-all active:scale-95 ${chartType === 'DONUT' ? 'bg-white dark:bg-slate-700 text-pink-600 dark:text-pink-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                            <PieChartIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setChartType('TREEMAP')}
                            title="Treemap"
                            className={`p-1.5 rounded-lg transition-all active:scale-95 ${chartType === 'TREEMAP' ? 'bg-white dark:bg-slate-700 text-pink-600 dark:text-pink-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl items-center gap-1 text-[10px] font-bold px-2 py-1 text-slate-500 dark:text-slate-400">
                        <Calendar className="w-3 h-3" />
                        Custom
                    </div>
                </div>
            </div>
            
            <div className="flex justify-center gap-2 mb-4" onMouseDown={(e) => e.stopPropagation()}>
                <input type="date" value={filters.pieStartDate || filters.startDate} onChange={(e) => onDateChange('start', e.target.value)} className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-[10px] text-slate-500 dark:text-slate-400 px-2 py-1 outline-none font-medium" />
                <span className="text-slate-300 self-center">-</span>
                <input type="date" value={filters.pieEndDate || filters.endDate} onChange={(e) => onDateChange('end', e.target.value)} className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-[10px] text-slate-500 dark:text-slate-400 px-2 py-1 outline-none font-medium" />
            </div>
            {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-52 h-52 rounded-full border-[24px] border-slate-100 dark:border-slate-800 animate-pulse relative">
                        <div className="absolute inset-0 rounded-full border-t-[24px] border-indigo-200 dark:border-indigo-900/50 animate-spin" style={{ animationDuration: '2s' }} />
                    </div>
                </div>
            ) : data.length > 0 ? (
                <>
                    <div className="flex-1 min-h-0 flex items-center justify-center relative">
                        {chartType === 'DONUT' && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-12">
                                <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-0.5">Total</span>
                                <span className="text-xl font-bold text-slate-800 dark:text-white">
                                    {formatShortIDR(totalCategoryExpense)}
                                </span>
                            </div>
                        )}
                        <ResponsiveContainer width="100%" height="100%">
                            {chartType === 'DONUT' ? (
                                <PieChart>
                                    <Pie data={data} cx="50%" cy="50%" innerRadius="70%" outerRadius="95%" paddingAngle={4} dataKey="value" cornerRadius={8} animationDuration={1000} stroke="none">
                                        {data.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip total={totalCategoryExpense} />} />
                                    <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} />
                                </PieChart>
                            ) : (
                                <Treemap
                                    data={data}
                                    dataKey="value"
                                    aspectRatio={4 / 3}
                                    stroke="transparent"
                                    fill="transparent"
                                    content={<CustomTreemapContent colors={PIE_COLORS} />}
                                    animationDuration={1000}
                                    isAnimationActive={true}
                                >
                                    <Tooltip content={<CustomTooltip total={totalCategoryExpense} />} />
                                </Treemap>
                            )}
                        </ResponsiveContainer>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
                    <PieChartIcon className="w-16 h-16 mb-2 opacity-20" />
                    <p className="text-sm font-medium">Belum ada data</p>
                </div>
            )}
        </div>
    );
}
