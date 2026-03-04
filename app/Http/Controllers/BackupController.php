<?php

declare(strict_types = 1)
;

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\Wallet;
use App\Models\Budget;
use App\Models\Debt;
use App\Models\RecurringTransaction;
use App\Models\Category;
use App\Models\Asset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class BackupController extends Controller
{
    /**
     * Download a full JSON backup of all user data.
     */
    public function download(Request $request)
    {
        $user = $request->user();

        $data = [
            'meta' => [
                'version' => '2.0',
                'app' => 'CAPH.io',
                'exported_at' => now()->toIso8601String(),
                'exported_by' => $user->email,
                'user_name' => $user->name,
            ],
            'wallets' => Wallet::where('user_id', $user->id)->get()->toArray(),
            'categories' => Category::where('user_id', $user->id)->get()->toArray(),
            'transactions' => Transaction::where('user_id', $user->id)->with(['tags'])->get()->toArray(),
            'budgets' => Budget::where('user_id', $user->id)->get()->toArray(),
            'debts' => Debt::where('user_id', $user->id)->get()->toArray(),
            'recurring' => RecurringTransaction::where('user_id', $user->id)->get()->toArray(),
            'assets' => Asset::where('user_id', $user->id)->get()->toArray(),
        ];

        $filename = 'CAPH_Backup_' . now()->format('d-m-Y') . '.json';

        return response()->json($data)
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"')
            ->header('Content-Type', 'application/json');
    }

    /**
     * Restore user data from a JSON backup file.
     * This will REPLACE all existing user data with the backup contents.
     */
    public function restore(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:json|max:10240', // max 10MB
        ]);

        $user = $request->user();

        try {
            $content = file_get_contents($request->file('file')->getRealPath());
            $data = json_decode($content, true, 512, JSON_THROW_ON_ERROR);
        }
        catch (\JsonException $e) {
            return response()->json(['message' => 'File backup tidak valid atau rusak.'], 422);
        }

        // Validate minimum structure
        if (!isset($data['meta'], $data['transactions'], $data['wallets'])) {
            return response()->json(['message' => 'Format file backup tidak dikenali. Gunakan file dari CAPH.io.'], 422);
        }

        // Validate Ownership
        if (isset($data['meta']['exported_by']) && $data['meta']['exported_by'] !== $user->email) {
            return response()->json(['message' => 'File backup ini milik pengguna lain (' . $data['meta']['exported_by'] . ') dan tidak dapat dipulihkan ke akun Anda.'], 403);
        }

        DB::beginTransaction();

        try {
            // -- Wipe existing data for the user --
            // Use forceDelete() for SoftDeletes models to truly remove records
            Transaction::withTrashed()->where('user_id', $user->id)->forceDelete();
            Wallet::where('user_id', $user->id)->delete();
            Budget::withTrashed()->where('user_id', $user->id)->forceDelete();
            Debt::withTrashed()->where('user_id', $user->id)->forceDelete();
            RecurringTransaction::where('user_id', $user->id)->delete();
            Category::where('user_id', $user->id)->delete();
            Asset::where('user_id', $user->id)->delete();

            // -- Restore wallets (and map old IDs to new IDs) --
            $walletIdMap = [];
            foreach ($data['wallets'] ?? [] as $walletData) {
                $oldId = $walletData['id'] ?? null;
                $cleanData = \Illuminate\Support\Arr::only($walletData, ['name', 'type', 'balance']);
                $cleanData['user_id'] = $user->id;
                $newWallet = Wallet::create($cleanData);
                if ($oldId) {
                    $walletIdMap[$oldId] = $newWallet->id;
                }
            }

            // -- Restore transactions (remap wallet_id) --
            foreach ($data['transactions'] ?? [] as $txData) {
                $cleanData = \Illuminate\Support\Arr::only($txData, ['to_wallet_id', 'date', 'description', 'amount', 'type', 'category', 'is_flagged']);
                $cleanData['user_id'] = $user->id;
                $cleanData['wallet_id'] = $walletIdMap[$txData['wallet_id'] ?? ''] ?? null;
                Transaction::create($cleanData);
            }

            // -- Restore budgets --
            foreach ($data['budgets'] ?? [] as $budgetData) {
                $cleanData = \Illuminate\Support\Arr::only($budgetData, ['category', 'limit', 'period', 'frequency', 'is_master']);
                $cleanData['user_id'] = $user->id;
                Budget::create($cleanData);
            }

            // -- Restore debts --
            foreach ($data['debts'] ?? [] as $debtData) {
                $cleanData = \Illuminate\Support\Arr::only($debtData, ['type', 'person', 'amount', 'description', 'due_date', 'is_paid']);
                $cleanData['user_id'] = $user->id;
                Debt::create($cleanData);
            }

            // -- Restore recurring transactions (remap wallet_id) --
            foreach ($data['recurring'] ?? [] as $recData) {
                $cleanData = \Illuminate\Support\Arr::only($recData, ['name', 'amount', 'type', 'category', 'frequency', 'start_date', 'next_run_date', 'auto_cut', 'is_active', 'description']);
                $cleanData['user_id'] = $user->id;
                $cleanData['wallet_id'] = $walletIdMap[$recData['wallet_id'] ?? ''] ?? null;
                RecurringTransaction::create($cleanData);
            }

            // -- Restore categories --
            foreach ($data['categories'] ?? [] as $catData) {
                $cleanData = \Illuminate\Support\Arr::only($catData, ['name', 'type', 'is_default', 'budget_rule']);
                $cleanData['user_id'] = $user->id;
                Category::create($cleanData);
            }

            // -- Restore assets --
            foreach ($data['assets'] ?? [] as $assetData) {
                $cleanData = \Illuminate\Support\Arr::only($assetData, ['name', 'value', 'type']);
                $cleanData['user_id'] = $user->id;
                Asset::create($cleanData);
            }

            DB::commit();

            return response()->json([
                'message' => 'Data berhasil dipulihkan dari backup ' . ($data['meta']['exported_at'] ?? '-'),
                'restored' => [
                    'wallets' => count($data['wallets'] ?? []),
                    'transactions' => count($data['transactions'] ?? []),
                    'budgets' => count($data['budgets'] ?? []),
                    'debts' => count($data['debts'] ?? []),
                    'recurring' => count($data['recurring'] ?? []),
                    'assets' => count($data['assets'] ?? []),
                ],
            ]);
        }
        catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Restore failed for user ' . $user->id, ['error' => $e->getMessage()]);

            return response()->json(['message' => 'Restore gagal. Silakan coba lagi atau hubungi support.'], 500);
        }
    }
}
