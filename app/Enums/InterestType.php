<?php

namespace App\Enums;

/**
 * Types of interest calculation for installments.
 */
enum InterestType: string
{
    case FLAT     = 'FLAT';
    case FLOATING = 'FLOATING';
    case MIXED    = 'MIXED';
    case NONE     = 'NONE';
}
