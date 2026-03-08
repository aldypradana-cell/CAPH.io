<?php

namespace App\Traits;

use App\Models\Transaction;
use Illuminate\Support\Facades\DB;

/**
 * Trait HasTransactionSuggestions
 *
 * Menyediakan method untuk mengambil saran deskripsi transaksi
 * berdasarkan histori transaksi user yang paling sering digunakan.
 *
 * Data yang dikembalikan sudah dikelompokkan per kategori,
 * dan dibatasi agar tetap ringan (maks 15 per kategori).
 */
trait HasTransactionSuggestions
{
    /**
     * Mengambil daftar saran deskripsi transaksi yang paling populer per kategori.
     *
     * @param int $userId
     * @param int $limitPerCategory Jumlah saran maksimal per kategori (default: 15)
     * @return array<string, string[]> Format: { "Makan & Minum": ["Kopi Kenangan", "Nasi Goreng", ...], ... }
     */
    protected function getTransactionSuggestions(int $userId, int $limitPerCategory = 15): array
    {
        // Mengambil deskripsi unik yang paling sering digunakan per kategori.
        // Menggunakan raw SQL untuk efisiensi GROUP BY + COUNT.
        $rows = DB::table('transactions')
            ->select('category', 'description', DB::raw('COUNT(*) as frequency'))
            ->where('user_id', $userId)
            ->whereIn('type', ['INCOME', 'EXPENSE'])
            ->whereNull('deleted_at')
            ->groupBy('category', 'description')
            ->orderByDesc('frequency')
            ->get();

        // Kelompokkan per kategori dan batasi per kategori
        $suggestions = [];
        $countPerCategory = [];

        foreach ($rows as $row) {
            $cat = $row->category;
            if (!isset($countPerCategory[$cat])) {
                $countPerCategory[$cat] = 0;
            }

            if ($countPerCategory[$cat] < $limitPerCategory) {
                $suggestions[$cat][] = $row->description;
                $countPerCategory[$cat]++;
            }
        }

        return $suggestions;
    }
}
