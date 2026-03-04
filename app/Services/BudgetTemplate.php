<?php

namespace App\Services;

/**
 * Centralized budget template definitions.
 *
 * Used by BudgetController and DashboardController to avoid
 * duplicating template constants across multiple files.
 */
class BudgetTemplate
{
    /**
     * Slot key → array of budget_rule values that should be aggregated
     */
    public const SLOT_TO_RULES = [
        'NEEDS'        => ['NEEDS'],
        'WANTS'        => ['WANTS'],
        'SAVINGS'      => ['SAVINGS'],
        'DEBT'         => ['DEBT'],
        'SOCIAL'       => ['SOCIAL'],
        'LIVING'       => ['NEEDS', 'WANTS'],              // 70-20-10
        'SAVINGS_PLUS' => ['SAVINGS', 'DEBT', 'SOCIAL'],   // 50-30-20
        'OBLIGATIONS'  => ['DEBT', 'SOCIAL'],              // 70-20-10
    ];

    /**
     * Template definitions: slot key → percentage
     */
    public const TEMPLATES = [
        '50-30-20' => [
            'NEEDS'        => 50,
            'WANTS'        => 30,
            'SAVINGS_PLUS' => 20,
        ],
        '40-30-20-10' => [
            'NEEDS'   => 40,
            'DEBT'    => 30,
            'SAVINGS' => 20,
            'SOCIAL'  => 10,
        ],
        '70-20-10' => [
            'LIVING'      => 70,
            'SAVINGS'     => 20,
            'OBLIGATIONS' => 10,
        ],
    ];

    /**
     * Labels per slot per template
     */
    public const TEMPLATE_LABELS = [
        '50-30-20' => [
            'NEEDS'        => 'Kebutuhan',
            'WANTS'        => 'Keinginan',
            'SAVINGS_PLUS' => 'Tabungan & Kewajiban',
        ],
        '40-30-20-10' => [
            'NEEDS'   => 'Kebutuhan',
            'DEBT'    => 'Cicilan & Kewajiban',
            'SAVINGS' => 'Tabungan & Investasi',
            'SOCIAL'  => 'Sosial & Kebaikan',
        ],
        '70-20-10' => [
            'LIVING'      => 'Biaya Hidup',
            'SAVINGS'     => 'Tabungan & Investasi',
            'OBLIGATIONS' => 'Kewajiban & Sosial',
        ],
    ];

    /**
     * Detect active template from the combination of master budget slot keys.
     */
    public static function detectTemplate(array $masterSlots): ?string
    {
        foreach (self::TEMPLATES as $key => $slots) {
            $templateSlots = array_keys($slots);
            sort($templateSlots);
            $current = $masterSlots;
            sort($current);
            if ($templateSlots === $current) {
                return $key;
            }
        }
        return null;
    }

    /**
     * Get labels for a detected template. Returns empty array if no match.
     */
    public static function getLabels(?string $templateKey): array
    {
        if (!$templateKey) {
            return [];
        }
        return self::TEMPLATE_LABELS[$templateKey] ?? [];
    }
}
