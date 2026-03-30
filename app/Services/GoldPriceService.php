<?php

namespace App\Services;

use App\Models\GoldPriceCache;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class GoldPriceService
{
    const SOURCE_URL = 'https://www.logammulia.com/id/harga-emas-hari-ini';
    const COOLDOWN_MINUTES = 60;

    /**
     * Scrape logammulia.com and store the result in the DB.
     * Returns the price per gram (float) or null on failure.
     */
    public function fetchAndStore(): ?float
    {
        $html = $this->fetchHtml(self::SOURCE_URL);
        if (!$html) {
            Log::warning('[GoldPriceService] Failed to fetch HTML from logammulia.com');
            return null;
        }

        $price = $this->parsePrice($html);
        if (!$price) {
            Log::warning('[GoldPriceService] Could not parse gold price from HTML');
            return null;
        }

        GoldPriceCache::updateOrCreate(
            ['date' => now()->toDateString()],
            [
                'price_per_gram' => $price,
                'source_url' => self::SOURCE_URL,
                'last_fetched_at' => now(),
            ]
        );

        Log::info("[GoldPriceService] Gold price fetched: Rp " . number_format($price, 0, ',', '.') . "/gr");
        return $price;
    }

    /**
     * Get latest cached price record from DB.
     */
    public function getLatest(): ?GoldPriceCache
    {
        return GoldPriceCache::orderByDesc('date')->first();
    }

    /**
     * Check if a refresh is allowed (respects cooldown).
     */
    public function canRefresh(): bool
    {
        $latest = $this->getLatest();
        if (!$latest || !$latest->last_fetched_at) {
            return true;
        }
        return $latest->last_fetched_at->lt(now()->subMinutes(self::COOLDOWN_MINUTES));
    }

    /**
     * Fetch HTML from the given URL via cURL.
     */
    private function fetchHtml(string $url): ?string
    {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_TIMEOUT => 20,
            CURLOPT_ENCODING => '', // auto-decode gzip
            CURLOPT_HTTPHEADER => [
                'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language: id-ID,id;q=0.9,en-US;q=0.8',
                'Cache-Control: no-cache',
            ],
        ]);
        $html = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        // Note: curl_close() is deprecated in PHP 8.5+ but safe to keep for compatibility
        @curl_close($ch);

        if ($httpCode !== 200 || !$html) {
            return null;
        }
        return $html;
    }

    /**
     * Parse the 1-gram gold price from the HTML table on logammulia.com.
     */
    private function parsePrice(string $html): ?float
    {
        $dom = new \DOMDocument();
        @$dom->loadHTML($html);
        $xpath = new \DOMXPath($dom);

        // The first table with class 'table table-bordered' contains gold prices.
        // Row structure: Col0=Weight, Col1=Base price, Col2=Price+Tax
        // We look for the '1 gr' row and return Col1 (price before tax).
        $rows = $xpath->query('//table[contains(@class,"table-bordered")]//tr');
        foreach ($rows as $row) {
            $cells = $xpath->query('.//td', $row);
            if ($cells->length < 2) {
                continue;
            }
            $weightText = trim($cells->item(0)->textContent ?? '');
            // Match '1 gr' exactly
            if (preg_match('/^\s*1\s*gr\s*$/i', $weightText)) {
                $priceText = trim($cells->item(1)->textContent ?? '');
                // Remove thousands separator (.), keep only digits
                $priceClean = preg_replace('/[^\d]/', '', $priceText);
                if ($priceClean && is_numeric($priceClean)) {
                    return (float) $priceClean;
                }
            }
        }

        return null;
    }
}
