<?php

namespace Tests\Feature;

use App\Models\Asset;
use App\Models\Budget;
use App\Models\Debt;
use App\Models\RecurringTransaction;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature Tests untuk Laravel Policies Authorization
 *
 * Menguji bahwa setiap resource HANYA bisa diakses oleh pemiliknya.
 * Jika user lain mencoba mengakses, harus mendapat 403 Forbidden.
 */
class PolicyAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    // ═══════════════════════════════════════════════════════
    // WALLET POLICY TESTS
    // ═══════════════════════════════════════════════════════

    public function test_user_can_update_own_wallet(): void
    {
        $user   = User::factory()->create();
        $wallet = Wallet::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->put(route('wallets.update', $wallet), [
            'name'    => 'Updated Name',
            'type'    => 'CASH',
            'balance' => 100000,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('wallets', ['id' => $wallet->id, 'name' => 'Updated Name']);
    }

    public function test_user_cannot_update_other_users_wallet(): void
    {
        $owner  = User::factory()->create();
        $hacker = User::factory()->create();
        $wallet = Wallet::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($hacker)->put(route('wallets.update', $wallet), [
            'name'    => 'Hacked!',
            'type'    => 'CASH',
            'balance' => 0,
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseMissing('wallets', ['id' => $wallet->id, 'name' => 'Hacked!']);
    }

    public function test_user_can_delete_own_wallet(): void
    {
        $user   = User::factory()->create();
        $wallet = Wallet::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->delete(route('wallets.destroy', $wallet));

        $response->assertRedirect();
        $this->assertDatabaseMissing('wallets', ['id' => $wallet->id]);
    }

    public function test_user_cannot_delete_other_users_wallet(): void
    {
        $owner  = User::factory()->create();
        $hacker = User::factory()->create();
        $wallet = Wallet::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($hacker)->delete(route('wallets.destroy', $wallet));

        $response->assertStatus(403);
        $this->assertDatabaseHas('wallets', ['id' => $wallet->id]);
    }

    // ═══════════════════════════════════════════════════════
    // TRANSACTION POLICY TESTS
    // ═══════════════════════════════════════════════════════

    public function test_user_cannot_update_other_users_transaction(): void
    {
        $owner  = User::factory()->create();
        $hacker = User::factory()->create();
        $wallet = Wallet::factory()->create(['user_id' => $owner->id]);
        $tx     = Transaction::factory()->create([
            'user_id'   => $owner->id,
            'wallet_id' => $wallet->id,
        ]);

        $response = $this->actingAs($hacker)->put(route('transactions.update', $tx), [
            'amount'      => 1,
            'type'        => 'EXPENSE',
            'category'    => 'Lainnya',
            'date'        => now()->format('Y-m-d'),
            'wallet_id'   => $wallet->id,
            'description' => 'hacked',
        ]);

        $response->assertStatus(403);
    }

    public function test_user_cannot_delete_other_users_transaction(): void
    {
        $owner  = User::factory()->create();
        $hacker = User::factory()->create();
        $wallet = Wallet::factory()->create(['user_id' => $owner->id]);
        $tx     = Transaction::factory()->create([
            'user_id'   => $owner->id,
            'wallet_id' => $wallet->id,
        ]);

        $response = $this->actingAs($hacker)->delete(route('transactions.destroy', $tx));

        $response->assertStatus(403);
        $this->assertDatabaseHas('transactions', ['id' => $tx->id]);
    }

    // ═══════════════════════════════════════════════════════
    // BUDGET POLICY TESTS
    // ═══════════════════════════════════════════════════════

    public function test_user_cannot_update_other_users_budget(): void
    {
        $owner  = User::factory()->create();
        $hacker = User::factory()->create();
        $budget = Budget::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($hacker)->put(route('budgets.update', $budget), [
            'category'    => 'Makanan & Minuman',
            'limit'       => 100000,
            'budget_rule' => 'NEEDS',
        ]);

        $response->assertStatus(403);
    }

    public function test_user_cannot_delete_other_users_budget(): void
    {
        $owner  = User::factory()->create();
        $hacker = User::factory()->create();
        $budget = Budget::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($hacker)->delete(route('budgets.destroy', $budget));

        $response->assertStatus(403);
        $this->assertDatabaseHas('budgets', ['id' => $budget->id]);
    }

    // ═══════════════════════════════════════════════════════
    // DEBT POLICY TESTS
    // ═══════════════════════════════════════════════════════

    public function test_user_cannot_delete_other_users_debt(): void
    {
        $owner  = User::factory()->create();
        $hacker = User::factory()->create();
        $debt   = Debt::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($hacker)->delete(route('debts.destroy', $debt));

        $response->assertStatus(403);
        $this->assertDatabaseHas('debts', ['id' => $debt->id]);
    }

    // ═══════════════════════════════════════════════════════
    // ASSET POLICY TESTS
    // ═══════════════════════════════════════════════════════

    public function test_user_cannot_delete_other_users_asset(): void
    {
        $owner  = User::factory()->create();
        $hacker = User::factory()->create();
        $asset  = Asset::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($hacker)->delete(route('assets.destroy', $asset));

        $response->assertStatus(403);
        $this->assertDatabaseHas('assets', ['id' => $asset->id]);
    }

    // ═══════════════════════════════════════════════════════
    // UNIT TEST POLICY DIRECTLY
    // ═══════════════════════════════════════════════════════

    public function test_wallet_policy_allows_owner(): void
    {
        $user   = User::factory()->create();
        $wallet = Wallet::factory()->create(['user_id' => $user->id]);

        $this->assertTrue($user->can('update', $wallet));
        $this->assertTrue($user->can('delete', $wallet));
    }

    public function test_wallet_policy_denies_non_owner(): void
    {
        $owner  = User::factory()->create();
        $hacker = User::factory()->create();
        $wallet = Wallet::factory()->create(['user_id' => $owner->id]);

        $this->assertFalse($hacker->can('update', $wallet));
        $this->assertFalse($hacker->can('delete', $wallet));
    }
}
