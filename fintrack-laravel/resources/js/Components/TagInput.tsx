import { useState, useRef, useEffect } from 'react';
import { X, Plus, Hash } from 'lucide-react';

interface Tag {
    id: number;
    name: string;
    color: string | null;
}

interface TagInputProps {
    availableTags: Tag[];
    selectedTags: string[];
    onChange: (tags: string[]) => void;
}

export default function TagInput({ availableTags, selectedTags, onChange }: TagInputProps) {
    const [inputValue, setInputValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Filter available tags based on input & exclude already selected
    const filteredTags = availableTags.filter(
        tag =>
            tag.name.toLowerCase().includes(inputValue.toLowerCase()) &&
            !selectedTags.includes(tag.name)
    );

    // Check if input exactly matches any existing tag
    const exactMatch = availableTags.some(
        tag => tag.name.toLowerCase() === inputValue.trim().toLowerCase()
    );

    // Check if input is already selected
    const alreadySelected = selectedTags.some(
        t => t.toLowerCase() === inputValue.trim().toLowerCase()
    );

    // Build dropdown options
    const options: { type: 'existing' | 'create'; name: string; color: string | null }[] = [];

    filteredTags.forEach(tag => {
        options.push({ type: 'existing', name: tag.name, color: tag.color });
    });

    if (inputValue.trim() && !exactMatch && !alreadySelected) {
        options.push({ type: 'create', name: inputValue.trim(), color: null });
    }

    const addTag = (name: string) => {
        if (!name.trim()) return;
        // Avoid duplicates (case-insensitive)
        if (!selectedTags.some(t => t.toLowerCase() === name.toLowerCase())) {
            onChange([...selectedTags, name]);
        }
        setInputValue('');
        setIsOpen(false);
        setHighlightIndex(0);
        inputRef.current?.focus();
    };

    const removeTag = (name: string) => {
        onChange(selectedTags.filter(t => t !== name));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !inputValue && selectedTags.length > 0) {
            removeTag(selectedTags[selectedTags.length - 1]);
            return;
        }

        if (!isOpen || options.length === 0) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (inputValue.trim()) addTag(inputValue.trim());
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightIndex(prev => (prev + 1) % options.length);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightIndex(prev => (prev - 1 + options.length) % options.length);
                break;
            case 'Enter':
                e.preventDefault();
                if (options[highlightIndex]) {
                    addTag(options[highlightIndex].name);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                break;
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Reset highlight when options change
    useEffect(() => {
        setHighlightIndex(0);
    }, [inputValue]);

    // Get color for a selected tag name from availableTags
    const getTagColor = (name: string): string => {
        const found = availableTags.find(t => t.name.toLowerCase() === name.toLowerCase());
        return found?.color || '#6366f1';
    };

    return (
        <div ref={containerRef} className="relative">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">
                Tags
            </label>
            <div
                className="flex flex-wrap items-center gap-1.5 min-h-[42px] px-3 py-2 border border-slate-200 dark:border-slate-700/50 rounded-2xl bg-slate-50 dark:bg-slate-900/50 focus-within:ring-2 focus-within:ring-indigo-500 transition-all cursor-text"
                onClick={() => inputRef.current?.focus()}
            >
                {/* Selected tag badges */}
                {selectedTags.map(tag => (
                    <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold text-white transition-all hover:scale-105 active:scale-95"
                        style={{ backgroundColor: getTagColor(tag) }}
                    >
                        <Hash className="w-3 h-3 opacity-70" />
                        {tag}
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
                            className="ml-0.5 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}

                {/* Input */}
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={selectedTags.length === 0 ? 'Ketik tag...' : ''}
                    className="flex-1 min-w-[80px] bg-transparent outline-none text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400"
                />
            </div>

            {/* Dropdown */}
            {isOpen && options.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden animate-pop-in max-h-[180px] overflow-y-auto scrollbar-hide">
                    {options.map((opt, idx) => (
                        <button
                            key={opt.type + opt.name}
                            type="button"
                            onClick={() => addTag(opt.name)}
                            onMouseEnter={() => setHighlightIndex(idx)}
                            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition-colors ${idx === highlightIndex
                                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                        >
                            {opt.type === 'existing' ? (
                                <>
                                    <span
                                        className="w-3 h-3 rounded-full shrink-0"
                                        style={{ backgroundColor: opt.color || '#6366f1' }}
                                    />
                                    <span className="font-medium">{opt.name}</span>
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4 text-indigo-500 shrink-0" />
                                    <span className="font-medium">
                                        Buat tag: <strong className="text-indigo-600 dark:text-indigo-400">"{opt.name}"</strong>
                                    </span>
                                </>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
