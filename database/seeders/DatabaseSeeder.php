<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create Admin User
        User::create([
            'name' => 'Super Admin',
            'email' => 'admin@fintrack.com',
            'password' => Hash::make('admin123'),
            'role' => 'ADMIN',
            'status' => 'ACTIVE',
            'preferences' => [
                'theme' => 'dark',
                'currency' => 'IDR',
                'notifications' => true,
            ],
        ]);

        // Create Demo User
        User::create([
            'name' => 'Demo User',
            'email' => 'user@fintrack.com',
            'password' => Hash::make('user123'),
            'role' => 'USER',
            'status' => 'ACTIVE',
            'preferences' => [
                'theme' => 'light',
                'currency' => 'IDR',
                'notifications' => true,
            ],
        ]);

        // Create Default Categories (System Categories)
        $defaultCategories = [
            // Income
            ['name' => 'Gaji',              'type' => 'INCOME',    'budget_rule' => null, 'is_default' => true],
            ['name' => 'Bonus',             'type' => 'INCOME',    'budget_rule' => null, 'is_default' => true],
            ['name' => 'Hasil Investasi',   'type' => 'INCOME',    'budget_rule' => null, 'is_default' => true],
            ['name' => 'Freelance',         'type' => 'INCOME',    'budget_rule' => null, 'is_default' => true],
            ['name' => 'Hadiah / THR',      'type' => 'INCOME',    'budget_rule' => null, 'is_default' => true],
            ['name' => 'Lainnya',           'type' => 'INCOME',    'budget_rule' => null, 'is_default' => true],

            // Expense
            ['name' => 'Makanan & Minuman', 'type' => 'EXPENSE',   'budget_rule' => 'NEEDS',       'is_default' => true],
            ['name' => 'Transportasi',      'type' => 'EXPENSE',   'budget_rule' => 'NEEDS',       'is_default' => true],
            ['name' => 'Belanja Kebutuhan', 'type' => 'EXPENSE',   'budget_rule' => 'NEEDS',       'is_default' => true],
            ['name' => 'Belanja Gaya Hidup','type' => 'EXPENSE',   'budget_rule' => 'WANTS',       'is_default' => true],
            ['name' => 'Tagihan & Utilitas','type' => 'EXPENSE',   'budget_rule' => 'NEEDS',       'is_default' => true],
            ['name' => 'Komunikasi',        'type' => 'EXPENSE',   'budget_rule' => 'NEEDS',       'is_default' => true],
            ['name' => 'Kesehatan',         'type' => 'EXPENSE',   'budget_rule' => 'NEEDS',       'is_default' => true],
            ['name' => 'Pendidikan',        'type' => 'EXPENSE',   'budget_rule' => 'NEEDS',       'is_default' => true],
            ['name' => 'Hiburan',           'type' => 'EXPENSE',   'budget_rule' => 'WANTS',       'is_default' => true],
            ['name' => 'Perawatan Diri',    'type' => 'EXPENSE',   'budget_rule' => 'WANTS',       'is_default' => true],
            ['name' => 'Cicilan & Utang',   'type' => 'EXPENSE',   'budget_rule' => 'DEBT',        'is_default' => true],
            ['name' => 'Sedekah',           'type' => 'EXPENSE',   'budget_rule' => 'SOCIAL',      'is_default' => true],
            ['name' => 'Lainnya',           'type' => 'EXPENSE',   'budget_rule' => null,          'is_default' => true],

            // Transfer
            ['name' => 'Transfer Antar Dompet', 'type' => 'TRANSFER', 'budget_rule' => null, 'is_default' => true],
            ['name' => 'Top Up E-Wallet',       'type' => 'TRANSFER', 'budget_rule' => null, 'is_default' => true],
            ['name' => 'Tarik Tunai',           'type' => 'TRANSFER', 'budget_rule' => null, 'is_default' => true],
            ['name' => 'Lainnya',               'type' => 'TRANSFER', 'budget_rule' => null, 'is_default' => true],
        ];

        foreach ($defaultCategories as $category) {
            Category::create([
                'user_id'     => null,
                'name'        => $category['name'],
                'type'        => $category['type'],
                'budget_rule' => $category['budget_rule'],
                'is_default'  => $category['is_default'],
            ]);
        }
    }
}
