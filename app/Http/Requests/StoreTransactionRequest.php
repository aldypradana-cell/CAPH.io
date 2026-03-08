<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Auth handled by middleware
    }

    public function rules(): array
    {
        $userId = $this->user()->id;

        return [
            // wallet_id is required UNLESS is_paylater is true
            'wallet_id'      => ['exclude_if:is_paylater,true', 'required_without:is_paylater', Rule::exists('wallets', 'id')->where('user_id', $userId)],
            'to_wallet_id'   => ['nullable', Rule::exists('wallets', 'id')->where('user_id', $userId)],
            'date'           => 'required|date',
            'description'    => 'required|string|max:255',
            'amount'         => 'required|numeric|min:1',
            'type'           => 'required|in:INCOME,EXPENSE,TRANSFER',
            'category'       => 'required|string',
            'tags'           => 'nullable|array',
            'tags.*'         => 'string|max:50',
            'admin_fee'      => 'nullable|numeric|min:0',
            'admin_fee_from' => 'nullable|in:sender,receiver',
            
            // PayLater fields
            'is_paylater'      => 'nullable|boolean',
            'paylater_lender'  => 'required_if:is_paylater,true|nullable|string|max:100',
            'paylater_tenor'   => 'required_if:is_paylater,true|nullable|integer|min:1|max:60',
            'paylater_due_day' => 'required_if:is_paylater,true|nullable|integer|min:1|max:31',
        ];
    }
}
