<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Check ownership via Policy
        return $this->user()->can('update', $this->route('transaction'));
    }

    public function rules(): array
    {
        $userId = $this->user()->id;

        return [
            'wallet_id'    => ['required', Rule::exists('wallets', 'id')->where('user_id', $userId)],
            'to_wallet_id' => ['nullable', Rule::exists('wallets', 'id')->where('user_id', $userId)],
            'date'         => 'required|date',
            'description'  => 'required|string|max:255',
            'amount'       => 'required|numeric|min:1',
            'type'         => 'required|in:INCOME,EXPENSE,TRANSFER',
            'category'     => 'required|string',
            'tags'         => 'nullable|array',
            'tags.*'       => 'string|max:50',
        ];
    }
}
