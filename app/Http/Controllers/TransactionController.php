<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\Wallet;
use App\Models\Category;
use App\Models\Tag;
use App\Services\TransactionService;
use App\Http\Requests\StoreTransactionRequest;
use App\Http\Requests\UpdateTransactionRequest;
use App\Traits\HasTransactionSuggestions;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class TransactionController extends Controller
{
    use HasTransactionSuggestions;

    protected $transactionService;

    public function __construct(TransactionService $transactionService)
    {
        $this->transactionService = $transactionService;
    }

    public function index(Request $request)
    {
        $user = $request->user();

        $query = Transaction::forUser($user->id)
            ->with(['wallet', 'toWallet', 'tags'])
            ->orderBy('date', 'desc');

        // Apply filters
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Wallet filter (for cross-linking from Wallet page)
        if ($request->filled('wallet_id')) {
            $query->where(function ($q) use ($request) {
                $q->where('wallet_id', $request->wallet_id)
                  ->orWhere('to_wallet_id', $request->wallet_id);
            });
        }

        // Category filter
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        // Determine date range (default to current month)
        $startDate = $request->input('start_date', now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', now()->endOfMonth()->format('Y-m-d'));

        $query->inDateRange($startDate, $endDate);


        // Apply tag filter
        if ($request->filled('tag')) {
            $query->whereHas('tags', function ($q) use ($request) {
                $q->where('slug', $request->tag);
            });
        }

        // Apply search filter (server-side)
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('description', 'LIKE', "%{$search}%")
                    ->orWhere('category', 'LIKE', "%{$search}%");
            });
        }

        // --- calculate stats for current filter ---
        // We need to clone the query because paginate() modifies it
        $statsQuery = clone $query;
        // MUST clear orderings from the main query, otherwise SQL throws only_full_group_by error for 'date'
        $statsData = $statsQuery->reorder()->selectRaw('type, SUM(amount) as total')->groupBy('type')->pluck('total', 'type');
        $filterStats = [
            'income' => (float) ($statsData['INCOME'] ?? 0),
            'expense' => (float) ($statsData['EXPENSE'] ?? 0),
            'net' => (float) ($statsData['INCOME'] ?? 0) - (float) ($statsData['EXPENSE'] ?? 0),
        ];

        $transactions = $query->paginate(20)->withQueryString();

        // Calculate Heatmap Data for the selected month (or current month)
        $heatmapStartDate = $request->filled('start_date') ? \Carbon\Carbon::parse($request->start_date)->startOfMonth() : now()->startOfMonth();
        $heatmapEndDate = $request->filled('start_date') ? \Carbon\Carbon::parse($request->start_date)->endOfMonth() : now()->endOfMonth();

        $heatmapRaw = Transaction::forUser($user->id)
            ->inDateRange($heatmapStartDate->format('Y-m-d'), $heatmapEndDate->format('Y-m-d'))
            ->selectRaw('DATE(date) as day_date, type, SUM(amount) as total')
            ->whereIn('type', ['EXPENSE', 'INCOME'])
            ->groupBy('day_date', 'type')
            ->get();

        $heatmapMonth = $heatmapStartDate->format('Y-m');
        $heatmapData = [];
        
        foreach ($heatmapRaw as $row) {
            $dateStr = $row->day_date; // Assuming it comes back as string from DATE()
            if (!isset($heatmapData[$dateStr])) {
                $heatmapData[$dateStr] = ['expense' => 0, 'income' => 0];
            }
            if ($row->type === 'EXPENSE') {
                $heatmapData[$dateStr]['expense'] = (float) $row->total;
            } elseif ($row->type === 'INCOME') {
                $heatmapData[$dateStr]['income'] = (float) $row->total;
            }
        }

        $wallets = Wallet::where('user_id', $user->id)->get();
        $categories = Category::userCategories($user->id)->get();
        $userTags = Tag::where('user_id', $user->id)->orderBy('name')->get();

        return Inertia::render('Transactions/Index', [
            'transactions' => $transactions,
            'wallets' => $wallets,
            'categories' => $categories,
            'filters' => [
                'type' => $request->type,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'tag' => $request->tag,
                'search' => $request->search,
                'wallet_id' => $request->wallet_id,
                'category' => $request->category,
            ],
            'userTags' => $userTags,
            'heatmapData' => $heatmapData,
            'heatmapMonth' => $heatmapMonth,
            'filterStats' => $filterStats,
            'suggestions' => $this->getTransactionSuggestions($user->id),
        ]);
    }

    public function store(StoreTransactionRequest $request)
    {
        $userId = $request->user()->id;
        $validated = $request->validated();

        try {
            if (!empty($validated['is_paylater'])) {
                // If PayLater, defer to special creation flow without touching wallet
                $transactions = $this->transactionService->createPayLaterTransaction($validated, $userId);
            } else {
                // Regular transaction flow
                $transactions = $this->transactionService->createTransactions(
                    [$validated],
                    $userId,
                    $validated['wallet_id']
                );
            }

            // Sync tags after creating the transaction
            if (!empty($validated['tags']) && !empty($transactions)) {
                $tagIds = Tag::resolveIds($validated['tags'], $userId);
                $transactions[0]->tags()->sync($tagIds);
            }

            return redirect()->back()->with('success', 'Transaksi berhasil ditambahkan');
        }
        catch (\Exception $e) {
            return redirect()->back()->withErrors(['message' => $e->getMessage()]);
        }
    }

    public function update(UpdateTransactionRequest $request, Transaction $transaction)
    {
        $userId = $request->user()->id;
        $validated = $request->validated();

        try {
            $this->transactionService->updateTransaction($transaction, $validated);

            // Sync tags after updating the transaction
            $tagIds = Tag::resolveIds($validated['tags'] ?? [], $userId);
            $transaction->tags()->sync($tagIds);

            return redirect()->back()->with('success', 'Transaksi berhasil diupdate');
        }
        catch (\Exception $e) {
            return redirect()->back()->withErrors(['message' => $e->getMessage()]);
        }
    }

    public function destroy(Request $request, Transaction $transaction)
    {
        // Authorization check
        if ($request->user()->cannot('delete', $transaction)) {
            abort(403);
        }

        $this->transactionService->deleteTransaction($transaction);

        return redirect()->back()->with('success', 'Transaksi berhasil dihapus');
    }


}
