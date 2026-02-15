<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Budget>
 */
class BudgetFactory extends Factory
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
            'category' => $this->faker->word(),
            'limit' => $this->faker->randomFloat(2, 100, 10000),
            'period' => 'MONTHLY',
            'frequency' => 'MONTHLY',
        ];
    }
}
