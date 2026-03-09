import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useState } from 'react';
import {
    Sparkle as Sparkles, SpinnerGap as Loader2, Heart, TrendUp as TrendingUp, TrendDown as TrendingDown,
    Shield, Target, Warning as AlertTriangle, CheckCircle as CheckCircle2, Lightning as Zap,
    ArrowUpRight, ArrowDownRight, CaretRight as ChevronRight, Info
} from '@phosphor-icons/react';
import toast, { Toaster } from 'react-hot-toast';

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
export default function InsightsIndex({ auth, transactionCount, hasProfile, latestInsight, aiQuota: initialAiQuota }: PageProps<{
    transactionCount: number;
    hasProfile: boolean;
    latestInsight?: { id: number; content: InsightData; created_at: string } | null;
    aiQuota?: { used: number; limit: number; resetsAt: string };
}>) {
    const [isLoading, setIsLoading] = useState(false);
    const [insight, setInsight] = useState<InsightData | null>(latestInsight ? latestInsight.content : null);
    const [lastUpdated, setLastUpdated] = useState<string | null>(latestInsight ? latestInsight.created_at : null);
    const [aiQuota, setAiQuota] = useState(initialAiQuota);

    const isQuotaExceeded = aiQuota ? aiQuota.used >= aiQuota.limit : false;

    // Period Filter State
    const [period, setPeriod] = useState<'THIS_MONTH' | 'LAST_MONTH' | 'CUSTOM'>('THIS_MONTH');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    const handleGenerate = async () => {
        setIsLoading(true);
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
            const formatDate = (d: Date) => d.toISOString().split('T')[0];

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
                toast.error(result.message || 'Gagal menghasilkan analisis');
                if (result.quota) setAiQuota(result.quota);
            }
        } catch (e: any) {
            console.error('Insight Error:', e);
            toast.error(e.response?.data?.message || 'Terjadi kesalahan');
            if (e.response?.status === 429 && e.response?.data?.used !== undefined) {
                setAiQuota({ used: e.response.data.used, limit: e.response.data.limit, resetsAt: e.response.data.resetsAt });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const sc = insight ? (sentimentConfig[insight.sentiment] || sentimentConfig.CAUTIOUS) : null;

    return (
        <>
            <Head title="Analisis AI" />
            <Toaster position="top-right" />

            <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 animate-fade-in-up">
                {lastUpdated && (
                    <p className="text-xs text-slate-400 -mt-2 mb-2">Terakhir diupdate: {new Date(lastUpdated).toLocaleString('id-ID')}</p>
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
                                        <>🔴 Kuota Habis<span className="font-medium text-[8px] opacity-80">Reset: {new Date(aiQuota.resetsAt).toLocaleDateString('id-ID', { weekday: 'long' })}</span></>
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
            </div>
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
