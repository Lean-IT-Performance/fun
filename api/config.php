<?php
/**
 * Configuration endpoint pour les applications client-side
 * Retourne une configuration de base sans exposer de secrets
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Configuration publique (sans secrets)
$config = [
    'openai' => [
        'model' => 'gpt-4o-mini',
        'maxTokens' => 1500,
        'temperature' => 0.8,
        'apiKey' => null // Ne jamais exposer la clé API côté client
    ],
    'app' => [
        'name' => 'Fun Lean IT Performance',
        'version' => '1.0.0',
        'environment' => 'production'
    ],
    'features' => [
        'recettes' => true,
        'sobre' => true,
        'admin' => true
    ]
];

echo json_encode($config, JSON_PRETTY_PRINT);
?>