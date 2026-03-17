import React, { useState, useEffect } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { CalendarBlank as Calendar, ArrowsClockwise as RefreshCw, Clock } from '@phosphor-icons/react';
import axios from 'axios';
import SankeyChart from '@/Components/Analytics/SankeyChart';
import { SankeyData } from '@/types/dashboard';

interface AnalyticsProps {
    defaultPeriod: {
        startDate: string;
        endDate: string;
    };
}

export default function AnalyticsIndex({ defaultPeriod }: AnalyticsProps) {
    const [dateRange, setDateRange] = useState({
        startDate: defaultPeriod.startDate,
        endDate: defaultPeriod.endDate,
    });

    const [sankeyData, setSankeyData] = useState<SankeyData | null>(null);
    const [isLoadingSankey, setIsLoadingSankey] = useState(true);

    const onDateChange = (type: 'start' | 'end', value: string) => {
        setDateRange(prev => ({
            ...prev,
            [type === 'start' ? 'startDate' : 'endDate']: value
        }));
    };

    const fetchSankey = async () => {
        setIsLoadingSankey(true);
        try {
            const res = await axios.get(route('api.analytics.sankey', dateRange));
            setSankeyData(res.data.sankeyData);
        } catch (error) {
            console.error('Sankey API Error:', error);
        } finally {
            setIsLoadingSankey(false);
        }
    };

    const refreshAll = () => {
        fetchSankey();
    };

    useEffect(() => {
        const debounce = setTimeout(() => {
            refreshAll();
        }, 500);
        return () => clearTimeout(debounce);
    }, [dateRange.startDate, dateRange.endDate]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 px-pb-20">
            <Head title="Analisis Arus Kas" />

            <div className="flex flex-col md:flex-row justify-end items-start md:items-center mb-8 gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white dark:bg-slate-800 p-1.5 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60">
                        <span className="p-2 sm:p-2.5 bg-[#0E3D42]/10 dark:bg-[#0E3D42]/20 rounded-xl sm:rounded-2xl backdrop-blur-md">
                            <Clock weight="duotone" className="w-4 h-4 sm:w-5 sm:h-5 text-[#0E3D42] dark:text-[#C5A059]" />
                        </span>
                        <div className="flex items-center gap-2 px-3">
                            <input 
                                type="date" 
                                value={dateRange.startDate} 
                                onChange={(e) => onDateChange('start', e.target.value)} 
                                className="bg-transparent border-none text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 focus:ring-0 p-0" 
                            />
                            <span className="text-slate-400 font-bold">-</span>
                            <input 
                                type="date" 
                                value={dateRange.endDate} 
                                onChange={(e) => onDateChange('end', e.target.value)} 
                                className="bg-transparent border-none text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 focus:ring-0 p-0" 
                            />
                        </div>
                    </div>

                    <button 
                        onClick={refreshAll}
                        className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 text-slate-500 hover:text-[#0E3D42] dark:hover:text-[#C5A059] transition-colors active:scale-95"
                        title="Refresh Data"
                    >
                        <RefreshCw weight="bold" className={`w-5 h-5 ${isLoadingSankey ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="space-y-6 pb-20">
                <div className="glass-card rounded-[2rem] p-4 sm:p-6 lg:p-8 animate-fade-in-up">
                    <SankeyChart data={sankeyData} isLoading={isLoadingSankey} />
                </div>
            </div>
        </div>
    );
}

AnalyticsIndex.layout = (page: any) => (
    <AppLayout header={
        <div className="flex flex-col min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-[#EDEDD6] tracking-tight truncate">Analisis Arus Kas</h1>
            <p className="hidden sm:block text-xs text-[#8F7442] dark:text-[#C5A059] font-medium mt-0.5 truncate">Peta lengkap aliran dana dan ringkasan keuangan Anda</p>
        </div>
    }>
        {page}
    </AppLayout>
);
