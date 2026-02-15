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
     * Get financial advice based on user profile and transactions
     */
    public function getFinancialAdvice(User $user, Collection $transactions): string
    {
        try {
            // Simplify data to save tokens
            $summary = $transactions->take(50)->map(function ($t) {
                return "{$t->date}: {$t->type} - {$t->category} - Rp" . number_format($t->amount, 0, ',', '.') . " ({$t->description})";
            })->join("\n");

            // Build Profile Context
            $profileContext = "";
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
                        $goals .= "- {$goal['name']}: Target Rp{$amount} pada {$goal['deadline']}\n";
                    }
                } else {
                    $goals = 'Belum ada target spesifik.';
                }
                
                $profileContext = "
DATA PROFIL PENGGUNA:
- Status Pernikahan: {$maritalStatus}
- Jumlah Tanggungan: {$dependents} orang
- Pekerjaan: {$occupation}
- Target Finansial (Financial Goals):
{$goals}";
            }

            $prompt = "Bertindaklah sebagai penasihat keuangan pribadi (Financial Planner) yang sangat cerdas, empatik, dan strategis.

{$profileContext}

RIWAYAT TRANSAKSI TERAKHIR (50 item):
{$summary}

TUGAS ANDA:
Berikan analisis keuangan yang mendalam dalam Bahasa Indonesia yang profesional namun ramah. Gunakan format Markdown.

Poin-poin analisis yang WAJIB ada:
1. **Kesehatan Cachflow**: Analisis pemasukan vs pengeluaran berdasarkan data transaksi.
2. **Analisis Profil Risiko & Dana Darurat**: 
   - Berdasarkan pekerjaan pengguna, hitung berapa bulan Dana Darurat yang ideal.
   - Bandingkan dengan pola pengeluaran mereka saat ini.
3. **Kewajaran Pengeluaran**:
   - Apakah pengeluaran untuk kebutuhan pokok terlihat wajar?
4. **Gap Analysis Target Finansial**:
   - Untuk setiap 'Target Finansial', hitung berapa yang harus ditabung per bulan mulai sekarang hingga deadline.
   - Bandingkan angka tersebut dengan sisa uang (surplus) bulanan rata-rata user saat ini.
5. **3 Rekomendasi Konkret**: Langkah nyata untuk memperbaiki keuangan atau mencapai target.";

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
                ]
            ];

            $options = [
                'http' => [
                    'header'  => "Content-type: application/json\r\n",
                    'method'  => 'POST',
                    'content' => json_encode($payload),
                    'ignore_errors' => true,
                    'timeout' => 60
                ],
                'ssl' => [
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                ],
                'socket' => [
                    'bindto' => '0:0' // Force IPv4
                ]
            ];

            $context  = stream_context_create($options);
            $response = file_get_contents($url, false, $context);

            if ($response === false) {
                 \Log::error('Gemini connection failed');
                 return 'Gagal menghubungkan ke server AI.';
            }

            $data = json_decode($response, true);
            
            // Log error response from API
            if (isset($data['error'])) {
                 \Log::error('Gemini API Error: ' . json_encode($data['error']));
                 return 'AI Error: ' . ($data['error']['message'] ?? 'Unknown');
            }

            $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
            
            if (!$text) {
                \Log::warning('Gemini empty response: ' . $response);
            }

            return $text ?? 'Maaf, saya tidak dapat menganalisis data saat ini.';

        } catch (\Exception $e) {
            \Log::error('Gemini AI advice exception: ' . $e->getMessage());
            return 'Terjadi kesalahan sistem saat analisis.';
        }
    }
}
