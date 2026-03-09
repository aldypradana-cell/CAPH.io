<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // System categories (is_default = true) + user's custom categories
        $categories = Category::allUserCategories($user->id)
            ->orderBy('type')
            ->orderBy('name')
            ->get();

        return Inertia::render('Categories/Index', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:INCOME,EXPENSE,TRANSFER',
            'budget_rule' => 'nullable|in:NEEDS,WANTS,SAVINGS,DEBT,SOCIAL',
        ]);

        Category::create([
            'user_id' => $request->user()->id,
            'name' => $validated['name'],
            'type' => $validated['type'],
            'is_default' => false,
            'budget_rule' => $validated['type'] === 'EXPENSE' ? ($validated['budget_rule'] ?? null) : null,
        ]);

        return redirect()->back()->with('success', 'Kategori berhasil ditambahkan');
    }

    public function update(Request $request, Category $category)
    {
        // Can only edit custom (non-default) categories owned by user
        if ($category->is_default || $category->user_id !== $request->user()->id) {
            abort(403, 'Tidak bisa mengedit kategori bawaan sistem.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:INCOME,EXPENSE,TRANSFER',
            'budget_rule' => 'nullable|in:NEEDS,WANTS,SAVINGS,DEBT,SOCIAL',
        ]);

        $category->update([
            'name' => $validated['name'],
            'type' => $validated['type'],
            'budget_rule' => $validated['type'] === 'EXPENSE' ? ($validated['budget_rule'] ?? null) : null,
        ]);

        return redirect()->back()->with('success', 'Kategori berhasil diupdate');
    }

    public function destroy(Request $request, Category $category)
    {
        if ($category->is_default || $category->user_id !== $request->user()->id) {
            abort(403, 'Tidak bisa menghapus kategori bawaan sistem.');
        }

        $category->delete();

        return redirect()->back()->with('success', 'Kategori berhasil dihapus');
    }

    public function toggleHide(Request $request, Category $category)
    {
        // Users can hide both default and custom categories, 
        // as long as the custom ones belong to them
        if (!$category->is_default && $category->user_id !== $request->user()->id) {
            abort(403, 'Akses ditolak.');
        }

        $category->update([
            'is_hidden' => !$category->is_hidden
        ]);

        $status = $category->is_hidden ? 'disembunyikan' : 'ditampilkan kembali';
        return redirect()->back()->with('success', "Kategori berhasil {$status}.");
    }
}