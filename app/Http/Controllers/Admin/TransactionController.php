<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SystemLog;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        SystemLog::create([
            'admin_id' => $request->user()->id,
            'action' => 'BLOCK_ADMIN_TRANSACTION_ACCESS',
            'target' => 'Admin transactions route',
            'details' => [
                'reason' => 'Direct access to raw user transactions is disabled by privacy policy.',
            ],
        ]);

        return redirect()
            ->route('admin.dashboard')
            ->with('success', 'Akses transaksi mentah user telah dinonaktifkan demi privasi.');
    }
}
