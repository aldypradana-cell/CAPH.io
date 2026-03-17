<?php

namespace App\Http\Middleware;

use App\Models\Transaction;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'flash' => [
                'success' => fn() => $request->session()->get('success'),
                'error' => fn() => $request->session()->get('error'),
            ],
            'ziggy' => fn() => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'onboarding' => fn() => $request->user() ? (function () use ($request) {
                $user = $request->user();
                $allWallets = Wallet::where('user_id', $user->id)->get();
                $hasWallet = $allWallets->count() > 0;
                $hasInitialBalance = ((float) $allWallets->sum('balance')) > 0;
                $hasFirstTransaction = Transaction::forUser($user->id)->exists();
                $completedSetupSteps = collect([$hasWallet, $hasInitialBalance, $hasFirstTransaction])->filter()->count();

                return [
                    'show' => !($hasWallet && $hasInitialBalance && $hasFirstTransaction),
                    'completedSteps' => $completedSetupSteps,
                    'progressPercent' => (int) round(($completedSetupSteps / 3) * 100),
                    'steps' => [
                        [
                            'key' => 'wallet',
                            'title' => 'Buat wallet pertama',
                            'description' => 'Tempat menyimpan saldo utama Anda.',
                            'completed' => $hasWallet,
                            'active' => !$hasWallet,
                            'href' => route('wallets.index'),
                            'actionLabel' => 'Buat Wallet',
                        ],
                        [
                            'key' => 'balance',
                            'title' => 'Tambahkan saldo awal',
                            'description' => 'Isi jumlah saldo yang Anda miliki saat ini.',
                            'completed' => $hasInitialBalance,
                            'active' => $hasWallet && !$hasInitialBalance,
                            'href' => route('wallets.index'),
                            'actionLabel' => 'Isi Saldo',
                        ],
                        [
                            'key' => 'transaction',
                            'title' => 'Catat transaksi pertama',
                            'description' => 'Mulai dengan satu pemasukan atau pengeluaran.',
                            'completed' => $hasFirstTransaction,
                            'active' => $hasWallet && $hasInitialBalance && !$hasFirstTransaction,
                            'href' => route('dashboard', ['action' => 'add-transaction']),
                            'actionLabel' => 'Tambah Transaksi',
                        ],
                    ],
                ];
            })() : null,
        ];
    }
}
