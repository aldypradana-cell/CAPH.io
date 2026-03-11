import React from 'react';
import { Sankey, Tooltip, ResponsiveContainer, Layer, Rectangle } from 'recharts';
import { SankeyData } from '@/types/dashboard';
import { MagnifyingGlass as FileSearch } from '@phosphor-icons/react';

interface SankeyChartProps {
    data: SankeyData | null;
    isLoading: boolean;
}

const formatShortIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

// Custom Tooltip
// A premium, diverse color palette for distinct nodes
const NODE_COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316', '#0ea5e9', '#6366f1',
    '#84cc16', '#d946ef', '#06b6d4', '#f43f5e', '#10b981',
    '#64748b', '#78716c', '#be123c', '#4338ca', '#0f766e',
];

// Helper to reliably get the same color for the same node index
const getColorForIndex = (index: number) => {
    return NODE_COLORS[index % NODE_COLORS.length];
};

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 max-w-[200px]">
                <p className="font-bold text-slate-800 dark:text-white capitalize text-sm mb-1 line-clamp-2">
                    {data.source?.name ? `${data.source.name} → ${data.target.name}` : data.name}
                </p>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#6366f1' }}></span>
                    <p className="text-slate-600 dark:text-slate-300 font-bold text-sm">
                        {formatShortIDR(data.value)}
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

const CustomNode = ({ x, y, width, height, index, payload, containerWidth }: any) => {
    const rawName = payload.name || '';
    // Strip prefix for display
    const displayName = typeof rawName === 'string' ? rawName.replace('IN: ', '').replace('OUT: ', '') : rawName;

    // Distinct color for each node
    const fill = payload.fill || getColorForIndex(index);
    
    // Calculate contrast text color using Tailwind text utilities combined with currentColor fill
    const labelColor = 'text-slate-800 dark:text-white';

    // Still use ratio for physical positioning of the text label
    const ratio = x / (containerWidth || 1100);

    return (
        <Layer key={`CustomNode${index}`}>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill={fill}
                fillOpacity={1}
                stroke={fill}
                strokeWidth={2}
                rx={6}
                ry={6}
                className="transition-all duration-300 hover:opacity-80"
                style={{ filter: `drop-shadow(0 4px 6px ${fill}33)` }}
            />
            {/* Elegant label positioning with better typography */}
            <text
                textAnchor={ratio < 0.2 ? 'end' : ratio > 0.8 ? 'start' : 'middle'}
                x={ratio < 0.2 ? x - 16 : ratio > 0.8 ? x + width + 16 : x + width / 2}
                y={y + height / 2 - 6}
                fontSize={13}
                fontFamily="'Inter', sans-serif"
                fontWeight="700"
                fill="currentColor"
                className={`${labelColor} pointer-events-none drop-shadow-sm`}
            >
                {displayName.length > 25 ? displayName.substring(0, 23) + '...' : displayName}
            </text>
            <text
                textAnchor={ratio < 0.2 ? 'end' : ratio > 0.8 ? 'start' : 'middle'}
                x={ratio < 0.2 ? x - 16 : ratio > 0.8 ? x + width + 16 : x + width / 2}
                y={y + height / 2 + 12}
                fontSize={11}
                fontFamily="'Inter', sans-serif"
                fontWeight="500"
                fill="currentColor"
                className="text-slate-500 dark:text-slate-300 uppercase tracking-wider pointer-events-none"
            >
                {formatShortIDR(payload.value)}
            </text>
        </Layer>
    );
};

const CustomLink = ({ sourceX, targetX, sourceY, targetY, sourceControlX, targetControlX, linkWidth, index, payload, activeLink, setActiveLink }: any) => {
    // Gradient Flow Strategy
    const sourceColor = payload.source?.fill || getColorForIndex(payload.source?.index || 0);
    const targetColor = payload.target?.fill || getColorForIndex(payload.target?.index || 0);
    const gradientId = `linkGradient-${index}`;

    // Opacity Logic based on Interaction
    let strokeOpacity = 0.35; // Default
    if (activeLink !== null) {
        strokeOpacity = activeLink === index ? 0.8 : 0.05; // Highlight active, dim others greatly
    }

    return (
        <Layer key={`CustomLink${index}`}>
            <defs>
                <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1={sourceX} y1={sourceY} x2={targetX} y2={targetY}>
                    <stop offset="0%" stopColor={sourceColor} stopOpacity={1} />
                    <stop offset="100%" stopColor={targetColor} stopOpacity={1} />
                </linearGradient>
            </defs>
            <path
                d={`
                    M${sourceX},${sourceY}
                    C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}
                `}
                stroke={`url(#${gradientId})`}
                strokeOpacity={strokeOpacity}
                strokeWidth={Math.max(linkWidth, 2)}
                fill="none"
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setActiveLink(index)}
                onMouseLeave={() => setActiveLink(null)}
                onClick={() => setActiveLink(activeLink === index ? null : index)}
            />
        </Layer>
    );
};


export default function SankeyChart({ data, isLoading }: SankeyChartProps) {
    const [activeLink, setActiveLink] = React.useState<number | null>(null);

    // Check if we have valid nodes and links
    const nodes = (Array.isArray(data?.nodes) ? data?.nodes : (data?.nodes ? Object.values(data.nodes) : [])) as any[];
    const links = (Array.isArray(data?.links) ? data?.links : (data?.links ? Object.values(data.links) : [])) as any[];
    const hasData = nodes.length > 0 && links.length > 0;
    const chartData = hasData ? { nodes, links } : null;

    return (
        <div className="flex flex-col h-full w-full min-h-[700px]">
            <div className="w-full relative bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col">
                {/* Decorative background gradients */}
                <div className="absolute top-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none"></div>

                {/* Card Header for Title */}
                <div className="px-6 sm:px-10 pt-8 pb-4 relative z-10">
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mb-2">Sankey Diagram</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Visualisasi dari mana uang Anda berasal dan ke mana mengalirnya.</p>
                </div>

                {isLoading ? (
                    <div className="w-full h-[650px] flex flex-col items-center justify-center space-y-4">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-indigo-100 dark:border-slate-800 rounded-full"></div>
                            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <p className="text-slate-400 font-medium animate-pulse text-lg">Memetakan miliaran rupiah...</p>
                    </div>
                ) : !chartData ? (
                    <div className="w-full h-[800px] flex flex-col items-center justify-center text-center p-8">
                        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-3xl flex items-center justify-center mb-6 text-slate-300 dark:text-slate-700">
                            <FileSearch weight="duotone" className="w-12 h-12" />
                        </div>
                        <h4 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Tidak Ada Data Aliran</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                            Coba sesuaikan filter tanggal atau tambahkan transaksi baru untuk melihat visualisasi aliran dana.
                        </p>
                    </div>
                ) : (
                    <div className="p-4 sm:p-10 lg:p-14">
                        {/* Mobile Scroll Hint */}
                        <div className="flex lg:hidden items-center justify-center mb-6 text-slate-400 dark:text-slate-500 animate-pulse bg-slate-50/50 dark:bg-slate-800/50 py-2 rounded-xl">
                            <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            <span className="text-xs font-semibold uppercase tracking-widest leading-none">Geser Horizontal Untuk Detail</span>
                        </div>

                        <div className="overflow-x-auto scrollbar-hide pb-2">
                            <div className="min-w-[800px] w-full max-w-[1000px] h-[650px] mx-auto">
                                <ResponsiveContainer width="100%" height={600}>
                                    <Sankey
                                        data={{
                                            // Inject consistent colors into nodes so links can use them
                                            nodes: nodes.map((n, i) => ({ ...n, fill: getColorForIndex(i), index: i })),
                                            links: links.map(l => ({ 
                                                source: Number(l.source), 
                                                target: Number(l.target), 
                                                value: Number(l.value) 
                                            }))
                                        }}
                                        node={<CustomNode containerWidth={1000} />}
                                        nodePadding={40}
                                        nodeWidth={16}
                                        link={
                                            <CustomLink 
                                                containerWidth={1000} 
                                                activeLink={activeLink} 
                                                setActiveLink={setActiveLink} 
                                            />
                                        }
                                        margin={{ top: 20, right: 120, bottom: 20, left: 120 }}
                                        iterations={64}
                                    >
                                        <Tooltip content={<CustomTooltip />} />
                                    </Sankey>
                                </ResponsiveContainer>
                            </div>
                        </div>
                </div>
            )}
        </div>
    </div>
);
}
