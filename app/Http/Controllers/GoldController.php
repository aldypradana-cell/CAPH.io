<?php

namespace App\Http\Controllers;

use App\Models\GoldPurchase;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Cache;

class GoldController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'grams' => 'required|numeric|min:0.001',
            'price_per_gram' => 'required|numeric|min:0',
            'purchased_at' => 'required|date',
            'notes' => 'nullable|string|max:1000',
        ]);

        GoldPurchase::create([
            'user_id' => $request->user()->id,
            ...$validated,
        ]);

        return redirect()->back()->with('success', 'Riwayat pembelian emas berhasil ditambahkan');
    }

    public function update(Request $request, GoldPurchase $gold)
    {
        if ($request->user()->id !== $gold->user_id) {
            abort(403);
        }

        $validated = $request->validate([
            'grams' => 'required|numeric|min:0.001',
            'price_per_gram' => 'required|numeric|min:0',
            'purchased_at' => 'required|date',
            'notes' => 'nullable|string|max:1000',
        ]);

        $gold->update($validated);

        return redirect()->back()->with('success', 'Riwayat pembelian emas berhasil diupdate');
    }

    public function destroy(Request $request, GoldPurchase $gold)
    {
        if ($request->user()->id !== $gold->user_id) {
            abort(403);
        }

        $gold->delete();

        return redirect()->back()->with('success', 'Riwayat pembelian emas berhasil dihapus');
    }

    public function updatePrice(Request $request)
    {
        $validated = $request->validate([
            'price' => 'required|numeric|min:0',
        ]);

        Cache::put('gold_price_today_' . $request->user()->id, $validated['price'], now()->addDays(30));

        return redirect()->back()->with('success', 'Harga emas hari ini berhasil diupdate');
    }
}
