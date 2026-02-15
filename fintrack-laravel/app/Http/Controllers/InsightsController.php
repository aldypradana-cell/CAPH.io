<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Services\GeminiService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InsightsController extends Controller
{
    protected $geminiService;

    public function __construct(GeminiService $geminiService)
    {
        $this->geminiService = $geminiService;
    }

    public function index(Request $request)
    {
        $user = $request->user();

        $transactions = Transaction::forUser($user->id)
            ->orderBy('date', 'desc')
            ->take(100)
            ->get();

        return Inertia::render('Insights/Index', [
            'transactionCount' => $transactions->count(),
            'hasProfile' => !empty($user->financial_profile),
        ]);
    }

    /**
     * Generate AI financial advice
     */
    public function generate(Request $request)
    {
        $user = $request->user();

        $transactions = Transaction::forUser($user->id)
            ->orderBy('date', 'desc')
            ->take(100)
            ->get();

        if ($transactions->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Belum ada transaksi untuk dianalisis. Tambahkan beberapa transaksi terlebih dahulu.',
            ], 422);
        }

        try {
            $advice = $this->geminiService->getFinancialAdvice($user, $transactions);

            return response()->json([
                'success' => true,
                'insight' => $advice,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghasilkan analisis. ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update user financial profile
     */
    public function updateProfile(Request $request)
    {
        $validated = $request->validate([
            'maritalStatus' => 'required|in:SINGLE,MARRIED',
            'dependents' => 'required|integer|min:0',
            'occupation' => 'required|in:STABLE,PRIVATE,FREELANCE',
            'goals' => 'nullable|array',
            'goals.*.name' => 'required|string',
            'goals.*.amount' => 'required|numeric|min:0',
            'goals.*.deadline' => 'required|string',
        ]);

        $request->user()->update([
            'financial_profile' => $validated,
        ]);

        return redirect()->back()->with('success', 'Profil finansial berhasil diupdate');
    }
}
