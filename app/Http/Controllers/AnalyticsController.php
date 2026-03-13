<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class AnalyticsController extends Controller
{
    public function index(Request $request)
    {
        file_put_contents(base_path('analytics_hit.txt'), "Hit at " . now() . " by user " . ($request->user() ? $request->user()->id : 'GUEST'));
        Log::info("Analytics Index Hit by User: " . $request->user()->id);
        $user = $request->user();
        
        $startDate = now()->startOfMonth()->format('Y-m-d');
        $endDate = now()->endOfMonth()->format('Y-m-d');

        return Inertia::render('Analytics/Index', [
            'defaultPeriod' => [
                'startDate' => $startDate,
                'endDate' => $endDate,
            ]
        ]);
    }

    public function sankeyApi(Request $request)
    {
        Log::info("Sankey API Hit. Start: " . $request->input('startDate') . ", End: " . $request->input('endDate'));
        try {
            $user = $request->user();
            $startDate = $request->input('startDate', now()->startOfMonth()->format('Y-m-d'));
            $endDate = $request->input('endDate', now()->endOfMonth()->format('Y-m-d'));

            // 1. Income Data (Grouped by Category and Wallet)
            $incomeData = Transaction::forUser($user->id)
                ->inDateRange($startDate, $endDate)
                ->where('type', 'INCOME')
                ->whereNotNull('wallet_id')
                ->select('category', 'wallet_id', DB::raw('SUM(amount) as total'))
                ->groupBy('category', 'wallet_id')
                ->get();

            $expenseData = Transaction::forUser($user->id)
                ->inDateRange($startDate, $endDate)
                ->where('type', 'EXPENSE')
                ->whereNotNull('wallet_id')
                ->select('wallet_id', 'category', DB::raw('SUM(amount) as total'))
                ->groupBy('wallet_id', 'category')
                ->get();

            // 3. Transfer Data (Internal Movement)
            $transferData = Transaction::forUser($user->id)
                ->inDateRange($startDate, $endDate)
                ->where('type', 'TRANSFER')
                ->whereNotNull('wallet_id')
                ->whereNotNull('to_wallet_id')
                ->select('wallet_id', 'to_wallet_id', DB::raw('SUM(amount) as total'))
                ->groupBy('wallet_id', 'to_wallet_id')
                ->get();

            $wallets = Wallet::where('user_id', $user->id)->pluck('name', 'id');

            $nodes = [];
            $nodeMap = []; // Name -> Index
            $links = [];

            $addNode = function ($name) use (&$nodes, &$nodeMap) {
                if (!isset($nodeMap[$name])) {
                    $nodeMap[$name] = count($nodes);
                    $nodes[] = ['name' => $name];
                }
                return $nodeMap[$name];
            };

            $rawLinks = [];
            
            // Income Links
            foreach ($incomeData as $item) {
                $catName = "IN: " . ($item->category ?: 'Pendapatan Lain');
                $walletName = $wallets[$item->wallet_id] ?? 'Dompet Tidak Diketahui';
                if ($item->total > 0) {
                    $rawLinks[] = ['source' => $catName, 'target' => $walletName, 'value' => (float) $item->total, 'isInternal' => false];
                }
            }

            // Pre-calculate explicit threshold for grouping tiny expenses
            $totalExpense = $expenseData->sum('total');
            // Group everything < 1% as "Lain-lain" to keep sankey clean and fast
            $expenseThreshold = $totalExpense * 0.01; 
            
            $catTotals = [];
            foreach ($expenseData as $item) {
                $cat = $item->category ?: 'Lain-lain';
                $catTotals[$cat] = ($catTotals[$cat] ?? 0) + $item->total;
            }

            // Expense Links
            foreach ($expenseData as $item) {
                $walletName = $wallets[$item->wallet_id] ?? 'Dompet Tidak Diketahui';
                $catName = $item->category ?: 'Lain-lain';
                
                // Apply threshold grouping
                if (($catTotals[$catName] ?? 0) < $expenseThreshold) {
                    $catName = 'Kecil (Lain-lain)';
                }
                
                if ($item->total > 0) {
                    $rawLinks[] = ['source' => $walletName, 'target' => "OUT: " . $catName, 'value' => (float) $item->total, 'isInternal' => false];
                }
            }

            // Transfer Links (Internal)
            foreach ($transferData as $item) {
                $sourceWallet = $wallets[$item->wallet_id] ?? 'Dompet Tidak Diketahui';
                $targetWallet = $wallets[$item->to_wallet_id] ?? 'Dompet Tidak Diketahui';
                
                if ($item->total > 0) {
                    $rawLinks[] = [
                        'source' => $sourceWallet, 
                        'target' => $targetWallet, 
                        'value' => (float) $item->total,
                        'isInternal' => true
                    ];
                }
            }

            // Aggregate raw links (if same source and target, sum them up)
            $aggregatedLinks = [];
            foreach ($rawLinks as $link) {
                $key = $link['source'] . '|||' . $link['target'];
                if (!isset($aggregatedLinks[$key])) {
                    $aggregatedLinks[$key] = 0;
                }
                $aggregatedLinks[$key] += $link['value'];
            }

            // Build final nodes and links
            foreach ($aggregatedLinks as $key => $value) {
                list($sourceName, $targetName) = explode('|||', $key);
                $sourceIdx = $addNode($sourceName);
                $targetIdx = $addNode($targetName);
                
                // Find if this specific link was originally internal
                $wasInternal = false;
                foreach ($rawLinks as $rl) {
                    if ($rl['source'] === $sourceName && $rl['target'] === $targetName) {
                        $wasInternal = $rl['isInternal'] ?? false;
                        break;
                    }
                }

                $links[] = [
                    'source' => $sourceIdx,
                    'target' => $targetIdx,
                    'value' => $value,
                    'isInternal' => $wasInternal
                ];
            }

            // Keep the 'IN: ' and 'OUT: ' prefixes so the frontend can reliably parse the type
            // from the node name, as Recharts strips custom properties like 'type'.
            
            Log::info("Sample Raw Links: ", array_slice($rawLinks, 0, 10));
            Log::info("Sankey Nodes: " . count($nodes) . ", Links: " . count($links));

            Log::info('Analytics Sankey Summary', [
                'nodes_count' => count($nodes),
                'links_count' => count($links),
                'nodes_sample' => array_slice($nodes, 0, 5),
                'raw_links_sample' => array_slice($rawLinks, 0, 5)
            ]);

            return response()->json([
                'sankeyData' => [
                    'nodes' => array_values($nodes),
                    'links' => array_values($links)
                ]
            ]);
        } catch (\Exception $e) {
            Log::error("Sankey API Error: " . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function netFlowApi(Request $request)
    {
        Log::info("NetFlow API Hit");
        $user = $request->user();
        // Default to last 6 months if not provided
        $startDate = $request->input('startDate', now()->subMonths(5)->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('endDate', now()->endOfMonth()->format('Y-m-d'));

        // SQLite vs MySQL compatibility for EXTRACT or STRFTIME
        if (DB::connection()->getDriverName() === 'sqlite') {
            $monthGroup = "strftime('%Y-%m', date)";
        } else {
            $monthGroup = "DATE_FORMAT(date, '%Y-%m')";
        }

        $netFlowRaw = Transaction::forUser($user->id)
            ->inDateRange($startDate, $endDate)
            ->selectRaw("{$monthGroup} as month, type, SUM(amount) as total")
            ->whereIn('type', ['EXPENSE', 'INCOME'])
            ->groupBy('month', 'type')
            ->orderBy('month')
            ->get();

        $dataMap = [];
        foreach ($netFlowRaw as $row) {
            $month = $row->month; // e.g. "2024-03"
            if (!isset($dataMap[$month])) {
                $dataMap[$month] = ['name' => Carbon::createFromFormat('Y-m', $month)->format('M y'), 'monthRaw' => $month, 'income' => 0, 'expense' => 0, 'net' => 0];
            }
            if ($row->type === 'INCOME') {
                $dataMap[$month]['income'] = (float) $row->total;
            } elseif ($row->type === 'EXPENSE') {
                $dataMap[$month]['expense'] = (float) $row->total;
            }
        }

        foreach ($dataMap as $k => $v) {
            $dataMap[$k]['net'] = $v['income'] - $v['expense'];
        }

        return response()->json([
            'netFlowData' => array_values($dataMap)
        ]);
    }

    public function summaryApi(Request $request)
    {
        $user = $request->user();
        $startDate = $request->input('startDate', now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('endDate', now()->endOfMonth()->format('Y-m-d'));

        $totals = Transaction::forUser($user->id)
            ->inDateRange($startDate, $endDate)
            ->selectRaw('type, SUM(amount) as total')
            ->whereIn('type', ['EXPENSE', 'INCOME'])
            ->groupBy('type')
            ->pluck('total', 'type');

        $topExpenses = Transaction::forUser($user->id)
            ->inDateRange($startDate, $endDate)
            ->where('type', 'EXPENSE')
            ->select('category', DB::raw('SUM(amount) as total'))
            ->groupBy('category')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        $topIncomes = Transaction::forUser($user->id)
            ->inDateRange($startDate, $endDate)
            ->where('type', 'INCOME')
            ->select('category', DB::raw('SUM(amount) as total'))
            ->groupBy('category')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        return response()->json([
            'summaryData' => [
                'totalIncome' => (float) ($totals['INCOME'] ?? 0),
                'totalExpense' => (float) ($totals['EXPENSE'] ?? 0),
                'netFlow' => (float) ($totals['INCOME'] ?? 0) - (float) ($totals['EXPENSE'] ?? 0),
                'topExpenses' => $topExpenses,
                'topIncomes' => $topIncomes,
            ]
        ]);
    }
}
