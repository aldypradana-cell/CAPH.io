<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\GoldPurchase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class AssetController extends Controller
{
    public function index(Request $request)
    {
        $assets = Asset::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();

        $summary = [
            'totalValue' => $assets->sum('value'),
            'byType' => $assets->groupBy('type')->map(fn($group) => [
                'count' => $group->count(),
                'value' => $group->sum('value'),
            ])->toArray(),
        ];

        $goldPurchases = GoldPurchase::where('user_id', $request->user()->id)
            ->orderBy('purchased_at', 'desc')
            ->orderBy('id', 'desc')
            ->get();
            
        $goldPriceToday = (float) Cache::get('gold_price_today_' . $request->user()->id, 1400000);

        // Calculate Grand Total Net Worth
        $totalGoldGrams = $goldPurchases->sum('grams');
        $totalGoldValue = $totalGoldGrams * $goldPriceToday;
        $grandTotalValue = $summary['totalValue'] + $totalGoldValue;

        $wallets = \App\Models\Wallet::where('user_id', $request->user()->id)->get();

        return Inertia::render('Assets/Index', [
            'assets' => $assets,
            'summary' => $summary,
            'goldPurchases' => $goldPurchases,
            'goldPriceToday' => $goldPriceToday,
            'grandTotalValue' => $grandTotalValue,
            'wallets' => $wallets,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'value' => 'required|numeric|min:0',
            'type' => 'required|in:GOLD,STOCK,CRYPTO,PROPERTY,VEHICLE,INVESTMENT,OTHER',
        ]);

        Asset::create([
            'user_id' => $request->user()->id,
            ...$validated,
        ]);

        return redirect()->back()->with('success', 'Aset berhasil ditambahkan');
    }

    public function update(Request $request, Asset $asset)
    {
        if ($request->user()->cannot('update', $asset)) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'value' => 'required|numeric|min:0',
            'type' => 'required|in:GOLD,STOCK,CRYPTO,PROPERTY,VEHICLE,INVESTMENT,OTHER',
        ]);

        $asset->update($validated);

        return redirect()->back()->with('success', 'Aset berhasil diupdate');
    }

    public function destroy(Request $request, Asset $asset)
    {
        if ($request->user()->cannot('delete', $asset)) {
            abort(403);
        }

        $asset->delete();

        return redirect()->back()->with('success', 'Aset berhasil dihapus');
    }
}
