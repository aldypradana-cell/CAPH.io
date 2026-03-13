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
                className="cursor-pointer hover:scale-105 transition-all flex items-center justify-center relative group max-w-[220px] ml-auto h-12"
                style={{
                    maskImage: 'linear-gradient(to right, transparent, rgba(0,0,0,1) 15%, rgba(0,0,0,1) 85%, transparent)',
                    WebkitMaskImage: 'linear-gradient(to right, transparent, rgba(0,0,0,1) 15%, rgba(0,0,0,1) 85%, transparent)'
                }}
            >
                {/* Blocks Container */}
                <div 
                    className={`flex-1 flex items-center justify-center gap-1.5 z-0 overflow-hidden transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}
                >
                    {datesArr.map((dateStr) => {
                        const hasTransaction = history[dateStr] ?? false;
                        const dateObj = new Date(dateStr);
                        const dateNum = dateObj.getDate();
                        const isToday = dateStr === todayStr;
                        
                        return (
                            <div 
                                key={dateStr}
                                className={`shrink-0 w-6 h-8 rounded-lg flex flex-col items-center justify-center transition-all duration-300 ${
                                    hasTransaction 
                                        ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg shadow-indigo-500/40 scale-105 z-10' 
                                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                                } ${isToday && !hasTransaction ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-950 scale-110 z-10' : ''}`}
                            >
                                <span className={`text-[10px] font-black leading-none ${hasTransaction ? 'text-white' : ''}`}>{dateNum}</span>
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
