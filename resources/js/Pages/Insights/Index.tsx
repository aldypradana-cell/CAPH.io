import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useState, useEffect, useRef } from 'react';
import {
    Sparkle as Sparkles, SpinnerGap as Loader2, Heart, TrendUp as TrendingUp, TrendDown as TrendingDown,
    Shield, Target, Warning as AlertTriangle, CheckCircle as CheckCircle2, Lightning as Zap,
    ArrowUpRight, ArrowDownRight, CaretRight as ChevronRight, Info,
    Fire, Clock as ClockIcon, ArrowCounterClockwise, ShareNetwork, Eye
} from '@phosphor-icons/react';
import toast, { Toaster } from 'react-hot-toast';
import { toDateString, formatDateTime, formatWeekday } from '@/utils/date';
import html2canvas from 'html2canvas';

// ── Types ────────────────────────────────────────────
interface Cashflow {
    income: number;
    expense: number;
    surplus: number;
    savingsRate: number;
    verdict: string;
}

interface EmergencyFund {
    idealMonths: number;
    monthlyExpenseAvg: number;
    idealAmount: number;
    verdict: string;
}

interface GoalProjection {
    name: string;
    targetAmount: number;
    deadline: string;
    monthsRemaining: number;
    requiredMonthly: number;
    currentSurplus: number;
    status: 'ON_TRACK' | 'DELAYED' | 'AT_RISK';
    projectedDate: string;
    verdict: string;
}

interface SpendingAlert {
    category: string;
    amount: number;
    avgLast6m: number;
    changePercent: number;
    severity: 'INFO' | 'WARNING' | 'DANGER';
    advice: string;
}

interface ActionItem {
    priority: number;
    title: string;
    description: string;
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
    savingsPotential: number;
}

interface NetWorthSnapshot {
    totalWallet: number;
    totalAssets: number;
    totalDebt: number;
    netWorth: number;
    verdict: string;
}

interface BudgetComplianceItem {
    category: string;
    limit: number;
    spent: number;
    usagePercent: number;
    status: 'OK' | 'WARNING' | 'OVER';
}

interface InsightData {
    healthScore: number;
    healthLabel: string;
    sentiment: 'EXCELLENT' | 'GOOD' | 'CAUTIOUS' | 'WARNING' | 'CRITICAL';
    summary: string;
    cashflow: Cashflow;
    emergencyFund: EmergencyFund;
    netWorthSnapshot?: NetWorthSnapshot;
    budgetCompliance?: BudgetComplianceItem[];
    goalProjections: GoalProjection[];
    spendingAlerts: SpendingAlert[];
    actionItems: ActionItem[];
}

// ── Roast Types ──────────────────────────────────────
interface RoastResult {
    id: number;
    level: 'MILD' | 'MEDIUM' | 'BRUTAL';
    roast_text: string;
    badge_name: string;
    badge_emoji: string;
    waste_score: number;
    challenge: string | null;
    categories_roasted: string[] | null;
    created_at: string;
}

interface RoastData {
    latestRoast: RoastResult | null;
    history: RoastResult[];
    roastedToday: boolean;
    cooldownEnds: string;
    quota: { used: number; limit: number; resetsAt: string };
}

type RoastLevel = 'MILD' | 'MEDIUM' | 'BRUTAL';

const ROAST_LEVELS: { key: RoastLevel; emoji: string; label: string; desc: string; color: string; ring: string }[] = [
    { key: 'MILD', emoji: '🟡', label: 'Halus', desc: 'Teman baik yang becanda', color: 'from-yellow-400 to-amber-400', ring: 'ring-yellow-400' },
    { key: 'MEDIUM', emoji: '🟠', label: 'Medium', desc: 'Kakak yang blak-blakan', color: 'from-orange-400 to-orange-500', ring: 'ring-orange-400' },
    { key: 'BRUTAL', emoji: '🔴', label: 'Brutal', desc: 'Stand-up tanpa ampun', color: 'from-red-500 to-rose-600', ring: 'ring-red-500' },
];

const LOADING_TEXTS = [
    'Menghitung berapa kali kamu beli kopi...',
    'Menganalisis koleksi langganan yang nggak pernah dipakai...',
    'Membandingkan tabunganmu dengan anak kos...',
    'Menyiapkan bahan roasting terpedas...',
    'Memanaskan panggangan AI...',
    'Mencari celah di budget kamu...',
    'Menghitung kerugian akibat impuls buying...',
];

function getWasteLabel(score: number) {
    if (score <= 20) return 'Sangat Hemat';
    if (score <= 40) return 'Hemat';
    if (score <= 60) return 'Normal';
    if (score <= 80) return 'Cukup Boros';
    return 'Boros Parah';
}

// ── Helpers ──────────────────────────────────────────
const formatIDR = (n: number) => 'Rp ' + n.toLocaleString('id-ID');
const formatShortIDR = (n: number) => {
    if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
    if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
    if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`;
    return `Rp ${n}`;
};

const sentimentConfig: Record<string, { color: string; bgFrom: string; bgTo: string; icon: string; ringColor: string }> = {
    EXCELLENT: { color: 'text-emerald-500', bgFrom: 'from-emerald-500', bgTo: 'to-teal-500', icon: '🎉', ringColor: '#10b981' },
    GOOD: { color: 'text-blue-500', bgFrom: 'from-blue-500', bgTo: 'to-indigo-500', icon: '👍', ringColor: '#3b82f6' },
    CAUTIOUS: { color: 'text-amber-500', bgFrom: 'from-amber-500', bgTo: 'to-yellow-500', icon: '⚠️', ringColor: '#f59e0b' },
    WARNING: { color: 'text-orange-500', bgFrom: 'from-orange-500', bgTo: 'to-red-400', icon: '🚨', ringColor: '#f97316' },
    CRITICAL: { color: 'text-red-600', bgFrom: 'from-red-600', bgTo: 'to-rose-600', icon: '🔴', ringColor: '#dc2626' },
};

const goalStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
    ON_TRACK: { label: 'On Track', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    DELAYED: { label: 'Delayed', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    AT_RISK: { label: 'At Risk', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
};

// ── Gauge Component ──────────────────────────────────
function HealthGauge({ score, sentiment }: { score: number; sentiment: string }) {
    const config = sentimentConfig[sentiment] || sentimentConfig.CAUTIOUS;
    const circumference = 2 * Math.PI * 52;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="relative w-36 h-36 mx-auto">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8"
                    className="text-slate-100 dark:text-slate-800" />
                <circle cx="60" cy="60" r="52" fill="none" stroke={config.ringColor} strokeWidth="8"
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    strokeLinecap="round" className="transition-all duration-[2000ms] ease-out" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-black ${config.color}`}>{score}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">/100</span>
            </div>
        </div>
    );
}

// ── Main Component ───────────────────────────────────
export default function InsightsIndex({ auth, transactionCount, hasProfile, latestInsight, aiQuota: initialAiQuota, roastData: initialRoastData }: PageProps<{
    transactionCount: number;
    hasProfile: boolean;
    latestInsight?: { id: number; content: InsightData; created_at: string } | null;
    aiQuota?: { used: number; limit: number; resetsAt: string };
    roastData?: RoastData;
}>) {
    const [isLoading, setIsLoading] = useState(false);
    const [insight, setInsight] = useState<InsightData | null>(latestInsight ? latestInsight.content : null);
    const [lastUpdated, setLastUpdated] = useState<string | null>(latestInsight ? latestInsight.created_at : null);
    const [aiQuota, setAiQuota] = useState(initialAiQuota);
    const [error, setError] = useState<string | null>(null);

    // Tab state
    const [activeTab, setActiveTab] = useState<'insight' | 'roast'>('insight');

    // Roast state
    const [roastLevel, setRoastLevel] = useState<RoastLevel>('MEDIUM');
    const [isRoasting, setIsRoasting] = useState(false);
    const [roastResult, setRoastResult] = useState<RoastResult | null>(initialRoastData?.latestRoast ?? null);
    const [roastHistory, setRoastHistory] = useState<RoastResult[]>(initialRoastData?.history ?? []);
    const [roastedToday, setRoastedToday] = useState(initialRoastData?.roastedToday ?? false);
    const [cooldownEnds, setCooldownEnds] = useState(initialRoastData?.cooldownEnds ?? '');
    const [roastQuota, setRoastQuota] = useState(initialRoastData?.quota);
    const [roastError, setRoastError] = useState<string | null>(null);
    const [loadingTextIdx, setLoadingTextIdx] = useState(0);
    const [expandedHistory, setExpandedHistory] = useState<number | null>(null);
    const [cooldownStr, setCooldownStr] = useState('');
    const [isLoadingShare, setIsLoadingShare] = useState(false);
    
    const isQuotaExceeded = aiQuota ? aiQuota.used >= aiQuota.limit : false;
    const shareRef = useRef<HTMLDivElement>(null);

    // Period Filter State
    const [period, setPeriod] = useState<'THIS_MONTH' | 'LAST_MONTH' | 'CUSTOM'>('THIS_MONTH');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Determine dates based on period
            let startDate, endDate;
            const now = new Date();

            if (period === 'THIS_MONTH') {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            } else if (period === 'LAST_MONTH') {
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0);
            } else {
                if (!customStart || !customEnd) {
                    toast.error('Pilih tanggal mulai dan selesai');
                    setIsLoading(false);
                    return;
                }
                startDate = new Date(customStart);
                endDate = new Date(customEnd);
            }

            // Format YYYY-MM-DD
            const formatDate = (d: Date) => toDateString(d);

            const response = await window.axios.post(route('insights.generate'), {
                startDate: formatDate(startDate),
                endDate: formatDate(endDate)
            });

            const result = response.data;
            if (result.success) {
                setInsight(result.insight);
                setLastUpdated(new Date().toISOString());
                toast.success('Analisis selesai & tersimpan!');
                if (result.quota) setAiQuota(result.quota);
            } else {
                setError(result.message || 'Gagal menghasilkan analisis');
                if (result.quota) setAiQuota(result.quota);
            }
        } catch (e: any) {
            console.error('Insight Error:', e);
            setError(e.response?.data?.message || 'Terjadi kendala jaringan saat menghubungi layanan AI.');
            if (e.response?.status === 429 && e.response?.data?.used !== undefined) {
                setAiQuota({ used: e.response.data.used, limit: e.response.data.limit, resetsAt: e.response.data.resetsAt });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const sc = insight ? (sentimentConfig[insight.sentiment] || sentimentConfig.CAUTIOUS) : null;

    // Loading text rotation
    useEffect(() => {
        if (!isRoasting) return;
        const interval = setInterval(() => {
            setLoadingTextIdx(prev => (prev + 1) % LOADING_TEXTS.length);
        }, 2000);
        return () => clearInterval(interval);
    }, [isRoasting]);

    // Cooldown countdown timer
    useEffect(() => {
        if (!roastedToday || !cooldownEnds) { setCooldownStr(''); return; }
        const update = () => {
            const diff = new Date(cooldownEnds).getTime() - Date.now();
            if (diff <= 0) { setCooldownStr(''); setRoastedToday(false); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            setCooldownStr(`${h}j ${m}m`);
        };
        update();
        const interval = setInterval(update, 60000);
        return () => clearInterval(interval);
    }, [roastedToday, cooldownEnds]);

    const handleGetSolution = () => {
        setActiveTab('insight');
        toast('Beralih ke Analisis Finansial serius... ✨');
    };

    const handleRoast = async () => {
        setIsRoasting(true);
        setRoastError(null);
        setLoadingTextIdx(0);
        try {
            const response = await window.axios.post(route('insights.roast'), { level: roastLevel });
            const data = response.data;
            if (data.success) {
                setRoastResult(data.roast);
                setRoastHistory(prev => [data.roast, ...prev].slice(0, 10));
                setRoastedToday(true);
                setCooldownEnds(data.cooldownEnds);
                toast.success('Kamu sudah dipanggang! 🔥');
            } else {
                setRoastError(data.message || 'Gagal memanggang.');
            }
        } catch (e: any) {
            if (e.response?.status === 429) {
                if (e.response?.data?.cooldown) {
                    setRoastedToday(true);
                    setCooldownEnds(e.response.data.cooldownEnds);
                } else if (e.response?.data?.quota) {
                    setRoastQuota({
                        used: e.response.data.used,
                        limit: e.response.data.limit,
                        resetsAt: e.response.data.resetsAt
                    });
                }
                setRoastError(e.response.data.message);
            } else {
                setRoastError(e.response?.data?.message || 'Terjadi kendala saat memanggang. Coba lagi nanti.');
            }
        } finally {
            setIsRoasting(false);
        }
    };

    const handleShare = async () => {
        if (!shareRef.current) return;
        setIsLoadingShare(true);
        const loadingToast = toast.loading('Menyiapkan gambar...');
        try {
            const canvas = await html2canvas(shareRef.current, {
                backgroundColor: '#0a0a0a',
                scale: 3, // High quality
                logging: false,
                useCORS: true,
                allowTaint: true,
                imageTimeout: 15000,
                onclone: (clonedDoc) => {
                    const el = clonedDoc.getElementById('share-card-container');
                    if (el) {
                        el.style.display = 'block';
                        el.style.position = 'relative';
                    }
                }
            });
            const dataUrl = canvas.toDataURL('image/png');
            
            // Try to use Web Share API if possible (mobile)
            if (navigator.share && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
                const blob = await (await fetch(dataUrl)).blob();
                const file = new File([blob], 'roast-me.png', { type: 'image/png' });
                await navigator.share({
                    files: [file],
                    title: 'Financial Roast Me - CAPH.io',
                    text: `Gue baru aja di-roast sama AI CAPH.io! Badge gue: ${roastResult?.badge_emoji} ${roastResult?.badge_name}. Cek keuangan lo juga di CAPH.io! Flame on! 🔥`,
                });
            } else {
                // Fallback to download
                const link = document.createElement('a');
                link.download = `roast-me-${roastResult?.badge_name.toLowerCase().replace(/\s+/g, '-')}.png`;
                link.href = dataUrl;
                link.click();
            }
            toast.success('Hasil roasting siap dibagikan! 🔥', { id: loadingToast });
        } catch (e) {
            console.error(e);
            toast.error('Gagal memproses gambar.', { id: loadingToast });
        } finally {
            setIsLoadingShare(false);
        }
    };

    return (
        <>
            <Head title="Analisis AI" />
            <Toaster position="top-right" />

            <div className={`max-w-5xl mx-auto space-y-4 sm:space-y-6 animate-fade-in-up transition-all duration-700 ease-in-out ${activeTab === 'roast' ? 'bg-[#0a0a0a] min-h-[80vh] rounded-[2rem] p-4 sm:p-8 shadow-[0_0_100px_rgba(220,38,38,0.1)] relative overflow-hidden ring-1 ring-white/5' : ''}`}>
                {/* ── Header Area with Secret Toggle & Timestamp ── */}
                <div className="flex items-center justify-between transition-colors duration-500 z-10 relative mb-4">
                    <div className="flex-1">
                        {activeTab !== 'roast' && lastUpdated && (
                            <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 font-medium">Terakhir diupdate: {formatDateTime(lastUpdated)}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-3 pr-1">
                        <div className={`flex items-center gap-1.5 transition-colors ${activeTab === 'roast' ? 'text-red-500' : 'text-slate-400 dark:text-slate-500'}`}>
                            <Fire 
                                weight={activeTab === 'roast' ? "fill" : "bold"} 
                                className={`w-3.5 h-3.5 ${activeTab === 'roast' ? 'drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : ''}`} 
                            />
                            <span className="text-[10px] sm:text-xs font-black tracking-widest uppercase">
                                Roast Me
                            </span>
                        </div>
                        <button 
                            onClick={() => setActiveTab(activeTab === 'insight' ? 'roast' : 'insight')}
                            className={`relative inline-flex h-7 w-12 sm:h-8 sm:w-14 items-center rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${activeTab === 'roast' ? 'bg-red-600 focus-visible:ring-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)] border-transparent' : 'bg-slate-300 dark:bg-slate-600 focus-visible:ring-slate-500 shadow-inner'}`}
                        >
                            <span className={`inline-block h-5 w-5 sm:h-6 sm:w-6 transform rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center ${activeTab === 'roast' ? 'translate-x-6 sm:translate-x-7' : 'translate-x-1'}`}>
                                {activeTab === 'roast' ? <Fire weight="fill" className="text-red-600 w-3 h-3 sm:w-4 sm:h-4" /> : <Sparkles weight="fill" className="text-slate-400 w-3 h-3 sm:w-4 sm:h-4" />}
                            </span>
                        </button>
                    </div>
                </div>

                {activeTab === 'roast' ? (
                    /* ═══════════════════════════════════ ROAST ME TAB ═══════════════════════════════════ */
                    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in-up relative z-10">
                        {/* Dramatic Red Glow Background */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/10 blur-[120px] rounded-full pointer-events-none" />

                        {isRoasting ? (
                            <div className="flex flex-col items-center text-center z-10 w-full max-w-sm">
                                {/* Loading text block without fire icons */}
                                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mb-6 mt-4">
                                    <div className="h-full bg-red-600 rounded-full animate-pulse" style={{ width: '100%' }} />
                                </div>
                                <p className="text-sm font-mono text-red-500/80 animate-pulse tracking-widest uppercase">
                                    {LOADING_TEXTS[loadingTextIdx]}
                                </p>
                            </div>
                        ) : roastResult && !roastError ? (
                            <div className="z-10 w-full flex flex-col items-center animate-pop-in">
                                {/* The exact share card rendered on screen */}
                                <div 
                                    className="w-full max-w-[420px] rounded-[1.5rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(220,38,38,0.2)] border border-white/5"
                                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
                                >
                                    <div style={{ background: '#101010', color: '#F3F5F7', padding: '24px', position: 'relative' }}>
                                        {/* Post Container */}
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            {/* Left Column: Avatar & Thread Line */}
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <div style={{ 
                                                    width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF6B6B, #C0392B, #8E44AD)', 
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden'
                                                }}>
                                                    <span style={{ fontSize: '24px', lineHeight: 1, marginTop: '0px', display: 'flex' }}>🔥</span>
                                                </div>
                                                {/* Thread line */}
                                                <div style={{ width: '2px', flexGrow: 1, backgroundColor: '#222', marginTop: '10px', marginBottom: '10px', borderRadius: '1px' }}></div>
                                                {/* Small avatar */}
                                                <div style={{ 
                                                    width: '18px', height: '18px', borderRadius: '50%', background: '#1d9bf0', 
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                                }}>
                                                    <svg viewBox="0 0 24 24" fill="#ffffff" style={{ width: '10px', height: '10px' }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path></svg>
                                                </div>
                                            </div>

                                            {/* Right Column: Content */}
                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingTop: '2px' }}>
                                                {/* Header: Name, Verified, Time */}
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <span style={{ fontSize: '15px', fontWeight: '600', color: '#F3F5F7', letterSpacing: '-0.2px' }}>caph_roast_ai</span>
                                                        <svg viewBox="0 0 24 24" fill="#0095F6" style={{ width: '14px', height: '14px' }}>
                                                             <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
                                                        </svg>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#777777', fontSize: '14px', fontWeight: '400', lineHeight: 1 }}>
                                                        <span style={{ display: 'flex', alignItems: 'center' }}>{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                                        <div style={{ display: 'flex', alignItems: 'center', marginTop: '2px' }}>
                                                            <svg aria-label="More" fill="currentColor" height="18" role="img" viewBox="0 0 24 24" width="18"><circle cx="12" cy="12" r="1.5"></circle><circle cx="6" cy="12" r="1.5"></circle><circle cx="18" cy="12" r="1.5"></circle></svg>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Post Text */}
                                                <div style={{ marginBottom: '14px' }}>
                                                    <p style={{ 
                                                        fontSize: '15px', 
                                                        fontWeight: '400', 
                                                        color: '#F3F5F7', 
                                                        lineHeight: '1.45', 
                                                        margin: 0,
                                                        whiteSpace: 'pre-wrap',
                                                    }}>
                                                        "{roastResult.roast_text.split('\n\n')[0]}"
                                                    </p>
                                                </div>

                                                {/* Engagement Icons */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#F3F5F7', marginBottom: '12px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px' }}>
                                                        <svg aria-label="Like" fill="transparent" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: '100%', height: '100%' }}><path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938m0-2a6.04 6.04 0 0 0-4.797 2.127 6.052 6.052 0 0 0-4.787-2.127A6.985 6.985 0 0 0 .5 9.122c0 3.61 2.55 5.827 5.015 7.97.283.246.569.494.853.747l1.027.918a44.998 44.998 0 0 0 3.518 3.018 2 2 0 0 0 2.174 0 45.263 45.263 0 0 0 3.626-3.115l.922-.824c.293-.26.59-.519.885-.774 2.334-2.025 4.98-4.32 4.98-7.94a6.985 6.985 0 0 0-6.708-7.218Z"></path></svg>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px' }}>
                                                        <svg aria-label="Comment" fill="transparent" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" style={{ width: '100%', height: '100%' }}><path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615l1.455 2.853c.123.243.342.368.61.368a.634.634 0 0 0 .61-.368c.28-.548.564-1.104.848-1.659.284-.555.568-1.111.848-1.666a.637.637 0 0 0-.106-.723Z"></path></svg>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px' }}>
                                                        <svg aria-label="Repost" fill="transparent" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" style={{ width: '100%', height: '100%' }}><path d="M19.998 9.497a1 1 0 0 0-1 1v4.228a3.274 3.274 0 0 1-3.27 3.27h-5.313l1.791-1.787a1 1 0 0 0-1.412-1.416L7.29 18.287a1.004 1.004 0 0 0-.294.707v.001c0 .023.012.042.013.065a.923.923 0 0 0 .281.643l3.502 3.504a1 1 0 0 0 1.414-1.414l-1.797-1.798h5.318a5.276 5.276 0 0 0 5.27-5.27v-4.228a1 1 0 0 0-1-1Zm-6.41-3.496-1.795 1.795a1 1 0 1 0 1.414 1.414l3.5-3.504a.936.936 0 0 0 .28-.645v-.001c0-.022-.012-.041-.013-.065a1.004 1.004 0 0 0-.294-.707l-3.504-3.504a1 1 0 0 0-1.414 1.414l1.794 1.795H8.24A5.276 5.276 0 0 0 2.97 7.268v4.228a1 1 0 1 0 2 0V7.268a3.274 3.274 0 0 1 3.27-3.27h5.346Z"></path></svg>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px' }}>
                                                        <svg aria-label="Share" fill="transparent" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" style={{ width: '100%', height: '100%' }}><line fill="none" x1="22" x2="9.218" y1="3" y2="10.083"></line><polygon fill="none" points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334"></polygon></svg>
                                                    </div>
                                                </div>

                                                {/* View Count */}
                                                <div style={{ color: '#777777', fontSize: '15px' }}>
                                                    4,2jt tayangan
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* End of Share Card */}

                                {/* Actions */}
                                <div className="flex flex-col gap-3 mt-8 w-full max-w-[420px]">
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleShare}
                                            disabled={isLoadingShare}
                                            className="flex-[2] flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold bg-white text-black transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
                                        >
                                            {isLoadingShare ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShareNetwork weight="bold" className="w-5 h-5" /> Bagikan ke IG</>}
                                        </button>
                                        <button
                                            onClick={() => { setRoastResult(null); }}
                                            className="flex-1 flex items-center justify-center py-4 rounded-xl text-sm font-bold bg-[#1a1a1a] text-white border border-white/10 hover:bg-[#2a2a2a] transition-colors"
                                        >
                                            Sembunyikan
                                        </button>
                                    </div>
                                    
                                    <button
                                        onClick={handleGetSolution}
                                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        <Sparkles weight="fill" className="w-4 h-4" />
                                        Minta Solusi Penyelamat (AI Analysis)
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Empty State - The Dark Room */
                            <div className="z-10 flex flex-col items-center text-center max-w-sm w-full py-8">
                                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                                    <Fire weight="duotone" className="w-10 h-10 text-red-500" />
                                </div>
                                <h3 className="text-2xl sm:text-3xl font-black text-white mb-4 leading-tight tracking-tight">Fakta Terdalam Keuanganmu.</h3>
                                <p className="text-sm text-slate-400 mb-10 leading-relaxed font-medium">
                                    AI akan memberikan roasting brutal tanpa filter tentang kebiasaan pengeluaranmu. Berani lihat realitanya?
                                </p>

                                {roastError && (
                                    <div className="w-full mb-6 p-4 bg-red-900/30 border border-red-500/30 rounded-xl text-sm text-red-400 font-medium">
                                        {roastError}
                                    </div>
                                )}

                                {/* Quota Display (Option 1) */}
                                {!roastedToday && !isRoasting && roastQuota && (
                                    <div className="mb-3">
                                        {roastQuota.used >= roastQuota.limit && auth.user.role !== 'ADMIN' ? (
                                            <span className="text-xs font-bold text-red-500 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                                                🔴 Kuota Habis
                                            </span>
                                        ) : (
                                            <span className="text-xs font-medium text-slate-500">
                                                ( Sisa Kuota: {roastQuota.limit === 999999 ? '∞' : roastQuota.limit - roastQuota.used}/{roastQuota.limit === 999999 ? '∞' : roastQuota.limit} )
                                            </span>
                                        )}
                                    </div>
                                )}

                                <button
                                    onClick={handleRoast}
                                    disabled={auth.user.role === 'ADMIN' ? isRoasting : (roastedToday || isRoasting || (roastQuota && roastQuota.used >= roastQuota.limit))}
                                    className="w-full relative group overflow-hidden rounded-[1.25rem] p-[2px] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <span className="absolute inset-0 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 rounded-[1.25rem] opacity-70 group-hover:opacity-100 animate-[pulse_3s_ease-in-out_infinite] transition-opacity" />
                                    <div className="relative bg-[#050505] px-6 py-5 rounded-2xl flex items-center justify-center gap-3 transition-transform group-hover:scale-[0.99] group-active:scale-[0.97]">
                                        {roastedToday && auth.user.role !== 'ADMIN' ? (
                                            <><ClockIcon weight="bold" className="w-5 h-5 text-slate-400" /> <span className="font-bold text-slate-300 text-lg">Istirahat {cooldownStr}</span></>
                                        ) : (
                                            <span className="font-black text-white text-lg tracking-widest uppercase">ROASTING SAYA</span>
                                        )}
                                    </div>
                                </button>

                                {roastedToday && initialRoastData?.latestRoast && !roastResult && (
                                    <button 
                                        onClick={() => setRoastResult(initialRoastData.latestRoast)}
                                        className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-400 rounded-xl text-xs font-bold transition-all animate-fade-in-up"
                                    >
                                        <Eye weight="bold" className="w-4 h-4" />
                                        Lihat Roasting Terakhir
                                    </button>
                                )}

                                {roastedToday && (
                                    <p className="text-xs text-slate-500 mt-5 font-medium">Jangan nangis. Evaluasi dompetmu.</p>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    /* ═══════════════════════════════════ AI INSIGHT TAB ═══════════════════════════════════ */
                    <>

                {/* ── Profile Completion Banner ── */}
                {!hasProfile && (
                    <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-200 dark:border-indigo-800/30 rounded-2xl p-4 flex items-center justify-between animate-fade-in-up">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                                <Info weight="duotone" className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-800 dark:text-white">Profil Finansial Belum Lengkap</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Lengkapi di Pengaturan agar AI dapat menganalisis Dana Darurat & Proyeksi Goal.</p>
                            </div>
                        </div>
                        <Link href={route('settings.index')} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors flex-shrink-0">
                            Lengkapi →
                        </Link>
                    </div>
                )}

                {/* ── Period Selector (Always Visible) ── */}
                <div className="glass-card p-4 rounded-2xl animate-fade-in-up">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest shrink-0">Analisis Periode:</span>
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                            <button
                                onClick={() => setPeriod('THIS_MONTH')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${period === 'THIS_MONTH' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                Bulan Ini
                            </button>
                            <button
                                onClick={() => setPeriod('LAST_MONTH')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${period === 'LAST_MONTH' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                Bulan Lalu
                            </button>
                            <button
                                onClick={() => setPeriod('CUSTOM')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${period === 'CUSTOM' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                Custom
                            </button>
                        </div>
                        {period === 'CUSTOM' && (
                            <div className="flex items-center gap-2 animate-fade-in">
                                <input
                                    type="date"
                                    value={customStart}
                                    onChange={(e) => setCustomStart(e.target.value)}
                                    className="bg-white dark:bg-slate-800 border-none rounded-xl text-xs px-3 py-2 outline-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-indigo-500"
                                />
                                <span className="text-slate-400">-</span>
                                <input
                                    type="date"
                                    value={customEnd}
                                    onChange={(e) => setCustomEnd(e.target.value)}
                                    className="bg-white dark:bg-slate-800 border-none rounded-xl text-xs px-3 py-2 outline-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-indigo-500"
                                />
                            </div>
                        )}
                        <div className="ml-auto flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                            {aiQuota && (
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex flex-col items-center justify-center text-center ${isQuotaExceeded ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                    {isQuotaExceeded ? (
                                        <>🔴 Kuota Habis<span className="font-medium text-[8px] opacity-80">Reset: {formatWeekday(aiQuota.resetsAt)}</span></>
                                    ) : (
                                        <>{aiQuota.limit === 999999 ? '👑 Admin: Tanpa Batas' : `${aiQuota.used}/${aiQuota.limit} minggu ini`}</>
                                    )}
                                </span>
                            )}
                            <button
                                onClick={handleGenerate}
                                disabled={isLoading || isQuotaExceeded}
                                className={`w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-xs font-bold transition-all transition-transform ${isQuotaExceeded ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-500/30 hover:scale-105 active:scale-95 disabled:opacity-50'}`}
                            >
                                {isLoading ? <><Loader2 weight="bold" className="w-3.5 h-3.5 mr-1.5 animate-spin" />Menganalisis...</> : <><Sparkles weight="fill" className="w-3.5 h-3.5 mr-1.5" />{insight ? 'Refresh Analysis' : 'Generate Insights'}</>}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Hero (first time, no insight yet) ── */}
                {!insight && !isLoading && (
                    <div className="glass-card p-5 sm:p-8 rounded-[2rem] text-center animate-fade-in-up">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-purple-500/30 animate-pulse-slow">
                            <Sparkles weight="duotone" className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Financial Health Check</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
                            AI akan menganalisis transaksi pada periode yang dipilih di atas, dan membandingkannya dengan tren historis 6 bulan terakhir.
                        </p>
                        {!hasProfile && (
                            <p className="text-xs text-amber-500 flex items-center justify-center gap-1">
                                <AlertTriangle weight="fill" className="w-3 h-3" /> Isi Profil Finansial di Pengaturan untuk hasil lebih akurat
                            </p>
                        )}

                        {/* Info cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
                            {[
                                { icon: '💰', label: 'Cashflow Analysis' },
                                { icon: '🎯', label: 'Goal Forecasting' },
                                { icon: '🛡️', label: 'Dana Darurat' },
                                { icon: '📊', label: 'Spending Alerts' },
                            ].map((item) => (
                                <div key={item.label} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center">
                                    <div className="text-2xl mb-1">{item.icon}</div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{item.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Error State ── */}
                {error && !isLoading && (
                    <div className="glass-card p-8 rounded-[2rem] text-center animate-fade-in-up border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-4">
                            <AlertTriangle weight="duotone" className="w-8 h-8" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Analisis AI Terkendala</h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
                            {error}
                        </p>
                        <button
                            onClick={handleGenerate}
                            disabled={isQuotaExceeded}
                            className="inline-flex items-center justify-center px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-red-500/30 active:scale-95 disabled:opacity-50"
                        >
                            <Zap weight="fill" className="w-4 h-4 mr-2" />
                            Coba Sekali Lagi
                        </button>
                    </div>
                )}

                {/* ── Loading State ── */}
                {isLoading && (
                    <div className="glass-card p-12 rounded-[2rem] text-center animate-fade-in-up">
                        <Loader2 weight="bold" className="w-12 h-12 mx-auto mb-4 text-purple-500 animate-spin" />
                        <p className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-1">AI sedang menganalisis...</p>
                        <p className="text-sm text-slate-400">Memproses transaksi & menghitung proyeksi</p>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════ */}
                {/* ── INSIGHT RESULTS ── */}
                {/* ═══════════════════════════════════════════════ */}
                {insight && sc && (
                    <>
                        {/* ── 1. HEALTH SCORE ── */}
                        <div className={`glass-card p-8 rounded-[2rem] animate-pop-in bg-gradient-to-br ${sc.bgFrom}/5 ${sc.bgTo}/5`}>
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                <HealthGauge score={insight.healthScore} sentiment={insight.sentiment} />
                                <div className="flex-1 text-center md:text-left">
                                    <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                                        <span className="text-2xl">{sc.icon}</span>
                                        <h2 className={`text-2xl font-black ${sc.color}`}>{insight.healthLabel}</h2>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{insight.summary}</p>
                                </div>
                            </div>
                        </div>

                        {/* ── 2. CASHFLOW & EMERGENCY FUND ── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Cashflow */}
                            <div className="glass-card p-6 rounded-[2rem] animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center mb-4">
                                    <TrendingUp weight="bold" className="w-5 h-5 mr-2 text-blue-500" /> Cashflow Bulan Ini
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl">
                                        <div className="flex items-center gap-2">
                                            <ArrowUpRight weight="bold" className="w-4 h-4 text-emerald-500" />
                                            <span className="text-sm text-slate-600 dark:text-slate-300">Pemasukan</span>
                                        </div>
                                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatShortIDR(insight.cashflow.income)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/10 rounded-xl">
                                        <div className="flex items-center gap-2">
                                            <ArrowDownRight weight="bold" className="w-4 h-4 text-red-500" />
                                            <span className="text-sm text-slate-600 dark:text-slate-300">Pengeluaran</span>
                                        </div>
                                        <span className="text-sm font-bold text-red-600 dark:text-red-400">{formatShortIDR(insight.cashflow.expense)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl">
                                        <div className="flex items-center gap-2">
                                            <Zap weight="fill" className="w-4 h-4 text-blue-500" />
                                            <span className="text-sm text-slate-600 dark:text-slate-300">Surplus</span>
                                        </div>
                                        <span className={`text-sm font-bold ${insight.cashflow.surplus >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {formatShortIDR(insight.cashflow.surplus)}
                                        </span>
                                    </div>
                                    <div className="text-center pt-2">
                                        <span className={`text-2xl font-black ${insight.cashflow.savingsRate >= 20 ? 'text-emerald-500' : insight.cashflow.savingsRate >= 10 ? 'text-amber-500' : 'text-red-500'}`}>
                                            {insight.cashflow.savingsRate}%
                                        </span>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Savings Rate</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl leading-relaxed">
                                    {insight.cashflow.verdict}
                                </p>
                            </div>

                            {/* Emergency Fund */}
                            <div className="glass-card p-6 rounded-[2rem] animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center mb-4">
                                    <Shield weight="duotone" className="w-5 h-5 mr-2 text-indigo-500" /> Dana Darurat
                                </h3>
                                <div className="space-y-4">
                                    <div className="text-center">
                                        <span className="text-4xl font-black text-indigo-500">{insight.emergencyFund.idealMonths}</span>
                                        <p className="text-sm text-slate-500">bulan ideal</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Pengeluaran/bln</p>
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatShortIDR(insight.emergencyFund.monthlyExpenseAvg)}</p>
                                        </div>
                                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Target Dana</p>
                                            <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{formatShortIDR(insight.emergencyFund.idealAmount)}</p>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl leading-relaxed">
                                    {insight.emergencyFund.verdict}
                                </p>
                            </div>
                        </div>

                        {/* ── 3. NET WORTH SNAPSHOT ── */}
                        {insight.netWorthSnapshot && (
                            <div className="glass-card p-6 rounded-[2rem] animate-fade-in-up" style={{ animationDelay: '250ms' }}>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center mb-4">
                                    <span className="text-xl mr-2">💎</span> Net Worth
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl text-center">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Saldo Dompet</p>
                                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatShortIDR(insight.netWorthSnapshot.totalWallet)}</p>
                                    </div>
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl text-center">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Total Aset</p>
                                        <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{formatShortIDR(insight.netWorthSnapshot.totalAssets)}</p>
                                    </div>
                                    <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-xl text-center">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Total Hutang</p>
                                        <p className="text-sm font-bold text-red-600 dark:text-red-400">{formatShortIDR(insight.netWorthSnapshot.totalDebt)}</p>
                                    </div>
                                    <div className={`p-3 rounded-xl text-center ${insight.netWorthSnapshot.netWorth >= 0 ? 'bg-indigo-50 dark:bg-indigo-900/10' : 'bg-red-50 dark:bg-red-900/10'}`}>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Net Worth</p>
                                        <p className={`text-sm font-bold ${insight.netWorthSnapshot.netWorth >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-600 dark:text-red-400'}`}>{formatShortIDR(insight.netWorthSnapshot.netWorth)}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl leading-relaxed">
                                    {insight.netWorthSnapshot.verdict}
                                </p>
                            </div>
                        )}

                        {/* ── 4. GOAL PROJECTIONS ── */}
                        <div className="glass-card p-6 rounded-[2rem] animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center mb-4">
                                <Target weight="duotone" className="w-5 h-5 mr-2 text-violet-500" /> Proyeksi Goal
                            </h3>
                            {insight.goalProjections.length > 0 ? (
                                <div className="space-y-4">
                                    {insight.goalProjections.map((goal) => {
                                        const gc = goalStatusConfig[goal.status] || goalStatusConfig.DELAYED;
                                        const progress = goal.targetAmount > 0
                                            ? Math.min(100, Math.max(0, ((goal.targetAmount - (goal.requiredMonthly * goal.monthsRemaining)) / goal.targetAmount) * 100))
                                            : 0;
                                        return (
                                            <div key={goal.name} className="p-4 border border-slate-100 dark:border-slate-700 rounded-2xl hover:shadow-md transition-shadow">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-slate-800 dark:text-white">{goal.name}</span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${gc.bg} ${gc.color}`}>
                                                            {gc.label}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-500">{formatShortIDR(goal.targetAmount)}</span>
                                                </div>
                                                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ${goal.status === 'ON_TRACK' ? 'bg-emerald-500' : goal.status === 'DELAYED' ? 'bg-amber-500' : 'bg-red-500'}`}
                                                        style={{ width: `${Math.max(5, progress)}%` }}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between text-[10px] text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg mb-2">
                                                    <span>Sisa Waktu: <strong className="text-slate-700 dark:text-slate-200">{goal.monthsRemaining} bln</strong></span>
                                                    <span>Surplus Anda: <strong className="text-slate-700 dark:text-slate-200">{formatShortIDR(goal.currentSurplus)}/bln</strong></span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 text-center mb-2">
                                                    <div>
                                                        <p className="text-[10px] text-slate-400 font-bold">Deadline</p>
                                                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{goal.deadline}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-slate-400 font-bold">Perlu/bln</p>
                                                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{formatShortIDR(goal.requiredMonthly)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-slate-400 font-bold">Est. Tercapai</p>
                                                        <p className={`text-xs font-bold ${gc.color}`}>{goal.projectedDate}</p>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{goal.verdict}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-center border-2 border-dashed border-slate-200 dark:border-slate-700">
                                    <Target weight="duotone" className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                                    <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Belum ada Goals</p>
                                    <p className="text-xs text-slate-500 mb-0">Tambahkan target finansial di Profil untuk melihat proyeksi.</p>
                                </div>
                            )}
                        </div>

                        {/* ── 5. BUDGET COMPLIANCE ── */}
                        {insight.budgetCompliance && insight.budgetCompliance.length > 0 && (
                            <div className="glass-card p-6 rounded-[2rem] animate-fade-in-up" style={{ animationDelay: '420ms' }}>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center mb-4">
                                    <span className="text-xl mr-2">📋</span> Budget Compliance
                                </h3>
                                <div className="space-y-3">
                                    {insight.budgetCompliance.map((b) => (
                                        <div key={b.category}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{b.category}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-slate-500">{formatShortIDR(b.spent)} / {formatShortIDR(b.limit)}</span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.status === 'OVER' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                        b.status === 'WARNING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                            'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                        }`}>{b.status === 'OVER' ? '🔴 OVER' : b.status === 'WARNING' ? '⚠️ Hampir' : '✅ Aman'}</span>
                                                </div>
                                            </div>
                                            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-700 ${b.status === 'OVER' ? 'bg-red-500' :
                                                        b.status === 'WARNING' ? 'bg-amber-500' :
                                                            'bg-emerald-500'
                                                        }`}
                                                    style={{ width: `${Math.min(100, b.usagePercent)}%` }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-0.5">{b.usagePercent.toFixed(1)}% terpakai</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── 6. SPENDING ALERTS ── */}
                        <div className="glass-card p-6 rounded-[2rem] animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center mb-4">
                                <AlertTriangle weight="fill" className="w-5 h-5 mr-2 text-amber-500" /> Spending Alerts
                            </h3>
                            {insight.spendingAlerts.length > 0 ? (
                                <div className="space-y-3">
                                    {insight.spendingAlerts.map((alert) => (
                                        <div
                                            key={alert.category}
                                            className={`p-4 rounded-2xl border-l-4 ${alert.severity === 'DANGER'
                                                ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                                                : alert.severity === 'WARNING'
                                                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10'
                                                    : 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-bold text-slate-800 dark:text-white">{alert.category}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{formatShortIDR(alert.amount)}</span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${alert.changePercent > 0
                                                        ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                                        : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                        }`}>
                                                        {alert.changePercent > 0 ? '+' : ''}{alert.changePercent}%
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Rata-rata 6 bln: {formatShortIDR(alert.avgLast6m)}
                                            </p>
                                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">💡 {alert.advice}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl flex items-center gap-4">
                                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                        <CheckCircle2 weight="fill" className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800 dark:text-white">Pengeluaran Terkendali!</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Tidak ada lonjakan signifikan dibanding rata-rata 6 bulan Anda.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── 5. ACTION PLAN ── */}
                        <div className="glass-card p-6 rounded-[2rem] animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center mb-4">
                                <CheckCircle2 weight="fill" className="w-5 h-5 mr-2 text-emerald-500" /> Action Plan
                            </h3>
                            {insight.actionItems.length > 0 ? (
                                <div className="space-y-3">
                                    {insight.actionItems.map((item) => (
                                        <div key={item.priority} className="flex items-start gap-4 p-4 border border-slate-100 dark:border-slate-700 rounded-2xl hover:shadow-md transition-shadow">
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-black flex-shrink-0 ${item.impact === 'HIGH' ? 'bg-gradient-to-br from-red-500 to-orange-500'
                                                : item.impact === 'MEDIUM' ? 'bg-gradient-to-br from-amber-500 to-yellow-500'
                                                    : 'bg-gradient-to-br from-blue-500 to-indigo-500'
                                                }`}>
                                                {item.priority}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">{item.title}</h4>
                                                    {item.savingsPotential > 0 && (
                                                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                                                            +{formatShortIDR(item.savingsPotential)}/bln
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-center">
                                    <p className="text-sm text-slate-500">Momentum Anda bagus. Pertahankan!</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
                    </>
                )}
            </div>

            {/* ── Hidden Share Card (Off-screen, rendered by html2canvas) ── */}
            {roastResult && (() => {
                const r = roastResult;
                return (
                <div style={{ position: 'absolute', left: '-9999px', top: '0', zIndex: -100 }}>
                    <div 
                        ref={shareRef}
                        id="share-card-container"
                        style={{ display: 'none', width: '500px', padding: '40px', background: '#0a0a0a', position: 'relative', overflow: 'hidden' }}
                    >
                        {/* Dramatic Red Glow Background for Share Card */}
                        <div style={{ 
                            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                            width: '400px', height: '400px', background: 'rgba(220, 38, 38, 0.15)', 
                            filter: 'blur(80px)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 
                        }} />

                        <div 
                            style={{ 
                                position: 'relative', zIndex: 1, width: '100%', maxWidth: '420px', margin: '0 auto',
                                borderRadius: '1.5rem', overflow: 'hidden', 
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                boxShadow: '0 20px 60px -15px rgba(220, 38, 38, 0.25)',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' 
                            }}
                        >
                            <div style={{ background: '#101010', color: '#F3F5F7', padding: '24px', position: 'relative' }}>
                                {/* Post Container */}
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    {/* Left Column: Avatar & Thread Line */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{ 
                                            width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF6B6B, #C0392B, #8E44AD)', 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden'
                                        }}>
                                            <span style={{ fontSize: '24px', lineHeight: 1, marginTop: '0px', display: 'flex' }}>🔥</span>
                                        </div>
                                        <div style={{ width: '2px', flexGrow: 1, backgroundColor: '#222', marginTop: '10px', marginBottom: '10px', borderRadius: '1px' }}></div>
                                        <div style={{ 
                                            width: '18px', height: '18px', borderRadius: '50%', background: '#1d9bf0', 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                        }}>
                                            <svg viewBox="0 0 24 24" fill="#ffffff" style={{ width: '10px', height: '10px' }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path></svg>
                                        </div>
                                    </div>

                                    {/* Right Column: Content */}
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingTop: '2px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <span style={{ fontSize: '15px', fontWeight: '600', color: '#F3F5F7', letterSpacing: '-0.2px' }}>caph_roast_ai</span>
                                                <svg viewBox="0 0 24 24" fill="#0095F6" style={{ width: '14px', height: '14px' }}>
                                                     <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
                                                </svg>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#777777', fontSize: '14px', fontWeight: '400', lineHeight: 1 }}>
                                                <span style={{ display: 'flex', alignItems: 'center' }}>{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                                <div style={{ display: 'flex', alignItems: 'center', marginTop: '2px' }}>
                                                    <svg aria-label="More" fill="currentColor" height="18" role="img" viewBox="0 0 24 24" width="18"><circle cx="12" cy="12" r="1.5"></circle><circle cx="6" cy="12" r="1.5"></circle><circle cx="18" cy="12" r="1.5"></circle></svg>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: '14px' }}>
                                            <p style={{ 
                                                fontSize: '15px', 
                                                fontWeight: '400', 
                                                color: '#F3F5F7', 
                                                lineHeight: '1.45', 
                                                margin: 0,
                                                whiteSpace: 'pre-wrap',
                                            }}>
                                                "{r.roast_text.split('\n\n')[0]}"
                                            </p>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#F3F5F7', marginBottom: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px' }}>
                                                <svg aria-label="Like" fill="transparent" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: '100%', height: '100%' }}><path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938m0-2a6.04 6.04 0 0 0-4.797 2.127 6.052 6.052 0 0 0-4.787-2.127A6.985 6.985 0 0 0 .5 9.122c0 3.61 2.55 5.827 5.015 7.97.283.246.569.494.853.747l1.027.918a44.998 44.998 0 0 0 3.518 3.018 2 2 0 0 0 2.174 0 45.263 45.263 0 0 0 3.626-3.115l.922-.824c.293-.26.59-.519.885-.774 2.334-2.025 4.98-4.32 4.98-7.94a6.985 6.985 0 0 0-6.708-7.218Z"></path></svg>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px' }}>
                                                <svg aria-label="Comment" fill="transparent" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" style={{ width: '100%', height: '100%' }}><path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615l1.455 2.853c.123.243.342.368.61.368a.634.634 0 0 0 .61-.368c.28-.548.564-1.104.848-1.659.284-.555.568-1.111.848-1.666a.637.637 0 0 0-.106-.723Z"></path></svg>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px' }}>
                                                <svg aria-label="Repost" fill="transparent" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" style={{ width: '100%', height: '100%' }}><path d="M19.998 9.497a1 1 0 0 0-1 1v4.228a3.274 3.274 0 0 1-3.27 3.27h-5.313l1.791-1.787a1 1 0 0 0-1.412-1.416L7.29 18.287a1.004 1.004 0 0 0-.294.707v.001c0 .023.012.042.013.065a.923.923 0 0 0 .281.643l3.502 3.504a1 1 0 0 0 1.414-1.414l-1.797-1.798h5.318a5.276 5.276 0 0 0 5.27-5.27v-4.228a1 1 0 0 0-1-1Zm-6.41-3.496-1.795 1.795a1 1 0 1 0 1.414 1.414l3.5-3.504a.936.936 0 0 0 .28-.645v-.001c0-.022-.012-.041-.013-.065a1.004 1.004 0 0 0-.294-.707l-3.504-3.504a1 1 0 0 0-1.414 1.414l1.794 1.795H8.24A5.276 5.276 0 0 0 2.97 7.268v4.228a1 1 0 1 0 2 0V7.268a3.274 3.274 0 0 1 3.27-3.27h5.346Z"></path></svg>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px' }}>
                                                <svg aria-label="Share" fill="transparent" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" style={{ width: '100%', height: '100%' }}><line fill="none" x1="22" x2="9.218" y1="3" y2="10.083"></line><polygon fill="none" points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334"></polygon></svg>
                                            </div>
                                        </div>

                                        <div style={{ color: '#777777', fontSize: '15px' }}>
                                            4,2jt tayangan
                                        </div>
                                        
                                        {/* Branding footer inside the box */}
                                        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#444', textTransform: 'uppercase', letterSpacing: '2px' }}>CAPH.io AI Roast</span>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#333' }}></div>
                                                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#333' }}></div>
                                                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#333' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                );
            })()}
        </>
    );
}

InsightsIndex.layout = (page: any) => (
    <AppLayout header={
        <div className="flex flex-col min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-white tracking-tight truncate">Analisis AI</h1>
                <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">Insight cerdas dari data keuangan Anda</p>
        </div>
    }>
        {page}
    </AppLayout>
);
