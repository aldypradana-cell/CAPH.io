import { motion, AnimatePresence } from 'framer-motion';

interface FloatingXPProps {
    amount: number;
    x: number;
    y: number;
    onComplete: () => void;
}

export default function FloatingXP({ amount, x, y, onComplete }: FloatingXPProps) {
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: y, x: x - 20, scale: 0.5 }}
                animate={{ 
                    opacity: [0, 1, 1, 0],
                    y: y - 100,
                    x: x + (Math.random() * 40 - 20),
                    scale: [0.5, 1.2, 1, 0.8]
                }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                onAnimationComplete={onComplete}
                className="fixed z-[9999] pointer-events-none"
            >
                <div className="flex items-center gap-1 bg-emerald-500 text-white px-3 py-1 rounded-full shadow-lg shadow-emerald-500/40 border border-emerald-400">
                    <span className="text-xs font-black">+{amount} XP</span>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
