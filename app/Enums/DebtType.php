<?php

namespace App\Enums;

/**
 * Types of debts tracked in the system.
 */
enum DebtType: string
{
    case DEBT       = 'DEBT';
    case RECEIVABLE = 'RECEIVABLE';
    case BILL       = 'BILL';
}
