import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Sparkle as Sparkles, Plus, ArrowDownRight, ArrowsClockwise as RotateCcw } from '@phosphor-icons/react';
import toast, { Toaster } from 'react-hot-toast';
import { Responsive, useContainerWidth } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Components
import CaphLogo from '@/Components/Brand/CaphLogo';
import StatsCards from '@/Components/Dashboard/StatsCards';
import TrendChart from '@/Components/Dashboard/TrendChart';
import DistributionPieChart from '@/Components/Dashboard/DistributionPieChart';
import BudgetWidget from '@/Components/Dashboard/BudgetWidget';
import RecurringWidget from '@/Components/Dashboard/RecurringWidget';
import UpcomingBillsWidget from '@/Components/Dashboard/UpcomingBillsWidget';
import RecentTransactionsWidget from '@/Components/Dashboard/RecentTransactionsWidget';
import TopTagsWidget from '@/Components/Dashboard/TopTagsWidget';
import TransactionFormModal from '@/Components/TransactionFormModal';
import NetWorthCard from '@/Components/Dashboard/NetWorthCard';
import HabitTrackerWidget from '@/Components/Dashboard/HabitTrackerWidget';
import ErrorBoundary from '@/Components/ErrorBoundary';
import { toDateString } from '@/utils/date';

// Types
import {
    Stats, ChartData, PieData, BudgetProgress,
    Transaction, WalletData, Debt, TopTagData,
    CategoryData, TagData, RecurringTransaction, FilterState
} from '@/types/dashboard';

const ResponsiveGridLayout = Responsive;

// Custom Resize Handle
const ResizeHandle = React.forwardRef<HTMLDivElement, any>(({ handleAxis, ...props }, ref) => {
    return (
        <div
            ref={ref}
            {...props}
            className={`absolute bottom-2 right-2 cursor-nwse-resize p-1 rounded-md hover:bg-emerald-50/70 dark:hover:bg-white/10 text-emerald-700 hover:text-[#0B5F64] transition-colors z-20`}
        >
            <ArrowDownRight weight="bold" className="w-5 h-5" />
        </div>
    );
});

export default function Dashboard({
    auth, stats, trendData: initialTrendData, pieData: initialPieData, budgetProgress, recentTransactions, wallets, allWallets, upcomingBills, topTags, categories, userTags, suggestions, filters, onboarding
}: PageProps<{
    stats: Stats;
    trendData: ChartData[];
    pieData: PieData[];
    budgetProgress: BudgetProgress[];
    recentTransactions: Transaction[];
    wallets: WalletData[];
    allWallets: WalletData[];
    upcomingBills: Debt[];
    topTags: TopTagData[];
    categories: CategoryData[];
    userTags: TagData[];
    suggestions: Record<string, string[]>;
    filters: FilterState;
    onboarding: {
        show: boolean;
        completedSteps: number;
        progressPercent: number;
        steps: {
            key: string;
            title: string;
            description: string;
            completed: boolean;
            active: boolean;
            href?: string;
            actionLabel?: string;
        }[];
    };
}>) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
    const [gridMargin, setGridMargin] = useState<[number, number]>([24, 24]);

    useEffect(() => {
        const updateMargin = () => setGridMargin(window.innerWidth < 640 ? [12, 12] : [24, 24]);
        updateMargin();
        window.addEventListener('resize', updateMargin);
        return () => window.removeEventListener('resize', updateMargin);
    }, []);

    const [trendData, setTrendData] = useState<ChartData[]>(initialTrendData || []);
    const [pieData, setPieData] = useState<PieData[]>(initialPieData || []);
    const [isTrendLoading, setIsTrendLoading] = useState(true);
    const [isPieLoading, setIsPieLoading] = useState(true);

    const [activeFilter, setActiveFilter] = useState<string>(filters.mode || 'DAILY');
    const [currentFilters, setCurrentFilters] = useState(filters);

    useEffect(() => {
        axios.get('/api/dashboard/recurring')
            .then(res => setRecurringTransactions(res.data))
            .catch(err => console.error('Failed to fetch recurring transactions:', err));
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const url = new URL(window.location.href);
        if (url.searchParams.get('action') === 'add-transaction') {
            setIsAddModalOpen(true);
            url.searchParams.delete('action');
            window.history.replaceState({}, '', url.toString());
        }
    }, []);

    const fetchTrendData = (params: Record<string, any>) => {
        setIsTrendLoading(true);
        axios.get('/api/dashboard/trend', { params })
            .then(res => {
                setTrendData(res.data.trendData || []);
                setCurrentFilters(prev => ({ ...prev, ...res.data.filters }));
            })
            .catch(err => console.error('Failed to fetch trend data:', err))
            .finally(() => setIsTrendLoading(false));
    };

    const fetchPieData = (params: Record<string, any>) => {
        setIsPieLoading(true);
        axios.get('/api/dashboard/pie', { params })
            .then(res => {
                setPieData(res.data.pieData || []);
            })
            .catch(err => console.error('Failed to fetch pie data:', err))
            .finally(() => setIsPieLoading(false));
    };

    useEffect(() => {
        fetchTrendData({
            startDate: filters.startDate,
            endDate: filters.endDate,
            mode: filters.mode,
            trendCategory: filters.trendCategory,
        });
        fetchPieData({
            pieStartDate: filters.pieStartDate,
            pieEndDate: filters.pieEndDate,
        });
    }, []);

    const getLocalDateString = (date?: Date) => toDateString(date);

    const handleFilterChange = (filter: string) => {
        setActiveFilter(filter);
        if (filter === 'CUSTOM') return;

        const now = new Date();
        let start = new Date();
        let end = new Date();
        let mode = 'DAILY';

        if (filter === 'DAILY') {
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
            mode = 'DAILY';
        }
        else if (filter === 'WEEKLY') {
            start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
            end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
            mode = 'WEEKLY';
        }
        else if (filter === 'MONTHLY') {
            start = new Date(now.getFullYear(), 0, 1);
            end = new Date(now.getFullYear(), 11, 31);
            mode = 'MONTHLY';
        }
        else if (filter === 'YEARLY') {
            start = new Date(now.getFullYear() - 4, 0, 1);
            end = new Date(now.getFullYear(), 11, 31);
            mode = 'YEARLY';
        }

        const params = {
            startDate: getLocalDateString(start),
            endDate: getLocalDateString(end),
            mode,
            trendCategory: currentFilters.trendCategory || 'ALL',
        };
        setCurrentFilters(prev => ({ ...prev, ...params }));
        fetchTrendData(params);
    };

    const handleDateChange = (field: 'start' | 'end', value: string) => {
        setActiveFilter('CUSTOM');
        const params = {
            startDate: field === 'start' ? value : (currentFilters.startDate || ''),
            endDate: field === 'end' ? value : (currentFilters.endDate || ''),
            mode: 'DAILY',
            trendCategory: currentFilters.trendCategory || 'ALL',
        };
        setCurrentFilters(prev => ({ ...prev, ...params }));
        fetchTrendData(params);
    };

    const handlePieDateChange = (field: 'start' | 'end', value: string) => {
        const params = {
            pieStartDate: field === 'start' ? value : (currentFilters.pieStartDate || ''),
            pieEndDate: field === 'end' ? value : (currentFilters.pieEndDate || ''),
        };
        setCurrentFilters(prev => ({ ...prev, ...params }));
        fetchPieData(params);
    };

    const defaultLayout = {
        lg: [
            { i: 'trendChart', x: 0, y: 0, w: 2, h: 8 },
            { i: 'pieChart', x: 2, y: 0, w: 1, h: 8 },
            { i: 'budget', x: 0, y: 8, w: 1, h: 6 },
            { i: 'recurring', x: 1, y: 8, w: 1, h: 6 },
            { i: 'transactions', x: 2, y: 8, w: 1, h: 6 },
            { i: 'bills', x: 0, y: 14, w: 1.5, h: 5 },
            { i: 'tags', x: 1.5, y: 14, w: 1.5, h: 5 },
        ],
        md: [
            { i: 'trendChart', x: 0, y: 0, w: 2, h: 8 },
            { i: 'pieChart', x: 2, y: 0, w: 1, h: 8 },
            { i: 'budget', x: 0, y: 8, w: 1, h: 6 },
            { i: 'recurring', x: 1, y: 8, w: 1, h: 6 },
            { i: 'transactions', x: 2, y: 8, w: 1, h: 6 },
            { i: 'bills', x: 0, y: 14, w: 1.5, h: 5 },
            { i: 'tags', x: 1.5, y: 14, w: 1.5, h: 5 },
        ],
        sm: [
            { i: 'trendChart', x: 0, y: 0, w: 1, h: 8 },
            { i: 'pieChart', x: 0, y: 8, w: 1, h: 8 },
            { i: 'budget', x: 0, y: 16, w: 1, h: 6 },
            { i: 'recurring', x: 0, y: 22, w: 1, h: 6 },
            { i: 'transactions', x: 0, y: 28, w: 1, h: 6 },
            { i: 'bills', x: 0, y: 34, w: 1, h: 5 },
            { i: 'tags', x: 0, y: 39, w: 1, h: 5 },
        ]
    };

    const [layouts, setLayouts] = useState(() => {
        const saved = localStorage.getItem('dashboardLayouts');
        return saved ? JSON.parse(saved) : defaultLayout;
    });

    const onLayoutChange = (layout: any, allLayouts: any) => {
        setLayouts(allLayouts);
        localStorage.setItem('dashboardLayouts', JSON.stringify(allLayouts));
    };

    const resetLayout = () => {
        setLayouts(defaultLayout);
        localStorage.removeItem('dashboardLayouts');
        toast.success('Layout di-reset ke default');
    };

    const { width, containerRef, mounted } = useContainerWidth();

    return (
        <>
            <Head title="Dashboard" />
            <Toaster position="top-right" />

            <div className="space-y-4 sm:space-y-8">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 animate-fade-in-up" style={{ animationDelay: '0ms' }}>
                    <div className="w-full md:w-auto">
                        <NetWorthCard amount={stats.netWorth} />
                    </div>

                    <div className="flex flex-col items-end gap-3 w-full md:w-auto mt-2 md:mt-0">
                        <div className="hidden sm:flex justify-end">
                            <HabitTrackerWidget onDateClick={(dateStr) => setIsAddModalOpen(true)} />
                        </div>
                        <div className="hidden sm:flex items-center gap-3 justify-end w-full">
                            <button
                                onClick={resetLayout}
                                className="hidden sm:flex p-3 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl border border-emerald-50 dark:border-white/10 hover:bg-emerald-50/70 dark:hover:bg-white/10 hover:text-[#0B5F64] dark:hover:text-[#EDEDD6] transition-all hover:scale-105 active:scale-95"
                                title="Reset Layout"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>
                            <Link
                                href={route('smart-entry.index')}
                                className="hidden sm:flex items-center px-5 py-3 bg-[#0B5F64]/10 dark:bg-[#0B5F64]/20 text-[#0B5F64] dark:text-[#EDEDD6] rounded-2xl text-sm font-bold hover:bg-[#0B5F64]/20 dark:hover:bg-[#0B5F64]/30 transition-all border border-[#0B5F64]/20 dark:border-[#0B5F64]/30 shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
                            >
                                <Sparkles className="w-4 h-4 mr-2 text-emerald-500 dark:text-emerald-400" />
                                AI Input
                            </Link>
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="flex items-center px-5 py-3 bg-gradient-to-r from-[#0B5F64] to-[#1B3742] text-white rounded-2xl text-sm font-bold hover:shadow-lg hover:shadow-[#1B3742]/25 transition-all hover:scale-105 active:scale-95"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Transaksi Baru
                            </button>
                        </div>
                    </div>
                </div>

                <StatsCards stats={stats} />

                <div ref={containerRef as React.Ref<HTMLDivElement>} style={{ minHeight: '800px' }}>
                    {mounted && (
                        <ResponsiveGridLayout
                            className="layout"
                            layouts={layouts}
                            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                            cols={{ lg: 3, md: 3, sm: 1, xs: 1, xxs: 1 }}
                            rowHeight={50}
                            width={width}
                            onLayoutChange={onLayoutChange}
                            dragConfig={{ enabled: true, handle: '.drag-handle' }}
                            resizeConfig={{
                                enabled: true,
                                handleComponent: (resizeHandleAxis: any, ref: any) => <ResizeHandle ref={ref} handleAxis={resizeHandleAxis} />
                            }}
                            margin={gridMargin}
                        >
                            <div key="trendChart">
                                <ErrorBoundary title="Widget Trend">
                                    <TrendChart
                                        data={trendData}
                                        filters={currentFilters}
                                        activeFilter={activeFilter}
                                        onFilterChange={handleFilterChange}
                                        onDateChange={handleDateChange}
                                        isLoading={isTrendLoading}
                                    />
                                </ErrorBoundary>
                            </div>
                            <div key="pieChart">
                                <ErrorBoundary title="Widget Distribusi">
                                    <DistributionPieChart
                                        data={pieData}
                                        filters={currentFilters}
                                        onDateChange={handlePieDateChange}
                                        isLoading={isPieLoading}
                                    />
                                </ErrorBoundary>
                            </div>
                            <div key="budget">
                                <ErrorBoundary title="Widget Budget">
                                    <BudgetWidget budgets={budgetProgress} />
                                </ErrorBoundary>
                            </div>
                            <div key="recurring">
                                <ErrorBoundary title="Widget Langganan">
                                    <RecurringWidget transactions={recurringTransactions} />
                                </ErrorBoundary>
                            </div>
                            <div key="transactions">
                                <ErrorBoundary title="Widget Transaksi">
                                    <RecentTransactionsWidget transactions={recentTransactions} />
                                </ErrorBoundary>
                            </div>
                            <div key="bills">
                                <ErrorBoundary title="Widget Tagihan">
                                    <UpcomingBillsWidget bills={upcomingBills} />
                                </ErrorBoundary>
                            </div>
                            <div key="tags">
                                <ErrorBoundary title="Widget Top Tags">
                                    <TopTagsWidget tags={topTags} />
                                </ErrorBoundary>
                            </div>
                        </ResponsiveGridLayout>
                    )}
                </div>
            </div>

            <TransactionFormModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                wallets={wallets}
                allWallets={allWallets}
                categories={categories}
                userTags={userTags}
                suggestions={suggestions}
            />
        </>
    );
}

Dashboard.layout = (page: any) => (
    <AppLayout
        header={
            <div className="flex items-center gap-3 min-w-0">
                <CaphLogo size={34} className="hidden sm:inline-flex" />
                <div className="flex flex-col min-w-0">
                    <h1 className="text-lg sm:text-2xl font-bold text-[#0B5F64] dark:text-[#EDEDD6] tracking-tight truncate">
                        Dashboard Ringkasan
                    </h1>
                    <p className="hidden sm:block text-xs text-emerald-700 dark:text-emerald-400 font-medium mt-0.5 truncate">
                        Selamat datang kembali, {page.props.auth.user.name.split(' ')[0]}!
                    </p>
                </div>
            </div>
        }
    >
        {page}
    </AppLayout>
);
