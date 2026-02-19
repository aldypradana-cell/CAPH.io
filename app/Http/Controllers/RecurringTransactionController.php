<?php

namespace App\Http\Controllers;

use App\Models\RecurringTransaction;
use App\Models\Wallet;
use App\Models\Category;
use App\Services\TransactionService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Illuminate\Support\Carbon;

class RecurringTransactionController extends Controller
{
    protected $transactionService;

    public function __construct(TransactionService $transactionService)
    {
        $this->transactionService = $transactionService;
    }



    public function store(Request $request)
    {
        $userId = $request->user()->id;

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'wallet_id' => ['required', Rule::exists('wallets', 'id')->where('user_id', $userId)],
            'type' => 'required|in:INCOME,EXPENSE,TRANSFER',
            'category' => 'required|string',
            'frequency' => 'required|in:DAILY,WEEKLY,MONTHLY,YEARLY',
            'start_date' => 'required|date',
            'auto_cut' => 'boolean',
            'description' => 'nullable|string',
        ]);

        $validated['user_id'] = $userId;
        $validated['next_run_date'] = $validated['start_date'];
        $validated['is_active'] = true;

        RecurringTransaction::create($validated);

        return redirect()->back()->with('success', 'Jadwal transaksi berhasil dibuat');
    }

    public function update(Request $request, RecurringTransaction $recurring)
    {
        if ($recurring->user_id !== $request->user()->id) {
            abort(403);
        }

        $userId = $request->user()->id;

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'wallet_id' => ['required', Rule::exists('wallets', 'id')->where('user_id', $userId)],
            'type' => 'required|in:INCOME,EXPENSE,TRANSFER',
            'category' => 'required|string',
            'frequency' => 'required|in:DAILY,WEEKLY,MONTHLY,YEARLY',
            'start_date' => 'required|date',
            'next_run_date' => 'required|date',
            'auto_cut' => 'boolean',
            'is_active' => 'boolean',
            'description' => 'nullable|string',
        ]);

        $recurring->update($validated);

        return redirect()->back()->with('success', 'Jadwal transaksi berhasil diperbarui');
    }

    public function destroy(Request $request, RecurringTransaction $recurring)
    {
        if ($recurring->user_id !== $request->user()->id) {
            abort(403);
        }

        $recurring->delete();

        return redirect()->back()->with('success', 'Jadwal transaksi berhasil dihapus');
    }

    /**
     * Return recurring transactions as JSON for the dashboard widget.
     */
    public function dashboardWidget(Request $request)
    {
        $user = $request->user();

        $recurring = RecurringTransaction::where('user_id', $user->id)
            ->where('is_active', true)
            ->orderBy('next_run_date', 'asc')
            ->take(5)
            ->get(['id', 'name', 'amount', 'next_run_date', 'frequency', 'type', 'category']);

        return response()->json($recurring);
    }

    /**
     * Process a manual recurring transaction (turn it into a real transaction)
     */
    public function process(Request $request, RecurringTransaction $recurring)
    {
        if ($recurring->user_id !== $request->user()->id) {
            abort(403);
        }

        // Validate override values (user might change amount or wallet at the last minute)
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'wallet_id' => ['required', Rule::exists('wallets', 'id')->where('user_id', $request->user()->id)],
            'date' => 'required|date', // Allow user to set the actual payment date
        ]);

        // Create the real transaction
        $this->transactionService->createTransactions(
        [[
                'wallet_id' => $validated['wallet_id'],
                'amount' => $validated['amount'],
                'type' => $recurring->type,
                'category' => $recurring->category,
                'description' => $recurring->name . ' (Recurring)',
                'date' => $validated['date'],
            ]],
            $request->user()->id,
            $validated['wallet_id']
        );

        // Update the next run date
        // Calculate next run date based on the *current* next_run_date to maintain schedule
        // OR based on the payment date? Usually schedule is better.
        // If users pay late, the next bill should still be on the original schedule?
        // Let's stick to the original schedule logic from the model.

        $recurring->next_run_date = $recurring->calculateNextRunDate();
        $recurring->save();

        return redirect()->back()->with('success', 'Transaksi berhasil diproses');
    }
}
