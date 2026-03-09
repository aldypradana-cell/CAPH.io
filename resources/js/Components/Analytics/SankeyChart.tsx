import React from 'react';
import { Sankey, Tooltip, ResponsiveContainer, Layer, Rectangle } from 'recharts';
import { SankeyData } from '@/types/dashboard';
import { FileSearch } from 'lucide-react';

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
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
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
        <div className="flex flex-col h-full w-full min-h-[650px] space-y-4">
            <div className="flex justify-between items-center px-2">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                        Sankey Diagram
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Visualisasi interaktif sumber penghasilan dan kemana uang Anda mengalir.
                    </p>
                </div>
            </div>

            <div className="w-full relative bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
                {/* Decorative background gradients */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

                {isLoading ? (
                    <div className="w-full h-[550px] flex items-center justify-center">
                        <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
                            <p className="text-slate-500 font-medium animate-pulse">Memetakan miliaran rupiah...</p>
                        </div>
                    </div>
                ) : !chartData ? (
                    <div className="w-full h-[550px] flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8">
                        <FileSearch className="w-16 h-16 mb-6 opacity-30 text-indigo-500" />
                        <p className="font-semibold text-lg text-slate-600 dark:text-slate-300">Belum ada aliran kas</p>
                        <p className="text-sm opacity-80 mt-1 max-w-sm text-center">Data arus kas untuk periode ini masih kosong. Silakan catat transaksi atau ubah filter tanggal.</p>
                    </div>
                ) : (
                    <div className="w-full overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 hover:scrollbar-thumb-slate-300 dark:hover:scrollbar-thumb-slate-600">
                        <div className="min-w-[1100px] h-[600px] flex items-center justify-center p-8">
                            <Sankey
                                width={1100}
                                height={540}
                                data={{
                                    // Inject consistent colors into nodes so links can use them
                                    nodes: nodes.map((n, i) => ({ ...n, fill: getColorForIndex(i), index: i })),
                                    links: links.map(l => ({ 
                                        source: Number(l.source), 
                                        target: Number(l.target), 
                                        value: Number(l.value) 
                                    }))
                                }}
                                node={<CustomNode containerWidth={1100} />}
                                nodePadding={45}
                                nodeWidth={16}
                                link={
                                    <CustomLink 
                                        containerWidth={1100} 
                                        activeLink={activeLink} 
                                        setActiveLink={setActiveLink} 
                                    />
                                }
                                margin={{ top: 40, right: 220, bottom: 40, left: 220 }}
                                iterations={64}
                            >
                                <Tooltip content={<CustomTooltip />} />
                            </Sankey>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
