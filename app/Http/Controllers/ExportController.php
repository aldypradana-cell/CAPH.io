<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Exports\TransactionsExport;
use App\Models\Transaction;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Maatwebsite\Excel\Facades\Excel;

class ExportController extends Controller
{
    /**
     * Preview summary for the export page (AJAX).
     * Optimized: uses SQL aggregation instead of loading all rows into memory.
     */
    public function preview(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after_or_equal:start_date',
            'wallet_id'  => 'nullable|integer|exists:wallets,id',
        ]);

        $user = $request->user();
        $query = Transaction::forUser($user->id)
            ->inDateRange($request->start_date, $request->end_date);

        if ($request->filled('wallet_id')) {
            $query->where('wallet_id', $request->wallet_id);
        }

        // Optimized: single SQL query with conditional SUM instead of loading all rows
        $stats = (clone $query)
            ->selectRaw("
                COUNT(*) as count,
                SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as income,
                SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as expense
            ")
            ->first();

        return response()->json([
            'count'   => (int) $stats->count,
            'income'  => (float) $stats->income,
            'expense' => (float) $stats->expense,
            'net'     => (float) ($stats->income - $stats->expense),
        ]);
    }

    /**
     * Download export file (Excel or PDF).
     * Optimized: aggregations done via SQL, only loads rows when needed for row-level output.
     */
    public function download(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after_or_equal:start_date',
            'format'     => 'required|in:excel,pdf',
            'wallet_id'  => 'nullable|integer|exists:wallets,id',
        ]);

        $user = $request->user();
        $startDate = Carbon::parse($request->start_date)->startOfDay();
        $endDate   = Carbon::parse($request->end_date)->endOfDay();

        $baseQuery = Transaction::forUser($user->id)
            ->inDateRange($startDate, $endDate);

        if ($request->filled('wallet_id')) {
            $baseQuery->where('wallet_id', $request->wallet_id);
        }

        // Aggregate totals via SQL (no memory overhead)
        $totals = (clone $baseQuery)
            ->selectRaw("
                SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as total_income,
                SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as total_expense
            ")
            ->first();

        $totalIncome  = (float) ($totals->total_income ?? 0);
        $totalExpense = (float) ($totals->total_expense ?? 0);

        // Top categories via SQL aggregation
        $topCategories = (clone $baseQuery)
            ->where('type', 'EXPENSE')
            ->selectRaw('category, SUM(amount) as total')
            ->groupBy('category')
            ->orderByDesc('total')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'category' => $row->category,
                'total'    => (float) $row->total,
            ])
            ->toArray();

        $fileName = "FinTrack_Laporan_{$startDate->format('Ymd')}_{$endDate->format('Ymd')}";

        // Load transactions with eager loading for row-level output
        $allTransactions = (clone $baseQuery)
            ->with(['wallet', 'tags'])
            ->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        // ── Excel ────────────────────────────────────────
        if ($request->format === 'excel') {
            return Excel::download(
                new TransactionsExport($allTransactions, $totalIncome, $totalExpense, $topCategories),
                $fileName . '.xlsx'
            );
        }

        // ── PDF ──────────────────────────────────────────
        $netFlow     = $totalIncome - $totalExpense;
        $savingsRate = $totalIncome > 0 ? round($netFlow / $totalIncome * 100, 1) : 0;

        // Group transactions by date
        $groupedByDate = $allTransactions->groupBy(fn ($tx) => $tx->date->format('Y-m-d'));

        // Find the max category total for progress bar scaling
        $maxCategoryTotal = !empty($topCategories) ? $topCategories[0]['total'] : 1;

        $pdf = Pdf::loadView('exports.pdf.report', [
            'user'             => $user,
            'startDate'        => $startDate,
            'endDate'          => $endDate,
            'totalIncome'      => $totalIncome,
            'totalExpense'     => $totalExpense,
            'netFlow'          => $netFlow,
            'savingsRate'      => $savingsRate,
            'topCategories'    => $topCategories,
            'maxCategoryTotal' => $maxCategoryTotal,
            'groupedByDate'    => $groupedByDate,
            'generatedAt'      => now(),
        ]);

        $pdf->setPaper('a4', 'portrait');

        return $pdf->download($fileName . '.pdf');
    }
}
