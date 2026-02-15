<?php

require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Gemini\Laravel\Facades\Gemini;

$candidates = [
    'gemini-3-flash-preview', 
    'gemini-3-pro-preview',
    'gemini-experimental'
];

echo "API Key: " . substr(env('GEMINI_API_KEY'), 0, 5) . "...\n";

foreach ($candidates as $model) {
    echo "Testing $model ... ";
    try {
        $result = Gemini::generativeModel($model)->generateContent('Hi');
        echo "SUCCESS!\n";
    } catch (\Exception $e) {
        $msg = $e->getMessage();
        if (strpos($msg, '404') !== false) echo "NOT FOUND\n";
        elseif (strpos($msg, '429') !== false) echo "RATE LIMIT\n";
        else echo "ERROR: $msg\n";
    }
}
