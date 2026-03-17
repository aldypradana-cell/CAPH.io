import { CheckCircle, CreditCard, Minus, Plus, Wallet, X } from '@phosphor-icons/react';
import { Link } from '@inertiajs/react';

interface OnboardingStep {
    key: string;
    title: string;
    description: string;
    completed: boolean;
    active: boolean;
    href?: string;
    actionLabel?: string;
}

interface OnboardingSetupCardProps {
    title?: string;
    subtitle?: string;
    progressText: string;
    progressPercent: number;
    steps: OnboardingStep[];
    mode?: 'desktop' | 'mobile' | 'floating';
    minimized?: boolean;
    onToggleMinimize?: () => void;
}

const iconByKey = {
    wallet: Wallet,
    balance: CreditCard,
    transaction: Plus,
} as const;

export default function OnboardingSetupCard({
    title = 'Siapkan akun Anda',
    subtitle = 'Mulai dengan 3 langkah agar dashboard CAPH.io bisa menampilkan ringkasan keuangan yang lebih akurat.',
    progressText,
    progressPercent,
    steps,
    mode = 'mobile',
    minimized = false,
    onToggleMinimize,
}: OnboardingSetupCardProps) {
    const isDesktop = mode === 'desktop';
    const isFloating = mode === 'floating';
    const activeStep = steps.find((step) => step.active) ?? steps.find((step) => !step.completed) ?? steps[0];

    if (isFloating && activeStep) {
        const Icon = iconByKey[activeStep.key as keyof typeof iconByKey] ?? Wallet;

        if (minimized) {
            return (
                <div className="relative w-full max-w-[280px] overflow-hidden rounded-[1.2rem] border border-white/10 bg-slate-900/88 backdrop-blur-xl shadow-2xl shadow-slate-950/50 text-white p-3 sm:w-[280px]">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute -top-12 -right-8 w-24 h-24 rounded-full bg-indigo-500/15 blur-3xl" />
                    </div>
                    <div className="relative z-10 flex items-center gap-3">
                        <button
                            type="button"
                            data-drag-handle="true"
                            className="flex h-9 w-9 shrink-0 cursor-move items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-200"
                            aria-label="Geser panel onboarding"
                        >
                            <Icon weight="duotone" className="h-4.5 w-4.5" />
                        </button>
                        <div className="min-w-0 flex-1">
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-indigo-200/90">Setup Akun</p>
                            <p className="mt-0.5 truncate text-[12px] font-semibold text-white">{progressText}</p>
                            <p className="mt-0.5 text-[10px] text-slate-400">Ketuk untuk melanjutkan setup</p>
                        </div>
                        <div className="flex items-center gap-1.5" data-no-drag="true">
                            <button type="button" onClick={onToggleMinimize} className="rounded-full bg-white/8 p-1.5 text-slate-300 transition-colors hover:bg-white/12 hover:text-white" aria-label="Buka onboarding">
                                <Plus className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="relative w-full max-w-[280px] overflow-hidden rounded-[1.4rem] border border-white/10 bg-slate-900/86 backdrop-blur-xl shadow-2xl shadow-slate-950/50 text-white p-3.5 sm:w-[280px]">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-16 -right-10 w-36 h-36 rounded-full bg-indigo-500/15 blur-3xl" />
                    <div className="absolute -bottom-12 -left-6 w-28 h-28 rounded-full bg-violet-500/10 blur-3xl" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-start gap-2.5 pr-7" data-drag-handle="true">
                        <div className="flex h-10 w-10 shrink-0 cursor-move items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-200">
                            <Icon weight="duotone" className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-indigo-200/90">Setup Akun</p>
                                    <h3 className="mt-1 text-[13px] font-bold tracking-tight text-white">{progressText}</h3>
                                </div>
                                <span className="text-[11px] font-semibold text-slate-300">{progressPercent}%</span>
                            </div>
                            <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-violet-400 to-emerald-400 transition-all duration-500" style={{ width: `${Math.max(0, Math.min(progressPercent, 100))}%` }} />
                            </div>
                        </div>
                    </div>

                    <div className="absolute right-0 top-0 z-20 flex items-center gap-1" data-no-drag="true">
                        <button
                            type="button"
                            onClick={onToggleMinimize}
                            className="rounded-full bg-white/6 p-1.5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                            aria-label="Minimize onboarding"
                        >
                            <Minus className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    <div className="mt-3.5 rounded-[1.15rem] border border-white/10 bg-white/[0.05] p-3" data-no-drag="true">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Langkah berikutnya</span>
                        </div>
                        <h4 className="mt-1 text-[13px] font-semibold text-white">{activeStep.title}</h4>
                        <p className="mt-1 text-[11px] leading-5 text-slate-300">{activeStep.description}</p>
                        {activeStep.href && activeStep.actionLabel && (
                            <Link
                                href={activeStep.href}
                                data-no-drag="true"
                                className="mt-3 inline-flex min-h-9 items-center justify-center rounded-2xl bg-white px-3.5 py-2 text-[11px] font-semibold text-slate-900 transition-all hover:bg-indigo-50"
                            >
                                {activeStep.actionLabel}
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/85 backdrop-blur-xl shadow-2xl shadow-slate-950/40 text-white ${isDesktop ? 'p-5' : 'p-4 sm:p-5'}`}>
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-16 -right-12 w-48 h-48 rounded-full bg-indigo-500/15 blur-3xl" />
                <div className="absolute -bottom-16 -left-8 w-40 h-40 rounded-full bg-violet-500/10 blur-3xl" />
            </div>

            <div className="relative z-10">
                <div className="mb-4">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-indigo-200/90">
                        First Setup
                    </div>
                    <h3 className={`mt-3 font-bold tracking-tight ${isDesktop ? 'text-xl' : 'text-lg sm:text-xl'}`}>{title}</h3>
                    <p className={`mt-1 text-slate-300 ${isDesktop ? 'text-sm leading-6' : 'text-xs sm:text-sm leading-5 sm:leading-6'}`}>{subtitle}</p>
                </div>

                <div className="mb-5">
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-300">
                        <span>{progressText}</span>
                        <span>{progressPercent}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-violet-400 to-emerald-400 transition-all duration-500"
                            style={{ width: `${Math.max(0, Math.min(progressPercent, 100))}%` }}
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    {steps.map((step, index) => {
                        const Icon = iconByKey[step.key as keyof typeof iconByKey] ?? Wallet;
                        const stateClass = step.completed
                            ? 'border-emerald-400/30 bg-emerald-500/10'
                            : step.active
                                ? 'border-indigo-400/40 bg-white/8 shadow-lg shadow-indigo-500/10'
                                : 'border-white/10 bg-white/[0.04] opacity-80';

                        return (
                            <div key={step.key} className={`rounded-[1.5rem] border p-3.5 transition-all ${stateClass}`}>
                                <div className="flex items-start gap-3">
                                    <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${step.completed ? 'bg-emerald-500/15 text-emerald-300' : step.active ? 'bg-indigo-500/15 text-indigo-200' : 'bg-white/8 text-slate-300'}`}>
                                        {step.completed ? <CheckCircle weight="fill" className="h-5 w-5" /> : <Icon weight="duotone" className="h-5 w-5" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Langkah {index + 1}</span>
                                            {step.active && !step.completed && (
                                                <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-200">
                                                    Berikutnya
                                                </span>
                                            )}
                                            {step.completed && (
                                                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200">
                                                    Selesai
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="mt-1 text-sm sm:text-[15px] font-semibold text-white">{step.title}</h4>
                                        <p className="mt-1 text-xs sm:text-sm leading-5 text-slate-300">{step.description}</p>

                                        {step.href && step.actionLabel && !step.completed && (
                                            <div className="mt-3">
                                                <Link
                                                    href={step.href}
                                                    className={`inline-flex min-h-10 items-center justify-center rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all ${step.active
                                                        ? 'bg-white text-slate-900 hover:bg-indigo-50'
                                                        : 'border border-white/12 bg-white/6 text-slate-200 hover:bg-white/10'
                                                        }`}
                                                >
                                                    {step.actionLabel}
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
