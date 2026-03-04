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
use Illuminate\Support\Facades\Log;

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
            $msg = $e->getMessage();
            Log::error('Gemini AI parsing error: ' . $msg);
            // Deteksi jenis error agar pesan lebih informatif
            if (str_contains($msg, 'timed out') || str_contains($msg, 'Connection timed out')) {
                throw new \Exception('Koneksi ke AI timeout. Silakan coba lagi dalam beberapa detik.');
            }
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

            $prompt = "Kamu adalah AI Financial Planner kelas dunia. Analisis data keuangan berikut dan kembalikan HANYA JSON valid (tanpa markdown, tanpa backtick, tanpa penjelasan di luar JSON).

=== KONTEKS WAKTU ===
{$contextData['todayContext']}

=== PROFIL PENGGUNA ===
{$profileContext}

=== POSISI KEUANGAN SAAT INI ===
-- Saldo Dompet --
{$contextData['walletBalances']}

-- Aset --
{$contextData['assets']}

-- Utang & Piutang Aktif --
{$contextData['debtsReceivables']}

-- Tagihan & Komitmen Rutin Bulanan --
{$contextData['recurringCommitments']}

=== BUDGET vs REALISASI (PERIODE INI) ===
{$contextData['budgetVsRealization']}

=== TRANSAKSI PERIODE INI (Detail) ===
{$contextData['currentMonthDetail']}

=== RINGKASAN 6 BULAN TERAKHIR ===
{$contextData['sixMonthSummary']}

=== TOP KATEGORI PENGELUARAN PERIODE INI ===
{$contextData['topCategories']}

=== RATA-RATA PER KATEGORI (6 BULAN TERAKHIR) ===
{$contextData['categoryAverages']}

=== INSTRUKSI ANALISIS ===
Gunakan semua data di atas untuk:
1. Hitung NET WORTH = (Total Saldo Dompet + Total Nilai Aset) - Total Hutang Aktif.
2. Evaluasi TEKANAN UTANG: bandingkan total hutang dengan pemasukan bulanan (debt-to-income ratio).
3. Pertimbangkan KOMITMEN RUTIN BULANAN saat menghitung surplus riil yang tersedia.
4. Identifikasi kategori budget yang OVER atau HAMPIR HABIS dan berikan saran spesifik.
5. Bandingkan pengeluaran bulan ini dengan rata-rata 6 bulan untuk Spending Alerts.

=== OUTPUT JSON (WAJIB PERSIS STRUKTUR INI) ===
{
  \"healthScore\": <number 0-100>,
  \"healthLabel\": <string, contoh: \"Cukup Sehat\">,
  \"sentiment\": <\"EXCELLENT\" | \"GOOD\" | \"CAUTIOUS\" | \"WARNING\" | \"CRITICAL\">,
  \"summary\": <string, ringkasan 2-3 kalimat kontekstual dalam Bahasa Indonesia>,
  \"cashflow\": {
    \"income\": <number total pemasukan periode ini>,
    \"expense\": <number total pengeluaran periode ini>,
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
  \"netWorthSnapshot\": {
    \"totalWallet\": <number total saldo semua dompet>,
    \"totalAssets\": <number total nilai aset>,
    \"totalDebt\": <number total hutang aktif (bukan piutang)>,
    \"netWorth\": <number = totalWallet + totalAssets - totalDebt>,
    \"verdict\": <string analisis posisi kekayaan bersih, 1-2 kalimat>
  },
  \"budgetCompliance\": [
    {
      \"category\": <string nama kategori>,
      \"limit\": <number limit budget>,
      \"spent\": <number realisasi>,
      \"usagePercent\": <number persentase terpakai>,
      \"status\": <\"OK\" | \"WARNING\" | \"OVER\"> // Wajib: OK (0-79%), WARNING (80-99%), OVER (100%+)
    }
  ],
  \"goalProjections\": [
    {
      \"name\": <string nama goal>,
      \"targetAmount\": <number>,
      \"deadline\": <string>,
      \"monthsRemaining\": <number>,
      \"requiredMonthly\": <number tabungan per bulan yang diperlukan>,
      \"currentSurplus\": <number surplus saat ini (setelah dikurangi komitmen rutin)>,
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
      \"priority\": <number 1-5>,
      \"title\": <string>,
      \"description\": <string>,
      \"impact\": <\"HIGH\" | \"MEDIUM\" | \"LOW\">,
      \"savingsPotential\": <number estimasi penghematan per bulan>
    }
  ]
}

PENTING:
- Semua angka dalam Rupiah (angka murni tanpa simbol Rp, tanpa titik pemisah ribuan).
- SEMUA teks verdict, summary, advice, description dalam Bahasa Indonesia.
- Jika tidak cukup data untuk suatu field, beri estimasi terbaik.
- Jika user tidak punya goal, kembalikan goalProjections sebagai array kosong [].
- Jika tidak ada budget yang ditetapkan, kembalikan budgetCompliance sebagai array kosong [].
- actionItems HARUS ada minimal 3 item (maksimal 5), berdasarkan seluruh data yang ada.
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

            $response = \Illuminate\Support\Facades\Http::timeout(60)
                ->acceptJson()
                ->post($url, $payload);

            if ($response->failed()) {
                $errorBody = $response->json('error');
                $errMsg = $errorBody['message'] ?? ('HTTP ' . $response->status());
                Log::error('Gemini API Error (Insights): ' . json_encode($errorBody));
                throw new \Exception('AI Error: ' . $errMsg);
            }

            $data = $response->json();

            $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;

            if (!$text) {
                Log::warning('Gemini empty insight response: ' . $response->body());
                throw new \Exception('AI tidak memberikan respons.');
            }

            // Clean potential markdown wrapping
            $text = trim($text);
            $text = preg_replace('/^```json\s*/i', '', $text);
            $text = preg_replace('/\s*```$/i', '', $text);
            $text = trim($text);

            $parsed = json_decode($text, true);

            if (!$parsed || !isset($parsed['healthScore'])) {
                Log::warning('Gemini invalid JSON insight: ' . $text);
                throw new \Exception('AI mengembalikan format yang tidak valid.');
            }

            return $parsed;

        } catch (\Exception $e) {
            Log::error('Gemini AI insight exception: ' . $e->getMessage());
            throw $e;
        }
    }
}