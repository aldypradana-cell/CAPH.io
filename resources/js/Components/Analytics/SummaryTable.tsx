import React from 'react';
import { ArrowUpRight, ArrowDownRight, Stack as Layers, CreditCard } from '@phosphor-icons/react';

interface SummaryTableProps {
    data: any;
    isLoading: boolean;
}

const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

export default function SummaryTable({ data, isLoading }: SummaryTableProps) {
    
    return (
        <div className="flex flex-col h-full w-full">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Ledger Ringkas</h3>
            
            {isLoading || !data ? (
                <div className="flex-1 w-full flex items-center justify-center min-h-[300px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                </div>
            ) : (
                <div className="space-y-6 flex-1 text-sm">
                    
                    {/* Grand Totals */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
                            <div className="flex items-center gap-2 mb-1">
                                <ArrowDownRight weight="bold" className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Total Masuk</p>
                            </div>
                            <p className="text-lg font-bold text-emerald-800 dark:text-emerald-300">{formatIDR(data.totalIncome)}</p>
                        </div>
                        <div className="bg-rose-50 dark:bg-rose-500/10 p-4 rounded-2xl border border-rose-100 dark:border-rose-500/20">
                            <div className="flex items-center gap-2 mb-1">
                                <ArrowUpRight weight="bold" className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                                <p className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Total Keluar</p>
                            </div>
                            <p className="text-lg font-bold text-rose-800 dark:text-rose-300">{formatIDR(data.totalExpense)}</p>
                        </div>
                    </div>

                    {/* Top 5 Expenses */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                        <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                            <Layers weight="duotone" className="w-4 h-4" /> 5 Pengeluaran Teratas
                        </h4>
                        
                        {data.topExpenses && data.topExpenses.length > 0 ? (
                            <div className="space-y-3">
                                {data.topExpenses.map((expense: any, idx: number) => {
                                    const percent = data.totalExpense > 0 
                                        ? Math.round((expense.total / data.totalExpense) * 100) 
                                        : 0;
                                        
                                    return (
                                        <div key={idx} className="flex justify-between items-center group">
                                            <div className="flex items-center gap-3 w-1/2">
                                                <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                                                <span className="font-medium text-slate-600 dark:text-slate-400 truncate group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                                    {expense.category || 'Lain-lain'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-right">
                                                <span className="text-xs font-bold bg-white dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                                                    {percent}%
                                                </span>
                                                <span className="font-bold text-slate-800 dark:text-slate-200 min-w-[90px]">
                                                    {formatIDR(expense.total)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-slate-400 text-center py-4 italic text-xs">Belum ada data pengeluaran</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
