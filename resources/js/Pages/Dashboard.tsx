import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react'; // Added router
import { PageProps } from '@/types';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Sparkles, Plus, ArrowDownRight, RotateCcw } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { Responsive, useContainerWidth } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Components
import StatsCards from '@/Components/Dashboard/StatsCards';
import TrendChart from '@/Components/Dashboard/TrendChart';
import DistributionPieChart from '@/Components/Dashboard/DistributionPieChart';
import BudgetWidget from '@/Components/Dashboard/BudgetWidget';
import RecurringWidget from '@/Components/Dashboard/RecurringWidget';
import UpcomingBillsWidget from '@/Components/Dashboard/UpcomingBillsWidget';
import RecentTransactionsWidget from '@/Components/Dashboard/RecentTransactionsWidget';
import TopTagsWidget from '@/Components/Dashboard/TopTagsWidget';
import AddTransactionModal from '@/Components/Dashboard/AddTransactionModal';

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
            className={`absolute bottom-2 right-2 cursor-nwse-resize p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-500 transition-colors z-20`}
        >
            <ArrowDownRight className="w-5 h-5" />
        </div>
    );
});

export default function Dashboard({
    auth, stats, trendData, pieData, budgetProgress, recentTransactions, wallets, upcomingBills, topTags, categories, userTags, filters
}: PageProps<{
    stats: Stats;
    trendData: ChartData[];
    pieData: PieData[];
    budgetProgress: BudgetProgress[];
    recentTransactions: Transaction[];
    wallets: WalletData[];
    upcomingBills: Debt[];
    topTags: TopTagData[];
    categories: CategoryData[];
    userTags: TagData[];
    filters: FilterState;
}>) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);

    // --- QUERY STATE ---
    const [activeFilter, setActiveFilter] = useState<string>(filters.mode || 'DAILY');

    // Fetch recurring transactions 
    useEffect(() => {
        axios.get('/api/dashboard/recurring')
            .then(res => setRecurringTransactions(res.data))
            .catch(err => console.error('Failed to fetch recurring transactions:', err));
    }, []);

    // Helper for formatting local date strings
    const getLocalDateString = (date: Date = new Date()) => {
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offset).toISOString().split('T')[0];
    };

    const updateParams = (newParams: Record<string, any>) => {
        router.get(route('dashboard'), { ...filters, ...newParams }, {
            preserveState: true,
            preserveScroll: true,
            only: ['stats', 'trendData', 'pieData', 'filters']
        });
    };

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

        updateParams({
            startDate: getLocalDateString(start),
            endDate: getLocalDateString(end),
            mode
        });
    };

    const handleDateChange = (field: 'start' | 'end', value: string) => {
        updateParams({
            [field === 'start' ? 'startDate' : 'endDate']: value,
            mode: 'DAILY' // Custom range implies detailed view
        });
        setActiveFilter('CUSTOM');
    };

    const handlePieDateChange = (field: 'start' | 'end', value: string) => {
        router.get(route('dashboard'), {
            ...filters,
            [field === 'start' ? 'pieStartDate' : 'pieEndDate']: value
        }, {
            preserveState: true,
            preserveScroll: true,
            only: ['pieData', 'filters']
        });
    };

    // --- GRID LAYOUT STATE ---
    // Default layout
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

            <div className="space-y-8">
                {/* Quick Action Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in-up" style={{ animationDelay: '0ms' }}>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Financial Overview</h2>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                            Pantau kondisi keuangan Anda secara real-time.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={resetLayout}
                            className="p-3 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all hover:scale-105 active:scale-95"
                            title="Reset Layout"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                        <Link
                            href={route('smart-entry.index')}
                            className="flex items-center px-5 py-3 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-2xl text-sm font-bold hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all border border-indigo-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
                        >
                            <Sparkles className="w-4 h-4 mr-2 text-indigo-500 dark:text-indigo-400" />
                            AI Input
                        </Link>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl text-sm font-bold hover:shadow-lg hover:shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Transaksi Baru
                        </button>
                    </div>
                </div>

                {/* Stats Cards - Fixed */}
                <StatsCards stats={stats} />

                {/* Draggable Grid */}
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
                            margin={[24, 24]}
                        >
                            <div key="trendChart">
                                <TrendChart
                                    data={trendData}
                                    filters={filters}
                                    activeFilter={activeFilter}
                                    onFilterChange={handleFilterChange}
                                    onDateChange={handleDateChange}
                                />
                            </div>
                            <div key="pieChart">
                                <DistributionPieChart
                                    data={pieData}
                                    filters={filters}
                                    onDateChange={handlePieDateChange}
                                />
                            </div>
                            <div key="budget">
                                <BudgetWidget budgets={budgetProgress} />
                            </div>
                            <div key="recurring">
                                <RecurringWidget transactions={recurringTransactions} />
                            </div>
                            <div key="transactions">
                                <RecentTransactionsWidget transactions={recentTransactions} />
                            </div>
                            <div key="bills">
                                <UpcomingBillsWidget bills={upcomingBills} />
                            </div>
                            <div key="tags">
                                <TopTagsWidget tags={topTags} />
                            </div>
                        </ResponsiveGridLayout>
                    )}
                </div>
            </div>

            <AddTransactionModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                wallets={wallets}
                categories={categories}
                userTags={userTags}
            />
        </>
    );
}

Dashboard.layout = (page: any) => (
    <AppLayout
        header={
            <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Dashboard Ringkasan</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    Selamat datang kembali, {page.props.auth.user.name.split(' ')[0]}!
                </p>
            </div>
        }
    >
        {page}
    </AppLayout>
);
