<?php

namespace App\Http\Controllers;

use App\Models\Wallet;
use App\Models\Category;
use App\Models\Tag;
use App\Models\AiUsageLog;
use App\Services\GroqService;
use App\Services\TransactionService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
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
        $user    = $request->user();
        $wallets = Wallet::where('user_id', $user->id)->get();
        $categories = Category::userCategories($user->id)->get();

        $usedToday = AiUsageLog::where('user_id', $user->id)
            ->where('feature', 'smart_entry')
            ->where('used_at', '>=', Carbon::today())
            ->count();

        return Inertia::render('SmartEntry/Index', [
            'wallets'    => $wallets,
            'categories' => $categories,
            'aiQuota'    => [
                'used'     => $usedToday,
                'limit'    => $user->smart_entry_limit,
                'resetsAt' => Carbon::tomorrow()->startOfDay()->toIso8601String(),
            ],
        ]);
    }

    public function parse(Request $request)
    {
        $user = $request->user();

        // Check per-user daily quota
        $usedToday = AiUsageLog::where('user_id', $user->id)
            ->where('feature', 'smart_entry')
            ->where('used_at', '>=', Carbon::today())
            ->count();

        if ($usedToday >= $user->smart_entry_limit) {
            return response()->json([
                'success'  => false,
                'quota'    => true,
                'message'  => 'Kuota Smart Entry Anda hari ini sudah habis.',
                'used'     => $usedToday,
                'limit'    => $user->smart_entry_limit,
                'resetsAt' => Carbon::tomorrow()->startOfDay()->toIso8601String(),
            ], 429);
        }

        $validated = $request->validate([
            'input' => 'required|string|min:5|max:1000',
        ]);

        try {
            $parsedTransactions = $this->groqService->parseNaturalLanguageTransaction($validated['input']);

            // Ensure each transaction has a tags array
            $parsedTransactions = array_map(function ($t) {
                $t['tags'] = $t['tags'] ?? [];
                return $t;
            }, $parsedTransactions);

            // Log successful usage
            AiUsageLog::create([
                'user_id' => $user->id,
                'feature' => 'smart_entry',
                'used_at' => now(),
            ]);

            return response()->json([
                'success'      => true,
                'transactions' => $parsedTransactions,
                'quota'        => [
                    'used'     => $usedToday + 1,
                    'limit'    => $user->smart_entry_limit,
                    'resetsAt' => Carbon::tomorrow()->startOfDay()->toIso8601String(),
                ],
            ]);
        }
        catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function confirm(Request $request)
    {
        $validated = $request->validate([
            'transactions' => 'required|array|min:1|max:20',
            'transactions.*.description' => 'required|string',
            'transactions.*.amount' => 'required|numeric|min:1',
            'transactions.*.type' => 'required|in:INCOME,EXPENSE',
            'transactions.*.category' => 'required|string',
            'transactions.*.date' => 'required|date',
            'transactions.*.tags' => 'nullable|array',
            'transactions.*.tags.*' => 'string|max:50',
            'wallet_id' => ['required', \Illuminate\Validation\Rule::exists('wallets', 'id')->where('user_id', $request->user()->id)],
        ]);

        $userId = $request->user()->id;

        // Extract tags per transaction before creating (since createTransactions doesn't handle tags)
        $tagsPerTransaction = [];
        foreach ($validated['transactions'] as $idx => $txData) {
            $tagsPerTransaction[$idx] = $txData['tags'] ?? [];
        }

        try {
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
        catch (\Exception $e) {
            return redirect()->back()->withErrors(['message' => $e->getMessage()]);
        }
    }


}
