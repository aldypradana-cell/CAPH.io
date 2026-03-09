import React, { useState, useEffect } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { Calendar, RefreshCw } from 'lucide-react';
import axios from 'axios';
import SankeyChart from '@/Components/Analytics/SankeyChart';
import NetFlowChart from '@/Components/Analytics/NetFlowChart';
import SummaryTable from '@/Components/Analytics/SummaryTable';
import { SankeyData, NetFlowData } from '@/types/dashboard';

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
    const [netFlowData, setNetFlowData] = useState<NetFlowData[]>([]);
    const [summaryData, setSummaryData] = useState<any>(null);
    
    const [isLoadingSankey, setIsLoadingSankey] = useState(true);
    const [isLoadingFlow, setIsLoadingFlow] = useState(true);
    const [isLoadingSummary, setIsLoadingSummary] = useState(true);

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

    const fetchNetFlow = async () => {
        setIsLoadingFlow(true);
        try {
            const res = await axios.get(route('api.analytics.netFlow', dateRange));
            setNetFlowData(res.data.netFlowData);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoadingFlow(false);
        }
    };

    const fetchSummary = async () => {
        setIsLoadingSummary(true);
        try {
            const res = await axios.get(route('api.analytics.summary', dateRange));
            setSummaryData(res.data.summaryData);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoadingSummary(false);
        }
    };

    const refreshAll = () => {
        fetchSankey();
        fetchNetFlow();
        fetchSummary();
    };

    useEffect(() => {
        const debounce = setTimeout(() => {
            refreshAll();
        }, 500);
        return () => clearTimeout(debounce);
    }, [dateRange.startDate, dateRange.endDate]);

    return (
        <>
            <Head title="Analisis Arus Kas" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filter */}
                <div className="flex flex-col md:flex-row justify-end items-start md:items-center mb-8 gap-4">

                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-white dark:bg-slate-800 p-1.5 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60">
                            <div className="flex items-center px-3 py-1.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                <Calendar className="w-4 h-4 text-indigo-500 mr-2" />
                                <div className="flex items-center gap-2">
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
                        </div>

                        <button 
                            onClick={refreshAll}
                            className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors active:scale-95"
                            title="Refresh Data"
                        >
                            <RefreshCw className={`w-5 h-5 ${(isLoadingSankey || isLoadingFlow || isLoadingSummary) ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Top Section: Sankey Diagram */}
                    <div className="glass-card rounded-[2rem] p-4 sm:p-6 lg:p-8 animate-fade-in-up">
                        <SankeyChart data={sankeyData} isLoading={isLoadingSankey} />
                    </div>

                    {/* Bottom Section: Grid for Net Flow & Summary */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="glass-card rounded-[2rem] p-4 sm:p-6 lg:p-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                            <NetFlowChart data={netFlowData} isLoading={isLoadingFlow} />
                        </div>
                        
                        <div className="glass-card rounded-[2rem] p-4 sm:p-6 lg:p-8 animate-fade-in-up flex flex-col" style={{ animationDelay: '0.2s' }}>
                            <SummaryTable data={summaryData} isLoading={isLoadingSummary} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

AnalyticsIndex.layout = (page: any) => (
    <AppLayout header={
        <div className="flex flex-col min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-white tracking-tight truncate">Analisis Arus Kas</h1>
            <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">Peta lengkap aliran dana dan ringkasan keuangan Anda</p>
        </div>
    }>
        {page}
    </AppLayout>
);
