<?php

namespace App\Http\Controllers;

use App\Models\Wallet;
use App\Models\Category;
use App\Models\Tag;
use App\Services\GroqService;
use App\Services\TransactionService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class SmartEntryController extends Controller
{
    protected $groqService;
    protected $transactionService;

    public function __construct(GroqService $groqService, TransactionService $transactionService)
    {
        $this->groqService = $groqService;
        $this->transactionService = $transactionService;
    }

    public function index(Request $request)
    {
        $wallets = Wallet::where('user_id', $request->user()->id)->get();
        $categories = Category::userCategories($request->user()->id)->get();
        
        return Inertia::render('SmartEntry/Index', [
            'wallets' => $wallets,
            'categories' => $categories,
        ]);
    }

    public function parse(Request $request)
    {
        $validated = $request->validate([
            'input' => 'required|string|min:5',
        ]);
        
        try {
            $parsedTransactions = $this->groqService->parseNaturalLanguageTransaction($validated['input']);
            
            // Ensure each transaction has a tags array
            $parsedTransactions = array_map(function ($t) {
                $t['tags'] = $t['tags'] ?? [];
                return $t;
            }, $parsedTransactions);

            return response()->json([
                'success' => true,
                'transactions' => $parsedTransactions,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function confirm(Request $request)
    {
        $validated = $request->validate([
            'transactions' => 'required|array|min:1',
            'transactions.*.description' => 'required|string',
            'transactions.*.amount' => 'required|numeric|min:0',
            'transactions.*.type' => 'required|in:INCOME,EXPENSE',
            'transactions.*.category' => 'required|string',
            'transactions.*.date' => 'required|date',
            'transactions.*.tags' => 'nullable|array',
            'transactions.*.tags.*' => 'string|max:50',
            'wallet_id' => 'required|exists:wallets,id',
        ]);
        
        $userId = $request->user()->id;

        // Extract tags per transaction before creating (since createTransactions doesn't handle tags)
        $tagsPerTransaction = [];
        foreach ($validated['transactions'] as $idx => $txData) {
            $tagsPerTransaction[$idx] = $txData['tags'] ?? [];
        }

        $newTransactions = $this->transactionService->createTransactions(
            $validated['transactions'],
            $userId,
            $validated['wallet_id']
        );
        
        // Sync tags for each created transaction
        foreach ($newTransactions as $idx => $transaction) {
            $tagNames = $tagsPerTransaction[$idx] ?? [];
            if (!empty($tagNames)) {
                $tagIds = Tag::resolveIds($tagNames, $userId);
                $transaction->tags()->sync($tagIds);
            }
        }
        
        return redirect()->route('dashboard')->with('success', 'Transaksi AI berhasil disimpan!');
    }


}
