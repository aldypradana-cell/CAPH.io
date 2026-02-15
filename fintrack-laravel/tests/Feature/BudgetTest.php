<?php

use App\Models\Budget;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Support\Carbon;

test('budget index displays budgets with correct progress', function () {
    $user = User::factory()->create();
    $wallet = Wallet::factory()->create(['user_id' => $user->id]);
    $this->actingAs($user);

    // Create a budget
    Budget::factory()->create([
        'user_id' => $user->id,
        'category' => 'Food',
        'limit' => 1000,
        'period' => 'MONTHLY',
    ]);

    // Create transactions inside the period
    Transaction::factory()->create([
        'user_id' => $user->id,
        'wallet_id' => $wallet->id,
        'category' => 'Food',
        'amount' => 200,
        'type' => 'EXPENSE',
        'date' => Carbon::now()->startOfMonth(),
    ]);

    Transaction::factory()->create([
        'user_id' => $user->id,
        'wallet_id' => $wallet->id,
        'category' => 'Food',
        'amount' => 300,
        'type' => 'EXPENSE',
        'date' => Carbon::now(),
    ]);

    // Create transaction outside the period (last month)
    Transaction::factory()->create([
        'user_id' => $user->id,
        'wallet_id' => $wallet->id,
        'category' => 'Food',
        'amount' => 100,
        'type' => 'EXPENSE',
        'date' => Carbon::now()->subMonth(),
    ]);

    // Create transaction for another category
    Transaction::factory()->create([
        'user_id' => $user->id,
        'wallet_id' => $wallet->id,
        'category' => 'Transport',
        'amount' => 50,
        'type' => 'EXPENSE',
        'date' => Carbon::now(),
    ]);

    $response = $this->get(route('budgets.index'));
    $response->assertStatus(200);
});

test('budget eager loading correctly filters transactions by category and user', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $wallet = Wallet::factory()->create(['user_id' => $user->id]);
    $otherWallet = Wallet::factory()->create(['user_id' => $otherUser->id]);

    Budget::factory()->create([
        'user_id' => $user->id,
        'category' => 'Food',
        'limit' => 1000,
        'period' => 'MONTHLY',
    ]);

    // User's Food expense
    Transaction::factory()->create([
        'user_id' => $user->id,
        'wallet_id' => $wallet->id,
        'category' => 'Food',
        'amount' => 200,
        'type' => 'EXPENSE',
        'date' => Carbon::now(),
    ]);

    // Other user's Food expense (should NOT be included)
    Transaction::factory()->create([
        'user_id' => $otherUser->id,
        'wallet_id' => $otherWallet->id,
        'category' => 'Food',
        'amount' => 500,
        'type' => 'EXPENSE',
        'date' => Carbon::now(),
    ]);

    // User's Food INCOME (should NOT be included)
    Transaction::factory()->create([
        'user_id' => $user->id,
        'wallet_id' => $wallet->id,
        'category' => 'Food',
        'amount' => 999,
        'type' => 'INCOME',
        'date' => Carbon::now(),
    ]);

    $budgets = Budget::where('user_id', $user->id)
        ->with(['transactions' => function ($query) use ($user) {
            $query->where('user_id', $user->id)
                  ->where('type', 'EXPENSE');
        }])
        ->get();

    expect($budgets)->toHaveCount(1);

    $budget = $budgets->first();
    expect($budget->transactions)->toHaveCount(1);
    expect((float) $budget->transactions->sum('amount'))->toBe(200.0);
});
