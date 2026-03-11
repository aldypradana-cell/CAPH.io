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

            $result = Gemini::generativeModel(config('services.gemini.model', 'gemini-2.5-flash'))
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
                $userGoals = $user->goals()->get();
                if ($userGoals->isNotEmpty()) {
                    foreach ($userGoals as $goal) {
                        $amount = number_format($goal->target_amount, 0, ',', '.');
                        $deadline = $goal->deadline ? $goal->deadline->format('Y-m-d') : 'tanpa tenggat';
                        $goals .= "  - {$goal->name}: Target Rp{$amount} pada {$deadline}\n";
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

            $apiKey = config('services.gemini.key');
            $model = config('services.gemini.model', 'gemini-1.5-flash');
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

    /**
     * Generate a humorous financial roast based on user data
     * Returns parsed JSON with roast_text, badge, waste_score, challenge
     */
    public function generateRoast(User $user, array $roastContext, string $level): array
    {
        try {
            // System persona — same for all levels
            $persona = "Kamu adalah komedian stand-up Indonesia yang AHLI di dunia keuangan.
Gayamu seperti campuran Raditya Dika, Ernest Prakasa, dan Warren Buffett yang bisa bahasa gaul Jakarta.
Kamu SANGAT jago membaca data keuangan dan mengubahnya jadi bahan roasting yang bikin ngakak tapi juga bikin mikir.

ATURAN PENTING:
1. SELALU gunakan DATA NYATA dari konteks — sebutkan angka spesifik, kategori spesifik, kebiasaan spesifik.
2. JANGAN pernah membuat data palsu. Jika datanya bagus, tetap roast tapi dari sudut pandang lucu.
3. Gunakan bahasa Indonesia GAUL tapi tetap bisa dibaca semua umur (tidak kasar/vulgar).
4. Setiap paragraf HARUS mengandung minimal 1 referensi ke data aktual pengguna.
5. Gunakan analogi absurd yang relate dengan kehidupan sehari-hari orang Indonesia.
6. JANGAN menggunakan emoji di dalam roast_text (emoji hanya di badge_emoji).
7. Tulis seolah kamu bicara langsung ke orangnya (\"kamu\", \"lo\", bukan \"pengguna\" atau \"user\").";

            // Level-specific tone
            $toneMap = [
                'MILD' => "TONE: Seperti teman baik yang becanda di Warkop. Bicara sopan tapi tetap jujur.
Pakai \"kamu\" bukan \"lo\". Akhiri dengan kalimat penyemangat.

Contoh gaya bahasa yang diinginkan:
\"Jadi kamu habiskan Rp850rb buat kopi bulan ini ya? Bukan masalah sih kalau gajimu di atas 50 juta. Tapi kalau belum... mungkin belajar bikin kopi sendiri bisa jadi skill baru yang menghemat sekaligus bikin keren.\"

PANJANG: 2 paragraf (masing-masing 2-3 kalimat). Pisahkan paragraf dengan baris baru (\\n\\n).",

                'MEDIUM' => "TONE: Seperti kakak kelas yang blak-blakan tapi sayang sama adiknya.
Boleh pakai \"lo/gue\" atau \"kamu\". Jujur tanpa basa-basi. Gunakan perbandingan yang bikin ngilu.

Contoh gaya bahasa yang diinginkan:
\"Lo tahu nggak, Rp2.3jt yang lo habiskan buat makan di luar bulan ini itu setara dengan 5 bulan langganan gym yang nggak pernah lo pakai? Oh wait, lo juga bayar gym Rp350rb tapi cuma datang 2x. Efisiensi yang luar biasa.\"

PANJANG: 3 paragraf (masing-masing 2-4 kalimat). Pisahkan paragraf dengan baris baru (\\n\\n).",

                'BRUTAL' => "TONE: Seperti stand-up comedian yang roasting habis-habisan di panggung.
Full \"lo/gue\". Savage tapi TETAP LUCU (bukan jahat). Bikin penonton ngakak sambil kasihan.
Gunakan sarkasme berlapis, plot twist, dan punchline di akhir setiap paragraf.

Contoh gaya bahasa yang diinginkan:
\"Gue udah liat data keuangan lo dan honestly... gue kagum. Bukan karena lo hebat, tapi karena lo berhasil menghabiskan Rp1.8jt di kategori Hiburan padahal Netflix lo aja nonton setengah episode terus ketiduran. Lo basically bayar Rp50rb per episode yang nggak pernah lo tamatin. Reed Hastings harusnya kirim lo karangan bunga.\"

PANJANG: 3-4 paragraf (masing-masing 3-5 kalimat, harus ada punchline di tiap paragraf). Pisahkan paragraf dengan baris baru (\\n\\n).",
            ];

            $tone = $toneMap[$level] ?? $toneMap['MEDIUM'];

            $prompt = "{$persona}

{$tone}

=== DATA KEUANGAN KORBAN ===
Ringkasan: {$roastContext['ringkasan']}

Top Kategori Pengeluaran:
{$roastContext['topKategori']}

Transaksi Terbesar:
{$roastContext['topTransaksi']}

Budget yang Bermasalah:
{$roastContext['budgetJebol']}

Trend Bulanan:
{$roastContext['trendBulanan']}

=== INSTRUKSI OUTPUT ===
Berdasarkan data di atas, ROAST orang ini tentang kebiasaan keuangannya.

Fokus roasting pada:
1. Kategori pengeluaran terbesar — apa yang mereka hamburkan?
2. Rasio tabungan vs pengeluaran — apakah mereka menabung atau cuma mimpi?
3. Kebiasaan berulang yang terlihat — langganan, makanan, impuls buying
4. Budget yang jebol — kalau ada, ini WAJIB di-roast
5. Perbandingan absurd — bandingkan pengeluaran mereka dengan sesuatu yang lucu

Untuk badge: pilih SATU kebiasaan paling menonjol dan buat julukan kreatif.
Untuk challenge: beri 1 tantangan SPESIFIK dan TERUKUR berdasarkan masalah terbesar mereka.
Untuk waste_score: 0=sangat hemat, 50=normal, 100=boros parah. Hitung dari data nyata.

Kembalikan HANYA JSON valid (tanpa markdown, tanpa backtick):
{
  \"roast_text\": \"string (roasting sesuai panjang level, pisahkan paragraf dengan baris baru)\",
  \"badge_name\": \"string (julukan kreatif tanpa emoji, contoh: Raja Kopi)\",
  \"badge_emoji\": \"string (1 emoji yang mewakili, contoh: ☕)\",
  \"waste_score\": number (0-100),
  \"challenge\": \"string (1 tantangan spesifik dan terukur)\",
  \"categories_roasted\": [\"array kategori yang dibahas dalam roast\"]
}

PENTING: JSON HARUS valid. Jangan tambahkan komentar atau teks di luar JSON. Semua angka dalam Rupiah (angka murni tanpa simbol).";

            $apiKey = config('services.gemini.key');
            $model = config('services.gemini.model', 'gemini-1.5-flash');
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
                    'temperature' => 0.95,
                ]
            ];

            $response = \Illuminate\Support\Facades\Http::timeout(60)
                ->acceptJson()
                ->post($url, $payload);

            if ($response->failed()) {
                $errorBody = $response->json('error');
                $errMsg = $errorBody['message'] ?? ('HTTP ' . $response->status());
                Log::error('Gemini API Error (Roast): ' . json_encode($errorBody));
                throw new \Exception('AI Error: ' . $errMsg);
            }

            $data = $response->json();
            $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;

            if (!$text) {
                Log::warning('Gemini empty roast response: ' . $response->body());
                throw new \Exception('AI tidak memberikan respons.');
            }

            // Clean potential markdown wrapping
            $text = trim($text);
            $text = preg_replace('/^```json\s*/i', '', $text);
            $text = preg_replace('/\s*```$/i', '', $text);
            $text = trim($text);

            $parsed = json_decode($text, true);

            if (!$parsed || !isset($parsed['roast_text'])) {
                Log::warning('Gemini invalid JSON roast: ' . $text);
                throw new \Exception('AI mengembalikan format yang tidak valid.');
            }

            // Ensure required keys exist with defaults
            $parsed['badge_name'] = $parsed['badge_name'] ?? 'Si Boros';
            $parsed['badge_emoji'] = $parsed['badge_emoji'] ?? '🔥';
            $parsed['waste_score'] = (int) min(100, max(0, $parsed['waste_score'] ?? 50));
            $parsed['challenge'] = $parsed['challenge'] ?? null;
            $parsed['categories_roasted'] = $parsed['categories_roasted'] ?? [];

            return $parsed;

        } catch (\Exception $e) {
            Log::error('Gemini AI roast exception: ' . $e->getMessage());
            throw $e;
        }
    }
}