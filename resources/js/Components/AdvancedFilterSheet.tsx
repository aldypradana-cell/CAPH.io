import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FadersHorizontal as SlidersHorizontal, X, Check } from '@phosphor-icons/react';

// ── Types ─────────────────────────────────────────────
interface FilterOption {
    value: string;
    label: string;
}

interface AdvancedFilterSheetProps {
    wallets: FilterOption[];
    categories: FilterOption[];
    tags: FilterOption[];
    // Current values
    filterType: string;
    filterWallet: string;
    filterCategory: string;
    filterTag: string;
    // Callbacks
    onApply: (filters: {
        type: string;
        wallet_id: string;
        category: string;
        tag: string;
    }) => void;
}

// ── Pill Button (reusable within this component) ──────
function FilterPill({
    label,
    isActive,
    onClick,
}: {
    label: string;
    isActive: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                    : 'bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border-white/40 dark:border-slate-700/50 border text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/50'
            }`}
        >
            {label}
        </button>
    );
}

// ── Main Component ────────────────────────────────────
export default function AdvancedFilterSheet({
    wallets,
    categories,
    tags,
    filterType,
    filterWallet,
    filterCategory,
    filterTag,
    onApply,
}: AdvancedFilterSheetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Local draft state (so user can cancel without saving)
    const [draftType, setDraftType] = useState(filterType);
    const [draftWallet, setDraftWallet] = useState(filterWallet);
    const [draftCategory, setDraftCategory] = useState(filterCategory);
    const [draftTag, setDraftTag] = useState(filterTag);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Sync when parent filters change (e.g., from URL navigation)
    useEffect(() => {
        setDraftType(filterType);
        setDraftWallet(filterWallet);
        setDraftCategory(filterCategory);
        setDraftTag(filterTag);
    }, [filterType, filterWallet, filterCategory, filterTag]);

    // Count active filters
    const activeCount = [filterType, filterWallet, filterCategory, filterTag].filter(Boolean).length;

    const handleApply = () => {
        onApply({
            type: draftType,
            wallet_id: draftWallet,
            category: draftCategory,
            tag: draftTag,
        });
        setIsOpen(false);
    };

    const handleReset = () => {
        setDraftType('');
        setDraftWallet('');
        setDraftCategory('');
        setDraftTag('');
    };

    const openSheet = () => {
        // Re-sync draft with current filters when opening
        setDraftType(filterType);
        setDraftWallet(filterWallet);
        setDraftCategory(filterCategory);
        setDraftTag(filterTag);
        setIsOpen(true);
    };

    // ── Filter Section (reusable layout within the sheet) ──
    const FilterSection = ({
        title,
        children,
    }: {
        title: string;
        children: React.ReactNode;
    }) => (
        <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">
                {title}
            </p>
            <div className="flex flex-wrap gap-2">{children}</div>
        </div>
    );

    const typeOptions: FilterOption[] = [
        { value: 'INCOME', label: '💰 Pemasukan' },
        { value: 'EXPENSE', label: '💸 Pengeluaran' },
        { value: 'TRANSFER', label: '🔄 Transfer' },
    ];

    return (
        <>
            {/* ── Trigger Button ── */}
            <button
                onClick={openSheet}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all active:scale-95 ${
                    activeCount > 0
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
            >
                <SlidersHorizontal weight="bold" className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Filter</span>
                {activeCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black">
                        {activeCount}
                    </span>
                )}
            </button>

            {/* ── Filter Sheet (Portal) ── */}
            {isOpen && mounted && createPortal(
                <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center animate-fade-in">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-indigo-900/10 dark:bg-slate-950/50 backdrop-blur-md transition-opacity"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Sheet */}
                    <div className="relative w-full sm:max-w-md glass-heavy rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden animate-pop-in max-h-[85vh] flex flex-col border-t sm:border border-slate-100/50 dark:border-slate-800/50">
                        {/* Ambient Colors for Glass */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-400/20 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" style={{ transform: 'translate(30%, -30%)' }} />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-400/20 dark:bg-pink-500/20 rounded-full blur-3xl pointer-events-none" style={{ transform: 'translate(-30%, 30%)' }} />
                        {/* Drag handle (mobile) */}
                        <div className="sm:hidden flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-5 pt-3 sm:pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <SlidersHorizontal weight="duotone" className="w-4 h-4 text-indigo-500" />
                                Filter Lanjutan
                            </h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border border-white/40 dark:border-slate-700/50 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors active:scale-95"
                            >
                                <X weight="bold" className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-5 space-y-5 overflow-y-auto scrollbar-hide">
                            {/* Type */}
                            <FilterSection title="Tipe Transaksi">
                                <FilterPill
                                    label="Semua"
                                    isActive={!draftType}
                                    onClick={() => setDraftType('')}
                                />
                                {typeOptions.map((opt) => (
                                    <FilterPill
                                        key={opt.value}
                                        label={opt.label}
                                        isActive={draftType === opt.value}
                                        onClick={() =>
                                            setDraftType(
                                                draftType === opt.value ? '' : opt.value
                                            )
                                        }
                                    />
                                ))}
                            </FilterSection>

                            {/* Wallet */}
                            {wallets.length > 0 && (
                                <FilterSection title="Dompet">
                                    <FilterPill
                                        label="Semua Dompet"
                                        isActive={!draftWallet}
                                        onClick={() => setDraftWallet('')}
                                    />
                                    {wallets.map((w) => (
                                        <FilterPill
                                            key={w.value}
                                            label={w.label}
                                            isActive={draftWallet === w.value}
                                            onClick={() =>
                                                setDraftWallet(
                                                    draftWallet === w.value ? '' : w.value
                                                )
                                            }
                                        />
                                    ))}
                                </FilterSection>
                            )}

                            {/* Category */}
                            {categories.length > 0 && (
                                <FilterSection title="Kategori">
                                    <FilterPill
                                        label="Semua Kategori"
                                        isActive={!draftCategory}
                                        onClick={() => setDraftCategory('')}
                                    />
                                    {categories.map((c) => (
                                        <FilterPill
                                            key={c.value}
                                            label={c.label}
                                            isActive={draftCategory === c.value}
                                            onClick={() =>
                                                setDraftCategory(
                                                    draftCategory === c.value ? '' : c.value
                                                )
                                            }
                                        />
                                    ))}
                                </FilterSection>
                            )}

                            {/* Tags */}
                            {tags.length > 0 && (
                                <FilterSection title="Tag">
                                    <FilterPill
                                        label="Semua Tag"
                                        isActive={!draftTag}
                                        onClick={() => setDraftTag('')}
                                    />
                                    {tags.map((t) => (
                                        <FilterPill
                                            key={t.value}
                                            label={`#${t.label}`}
                                            isActive={draftTag === t.value}
                                            onClick={() =>
                                                setDraftTag(
                                                    draftTag === t.value ? '' : t.value
                                                )
                                            }
                                        />
                                    ))}
                                </FilterSection>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="flex gap-3 p-5 pt-3 border-t border-slate-100/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
                            <button
                                onClick={handleReset}
                                className="flex-1 py-3 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border border-white/40 dark:border-slate-700/50 hover:bg-white/60 dark:hover:bg-slate-700/60 transition-colors active:scale-95"
                            >
                                Reset
                            </button>
                            <button
                                onClick={handleApply}
                                className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                            >
                                <Check weight="bold" className="w-4 h-4" />
                                Terapkan
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
