import { PropsWithChildren, useState, useRef, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
    LayoutDashboard, List, Zap, PieChart,
    Wallet as WalletIcon, LogOut, HandCoins,
    Target, Gem, CreditCard, Tags, User as UserIcon,
    Settings, FileDown, Bell, HelpCircle, Menu, X,
    ShieldCheck, Check, AlertTriangle, Info, CheckCircle,
    Sun, Moon, MoreHorizontal, Users, FileText, Database, ArrowRightLeft
}
    from 'lucide-react';
import { User } from '@/types';

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
    const user = usePage().props.auth.user as User;
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
            case 'WARNING': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
            case 'ALERT': return <AlertTriangle className="w-4 h-4 text-red-500" />;
            case 'SUCCESS': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
            default: return <Info className="w-4 h-4 text-blue-500" />;
        }
    };

    const NavItem = ({ href, icon: Icon, label, active }: { href: string; icon: any; label: string; active: boolean }) => {
        return (
            <Link
                href={href}
                onClick={() => setIsSidebarOpen(false)}
                className={`group flex items-center w-full px-4 py-3 mb-1.5 rounded-2xl transition-all duration-500 ease-out relative overflow-hidden ${active
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 translate-x-1'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-sm'
                    }`}
            >
                <div className={`mr-3 transition-transform duration-500 ease-out ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
                    <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`} />
                </div>
                <span className="font-semibold text-sm tracking-wide">{label}</span>
                {active && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />}
            </Link>
        );
    };

    return (
        <div className="flex h-screen bg-slate-50/50 dark:bg-slate-950 overflow-hidden text-slate-900 dark:text-slate-100 transition-colors duration-500">
            {/* Mobile overlay */}
            {isSidebarOpen && (
                <div className="fixed inset-0 modal-overlay z-30 lg:hidden animate-fade-in" onClick={() => setIsSidebarOpen(false)} />
            )}

            {/* Glassmorphism Sidebar */}
            <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-slate-50/95 dark:bg-slate-900/95 lg:bg-transparent transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) lg:transform-none flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="h-full flex flex-col p-4 lg:py-6 lg:pl-6">
                    <div className="flex-1 glass lg:rounded-[2rem] lg:shadow-2xl flex flex-col overflow-hidden transition-all duration-500">

                        {/* Logo */}
                        <div className="flex items-center justify-between p-6 pb-2">
                            <div className="flex items-center space-x-3 group cursor-default">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
                                    <WalletIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white leading-none">CAPH.io</h1>
                                    <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 tracking-widest uppercase">AI Powered</span>
                                </div>
                            </div>
                            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-xl transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Navigation */}
                        <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-8 scrollbar-hide">
                            <div className="animate-slide-in-right" style={{ animationDelay: '0.1s' }}>
                                <p className="px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Menu Utama</p>
                                <div className="space-y-1">
                                    <NavItem href={route('dashboard')} icon={LayoutDashboard} label="Dashboard" active={currentRoute === 'dashboard'} />
                                    <NavItem href={route('transactions.index')} icon={List} label="Riwayat" active={currentRoute?.startsWith('transactions') ?? false} />
                                    <NavItem href={route('smart-entry.index')} icon={Zap} label="Input AI" active={currentRoute?.startsWith('smart-entry') ?? false} />
                                    <NavItem href={route('insights.index')} icon={PieChart} label="Analisis" active={currentRoute?.startsWith('insights') ?? false} />
                                </div>
                            </div>

                            <div className="animate-slide-in-right" style={{ animationDelay: '0.2s' }}>
                                <p className="px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Keuangan</p>
                                <div className="space-y-1">
                                    <NavItem href={route('wallets.index')} icon={CreditCard} label="Dompet" active={currentRoute?.startsWith('wallets') ?? false} />
                                    <NavItem href={route('budgets.index')} icon={Target} label="Anggaran" active={currentRoute?.startsWith('budgets') ?? false} />
                                    <NavItem href={route('categories.index')} icon={Tags} label="Kategori" active={currentRoute?.startsWith('categories') ?? false} />
                                    <NavItem href={route('debts.index')} icon={HandCoins} label="Tagihan & Kewajiban" active={currentRoute?.startsWith('debts') ?? false} />
                                    <NavItem href={route('assets.index')} icon={Gem} label="Aset" active={currentRoute?.startsWith('assets') ?? false} />
                                </div>
                            </div>

                            <div className="animate-slide-in-right" style={{ animationDelay: '0.3s' }}>
                                <p className="px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Akun</p>
                                <div className="space-y-1">
                                    <NavItem href={route('profile.edit')} icon={UserIcon} label="Profil Saya" active={currentRoute === 'profile.edit'} />
                                    <NavItem href={route('settings.index')} icon={Settings} label="Pengaturan" active={currentRoute?.startsWith('settings') ?? false} />
                                    <NavItem href={route('export.index')} icon={FileDown} label="Export Data" active={currentRoute?.startsWith('export') ?? false} />
                                    <NavItem href={route('notifications.page')} icon={Bell} label="Notifikasi" active={currentRoute?.startsWith('notifications') ?? false} />
                                    <NavItem href={route('help.index')} icon={HelpCircle} label="Bantuan" active={currentRoute?.startsWith('help') ?? false} />
                                </div>
                            </div>

                            {(user as any)?.role === 'ADMIN' && (
                                <div className="animate-slide-in-right" style={{ animationDelay: '0.4s' }}>
                                    <p className="px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Sistem</p>
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
                            <div className="bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-100 dark:border-slate-700 relative group transition-all duration-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80">
                                <div className="flex items-center space-x-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-sm shadow-md overflow-hidden ring-2 ring-white dark:ring-slate-700">
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
                < header className="h-14 sm:h-20 lg:h-24 flex items-center justify-between px-4 sm:px-6 lg:px-10 z-20 sticky top-0 glass transition-colors" >
                    <div className="flex items-center gap-4 lg:gap-0">
                        <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 mr-2 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-xl shadow-sm transition-all active:scale-95">
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="flex flex-col animate-fade-in">
                            {header}
                        </div>
                    </div>

                    {/* Notifications & Help */}
                    <div className="flex items-center gap-3">
                        {/* Notification Dropdown */}
                        <div className="relative" ref={notifRef}>
                            <button
                                onClick={() => setIsNotifOpen(!isNotifOpen)}
                                className="p-3 rounded-2xl bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-md transition-all active:scale-95 relative"
                            >
                                <Bell className="w-5 h-5" />
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
                                                className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-2 py-1 rounded-lg transition-colors flex items-center"
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
                                                    className={`p-4 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors flex gap-3 bg-indigo-50/40 dark:bg-indigo-900/10`}
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
                                                            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{notif.data.message}</p>
                                                        <p className="text-[10px] text-slate-400 mt-1.5">
                                                            {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                                            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline py-1 block"
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
                            className="p-3 rounded-2xl bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-md transition-all active:scale-95"
                            title={isDark ? 'Mode Terang' : 'Mode Gelap'}
                        >
                            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>

                        {/* Help Button */}
                        <Link
                            href="/help"
                            className="p-3 rounded-2xl bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-md transition-all active:scale-95 hidden sm:block"
                            title="Bantuan"
                        >
                            <HelpCircle className="w-5 h-5" />
                        </Link>
                    </div>
                </header >

                {/* Page Content */}
                < div className="flex-1 overflow-y-auto p-6 pb-24 lg:px-10 lg:pb-10 scroll-smooth" >
                    <div className="max-w-7xl mx-auto w-full animate-fade-in-up">
                        {children}
                    </div>
                </div >

                {/* Mobile Bottom Navigation Bar */}
                < nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden" >
                    <div className="glass border-t border-slate-200/50 dark:border-slate-700/50 px-2 pt-2 pb-[env(safe-area-inset-bottom,8px)]">
                        <div className="flex items-center justify-around">
                            {[
                                { href: route('dashboard'), icon: LayoutDashboard, label: 'Home', active: currentRoute === 'dashboard' },
                                { href: route('transactions.index'), icon: List, label: 'Riwayat', active: currentRoute?.startsWith('transactions') ?? false },
                                { href: route('smart-entry.index'), icon: Zap, label: 'AI Input', active: currentRoute?.startsWith('smart-entry') ?? false },
                                { href: route('wallets.index'), icon: CreditCard, label: 'Dompet', active: currentRoute?.startsWith('wallets') ?? false },
                            ].map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-300 min-w-[60px] ${item.active
                                        ? 'text-indigo-600 dark:text-indigo-400'
                                        : 'text-slate-400 dark:text-slate-500 active:text-indigo-600 dark:active:text-indigo-400'
                                        }`}
                                >
                                    <div className="relative">
                                        <item.icon className={`w-5 h-5 transition-transform duration-300 ${item.active ? 'scale-110' : ''}`} />
                                        {item.active && (
                                            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                                        )}
                                    </div>
                                    <span className={`text-[10px] font-semibold mt-0.5 ${item.active ? 'font-bold' : ''}`}>{item.label}</span>
                                </Link>
                            ))}
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-300 min-w-[60px] text-slate-400 dark:text-slate-500 active:text-indigo-600 dark:active:text-indigo-400"
                            >
                                <MoreHorizontal className="w-5 h-5" />
                                <span className="text-[10px] font-semibold mt-0.5">Menu</span>
                            </button>
                        </div>
                    </div>
                </nav >
            </main >
        </div >
    );
}
