<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
            'user' => $request->user()->only([
                'id', 'name', 'email', 'avatar', 'role',
                'preferences', 'financial_profile', 'created_at'
            ]),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit')->with('success', 'Profil berhasil diupdate');
    }

    /**
     * Update user preferences (theme, currency, notifications).
     */
    public function updatePreferences(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'preferences' => 'required|array',
            'preferences.theme' => 'nullable|in:light,dark,auto',
            'preferences.currency' => 'nullable|string|max:10',
            'preferences.language' => 'nullable|string|max:10',
            'preferences.notifications' => 'nullable|boolean',
        ]);

        $request->user()->update([
            'preferences' => $validated['preferences'],
        ]);

        return Redirect::back()->with('success', 'Preferensi berhasil diupdate');
    }

    /**
     * Update user's financial profile for AI insights.
     */
    public function updateFinancialProfile(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'financial_profile' => 'required|array',
            'financial_profile.maritalStatus' => 'nullable|in:SINGLE,MARRIED',
            'financial_profile.dependents' => 'nullable|integer|min:0',
            'financial_profile.occupation' => 'nullable|in:STABLE,PRIVATE,FREELANCE',
        ]);

        $request->user()->update([
            'financial_profile' => $validated['financial_profile'],
        ]);

        return Redirect::back()->with('success', 'Profil finansial berhasil diupdate');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
