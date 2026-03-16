import AppLayout from '@/Layouts/AppLayout';
import { Head, usePage, router, Link } from '@inertiajs/react';
import {
    SquaresFour as LayoutDashboard, Users, Pulse as Activity, Database,
    Shield, FileText, List as Menu,
    ChatCircleDots
} from '@phosphor-icons/react';
import { Toaster } from 'react-hot-toast';

// Partials
import OverviewTab from './Partials/OverviewTab';
import UsersTab from './Partials/UsersTab';
import MasterTab from './Partials/MasterTab';
import LogsTab from './Partials/LogsTab';
import FeedbacksTab from './Partials/FeedbacksTab';

export default function AdminDashboard() {
    const { props } = usePage();
    const {
        tab = 'overview',
        stats = {},
        recentLogs = [],
        users = { data: [] },
        categories = [],
        logs = { data: [] },
        feedbacks = { data: [] },
        feedbackStats = { total: 0, open: 0, inReview: 0, resolved: 0 },
        filters = {}
    } = props as any;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard, route: 'admin.dashboard' },
        { id: 'users', label: 'Users', icon: Users, route: 'admin.users.index' },
        { id: 'master', label: 'Master Data', icon: Database, route: 'admin.master.index' },
        { id: 'logs', label: 'System Logs', icon: FileText, route: 'admin.logs.index' },
        { id: 'feedbacks', label: 'Feedback', icon: ChatCircleDots, route: 'admin.feedbacks.index' },
    ];

    const activeTabInfo = tabs.find(t => t.id === tab) || tabs[0];

    const renderContent = () => {
        switch (tab) {
            case 'users':
                return <UsersTab users={users} filters={filters} />;
            case 'master':
                return <MasterTab categories={categories} />;
            case 'logs':
                return <LogsTab logs={logs} filters={filters} />;
            case 'feedbacks':
                return <FeedbacksTab feedbacks={feedbacks} feedbackStats={feedbackStats} filters={filters} />;
            case 'overview':
            default:
                // Pass processed stats for Overview
                const overviewStats = {
                    totalUsers: stats.totalUsers ?? 0,
                    activeUsers: stats.activeUsers ?? 0,
                    totalTransactions: stats.totalTransactions ?? 0,
                    flaggedTransactions: stats.flaggedTransactionsCount ?? 0,
                    highValueTransactions: stats.highValueTransactionsCount ?? 0,
                    transactionsToday: stats.transactionsToday ?? 0,
                    newUsersThisMonth: stats.newUsersThisMonth ?? 0,
                    transactionsThisMonth: stats.transactionsThisMonth ?? 0,
                };
                return <OverviewTab stats={overviewStats} recentLogs={recentLogs} />;
        }
    };

    return (

        <>
            <Head title={`Admin - ${activeTabInfo.label}`} />
            <Toaster position="top-right" />

            <div className="space-y-6 animate-fade-in-up">
                {/* Mobile Tab Select */}
                <div className="md:hidden">
                    <select
                        value={tab}
                        onChange={(e) => {
                            const selected = tabs.find(t => t.id === e.target.value);
                            if (selected) router.get(route(selected.route));
                        }}
                        className="w-full bg-white dark:bg-slate-900 border-none rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500"
                    >
                        {tabs.map(t => (
                            <option key={t.id} value={t.id}>{t.label}</option>
                        ))}
                    </select>
                </div>

                {/* Desktop Tabs */}
                <div className="hidden md:flex p-1 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-x-auto">
                    {tabs.map((t) => {
                        const isActive = tab === t.id;
                        return (
                            <Link
                                key={t.id}
                                href={route(t.route)}
                                preserveState={true}
                                preserveScroll={true}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all relative ${isActive
                                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <t.icon weight={isActive ? "fill" : "duotone"} className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
                                {t.label}
                                {isActive && (
                                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-indigo-500 rounded-t-full" />
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* Content Area */}
                <div className="min-h-[500px]">
                    {renderContent()}
                </div>
            </div>
        </>
    );
}

// Define the layout with a function that accesses page props to render the dynamic header
AdminDashboard.layout = (page: any) => {
    // We can access props from the page object.
    // The structure is page.props.activeTabInfo... wait, 'activeTabInfo' is calculated inside the component.
    // We need to derive it from 'tab' prop which is available in page.props.

    // We can recreate the tabs array here or better yet, just extract the title/label logic.
    // However, recreating 'tabs' array with icons might be repetitive.
    // Let's try to infer the title from props or just use a generic title.
    // The user wants "Admin Panel" and the subtitle.

    const { tab } = page.props;
    const tabLabel = tab ? (tab as string).charAt(0).toUpperCase() + (tab as string).slice(1) : 'Overview';

    return (
        <AppLayout header={
            <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-xl">
                    <Shield weight="duotone" className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Admin Panel</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        {tabLabel} & Management Area
                    </p>
                </div>
            </div>
        }>
            {page}
        </AppLayout>
    );
};


