<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\Wallet;
use App\Models\Category;
use App\Services\TransactionService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
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
            ->with(['wallet', 'toWallet'])
            ->orderBy('date', 'desc');
        
        // Apply filters
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }
        
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->inDateRange($request->start_date, $request->end_date);
        }
        
        $transactions = $query->paginate(20);
        
        $wallets = Wallet::where('user_id', $user->id)->get();
        $categories = Category::userCategories($user->id)->get();
        
        return Inertia::render('Transactions/Index', [
            'transactions' => $transactions,
            'wallets' => $wallets,
            'categories' => $categories,
            'filters' => $request->only(['type', 'start_date', 'end_date']),
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
        ]);
        
        $this->transactionService->createTransactions(
            [$validated],
            $request->user()->id,
            $validated['wallet_id']
        );
        
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
        ]);
        
        $this->transactionService->updateTransaction($transaction, $validated);
        
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
