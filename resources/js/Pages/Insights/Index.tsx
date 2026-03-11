import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useState, useEffect, useRef } from 'react';
import {
    Sparkle as Sparkles, SpinnerGap as Loader2, Heart, TrendUp as TrendingUp, TrendDown as TrendingDown,
    Shield, Target, Warning as AlertTriangle, CheckCircle as CheckCircle2, Lightning as Zap,
    ArrowUpRight, ArrowDownRight, CaretRight as ChevronRight, Info,
    Fire, Clock as ClockIcon, ArrowCounterClockwise, ShareNetwork
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
    const [roastError, setRoastError] = useState<string | null>(null);
    const [loadingTextIdx, setLoadingTextIdx] = useState(0);
    const [expandedHistory, setExpandedHistory] = useState<number | null>(null);
    const [cooldownStr, setCooldownStr] = useState('');
    const [isLoadingShare, setIsLoadingShare] = useState(false);
    const shareRef = useRef<HTMLDivElement>(null);

    const isQuotaExceeded = aiQuota ? aiQuota.used >= aiQuota.limit : false;

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
            if (e.response?.status === 429 && e.response?.data?.cooldown) {
                setRoastedToday(true);
                setCooldownEnds(e.response.data.cooldownEnds);
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
                backgroundColor: null,
                scale: 3, // High quality
                logging: false,
                useCORS: true,
                onclone: (clonedDoc) => {
                    const el = clonedDoc.getElementById('share-card-container');
                    if (el) el.style.display = 'block';
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

            <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 animate-fade-in-up">
                {/* ── Tab Switcher ── */}
                <div className="flex bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-1.5 gap-1">
                    <button
                        onClick={() => setActiveTab('insight')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                            activeTab === 'insight'
                                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        <Sparkles weight="fill" className="w-4 h-4" /> AI Insight
                    </button>
                    <button
                        onClick={() => setActiveTab('roast')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                            activeTab === 'roast'
                                ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/25'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        <Fire weight="fill" className="w-4 h-4" /> Roast Me
                    </button>
                </div>

                {activeTab === 'roast' ? (
                    /* ═══════════════════════════════════ ROAST ME TAB ═══════════════════════════════════ */
                    <div className="space-y-6 animate-fade-in-up">
                        {/* Loading State */}
                        {isRoasting ? (
                            <div className="glass-card rounded-[2rem] p-8 sm:p-12 flex flex-col items-center justify-center min-h-[400px] text-center">
                                <div className="flex gap-2 mb-6">
                                    <span className="text-4xl animate-bounce" style={{ animationDelay: '0ms' }}>🔥</span>
                                    <span className="text-4xl animate-bounce" style={{ animationDelay: '150ms' }}>🔥</span>
                                    <span className="text-4xl animate-bounce" style={{ animationDelay: '300ms' }}>🔥</span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">Sedang memanggang...</h3>
                                <div className="w-full max-w-xs h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-4">
                                    <div className="h-full bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400 rounded-full animate-pulse" style={{ width: '100%' }} />
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 italic transition-all duration-500">
                                    {LOADING_TEXTS[loadingTextIdx]}
                                </p>
                            </div>
                        ) : roastResult && !roastError ? (
                            /* Result Card */
                            <div className="glass-card rounded-[2rem] overflow-hidden">
                                {/* Gradient bar top */}
                                <div className="h-2 bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400" />

                                <div className="p-6 sm:p-10 space-y-6">
                                    {/* Badge section */}
                                    <div className="text-center">
                                        <span className="text-5xl block mb-2">{roastResult.badge_emoji}</span>
                                        <h3 className="text-2xl font-black text-slate-800 dark:text-white">{roastResult.badge_name}</h3>
                                        <span className={`inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${ROAST_LEVELS.find(l => l.key === roastResult.level)?.color ?? 'from-orange-400 to-orange-500'}`}>
                                            {ROAST_LEVELS.find(l => l.key === roastResult.level)?.emoji} {ROAST_LEVELS.find(l => l.key === roastResult.level)?.label}
                                        </span>
                                    </div>

                                    {/* Waste Score Thermometer */}
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Skor Keborosan</span>
                                            <span className="text-lg font-black text-slate-800 dark:text-white">{roastResult.waste_score}/100</span>
                                        </div>
                                        <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-1000 ease-out"
                                                style={{
                                                    width: `${roastResult.waste_score}%`,
                                                    background: `linear-gradient(90deg, #60a5fa ${0}%, #facc15 ${50}%, #ef4444 ${100}%)`
                                                }}
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center font-medium">{getWasteLabel(roastResult.waste_score)}</p>
                                    </div>

                                    {/* Roast Text */}
                                    <div className="space-y-4">
                                        {roastResult.roast_text.split('\n\n').filter(Boolean).map((paragraph, i) => (
                                            <p key={i} className="text-base leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
                                                {paragraph.trim()}
                                            </p>
                                        ))}
                                    </div>

                                    {/* Challenge Card */}
                                    {roastResult.challenge && (
                                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 rounded-2xl">
                                            <div className="flex items-start gap-3">
                                                <Target weight="duotone" className="w-6 h-6 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">Tantangan Bulan Ini</p>
                                                    <p className="text-sm text-amber-900 dark:text-amber-200 font-medium">{roastResult.challenge}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleRoast}
                                            disabled={roastedToday || isRoasting}
                                            className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-lg shadow-red-500/30 hover:scale-[1.02]"
                                        >
                                            {roastedToday ? (
                                                <><ClockIcon weight="bold" className="w-4 h-4" /> Sisa {cooldownStr}  </>
                                            ) : (
                                                <><ArrowCounterClockwise weight="bold" className="w-4 h-4" /> Panggang Lagi</>  
                                            )}
                                        </button>
                                        <button
                                            onClick={handleShare}
                                            disabled={isLoadingShare}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700"
                                        >
                                            {isLoadingShare ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ShareNetwork weight="bold" className="w-4 h-4" /> Bagikan</>}
                                        </button>
                                    </div>
                                    {roastedToday && (
                                        <p className="text-xs text-slate-400 italic text-center -mt-3">Istirahat dulu. Panasnya masih terasa.</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* Empty / Error State */
                            <div className="glass-card rounded-[2rem] p-8 sm:p-12 flex flex-col items-center justify-center text-center">
                                <div className="text-5xl mb-4 animate-pulse">🔥</div>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Berani Lihat Realita Keuanganmu?</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-8">
                                    AI akan menganalisis kebiasaan keuanganmu dan memberikan roasting yang pedas tapi jujur.
                                </p>

                                {roastError && (
                                    <div className="w-full max-w-md mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl text-sm text-red-600 dark:text-red-400 font-medium text-center">
                                        {roastError}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Level Selector + CTA (always visible when not loading) */}
                        {!isRoasting && !(roastResult && !roastError) && (
                            <div className="space-y-4">
                                {/* Level Selector */}
                                <div className="glass-card rounded-2xl p-4">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">Pilih Level Kekejaman</p>
                                    <div className="flex gap-2">
                                        {ROAST_LEVELS.map(level => (
                                            <button
                                                key={level.key}
                                                onClick={() => setRoastLevel(level.key)}
                                                className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 transition-all duration-200 ${
                                                    roastLevel === level.key
                                                        ? `border-transparent bg-gradient-to-br ${level.color} text-white scale-105 shadow-lg ring-2 ring-offset-2 dark:ring-offset-slate-900 ${level.ring}`
                                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                                }`}
                                            >
                                                <span className="text-lg">{level.emoji}</span>
                                                <span className="text-xs font-bold">{level.label}</span>
                                                <span className={`text-[10px] ${roastLevel === level.key ? 'text-white/80' : 'text-slate-400'}`}>{level.desc}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* CTA Button */}
                                <button
                                    onClick={handleRoast}
                                    disabled={roastedToday || isRoasting}
                                    className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-2xl text-lg font-black shadow-xl shadow-red-500/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                >
                                    {roastedToday ? (
                                        <><ClockIcon weight="bold" className="w-5 h-5" /> Sisa {cooldownStr} sebelum bisa dipanggang lagi</>
                                    ) : (
                                        <><Fire weight="fill" className="w-5 h-5" /> PANGGANG AKU!</>
                                    )}
                                </button>
                                {roastedToday && (
                                    <p className="text-xs text-slate-400 italic text-center">Istirahat dulu. Panasnya masih terasa.</p>
                                )}
                            </div>
                        )}

                        {/* If has result, show level selector + CTA below result */}
                        {!isRoasting && roastResult && !roastError && !roastedToday && (
                            <div className="glass-card rounded-2xl p-4">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">Ganti Level & Panggang Lagi</p>
                                <div className="flex gap-2 mb-4">
                                    {ROAST_LEVELS.map(level => (
                                        <button
                                            key={level.key}
                                            onClick={() => setRoastLevel(level.key)}
                                            className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 transition-all duration-200 ${
                                                roastLevel === level.key
                                                    ? `border-transparent bg-gradient-to-br ${level.color} text-white scale-105 shadow-lg`
                                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                            }`}
                                        >
                                            <span className="text-lg">{level.emoji}</span>
                                            <span className="text-xs font-bold">{level.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Roast History Timeline */}
                        {roastHistory.length > 0 && (
                            <div className="glass-card rounded-[2rem] p-6">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Fire weight="duotone" className="w-4 h-4" /> Riwayat Panggang
                                </h4>
                                <div className="space-y-2">
                                    {roastHistory.map((item) => {
                                        const isExpanded = expandedHistory === item.id;
                                        const scoreColor = item.waste_score <= 30 ? 'text-blue-500' : item.waste_score <= 60 ? 'text-amber-500' : 'text-red-500';
                                        const levelConf = ROAST_LEVELS.find(l => l.key === item.level);
                                        return (
                                            <div key={item.id}>
                                                <button
                                                    onClick={() => setExpandedHistory(isExpanded ? null : item.id)}
                                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-left"
                                                >
                                                    <span className="text-2xl">{item.badge_emoji}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{item.badge_name}</p>
                                                        <p className="text-xs text-slate-400">{formatDateTime(item.created_at)}</p>
                                                    </div>
                                                    <span className={`text-sm font-black ${scoreColor}`}>{item.waste_score}</span>
                                                    <span className="text-xs">{levelConf?.emoji}</span>
                                                    <ChevronRight weight="bold" className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                </button>
                                                {isExpanded && (
                                                    <div className="px-3 pb-3 pt-1 animate-fade-in">
                                                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2">
                                                            {item.roast_text.split('\n\n').filter(Boolean).map((p, i) => (
                                                                <p key={i} className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{p.trim()}</p>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* ═══════════════════════════════════ AI INSIGHT TAB ═══════════════════════════════════ */
                    <>
                {lastUpdated && (
                    <p className="text-xs text-slate-400 -mt-2 mb-2">Terakhir diupdate: {formatDateTime(lastUpdated)}</p>
                )}

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
                        style={{ display: 'none', width: '400px', fontFamily: 'system-ui, -apple-system, sans-serif' }}
                    >
                        {/* Premium Dark Gradient Background */}
                        <div style={{ background: '#0B0F19', position: 'relative', overflow: 'hidden' }}>
                            {/* Accent Gradients for depth */}
                            <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 60%)', borderRadius: '50%' }} />
                            <div style={{ position: 'absolute', bottom: '-80px', left: '-80px', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 60%)', borderRadius: '50%' }} />

                            <div style={{ padding: '24px 32px 32px', position: 'relative', zIndex: 10 }}>
                                {/* Hero Section: Emoji & Badge Name */}
                                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                                    {/* Glowing Frame for Emoji */}
                                    <div style={{ 
                                        position: 'relative',
                                        width: '120px',
                                        height: '120px',
                                        margin: '0 auto 20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        borderRadius: '30px',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        boxShadow: '0 0 40px rgba(99, 102, 241, 0.2), inset 0 0 20px rgba(255, 255, 255, 0.05)'
                                    }}>
                                        <div style={{
                                            fontSize: '72px',
                                            lineHeight: '1',
                                            filter: 'drop-shadow(0px 8px 16px rgba(0,0,0,0.5))'
                                        }}>
                                            {r.badge_emoji}
                                        </div>
                                    </div>

                                    <h3 style={{
                                        fontSize: '32px',
                                        fontWeight: '900',
                                        color: '#ffffff',
                                        letterSpacing: '-1px',
                                        lineHeight: '1.1',
                                        margin: '0',
                                        textTransform: 'uppercase'
                                    }}>
                                        {r.badge_name}
                                    </h3>
                                    {/* Subtitle / Separator */}
                                    <div style={{
                                        width: '40px',
                                        height: '4px',
                                        background: 'linear-gradient(90deg, #6366f1, #ec4899)',
                                        margin: '16px auto 0',
                                        borderRadius: '2px'
                                    }} />
                                </div>

                                {/* Roast Text Card (Glassmorphism) */}
                                <div style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    backdropFilter: 'blur(10px)',
                                    borderRadius: '20px',
                                    padding: '24px',
                                    marginBottom: '32px',
                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                                }}>
                                    <p style={{
                                        fontSize: '15px',
                                        fontWeight: '500',
                                        color: '#cbd5e1',
                                        lineHeight: '1.6',
                                        textAlign: 'center',
                                        margin: 0
                                    }}>
                                        "{r.roast_text.split('\n\n')[0]}"
                                    </p>
                                </div>

                                {/* Footer Area */}
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{
                                        fontSize: '12px',
                                        fontWeight: '800',
                                        color: '#ffffff',
                                        letterSpacing: '3px',
                                        textTransform: 'uppercase',
                                        margin: '0 0 8px'
                                    }}>
                                        Berani di Roasting?
                                    </p>
                                </div>
                                <div style={{ 
                                    textAlign: 'center', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)'
                                }}>
                                    <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', letterSpacing: '2px', textTransform: 'uppercase' }}>
                                        caph.io • Roast Me AI
                                    </span>
                                </div>
                            </div>

                            {/* Bottom accent bar */}
                            <div style={{ height: '4px', background: 'linear-gradient(90deg, #eab308, #f97316, #ef4444)' }} />
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
