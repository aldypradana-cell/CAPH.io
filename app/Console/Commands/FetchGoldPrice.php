<?php

namespace App\Console\Commands;

use App\Services\GoldPriceService;
use Illuminate\Console\Command;

class FetchGoldPrice extends Command
{
    protected $signature = 'gold:fetch-price';
    protected $description = 'Fetch and cache the daily Antam gold price from logammulia.com';

    public function handle(GoldPriceService $service): int
    {
        $this->info('Fetching Antam gold price from logammulia.com...');

        $price = $service->fetchAndStore();

        if ($price) {
            $this->info('✓ Gold price fetched: Rp ' . number_format($price, 0, ',', '.') . '/gr');
            return self::SUCCESS;
        }

        $this->error('✗ Failed to fetch gold price. Check logs for details.');
        return self::FAILURE;
    }
}
