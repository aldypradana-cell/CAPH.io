<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\Wallet;
use App\Models\Category;
use App\Models\Tag;
use App\Services\TransactionService;
use App\Http\Requests\StoreTransactionRequest;
use App\Http\Requests\UpdateTransactionRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class TransactionController extends Controller
{
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

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->inDateRange($request->start_date, $request->end_date);
        }

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
            'filters' => $request->only(['type', 'start_date', 'end_date', 'tag', 'search']),
            'userTags' => $userTags,
            'heatmapData' => $heatmapData,
            'heatmapMonth' => $heatmapMonth,
        ]);
    }

    public function store(StoreTransactionRequest $request)
    {
        $userId = $request->user()->id;
        $validated = $request->validated();

        try {
            $transactions = $this->transactionService->createTransactions(
            [$validated],
                $request->user()->id,
                $validated['wallet_id']
            );

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
