import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useEffect, useState } from 'react';

interface WealthTreeVoxelProps {
    level: number;
    isWithering?: boolean;
    className?: string;
}

/**
 * Canvas-based Black-to-Alpha Transparency Engine.
 * Converts black/near-black pixels to transparent alpha.
 * Uses aggressive thresholds and edge feathering for seamless blending.
 */
function processImageToTransparent(img: HTMLImageElement): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const w = canvas.width;
    const h = canvas.height;

    // --- Pass 1: Brightness-based alpha conversion ---
    const threshold = 50;       // Anything below this brightness = fully transparent
    const fadeZone = 60;        // Transition zone width for smooth edges

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = Math.max(r, g, b);

        if (brightness <= threshold) {
            data[i + 3] = 0; // Fully transparent
        } else if (brightness < threshold + fadeZone) {
            // Smooth gradient from transparent to opaque
            const t = (brightness - threshold) / fadeZone;
            // Use smoothstep for more natural transition
            const alpha = t * t * (3 - 2 * t) * 255;
            data[i + 3] = Math.min(data[i + 3], Math.round(alpha));
        }
    }

    // --- Pass 2: Edge feathering (fade outer 8% of each edge) ---
    const edgeFade = 0.08;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            if (data[idx + 3] === 0) continue; // Skip already-transparent

            // Calculate distance from each edge as a fraction [0, 1]
            const fromLeft = x / w;
            const fromRight = 1 - fromLeft;
            const fromTop = y / h;
            const fromBottom = 1 - fromTop;
            const minEdgeDist = Math.min(fromLeft, fromRight, fromTop, fromBottom);

            if (minEdgeDist < edgeFade) {
                const edgeAlpha = minEdgeDist / edgeFade;
                // Smooth the edge fade
                const smooth = edgeAlpha * edgeAlpha;
                data[idx + 3] = Math.round(data[idx + 3] * smooth);
            }
        }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
}

export default function WealthTreeVoxel({ level, isWithering, className }: WealthTreeVoxelProps) {
    const [canvasDataUrl, setCanvasDataUrl] = useState<string>('');
    const [isReady, setIsReady] = useState(false);

    const getImagePath = (lvl: number) => {
        const v = '5.0';
        // Always show the current level's tree — withering uses CSS filter instead
        return `/images/trees/level${Math.min(10, Math.max(1, lvl))}.png?v=${v}`;
    };

    // Load and process image through canvas
    useEffect(() => {
        setIsReady(false);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const result = processImageToTransparent(img);
            setCanvasDataUrl(result);
            setIsReady(true);
        };
        img.onerror = () => {
            setCanvasDataUrl(getImagePath(level));
            setIsReady(true);
        };
        img.src = getImagePath(level);
    }, [level, isWithering]);

    // Particle effects
    const particles = useMemo(() =>
        Array.from({ length: 12 }).map((_, i) => ({
            id: i,
            x: Math.random() * 60 + 20,
            y: Math.random() * 50 + 25,
            size: Math.random() * 2.5 + 1.5,
            duration: Math.random() * 2.5 + 2.5,
            delay: Math.random() * 5,
        })), [level]
    );

    const particleColor = isWithering ? '#92400E' : (level >= 9 ? '#FBBF24' : '#34D399');
    const glowColor = isWithering
        ? 'rgba(120,53,15,0.12)'
        : level >= 9 ? 'rgba(251,191,36,0.2)' : 'rgba(16,185,129,0.15)';

    // Wither visual effect: desaturate + sepia + dim
    const witherFilter = isWithering
        ? 'grayscale(60%) sepia(40%) brightness(0.6) saturate(0.7)'
        : 'none';

    // Dynamic Scaling based on Level
    // Lvl 1-3: Smallest, Lvl 4-6: Medium, Lvl 7-8: Large, Lvl 9-10: Largest
    const getScaleConfig = () => {
        if (level <= 3) return { scale: 0.8, yBase: 10 };
        if (level <= 6) return { scale: 0.95, yBase: 5 };
        if (level <= 8) return { scale: 1.1, yBase: 0 };
        return { scale: 1.25, yBase: -5 };
    };
    
    const treeConfig = getScaleConfig();

    return (
        <div className={`relative flex items-center justify-center ${className} select-none`}>
            {/* Ambient Glow */}
            <motion.div
                animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute w-2/3 h-2/3 rounded-full pointer-events-none"
                style={{ background: `radial-gradient(circle, ${glowColor}, transparent 70%)` }}
            />

            {/* Tree */}
            <div className="relative w-full h-full flex items-center justify-center z-10">
                <AnimatePresence mode="wait">
                    {isReady && canvasDataUrl && (
                        <motion.img
                            key={`tree-${level}-${isWithering}`}
                            src={canvasDataUrl}
                            initial={{ opacity: 0, scale: treeConfig.scale - 0.15, y: treeConfig.yBase + 20 }}
                            animate={{
                                opacity: 1,
                                scale: [treeConfig.scale, treeConfig.scale + 0.02, treeConfig.scale],
                                y: [treeConfig.yBase, treeConfig.yBase - 4, treeConfig.yBase],
                            }}
                            exit={{ opacity: 0, scale: treeConfig.scale + 0.1, y: treeConfig.yBase - 15 }}
                            transition={{
                                opacity: { type: "spring", stiffness: 200, damping: 20 },
                                scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                                y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                            }}
                            alt={`Wealth Tree Level ${level}`}
                            className="w-full h-full object-contain transition-[filter] duration-1000"
                            style={{ filter: witherFilter }}
                            draggable={false}
                        />
                    )}
                </AnimatePresence>

                {!isReady && (
                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 animate-pulse blur-xl" />
                )}

                {/* Ground Glow */}
                <motion.div
                    animate={{ opacity: [0.2, 0.35, 0.2] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-[8%] w-2/5 h-4 rounded-full blur-lg pointer-events-none"
                    style={{ backgroundColor: particleColor }}
                />
            </div>

            {/* Sparkle Particles */}
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 0 }}
                    animate={{ opacity: [0, 0.5, 0], y: -55, x: Math.random() * 24 - 12 }}
                    transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeOut" }}
                    className="absolute rounded-full pointer-events-none z-20"
                    style={{
                        left: `${p.x}%`, top: `${p.y}%`,
                        width: p.size, height: p.size,
                        backgroundColor: particleColor,
                        boxShadow: `0 0 6px ${particleColor}`
                    }}
                />
            ))}
        </div>
    );
}
