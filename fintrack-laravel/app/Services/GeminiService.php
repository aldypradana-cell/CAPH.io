<?php

namespace App\Services;

use App\Models\User;
use Gemini\Laravel\Facades\Gemini;
use Gemini\Data\GenerationConfig;
use Gemini\Enums\ModelType;
use Gemini\Enums\ResponseMimeType;
use Gemini\Data\Schema;
use Gemini\Enums\DataType;
use Illuminate\Support\Collection;

class GeminiService
{
    /**
     * Parse natural language input into transaction array
     */
    public function parseNaturalLanguageTransaction(string $input): array
    {
        try {
            $today = now()->format('Y-m-d');
            
            $prompt = "Analisis teks berikut dan ekstrak data transaksi keuangan.
Teks: \"{$input}\"

Kembalikan array objek JSON dengan properti:
- description (string): Deskripsi singkat transaksi
- amount (number): Jumlah uang (dalam Rupiah/Angka murni tanpa simbol)
- type (string): 'INCOME' atau 'EXPENSE'
- category (string): Kategori yang paling relevan (Contoh: Makanan, Transportasi, Gaji, dll)
- date (string): Tanggal dalam format ISO (YYYY-MM-DD). Jika tidak disebutkan, gunakan tanggal hari ini: {$today}.";

            $result = Gemini::generativeModel(env('GEMINI_MODEL', 'gemini-2.5-flash'))
                ->withGenerationConfig(
                    new GenerationConfig(
                        responseMimeType: ResponseMimeType::APPLICATION_JSON,
                        responseSchema: new Schema(
                            type: DataType::ARRAY,
                            items: new Schema(
                                type: DataType::OBJECT,
                                properties: [
                                    'description' => new Schema(type: DataType::STRING),
                                    'amount' => new Schema(type: DataType::NUMBER),
                                    'type' => new Schema(type: DataType::STRING, enum: ['INCOME', 'EXPENSE']),
                                    'category' => new Schema(type: DataType::STRING),
                                    'date' => new Schema(type: DataType::STRING),
                                ],
                                required: ['description', 'amount', 'type', 'category', 'date']
                            )
                        )
                    )
                )
                ->generateContent($prompt);

            $text = $result->text();
            
            if (!$text) {
                return [];
            }

            return json_decode($text, true) ?? [];

        } catch (\Exception $e) {
            \Log::error('Gemini AI parsing error: ' . $e->getMessage());
            throw new \Exception('Gagal memproses input dengan AI. Silakan coba lagi.');
        }
    }

    /**
     * Get structured financial advice based on user profile, transactions, and trends
     * Returns parsed JSON array matching the InsightData schema
     */
    public function getFinancialAdvice(User $user, array $contextData): array
    {
        try {
            // Build Profile Context
            $profileContext = "Profil belum diisi.";
            if ($user->financial_profile) {
                $fp = $user->financial_profile;
                $occupationMap = [
                    'STABLE' => 'PNS/BUMN (Stabil)',
                    'PRIVATE' => 'Karyawan Swasta',
                    'FREELANCE' => 'Freelancer/Pengusaha (Fluktuatif)'
                ];
                
                $maritalStatus = ($fp['maritalStatus'] ?? 'SINGLE') === 'MARRIED' ? 'Menikah' : 'Lajang';
                $dependents = $fp['dependents'] ?? 0;
                $occupation = $occupationMap[$fp['occupation'] ?? 'PRIVATE'] ?? 'Tidak diketahui';
                
                $goals = '';
                if (!empty($fp['goals'])) {
                    foreach ($fp['goals'] as $goal) {
                        $amount = number_format($goal['amount'] ?? 0, 0, ',', '.');
                        $goals .= "  - {$goal['name']}: Target Rp{$amount} pada {$goal['deadline']}\n";
                    }
                } else {
                    $goals = '  Belum ada target spesifik.';
                }
                
                $profileContext = "Status: {$maritalStatus}, Tanggungan: {$dependents}, Pekerjaan: {$occupation}\nGoals:\n{$goals}";
            }

            $prompt = "Kamu adalah AI Financial Planner. Analisis data keuangan berikut dan kembalikan HANYA JSON valid (tanpa markdown, tanpa backtick, tanpa penjelasan di luar JSON).

=== PROFIL PENGGUNA ===
{$profileContext}

=== TRANSAKSI BULAN INI (Detail) ===
{$contextData['currentMonthDetail']}

=== RINGKASAN 6 BULAN TERAKHIR ===
{$contextData['sixMonthSummary']}

=== TOP KATEGORI BULAN INI ===
{$contextData['topCategories']}

=== TUGAS ===
Analisis semua data di atas dan kembalikan JSON dengan struktur PERSIS seperti ini:

{
  \"healthScore\": <number 0-100>,
  \"healthLabel\": <string, contoh: \"Cukup Sehat\">,
  \"sentiment\": <\"EXCELLENT\" | \"GOOD\" | \"CAUTIOUS\" | \"WARNING\" | \"CRITICAL\">,
  \"summary\": <string, ringkasan 1-2 kalimat dalam Bahasa Indonesia>,
  \"cashflow\": {
    \"income\": <number total pemasukan bulan ini>,
    \"expense\": <number total pengeluaran bulan ini>,
    \"surplus\": <number selisih>,
    \"savingsRate\": <number persentase>,
    \"verdict\": <string analisis singkat>
  },
  \"emergencyFund\": {
    \"idealMonths\": <number bulan ideal berdasarkan pekerjaan & tanggungan>,
    \"monthlyExpenseAvg\": <number rata-rata pengeluaran>,
    \"idealAmount\": <number total dana darurat ideal>,
    \"verdict\": <string analisis & saran>
  },
  \"goalProjections\": [
    {
      \"name\": <string nama goal>,
      \"targetAmount\": <number>,
      \"deadline\": <string>,
      \"monthsRemaining\": <number>,
      \"requiredMonthly\": <number tabungan per bulan yang diperlukan>,
      \"currentSurplus\": <number surplus saat ini>,
      \"status\": <\"ON_TRACK\" | \"DELAYED\" | \"AT_RISK\">,
      \"projectedDate\": <string estimasi kapan tercapai>,
      \"verdict\": <string penjelasan singkat>
    }
  ],
  \"spendingAlerts\": [
    {
      \"category\": <string>,
      \"amount\": <number>,
      \"avgLast6m\": <number rata-rata 6 bulan>,
      \"changePercent\": <number>,
      \"severity\": <\"INFO\" | \"WARNING\" | \"DANGER\">,
      \"advice\": <string saran konkret>
    }
  ],
  \"actionItems\": [
    {
      \"priority\": <number 1-3>,
      \"title\": <string>,
      \"description\": <string>,
      \"impact\": <\"HIGH\" | \"MEDIUM\" | \"LOW\">,
      \"savingsPotential\": <number estimasi penghematan per bulan>
    }
  ]
}

PENTING:
- Semua angka dalam Rupiah (tanpa simbol Rp, tanpa titik pemisah ribuan, hanya angka).
- SEMUA teks dalam Bahasa Indonesia.
- Jika tidak cukup data untuk suatu field, beri estimasi terbaik.
- Jika user belum punya goal, kembalikan goalProjections sebagai array kosong [].
- JSON HARUS valid. Jangan tambahkan komentar atau teks di luar JSON.";

            $apiKey = env('GEMINI_API_KEY');
            $model = env('GEMINI_MODEL', 'gemini-1.5-flash');
            $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

            $payload = [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'response_mime_type' => 'application/json',
                    'temperature' => 0.7,
                ]
            ];

            $options = [
                'http' => [
                    'header'  => "Content-type: application/json\r\n",
                    'method'  => 'POST',
                    'content' => json_encode($payload),
                    'ignore_errors' => true,
                    'timeout' => 90
                ],
                'ssl' => [
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                ],
                'socket' => [
                    'bindto' => '0:0'
                ]
            ];

            $context  = stream_context_create($options);
            $response = file_get_contents($url, false, $context);

            if ($response === false) {
                 \Log::error('Gemini connection failed for insights');
                 throw new \Exception('Gagal menghubungkan ke server AI.');
            }

            $data = json_decode($response, true);
            
            if (isset($data['error'])) {
                 \Log::error('Gemini API Error (Insights): ' . json_encode($data['error']));
                 throw new \Exception('AI Error: ' . ($data['error']['message'] ?? 'Unknown'));
            }

            $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
            
            if (!$text) {
                \Log::warning('Gemini empty insight response: ' . $response);
                throw new \Exception('AI tidak memberikan respons.');
            }

            // Clean potential markdown wrapping
            $text = trim($text);
            $text = preg_replace('/^```json\s*/i', '', $text);
            $text = preg_replace('/\s*```$/i', '', $text);
            $text = trim($text);

            $parsed = json_decode($text, true);
            
            if (!$parsed || !isset($parsed['healthScore'])) {
                \Log::warning('Gemini invalid JSON insight: ' . $text);
                throw new \Exception('AI mengembalikan format yang tidak valid.');
            }

            return $parsed;

        } catch (\Exception $e) {
            \Log::error('Gemini AI insight exception: ' . $e->getMessage());
            throw $e;
        }
    }
}
