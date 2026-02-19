import { PieChart as PieChartIcon, Calendar, GripHorizontal } from 'lucide-react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { PieData, FilterState } from '@/types/dashboard';

interface DistributionPieChartProps {
    data: PieData[];
    filters: FilterState;
    onDateChange: (field: 'start' | 'end', value: string) => void;
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

export default function DistributionPieChart({
    data, filters, onDateChange,
    className, style, onMouseDown, onMouseUp, onTouchEnd
}: DistributionPieChartProps) {
    const totalCategoryExpense = data.reduce((a, b) => a + b.value, 0);

    return (
        <div
            className={`glass-card p-6 lg:p-8 rounded-[2rem] flex flex-col transition-all hover:shadow-lg duration-500 animate-fade-in-up h-full ${className || ''}`}
            style={style}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onTouchEnd={onTouchEnd}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-pink-50 dark:bg-slate-800 text-pink-600 dark:text-pink-400 rounded-xl relative group cursor-grab active:cursor-grabbing">
                        <PieChartIcon className="w-5 h-5 group-hover:opacity-0 transition-opacity duration-200" />
                        <GripHorizontal className="w-5 h-5 absolute top-2.5 left-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 drag-handle" />
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-lg">Distribusi</h4>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg text-slate-500 dark:text-slate-400">
                    <Calendar className="w-3 h-3" />
                    Custom
                </div>
            </div>
            <div className="flex justify-center gap-2 mb-4" onMouseDown={(e) => e.stopPropagation()}>
                <input type="date" value={filters.pieStartDate || filters.startDate} onChange={(e) => onDateChange('start', e.target.value)} className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-[10px] text-slate-500 dark:text-slate-400 px-2 py-1 outline-none" />
                <input type="date" value={filters.pieEndDate || filters.endDate} onChange={(e) => onDateChange('end', e.target.value)} className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-[10px] text-slate-500 dark:text-slate-400 px-2 py-1 outline-none" />
            </div>
            {data.length > 0 ? (
                <>
                    <div className="flex-1 min-h-0 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={data} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={4} dataKey="value" cornerRadius={6} animationDuration={800}>
                                    {data.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} strokeWidth={0} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip total={totalCategoryExpense} />} />
                                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} />
                            </PieChart>
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
