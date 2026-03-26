import { useState, useEffect } from 'react';
import TrackerModal from './TrackerModal';
import { CaretLeft, CaretRight, X, Lightning, Crown, CalendarCheck, Fire } from '@phosphor-icons/react';
import axios from 'axios';
import { todayString } from '@/utils/date';

interface HabitData {
    history: Record<string, boolean>;
    current_streak: number;
    startDate: string;
    endDate: string;
}

interface Props {
    onDateClick?: (dateStr: string) => void;
    variant?: 'default' | 'minimal';
}

export default function HabitTrackerWidget({ onDateClick, variant = 'default' }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [data, setData] = useState<HabitData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const todayStr = todayString();

    useEffect(() => {
        // Fetch streak data
        axios.get('/api/dashboard/streak?days=35')
            .then(res => setData(res.data))
            .catch(err => console.error(err))
            .finally(() => setIsLoading(false));
    }, []);

    const { history, current_streak } = data || { history: {} as Record<string, boolean>, current_streak: 0 };

    if (variant === 'minimal') {
        return (
            <>
                <div 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400/40 hover:text-[#0E3D42] dark:hover:text-emerald-400 hover:shadow-md transition-all active:scale-95 relative cursor-pointer"
                    title={`Streak: ${current_streak} Hari`}
                >
                    <div className="relative">
                        <Fire weight="duotone" className="w-5 h-5 text-emerald-700 dark:text-emerald-400/40 group-hover:text-[#0E3D42] dark:group-hover:text-emerald-400 transition-colors" />
                        {current_streak > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[14px] h-3.5 px-1 bg-[#9F1239] text-[#EDEDD6] text-[8px] font-black rounded-full border border-white dark:border-slate-800 shadow-lg shadow-[#9F1239]/20">
                                {current_streak}
                            </span>
                        )}
                    </div>
                </div>
                <TrackerModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    onDateClick={onDateClick}
                />
            </>
        );
    }

    // Default Desktop View Logic
    const totalSlots = 7;
    const todayIndex = 4; 
    const datesArr: string[] = [];
    for (let i = 0; i < totalSlots; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (todayIndex - i));
        const df = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
        datesArr.push(df);
    }

    return (
        <>
            {/* Desktop View: Floating Date Blocks */}
            <div 
                onClick={() => setIsModalOpen(true)}
                className="hidden sm:flex cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all items-center justify-center relative group max-w-[240px] ml-auto h-14 pointer-events-auto"
                style={{
                    maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent), linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)',
                    WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent), linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)',
                    maskComposite: 'intersect',
                    WebkitMaskComposite: 'source-in'
                }}
            >
                {/* Blocks Container */}
                <div 
                    className={`flex-1 flex items-center justify-center gap-2 z-0 transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}
                >
                    {datesArr.map((dateStr) => {
                        const hasTransaction = history[dateStr] ?? false;
                        const dateObj = new Date(dateStr);
                        const dateNum = dateObj.getDate();
                        const isToday = dateStr === todayStr;
                        
                        return (
                            <div 
                                key={dateStr}
                                className={`shrink-0 w-7 h-9 rounded-lg flex flex-col items-center justify-center transition-all duration-300 relative ${
                                    hasTransaction 
                                        ? 'bg-[#0E3D42] text-[#EDEDD6] shadow-xl shadow-[#0E3D42]/30 scale-105 z-10' 
                                        : 'bg-slate-200 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500'
                                } ${isToday && !hasTransaction ? 'ring-2 ring-[#0E3D42] ring-offset-2 dark:ring-offset-slate-950 scale-110 z-10' : ''} ${isToday && hasTransaction ? 'ring-2 ring-white/50 ring-offset-1 dark:ring-offset-slate-900 shadow-2xl' : ''}`}
                            >
                                <span className={`text-[11px] font-black tracking-tight leading-none ${hasTransaction ? 'text-emerald-400' : ''} ${isToday ? 'mb-0.5' : ''}`}>{dateNum}</span>
                                {isToday && (
                                    <div className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${hasTransaction ? 'bg-emerald-400' : 'bg-[#0E3D42] shadow-sm shadow-[#0E3D42]/50'}`} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
            
            <TrackerModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onDateClick={onDateClick}
            />
        </>
    );
}
