<?php

namespace App\Enums;

/**
 * Centralized transaction type definitions.
 *
 * Use TransactionType::INCOME->value (etc.) instead of hardcoded strings
 * to prevent typos and enable IDE autocomplete.
 */
enum TransactionType: string
{
    case INCOME   = 'INCOME';
    case EXPENSE  = 'EXPENSE';
    case TRANSFER = 'TRANSFER';
}
