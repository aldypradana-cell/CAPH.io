import { PropsWithChildren, useState, useRef, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
    SquaresFour as LayoutDashboard, Receipt as List, Lightning as Zap, ChartPieSlice as PieChart,
    Wallet as WalletIcon, SignOut as LogOut, HandCoins,
    Target, Diamond as Gem, CreditCard, Tag as Tags, User as UserIcon,
    Gear as Settings, DownloadSimple as FileDown, Bell, Question as HelpCircle, List as Menu, X,
    ShieldCheck, Check, Warning as AlertTriangle, Info, CheckCircle,
    Sun, Moon, DotsThree as MoreHorizontal, Users, FileText, Database, ArrowsLeftRight as ArrowRightLeft, Plus, PiggyBank, ChartBar as BarChart3,
    ChatCircleDots
} from '@phosphor-icons/react';
import HabitTrackerWidget from '@/Components/Dashboard/HabitTrackerWidget';
import OnboardingSetupCard from '@/Components/Dashboard/OnboardingSetupCard';
import CaphLogo from '@/Components/Brand/CaphLogo';
import { User } from '@/types';
import { formatTime } from '@/utils/date';

interface LayoutProps {
    header?: React.ReactNode;
}

interface Notification {
    id: string;
    data: {
        title: string;
        message: string;
        type: 'ALERT' | 'WARNING' | 'SUCCESS' | 'INFO';
        link?: string;
    };
    created_at: string;
    read_at: string | null;
}

export default function AppLayout({ header, children }: PropsWithChildren<LayoutProps>) {
    const page = usePage().props as any;
    const user = page.auth.user as User;
    const onboarding = page.onboarding as {
        show?: boolean;
        completedSteps?: number;
        progressPercent?: number;
        steps?: {
            key: string;
            title: string;
            description: string;
            completed: boolean;
            active: boolean;
            href?: string;
            actionLabel?: string;
        }[];
    } | undefined;
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMoreOpen, setIsMoreOpen] = useState(false);
    const [isOnboardingDismissed, setIsOnboardingDismissed] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('caph_onboarding_dismissed') === 'true';
        }
        return false;
    });
    const [isOnboardingMinimized, setIsOnboardingMinimized] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('caph_onboarding_minimized') === 'true';
        }
        return false;
    });
    const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
    const dragOffsetRef = useRef({ x: 0, y: 0 });
    const draggingRef = useRef(false);
    const currentRoute = route().current() || '';

    // Dark mode state
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('caph-theme');
            if (saved) return saved === 'dark';
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    });

    useEffect(() => {
        const root = document.documentElement;
        if (isDark) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('caph-theme', isDark ? 'dark' : 'light');
    }, [isDark]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('caph_onboarding_dismissed');
            localStorage.setItem('caph_onboarding_minimized', isOnboardingMinimized ? 'true' : 'false');
        }
    }, [isOnboardingMinimized]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (window.innerWidth < 1024) return;
        if (!dragPosition) {
            setDragPosition({
                x: Math.max(16, Math.round((window.innerWidth - 280) / 2)),
                y: 92,
            });
        }
    }, [dragPosition]);

    // Notification state
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const notifRef = useRef<HTMLDivElement>(null);
    const unreadCount = notifications.length;

    const fetchNotifications = async () => {
        try {
            const res = await fetch(route('notifications.index'));
            const data = await res.json();
            setNotifications(data);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Optional: Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleMarkAllRead = async () => {
        try {
            await router.post(route('notifications.readAll'));
            setNotifications([]);
        } catch (error) {
            console.error('Failed to mark all read', error);
        }
    };

    const handleNotificationClick = async (id: string, link?: string) => {
        try {
            await router.post(route('notifications.read', id));
            setNotifications(prev => prev.filter(n => n.id !== id));
            if (link) router.visit(link);
        } catch (error) {
            console.error('Failed to mark read', error);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getNotifIcon = (type: string) => {
        switch (type) {
            case 'WARNING': return <AlertTriangle weight="duotone" className="w-4 h-4 text-amber-500" />;
            case 'ALERT': return <AlertTriangle weight="duotone" className="w-4 h-4 text-red-500" />;
            case 'SUCCESS': return <CheckCircle weight="duotone" className="w-4 h-4 text-emerald-500" />;
            default: return <Info weight="duotone" className="w-4 h-4 text-blue-500" />;
        }
    };

    const handleOnboardingMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (typeof window === 'undefined' || window.innerWidth < 1024) return;
        const target = event.target as HTMLElement;
        if (!target.closest('[data-drag-handle="true"]')) return;
        if (target.closest('[data-no-drag="true"]')) return;

        draggingRef.current = true;
        const rect = event.currentTarget.getBoundingClientRect();
        dragOffsetRef.current = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        };
        event.preventDefault();
    };

    useEffect(() => {
        const handleMove = (event: MouseEvent) => {
            if (!draggingRef.current || typeof window === 'undefined' || window.innerWidth < 1024) return;
            const width = 280;
            const estimatedHeight = isOnboardingMinimized ? 72 : 170;
            const nextX = Math.min(Math.max(12, event.clientX - dragOffsetRef.current.x), window.innerWidth - width - 12);
            const nextY = Math.min(Math.max(12, event.clientY - dragOffsetRef.current.y), window.innerHeight - estimatedHeight - 12);
            setDragPosition({ x: nextX, y: nextY });
        };

        const handleUp = () => {
            draggingRef.current = false;
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
        };
    }, [isOnboardingMinimized]);

    const NavItem = ({ href, icon: Icon, label, active }: { href: string; icon: any; label: string; active: boolean }) => {
        return (
            <Link
                href={href}
                onClick={() => setIsSidebarOpen(false)}
                className={`group flex items-center w-full px-4 py-3 mb-1.5 rounded-2xl transition-all duration-500 ease-out relative overflow-hidden ${active
                    ? 'bg-gradient-to-r from-[#0B5F64] to-[#1B3742] text-white shadow-lg shadow-[#1B3742]/25 translate-x-1'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-[#EDEDD6]/70 dark:hover:bg-white/5 hover:text-[#0B5F64] dark:hover:text-[#EDEDD6] hover:shadow-sm'
                    }`}
            >
                <div className={`mr-3 transition-transform duration-500 ease-out ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
                    <Icon weight="duotone" className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-teal-700 dark:group-hover:text-teal-300'}`} />
                </div>
                <span className="font-semibold text-sm tracking-wide">{label}</span>
                {active && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />}
            </Link>
        );
    };

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden text-slate-900 dark:text-slate-100 transition-colors duration-500">
            {/* Mobile overlay */}
            {isSidebarOpen && (
                <div className="fixed inset-0 modal-overlay z-30 lg:hidden animate-fade-in" onClick={() => setIsSidebarOpen(false)} />
            )}

            {/* Glassmorphism Sidebar */}
            <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-[#E9E5DE]/95 dark:bg-slate-900/95 lg:bg-transparent transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) lg:transform-none flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="h-full flex flex-col p-4 lg:py-6 lg:pl-6">
                    <div className="flex-1 glass lg:rounded-[2rem] lg:shadow-2xl flex flex-col overflow-hidden transition-all duration-500">

                        {/* Logo */}
                        <div className="flex items-center justify-between p-6 pb-2">
                            <div className="group cursor-default">
                                <CaphLogo
                                    size={40}
                                    showWordmark
                                    subtitle="Premium Finance"
                                    className="transition-transform duration-500 group-hover:scale-[1.03]"
                                />
                            </div>
                            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:bg-teal-50 dark:hover:bg-teal-950/30 p-2 rounded-xl transition-colors">
                                <X weight="bold" className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Navigation */}
                        <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-8 scrollbar-hide overscroll-contain">
                            <div className="animate-slide-in-right" style={{ animationDelay: '0.1s' }}>
                                <p className="px-4 text-[10px] font-bold text-[#8F7442] dark:text-[#B89A5D] uppercase tracking-widest mb-3">Menu Utama</p>
                                <div className="space-y-1">
                                    <NavItem href={route('dashboard')} icon={LayoutDashboard} label="Dashboard" active={currentRoute === 'dashboard'} />
                                    <NavItem href={route('analytics.index')} icon={BarChart3} label="Analisis Arus Kas" active={currentRoute?.startsWith('analytics') ?? false} />
                                    <NavItem href={route('transactions.index')} icon={List} label="Riwayat" active={currentRoute?.startsWith('transactions') ?? false} />
                                    <NavItem href={route('smart-entry.index')} icon={Zap} label="Input AI" active={currentRoute?.startsWith('smart-entry') ?? false} />
                                    <NavItem href={route('insights.index')} icon={PieChart} label="Analisis AI" active={currentRoute?.startsWith('insights') ?? false} />
                                </div>
                            </div>

                            <div className="animate-slide-in-right" style={{ animationDelay: '0.2s' }}>
                                <p className="px-4 text-[10px] font-bold text-[#8F7442] dark:text-[#B89A5D] uppercase tracking-widest mb-3">Keuangan</p>
                                <div className="space-y-1">
                                    <NavItem href={route('wallets.index')} icon={CreditCard} label="Dompet" active={currentRoute?.startsWith('wallets') ?? false} />
                                    <NavItem href={route('budgets.index')} icon={Target} label="Anggaran" active={currentRoute?.startsWith('budgets') ?? false} />
                                    <NavItem href={route('savings.index')} icon={PiggyBank} label="Tabungan & Impian" active={currentRoute?.startsWith('savings') ?? false} />
                                    <NavItem href={route('categories.index')} icon={Tags} label="Kategori" active={currentRoute?.startsWith('categories') ?? false} />
                                    <NavItem href={route('debts.index')} icon={HandCoins} label="Jadwal & Tagihan" active={currentRoute?.startsWith('debts') ?? false} />
                                    <NavItem href={route('assets.index')} icon={Gem} label="Aset" active={currentRoute?.startsWith('assets') ?? false} />
                                </div>
                            </div>

                            <div className="animate-slide-in-right" style={{ animationDelay: '0.3s' }}>
                                <p className="px-4 text-[10px] font-bold text-[#8F7442] dark:text-[#B89A5D] uppercase tracking-widest mb-3">Akun</p>
                                <div className="space-y-1">
                                    <NavItem href={route('profile.edit')} icon={UserIcon} label="Profil Saya" active={currentRoute === 'profile.edit'} />
                                    <NavItem href={route('settings.index')} icon={Settings} label="Pengaturan" active={currentRoute?.startsWith('settings') ?? false} />
                                    <NavItem href={route('export.index')} icon={FileDown} label="Export Data" active={currentRoute?.startsWith('export') ?? false} />
                                    <NavItem href={route('notifications.page')} icon={Bell} label="Notifikasi" active={currentRoute?.startsWith('notifications') ?? false} />
                                    <NavItem href={route('feedback.index')} icon={ChatCircleDots} label="Kotak Saran" active={currentRoute?.startsWith('feedback') ?? false} />
                                    <NavItem href={route('help.index')} icon={HelpCircle} label="Bantuan" active={currentRoute?.startsWith('help') ?? false} />
                                </div>
                            </div>

                            {(user as any)?.role === 'ADMIN' && (
                                <div className="animate-slide-in-right" style={{ animationDelay: '0.4s' }}>
                                    <p className="px-4 text-[10px] font-bold text-[#8F7442] dark:text-[#B89A5D] uppercase tracking-widest mb-3">Sistem</p>
                                    <div className="space-y-1">
                                        <NavItem
                                            href={route('admin.dashboard')}
                                            icon={ShieldCheck}
                                            label="Admin Panel"
                                            active={currentRoute?.startsWith('admin.') ?? false}
                                        />
                                    </div>
                                </div>
                            )}
                        </nav>

                        {/* User Profile Footer */}
                        <div className="p-4 mt-auto animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                            <div className="bg-white/65 dark:bg-teal-950/30 backdrop-blur-sm rounded-2xl p-4 border border-teal-100/80 dark:border-teal-900/40 relative group transition-all duration-300 hover:bg-teal-50/85 dark:hover:bg-teal-950/45">
                                <div className="flex items-center space-x-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-600 to-cyan-700 text-white flex items-center justify-center font-bold text-sm shadow-md overflow-hidden ring-2 ring-white dark:ring-teal-900/50">
                                        {user?.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="overflow-hidden flex-1">
                                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{user?.name}</p>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                                    </div>
                                </div>
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="flex items-center justify-center w-full py-2.5 text-xs font-bold text-red-500 bg-white/80 dark:bg-slate-700/80 border border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 rounded-xl transition-all shadow-sm active:scale-95"
                                >
                                    <LogOut className="w-3.5 h-3.5 mr-2" /> Sign Out
                                </Link>
                            </div>
                        </div>
                    </div>
                </div >
            </aside >

            {/* Main Content */}
            < main className="flex-1 flex flex-col h-full overflow-hidden relative" >
                {/* Glassmorphism Header */}
                < header className="h-14 lg:h-20 flex items-center justify-between px-3 sm:px-6 lg:px-10 z-20 sticky top-0 bg-[#E9E5DE]/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-[#ddd8d0] dark:border-slate-800/95 transition-colors" >
                    <div className="flex items-center gap-2 sm:gap-4 lg:gap-0 flex-1 min-w-0">
                        <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-1.5 sm:p-2 mr-1 sm:mr-2 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-xl shadow-sm transition-all active:scale-95 flex-shrink-0">
                            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                        <div className="flex flex-col animate-fade-in min-w-0">
                            {header}
                        </div>
                    </div>

                    {/* Notifications & Help */}
                    <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0 ml-2">
                        {/* Streak Indicator (Mobile Only) */}
                        <div className="lg:hidden">
                            <HabitTrackerWidget variant="minimal" />
                        </div>

                        {/* Notification Dropdown */}
                        <div className="relative" ref={notifRef}>
                            <button
                                onClick={() => setIsNotifOpen(!isNotifOpen)}
                                className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-teal-700 dark:hover:text-teal-300 hover:shadow-md transition-all active:scale-95 relative"
                            >
                                <Bell weight="duotone" className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse"></span>
                                )}
                            </button>

                            {isNotifOpen && (
                                <div className="absolute right-0 mt-4 w-80 sm:w-96 glass-card rounded-2xl shadow-2xl border border-white/50 dark:border-slate-700 overflow-hidden animate-pop-in origin-top-right z-50">
                                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm flex justify-between items-center">
                                        <h3 className="font-bold text-slate-800 dark:text-white">Notifikasi</h3>
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={handleMarkAllRead}
                                                className="text-[10px] font-bold text-[#0B5F64] dark:text-[#B89A5D] hover:bg-[#0B5F64]/10 dark:hover:bg-white/10 px-2 py-1 rounded-lg transition-colors flex items-center"
                                            >
                                                <Check className="w-3 h-3 mr-1" /> Tandai dibaca
                                            </button>
                                        )}
                                    </div>

                                    <div className="max-h-[300px] overflow-y-auto scrollbar-hide">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center text-slate-400 dark:text-slate-500">
                                                <Bell className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                                <p className="text-xs">Tidak ada notifikasi baru</p>
                                            </div>
                                        ) : (
                                            notifications.map((notif) => (
                                                <div
                                                    key={notif.id}
                                                    onClick={() => handleNotificationClick(notif.id, notif.data.link)}
                                                    className={`p-4 border-b border-slate-50 dark:border-slate-700/50 hover:bg-teal-50/70 dark:hover:bg-teal-950/20 cursor-pointer transition-colors flex gap-3 bg-teal-50/40 dark:bg-teal-950/10`}
                                                >
                                                    <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${notif.data.type === 'ALERT' || notif.data.type === 'WARNING' ? 'bg-red-100 text-red-500' :
                                                        notif.data.type === 'SUCCESS' ? 'bg-emerald-100 text-emerald-500' :
                                                            'bg-blue-100 text-blue-500'
                                                        }`}>
                                                        {getNotifIcon(notif.data.type)}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start mb-0.5">
                                                            <p className={`text-sm font-bold text-slate-800 dark:text-white`}>{notif.data.title}</p>
                                                            <span className="w-2 h-2 bg-teal-600 rounded-full"></span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{notif.data.message}</p>
                                                        <p className="text-[10px] text-slate-400 mt-1.5">
                                                            {formatTime(notif.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <div className="p-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 text-center">
                                        <Link
                                            href={route('notifications.page')}
                                            onClick={() => setIsNotifOpen(false)}
                                            className="text-xs font-bold text-[#0B5F64] dark:text-[#B89A5D] hover:underline py-1 block"
                                        >
                                            Lihat Semua Notifikasi
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Dark Mode Toggle */}
                        <button
                            onClick={() => setIsDark(!isDark)}
                            className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-teal-700 dark:hover:text-teal-300 hover:shadow-md transition-all active:scale-95"
                            title={isDark ? 'Mode Terang' : 'Mode Gelap'}
                        >
                            {isDark ? <Sun weight="duotone" className="w-5 h-5" /> : <Moon weight="duotone" className="w-5 h-5" />}
                        </button>

                        {/* Help Button */}
                        <Link
                            href="/help"
                            className="p-3 rounded-2xl bg-[#E9E5DE] dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-[#0B5F64] dark:hover:text-[#EDEDD6] hover:shadow-md transition-all active:scale-95 hidden sm:block"
                            title="Bantuan"
                        >
                            <HelpCircle weight="duotone" className="w-5 h-5" />
                        </Link>
                    </div>
                </header >

                {/* Page Content */}
                < div className="flex-1 overflow-y-auto p-3 pb-24 sm:p-6 sm:pb-24 lg:px-10 lg:pb-10 scroll-smooth" >
                    <div className="max-w-7xl mx-auto w-full animate-fade-in-up">
                        {children}
                    </div>
                </div >

                {onboarding?.show && Array.isArray(onboarding.steps) && onboarding.steps.length > 0 && (
                    <>
                        <div
                            className="hidden lg:block fixed z-40 max-w-[280px] opacity-95 hover:opacity-100 transition-opacity"
                            onMouseDown={handleOnboardingMouseDown}
                            style={dragPosition ? { left: dragPosition.x, top: dragPosition.y } : { left: '50%', top: 92, transform: 'translateX(-50%)' }}
                        >
                            <OnboardingSetupCard
                                mode="floating"
                                progressText={`${onboarding.completedSteps ?? 0}/3 selesai`}
                                progressPercent={onboarding.progressPercent ?? 0}
                                steps={onboarding.steps}
                                minimized={isOnboardingMinimized}
                                onToggleMinimize={() => setIsOnboardingMinimized((prev: boolean) => !prev)}
                            />
                        </div>
                        <div className="lg:hidden fixed left-3 right-3 top-20 z-40 opacity-95">
                            <OnboardingSetupCard
                                mode="floating"
                                progressText={`${onboarding.completedSteps ?? 0}/3 selesai`}
                                progressPercent={onboarding.progressPercent ?? 0}
                                steps={onboarding.steps}
                                minimized={isOnboardingMinimized}
                                onToggleMinimize={() => setIsOnboardingMinimized((prev: boolean) => !prev)}
                            />
                        </div>
                    </>
                )}

                {/* Mobile Bottom Navigation Bar */}
                < nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden" >
                    <div className="glass border-t border-slate-200/50 dark:border-slate-700/50 px-2 pt-2 pb-[env(safe-area-inset-bottom,8px)]">
                        <div className="flex items-center justify-around relative">
                            {[
                                { href: route('dashboard'), icon: LayoutDashboard, label: 'Home', active: currentRoute === 'dashboard' },
                                { href: route('transactions.index'), icon: List, label: 'Riwayat', active: currentRoute?.startsWith('transactions') ?? false },
                            ].map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-300 min-w-[50px] ${item.active
                                        ? 'text-[#0B5F64] dark:text-[#B89A5D]'
                                        : 'text-slate-400 dark:text-slate-500 active:text-[#0B5F64] dark:active:text-[#B89A5D]'
                                        }`}
                                >
                                    <div className="relative">
                                        <item.icon weight="duotone" className={`w-6 h-6 transition-transform duration-300 ${item.active ? 'scale-110' : ''}`} />
                                        {item.active && (
                                            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#0B5F64] dark:bg-[#B89A5D]" />
                                        )}
                                    </div>
                                    <span className={`text-[10px] font-semibold mt-0.5 ${item.active ? 'font-bold' : ''}`}>{item.label}</span>
                                </Link>
                            ))}
                            
                            {/* Global Center FAB */}
                            <div className="relative -top-5 px-2">
                                <Link
                                    href={route('transactions.index') + '?action=add'}
                                    className="flex items-center justify-center w-12 h-12 bg-gradient-to-tr from-[#0B5F64] to-[#044D52] text-white rounded-full shadow-lg shadow-[#0B5F64]/40 hover:scale-110 active:scale-95 transition-all duration-300 ring-4 ring-slate-50 dark:ring-slate-950"
                                    aria-label="Tambah Transaksi"
                                >
                                    <Plus weight="bold" className="w-6 h-6 leading-none" />
                                </Link>
                            </div>

                            {[
                                { href: route('smart-entry.index'), icon: Zap, label: 'Input AI', active: currentRoute?.startsWith('smart-entry') ?? false },
                            ].map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-300 min-w-[50px] ${item.active
                                        ? 'text-[#0B5F64] dark:text-[#B89A5D]'
                                        : 'text-slate-400 dark:text-slate-500 active:text-[#0B5F64] dark:active:text-[#B89A5D]'
                                        }`}
                                >
                                    <div className="relative">
                                        <item.icon weight="duotone" className={`w-6 h-6 transition-transform duration-300 ${item.active ? 'scale-110' : ''}`} />
                                        {item.active && (
                                            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#0B5F64] dark:bg-[#B89A5D]" />
                                        )}
                                    </div>
                                    <span className={`text-[10px] font-semibold mt-0.5 ${item.active ? 'font-bold' : ''}`}>{item.label}</span>
                                </Link>
                            ))}

                            {/* More Menu Button */}
                            <button
                                onClick={() => setIsMoreOpen(true)}
                                className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-300 min-w-[50px] ${[
                                    'wallets', 'debts', 'insights', 'budgets', 'assets', 'categories', 'settings', 'export', 'help', 'notifications', 'profile', 'feedback'
                                ].some(r => currentRoute?.startsWith(r))
                                    ? 'text-[#0B5F64] dark:text-[#B89A5D]'
                                    : 'text-slate-400 dark:text-slate-500 active:text-[#0B5F64] dark:active:text-[#B89A5D]'
                                }`}
                            >
                                <div className="relative">
                                    <MoreHorizontal weight="duotone" className="w-6 h-6" />
                                </div>
                                <span className="text-[10px] font-semibold mt-0.5">Lainnya</span>
                            </button>
                        </div>
                    </div>
                </nav >

                {/* More Bottom Sheet */}
                {isMoreOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden animate-fade-in">
                        <div className="absolute inset-0 bg-indigo-900/10 dark:bg-slate-950/50 backdrop-blur-md transition-opacity" onClick={() => setIsMoreOpen(false)} />
                        <div className="absolute bottom-0 left-0 right-0 glass-heavy rounded-t-[2rem] shadow-2xl overflow-hidden border-t border-slate-200/50 dark:border-slate-700/50 animate-pop-in pb-[env(safe-area-inset-bottom,16px)]">
                            {/* Ambient Colors for Glass */}
                            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-400/20 dark:bg-purple-500/20 rounded-full blur-3xl pointer-events-none" style={{ transform: 'translate(30%, -30%)' }} />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/20 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" style={{ transform: 'translate(-30%, 30%)' }} />

                            <div className="flex justify-center pt-3 pb-2 relative z-10">
                                <div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
                            </div>
                            <div className="px-4 pb-4 grid grid-cols-4 gap-3">
                                {[
                                    { href: route('wallets.index'), icon: CreditCard, label: 'Dompet', color: 'bg-teal-50 dark:bg-[#0B5F64]/10 text-[#0B5F64] dark:text-[#B89A5D]' },
                                    { href: route('budgets.index'), icon: Target, label: 'Anggaran', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' },
                                    { href: route('savings.index'), icon: PiggyBank, label: 'Tabungan', color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400' },
                                    { href: route('debts.index'), icon: HandCoins, label: 'Jadwal', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' },
                                    { href: route('insights.index'), icon: PieChart, label: 'Analisis', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
                                    { href: route('assets.index'), icon: Gem, label: 'Aset', color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400' },
                                    { href: route('categories.index'), icon: Tags, label: 'Kategori', color: 'bg-[#B89A5D]/10 dark:bg-[#B89A5D]/5 text-[#8F7442] dark:text-[#B89A5D]' },
                                    { href: route('settings.index'), icon: Settings, label: 'Pengaturan', color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' },
                                    { href: route('feedback.index'), icon: ChatCircleDots, label: 'Saran', color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400' },
                                    { href: route('profile.edit'), icon: UserIcon, label: 'Profil', color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' },
                                ].map((item) => (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        onClick={() => setIsMoreOpen(false)}
                                        className="flex flex-col items-center gap-1.5 py-3 rounded-2xl hover:bg-white/40 dark:hover:bg-slate-800/40 transition-all active:scale-95 relative z-10"
                                    >
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${item.color.replace('bg-', 'bg-transparent border border-').replace('text-', 'text-')}`}>
                                            <item.icon weight="duotone" className="w-5 h-5" />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{item.label}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main >
        </div >
    );
}

