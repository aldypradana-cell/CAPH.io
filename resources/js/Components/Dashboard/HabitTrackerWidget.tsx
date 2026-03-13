import { useState, useEffect } from 'react';
import TrackerModal from './TrackerModal';
import { Target } from '@phosphor-icons/react';
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
}

export default function HabitTrackerWidget({ onDateClick }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [data, setData] = useState<HabitData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const todayStr = todayString();

    useEffect(() => {
        axios.get('/api/dashboard/streak?days=10')
            .then(res => setData(res.data))
            .catch(err => console.error(err))
            .finally(() => setIsLoading(false));
    }, []);

    // Generate 7 slots, placing today at "middle-right" (index 4 of 0-6)
    const totalSlots = 7;
    const todayIndex = 4; 
    const datesArr: string[] = [];
    for (let i = 0; i < totalSlots; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (todayIndex - i));
        const df = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
        datesArr.push(df);
    }

    const { history, current_streak } = data || { history: {} as Record<string, boolean>, current_streak: 0 };

    return (
        <>
            <div 
                onClick={() => setIsModalOpen(true)}
                className="cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center relative group max-w-[240px] ml-auto h-14 pointer-events-auto"
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
                                        ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-xl shadow-indigo-500/40 scale-105 z-10' 
                                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                                } ${isToday && !hasTransaction ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-950 scale-110 z-10' : ''} ${isToday && hasTransaction ? 'ring-2 ring-white/50 ring-offset-1 dark:ring-offset-slate-900 shadow-2xl' : ''}`}
                            >
                                <span className={`text-[11px] font-black tracking-tight leading-none ${hasTransaction ? 'text-white' : ''} ${isToday ? 'mb-0.5' : ''}`}>{dateNum}</span>
                                {isToday && (
                                    <div className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${hasTransaction ? 'bg-white' : 'bg-indigo-500 shadow-sm shadow-indigo-500/50'}`} />
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
