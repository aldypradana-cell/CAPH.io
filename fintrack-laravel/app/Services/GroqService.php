<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GroqService
{
    protected $apiKey;
    protected $baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
    protected $model;

    public function __construct()
    {
        $this->apiKey = env('GROQ_API_KEY');
        $this->model = env('GROQ_MODEL', 'llama-3.3-70b-versatile');
    }

    /**
     * Parse natural language input into transaction array using Groq
     */
    public function parseNaturalLanguageTransaction(string $input): array
    {
        try {
            $today = now()->format('Y-m-d');
            
            $systemPrompt = "You are a financial transaction parser. 
Analyze the user's input and extract transaction data.
Return ONLY a valid JSON array of objects.
Each object must have:
- description (string): Brief description (do NOT include hashtags in description)
- amount (number): Amount in IDR (pure number)
- type (string): 'INCOME' or 'EXPENSE'
- category (string): Relevant category (e.g., Makanan, Transport, Gaji)
- date (string): ISO format YYYY-MM-DD. Default to {$today} if not specified.
- tags (array of strings): Extract tags from the input. Rules:
  1. Any word starting with '#' becomes a tag (remove the # symbol).
  2. If the description contains notable context keywords (brand names, places, habits), suggest them as tags.
  3. If no tags are found, return an empty array [].

Input Example: 'Makan siang 15rb #hemat, beli bensin di Shell 20rb #kendaraan'
Output Example:
[
  {\"description\": \"Makan siang\", \"amount\": 15000, \"type\": \"EXPENSE\", \"category\": \"Makanan\", \"date\": \"{$today}\", \"tags\": [\"hemat\"]},
  {\"description\": \"Beli bensin di Shell\", \"amount\": 20000, \"type\": \"EXPENSE\", \"category\": \"Transportasi\", \"date\": \"{$today}\", \"tags\": [\"kendaraan\", \"Shell\"]}
]
NO explanations. JUST JSON.";

            // Setup stream context options to bypass cURL issues
            $options = [
                'http' => [
                    'header'  => "Content-type: application/json\r\n" .
                               "Authorization: Bearer {$this->apiKey}\r\n" .
                               "Connection: close\r\n",
                    'method'  => 'POST',
                    'content' => json_encode([
                        'model' => $this->model,
                        'messages' => [
                            ['role' => 'system', 'content' => $systemPrompt],
                            ['role' => 'user', 'content' => $input]
                        ],
                        'temperature' => 0.1, // precision
                        'response_format' => ['type' => 'json_object']
                    ]),
                    'ignore_errors' => true,
                    'timeout' => 3
                ],
                'ssl' => [
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                ],
                // Force IPv4 to avoid Connection Reset on Windows (common issue)
                'socket' => [
                    'bindto' => '0:0'
                ]
            ];

            $context  = stream_context_create($options);
            $result = file_get_contents($this->baseUrl, false, $context);

            if ($result === false) {
                $error = error_get_last();
                Log::error('Groq Stream Error: ' . json_encode($error));
                throw new \Exception('Failed to connect to Groq via Stream.');
            }
            
            $data = json_decode($result, true);
            
            // Check for API errors in response
            if (isset($data['error'])) {
                 Log::error('Groq API Error: ' . json_encode($data['error']));
                 throw new \Exception('Groq API Error: ' . ($data['error']['message'] ?? 'Unknown error'));
            }

            $content = $data['choices'][0]['message']['content'] ?? null;
            
            if (!$content) {
                return [];
            }

            // Clean up potentially wrapped JSON (markdown code blocks)
            $content = str_replace(['```json', '```'], '', $content);
            $data = json_decode($content, true);

            // If result is wrapped in an object key like "transactions", extract it
            if (isset($data['transactions']) && is_array($data['transactions'])) {
                return $data['transactions'];
            }

            // If it's already an array, return it
            if (is_array($data) && array_is_list($data)) {
                return $data;
            }
            
            // If single object, wrap in array
            if (is_array($data)) {
                return [$data];
            }

            return [];

        } catch (\Exception $e) {
            Log::error('Groq Parsing Error: ' . $e->getMessage());
            throw new \Exception('Gagal memproses dengan Groq AI: ' . $e->getMessage());
        }
    }

    /**
     * Analyze financial data and provide insights
     */
    public function analyzeFinancials(\App\Models\User $user, $summary, $profileContext): string
    {
        try {
            $systemPrompt = "You are a friendly and strategic Financial Planner. 
Analyze the provided financial data and user profile.
Return the analysis in **Indonesian (Bahasa Indonesia)** using valid **Markdown**.
Keep it concise, encouraging, and actionable.

Structure your response sections as follows:
1. **🔍 Cashflow Health**: Brief comment on Income vs Expense.
2. **🛡️ Risk & Emergency**: Assessment based on their job stability vs spending.
3. **💡 Smart Insight**: One key observation about their spending habits (e.g., spending too much on Coffee).
4. **🚀 3 Actionable Tips**: Three bullet points of what to do next to improve.

Do not use H1 (#). Start with H2 (##) or bold text.";

            $userPrompt = "Profile:\n{$profileContext}\n\nRecent Transactions Summary:\n{$summary}\n\nPlease analyze.";

            // Setup stream context options to bypass cURL issues
            $options = [
                'http' => [
                    'header'  => "Content-type: application/json\r\n" .
                               "Authorization: Bearer {$this->apiKey}\r\n" .
                               "Connection: close\r\n",
                    'method'  => 'POST',
                    'content' => json_encode([
                        'model' => $this->model,
                        'messages' => [
                            ['role' => 'system', 'content' => $systemPrompt],
                            ['role' => 'user', 'content' => $userPrompt]
                        ],
                        'temperature' => 0.3, 
                        'max_tokens' => 1000
                    ]),
                    'ignore_errors' => true,
                    'timeout' => 10 // longer timeout for analysis
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
            $result = file_get_contents($this->baseUrl, false, $context);

            if ($result === false) {
                Log::error('Groq Insight Error');
                return "Maaf, sistem analisis sedang sibuk. Coba lagi nanti.";
            }
            
            $data = json_decode($result, true);
            return $data['choices'][0]['message']['content'] ?? "Gagal mendapatkan analisis.";

        } catch (\Exception $e) {
            Log::error('Groq Insight Exception: ' . $e->getMessage());
            return "Terjadi kesalahan sistem saat analisis.";
        }
    }
}
