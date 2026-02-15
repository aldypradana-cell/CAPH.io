<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\SystemLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class MasterDataController extends Controller
{
    public function index()
    {
        // Admin sees GLOBAL categories (user_id = null) + maybe some system stats
        $categories = Category::whereNull('user_id')->get();
        
        // Mocking banks for now as we might not have a Bank model yet, 
        // or if we do, we should fetch it. Assuming we might want to manage a 'banks' table later.
        // For now, let's just focus on Categories as that is more critical.
        
        return Inertia::render('Admin/Dashboard', [
            'tab' => 'master',
            'categories' => $categories
        ]);
    }

    public function seed()
    {
        $defaults = [
            ['name' => 'Gaji', 'type' => 'INCOME', 'icon' => 'Wallet', 'color' => 'bg-emerald-500'],
            ['name' => 'Bonus', 'type' => 'INCOME', 'icon' => 'TrendingUp', 'color' => 'bg-blue-500'],
            ['name' => 'Makanan', 'type' => 'EXPENSE', 'icon' => 'Coffee', 'color' => 'bg-amber-500'],
            ['name' => 'Transportasi', 'type' => 'EXPENSE', 'icon' => 'Car', 'color' => 'bg-blue-500'],
            ['name' => 'Belanja', 'type' => 'EXPENSE', 'icon' => 'ShoppingBag', 'color' => 'bg-pink-500'],
            ['name' => 'Hiburan', 'type' => 'EXPENSE', 'icon' => 'Film', 'color' => 'bg-violet-500'],
            ['name' => 'Kesehatan', 'type' => 'EXPENSE', 'icon' => 'Activity', 'color' => 'bg-red-500'],
            ['name' => 'Pendidikan', 'type' => 'EXPENSE', 'icon' => 'Book', 'color' => 'bg-cyan-500'],
        ];

        foreach ($defaults as $cat) {
            Category::firstOrCreate(
                ['name' => $cat['name'], 'user_id' => null],
                $cat
            );
        }

        SystemLog::log('SEED_CATEGORIES', 'Master Data', ['count' => count($defaults)]);

        return redirect()->back()->with('success', 'Kategori default berhasil ditambahkan');
    }

    public function storeCategory(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:categories,name,NULL,id,user_id,NULL',
            'type' => 'required|in:INCOME,EXPENSE',
            'icon' => 'required|string',
            'color' => 'required|string',
        ]);

        $category = Category::create([
            'name' => $validated['name'],
            'type' => $validated['type'],
            'icon' => $validated['icon'],
            'color' => $validated['color'],
            'user_id' => null,
        ]);

        SystemLog::log('CREATE_CATEGORY', "Category #{$category->id} ({$category->name})", $validated);

        return redirect()->back()->with('success', 'Kategori master berhasil ditambahkan');
    }

    public function updateCategory(Request $request, Category $category)
    {
        // Ensure we are only editing global categories
        if ($category->user_id !== null) {
            abort(403, 'Cannot edit user specific category');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('categories')->ignore($category->id)->whereNull('user_id')],
            'type' => 'required|in:INCOME,EXPENSE',
            'icon' => 'required|string',
            'color' => 'required|string',
        ]);

        $category->update($validated);

        SystemLog::log('UPDATE_CATEGORY', "Category #{$category->id} ({$category->name})", $validated);

        return redirect()->back()->with('success', 'Kategori berhasil diupdate');
    }

    public function destroyCategory(Category $category)
    {
         if ($category->user_id !== null) {
            abort(403);
        }
        
        SystemLog::log('DELETE_CATEGORY', "Category #{$category->id} ({$category->name})", [
            'name' => $category->name,
            'type' => $category->type,
        ]);

        $category->delete();
        
        return redirect()->back()->with('success', 'Kategori berhasil dihapus');
    }
}
