import React from 'react';

interface CaphLogoProps {
    size?: number;
    className?: string;
    showWordmark?: boolean;
    wordmarkClassName?: string;
    subtitle?: string;
}

export default function CaphLogo({
    size = 40,
    className = '',
    showWordmark = false,
    wordmarkClassName = '',
    subtitle,
}: CaphLogoProps) {
    return (
        <div className={`inline-flex items-center gap-3 ${className}`.trim()}>
            <img
                src="/Icon_CAPH.png"
                alt="CAPH.io logo"
                width={size}
                height={size}
                className="shrink-0 rounded-2xl object-cover"
            />

            {showWordmark && (
                <div className={wordmarkClassName}>
                    <div className="text-xl font-bold tracking-tight text-slate-800 dark:text-white leading-none">CAPH.io</div>
                    {subtitle && (
                        <div className="text-[10px] font-bold text-amber-500 dark:text-amber-400 tracking-[0.24em] uppercase mt-1">
                            {subtitle}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
