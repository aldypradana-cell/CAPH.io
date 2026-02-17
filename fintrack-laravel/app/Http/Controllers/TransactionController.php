<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\Wallet;
use App\Models\Category;
use App\Models\Tag;
use App\Services\TransactionService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
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
        
        $wallets = Wallet::where('user_id', $user->id)->get();
        $categories = Category::userCategories($user->id)->get();
        $userTags = Tag::where('user_id', $user->id)->orderBy('name')->get();
        
        return Inertia::render('Transactions/Index', [
            'transactions' => $transactions,
            'wallets' => $wallets,
            'categories' => $categories,
            'filters' => $request->only(['type', 'start_date', 'end_date', 'tag', 'search']),
            'userTags' => $userTags,
        ]);
    }

    public function store(Request $request)
    {
        $userId = $request->user()->id;
        
        $validated = $request->validate([
            'wallet_id' => ['required', Rule::exists('wallets', 'id')->where('user_id', $userId)],
            'to_wallet_id' => ['nullable', Rule::exists('wallets', 'id')->where('user_id', $userId)],
            'date' => 'required|date',
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'type' => 'required|in:INCOME,EXPENSE,TRANSFER',
            'category' => 'required|string',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
        ]);
        
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

    public function update(Request $request, Transaction $transaction)
    {
        // Authorization check
        if ($transaction->user_id !== $request->user()->id) {
            abort(403);
        }
        
        $userId = $request->user()->id;

        $validated = $request->validate([
            'wallet_id' => ['required', Rule::exists('wallets', 'id')->where('user_id', $userId)],
            'to_wallet_id' => ['nullable', Rule::exists('wallets', 'id')->where('user_id', $userId)],
            'date' => 'required|date',
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'type' => 'required|in:INCOME,EXPENSE,TRANSFER',
            'category' => 'required|string',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
        ]);
        
        $this->transactionService->updateTransaction($transaction, $validated);
        
        // Sync tags after updating the transaction
        $tagIds = Tag::resolveIds($validated['tags'] ?? [], $userId);
        $transaction->tags()->sync($tagIds);
        
        return redirect()->back()->with('success', 'Transaksi berhasil diupdate');
    }

    public function destroy(Request $request, Transaction $transaction)
    {
        // Authorization check
        if ($transaction->user_id !== $request->user()->id) {
            abort(403);
        }
        
        $this->transactionService->deleteTransaction($transaction);
        
        return redirect()->back()->with('success', 'Transaksi berhasil dihapus');
    }


}
