import { Tag as TagIcon, GripHorizontal } from 'lucide-react';
import { TopTagData } from '@/types/dashboard';

interface TopTagsWidgetProps {
    tags: TopTagData[];
    className?: string; // Allow passing styles/classes for grid layout
    style?: React.CSSProperties; // Allow passing styles directly
    onMouseDown?: React.MouseEventHandler;
    onMouseUp?: React.MouseEventHandler;
    onTouchEnd?: React.TouchEventHandler;
}

const formatShortIDR = (amount: number) => {
    if (amount >= 1_000_000_000) return `Rp${(amount / 1_000_000_000).toFixed(1)}M`;
    if (amount >= 1_000_000) return `Rp${(amount / 1_000_000).toFixed(1)}Jt`;
    if (amount >= 1_000) return `Rp${(amount / 1_000).toFixed(0)}K`;

    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

export default function TopTagsWidget({
    tags, className, style, onMouseDown, onMouseUp, onTouchEnd
}: TopTagsWidgetProps) {
    return (
        <div
            className={`glass-card p-6 rounded-[2rem] flex flex-col transition-all hover:shadow-lg duration-500 animate-fade-in-up h-full ${className || ''}`}
            style={style}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onTouchEnd={onTouchEnd}
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 group cursor-grab active:cursor-grabbing">
                    <div className="relative">
                        <TagIcon className="w-5 h-5 text-violet-500 group-hover:opacity-0 transition-opacity duration-200" />
                        <GripHorizontal className="w-5 h-5 text-slate-400 absolute top-0 left-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 drag-handle" />
                    </div>
                    Fokus Pengeluaran
                </h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bulan Ini</span>
            </div>
            <div className="space-y-4 flex-1">
                {tags.length > 0 ? (
                    tags.map((tag, idx) => {
                        const tagColor = tag.color || ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6'][idx % 5];
                        return (
                            <div key={tag.name}>
                                <div className="flex justify-between items-center mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tagColor }} />
                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[140px]">{tag.name}</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{formatShortIDR(tag.total)}</span>
                                </div>
                                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${tag.percentage}%`, backgroundColor: tagColor }}
                                    />
                                </div>
                                <div className="flex justify-end mt-0.5">
                                    <span className="text-[10px] text-slate-400 font-bold">{tag.percentage}%</span>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center flex-1 text-slate-300 dark:text-slate-600 py-8">
                        <TagIcon className="w-12 h-12 mb-2 opacity-20" />
                        <p className="text-sm font-medium">Belum ada pengeluaran bertag bulan ini</p>
                    </div>
                )}
            </div>
        </div>
    );
}
