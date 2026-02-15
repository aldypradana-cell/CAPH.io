<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Transaction>
 */
class TransactionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => \App\Models\User::factory(),
            'wallet_id' => \App\Models\Wallet::factory(),

            'date' => $this->faker->date(),
            'description' => $this->faker->sentence(),
            'amount' => $this->faker->randomFloat(2, 10, 1000),
            'type' => $this->faker->randomElement(['INCOME', 'EXPENSE']),
            'category' => $this->faker->word(),
            'is_flagged' => false,
        ];
    }
}
