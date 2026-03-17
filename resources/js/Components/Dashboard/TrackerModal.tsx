import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import { CaretLeft, CaretRight, X, Lightning, Crown, CalendarCheck, Fire } from '@phosphor-icons/react';
import axios from 'axios';
import { formatMonthYearLong, todayString } from '@/utils/date';

interface HabitData {
    history: Record<string, boolean>;
    current_streak: number;
    max_streak: number;
    startDate: string;
    endDate: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onDateClick?: (dateStr: string) => void;
}

export default function TrackerModal({ isOpen, onClose, onDateClick }: Props) {
    const todayStr = todayString();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [data, setData] = useState<HabitData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    useEffect(() => {
        if (!isOpen) return;
        
        setIsLoading(true);
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1; // 1-12
        
        axios.get(`/api/dashboard/streak?year=${year}&month=${month}`)
            .then(res => setData(res.data))
            .catch(err => console.error(err))
            .finally(() => setIsLoading(false));
    }, [isOpen, currentDate]);
    
    const handlePrevMonth = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() - 1);
            return newDate;
        });
    };
    
    const handleNextMonth = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + 1);
            return newDate;
        });
    };
    
    const isCurrentMonth = () => {
        const now = new Date();
        return currentDate.getMonth() === now.getMonth() && currentDate.getFullYear() === now.getFullYear();
    };
    
    // Generate calendar days
    const getDaysInMonth = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
        
        const blanks = Array(firstDayIndex).fill(null);
        const dayArray = Array.from({ length: days }, (_, i) => {
            const day = i + 1;
            const strMonth = String(month + 1).padStart(2, '0');
            const strDay = String(day).padStart(2, '0');
            return `${year}-${strMonth}-${strDay}`;
        });
        
        return { blanks, dayArray };
    };
    
    const { blanks, dayArray } = getDaysInMonth();
    const weekDays = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    const handleCellClick = (dateStr: string, isRecorded: boolean, isFuture: boolean) => {
        if (!isFuture && !isRecorded && onDateClick) {
            onClose(); // Close modal automatically
            onDateClick(dateStr); // Pass date back to parent to open transaction form
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-[2rem] bg-white dark:bg-slate-900 p-6 text-left align-middle shadow-2xl transition-all border border-slate-200 dark:border-slate-800">
                                <div className="flex items-center justify-between mb-6">
                                    <Dialog.Title as="h3" className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                                        <CalendarCheck weight="duotone" className="w-7 h-7 text-[#0B5F64]" />
                                        Kalender Disiplin Input
                                    </Dialog.Title>
                                    <button
                                        onClick={onClose}
                                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                                    >
                                        <X weight="bold" className="w-5 h-5" />
                                    </button>
                                </div>
                                
                                <div className="bg-gradient-to-br from-[#0B5F64] via-[#044D52] to-[#013538] rounded-[2rem] p-6 text-white flex items-center mb-8 shadow-xl shadow-[#0B5F64]/20 relative overflow-hidden group">
                                    {/* Decorative background element */}
                                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
                                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-teal-400/10 rounded-full blur-2xl" />
                                    
                                    <div className="flex-1 relative z-10 border-r border-white/10 pr-6">
                                        <div className="flex items-center gap-1.5 text-[#B89A5D] text-[10px] font-bold uppercase tracking-widest mb-2 opacity-90">
                                            <Fire weight="fill" className="w-3 h-3 text-orange-400" />
                                            Beruntun
                                        </div>
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-4xl font-black tabular-nums tracking-tight">{data?.current_streak || 0}</span>
                                            <span className="text-xs font-bold text-[#B89A5D] uppercase tracking-tighter">Hari</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 relative z-10 pl-8">
                                        <div className="flex items-center gap-1.5 text-[#B89A5D] text-[10px] font-bold uppercase tracking-widest mb-2 opacity-90">
                                            <Crown weight="fill" className="w-3 h-3 text-amber-500" />
                                            Puncak
                                        </div>
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-3xl font-black tabular-nums tracking-tight">{data?.max_streak || 0}</span>
                                            <span className="text-xs font-bold text-[#B89A5D] uppercase tracking-tighter">Hari</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mb-4">
                                    <button 
                                        onClick={handlePrevMonth}
                                        disabled={isLoading}
                                        className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        <CaretLeft weight="bold" className="w-5 h-5" />
                                    </button>
                                    <h4 className="text-lg font-bold text-slate-800 dark:text-white">
                                        {formatMonthYearLong(currentDate)}
                                    </h4>
                                    <button 
                                        onClick={handleNextMonth}
                                        disabled={isLoading || isCurrentMonth()}
                                        className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        <CaretRight weight="bold" className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Calendar Grid */}
                                <div className="grid grid-cols-7 gap-2 mb-2">
                                    {weekDays.map(day => (
                                        <div key={day} className="text-center text-[10px] sm:text-xs font-bold text-slate-400 uppercase">
                                            {day}
                                        </div>
                                    ))}
                                </div>
                                
                                <div className={`grid grid-cols-7 gap-1 sm:gap-2 transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
                                    {blanks.map((_, i) => (
                                        <div key={`blank-${i}`} className="aspect-square" />
                                    ))}
                                    {dayArray.map((dateStr) => {
                                        const isRecorded = data?.history[dateStr] ?? false;
                                        const isToday = dateStr === todayStr;
                                        const dateNum = parseInt(dateStr.split('-')[2], 10);
                                        const isFuture = dateStr > todayStr;
                                        
                                        let bgClass = "bg-slate-50 dark:bg-slate-800/50 text-slate-400";
                                        if (isRecorded) {
                                            bgClass = "bg-[#0B5F64] text-white shadow-md shadow-[#0B5F64]/30 font-bold";
                                        } else if (isFuture) {
                                            bgClass = "bg-transparent text-slate-300 dark:text-slate-600";
                                        } else if (isToday && !isRecorded) {
                                            bgClass = "bg-teal-50 dark:bg-[#0B5F64]/10 text-[#0B5F64] dark:text-[#B89A5D] ring-2 ring-[#0B5F64] font-bold";
                                        }

                                        return (
                                            <button 
                                                key={dateStr}
                                                type="button" 
                                                onClick={() => handleCellClick(dateStr, isRecorded, isFuture)}
                                                disabled={isFuture || isRecorded || !onDateClick}
                                                className={`aspect-square rounded-xl flex items-center justify-center transition-all relative ${bgClass} ${!isFuture && !isRecorded && onDateClick ? 'hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer hover:ring-2 hover:ring-[#0B5F64]/50 hover:text-[#0B5F64] dark:hover:text-[#B89A5D] active:scale-95' : ''}`}
                                                title={isRecorded ? 'Tercatat' : isFuture ? '' : 'Klik untuk isi catatan hari ini'}
                                            >
                                                <span className={isToday ? 'mb-1' : ''}>{dateNum}</span>
                                                {isToday && (
                                                    <div className={`absolute bottom-2 w-1.5 h-1.5 rounded-full ${isRecorded ? 'bg-white' : 'bg-[#0B5F64]'}`} />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                                
                                <div className="mt-6 flex flex-wrap gap-4 justify-center text-xs font-medium text-slate-500">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-[#0B5F64]"></div> Tercatat
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-800"></div> Bolong
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-teal-50 dark:bg-[#0B5F64]/10 ring-1 ring-[#0B5F64]"></div> Hari Ini
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        onClick={onClose}
                                        className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors"
                                    >
                                        Tutup
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
