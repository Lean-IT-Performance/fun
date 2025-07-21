<?php


// Headers CORS et sécurité
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Gestion de la requête OPTIONS pour CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Test du fichier .env
    $currentDir = __DIR__;
    $envFile = $currentDir . '/../../.env';
    
    // Essayer différents emplacements
    $possiblePaths = [
        $currentDir . '/../../.env',
        $currentDir . '/../.env',
        $currentDir . '/.env',
        $_SERVER['DOCUMENT_ROOT'] . '/.env'
    ];
    
    $debug = [
        'current_dir' => $currentDir,
        'tried_paths' => [],
        'found_path' => null,
        'env_file_exists' => false,
        'env_file_readable' => false,
        'env_vars_found' => [],
        'php_version' => phpversion(),
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'unknown'
    ];
    
    $envFile = null;
    foreach ($possiblePaths as $path) {
        $debug['tried_paths'][] = [
            'path' => $path,
            'exists' => file_exists($path),
            'readable' => file_exists($path) ? is_readable($path) : false
        ];
        
        if (file_exists($path) && is_readable($path)) {
            $envFile = $path;
            $debug['found_path'] = $path;
            $debug['env_file_exists'] = true;
            $debug['env_file_readable'] = true;
            break;
        }
    }
    
    if ($envFile) {
        // Lire le fichier .env
        $envContent = file_get_contents($envFile);
        if ($envContent !== false) {
            $lines = explode("\n", $envContent);
            foreach ($lines as $line) {
                $line = trim($line);
                if (empty($line) || $line[0] === '#') {
                    continue;
                }
                if (strpos($line, '=') !== false) {
                    list($key, $value) = explode('=', $line, 2);
                    $key = trim($key);
                    
                    // Ne pas exposer les valeurs, juste les clés
                    $debug['env_vars_found'][] = [
                        'key' => $key,
                        'has_value' => !empty(trim($value)),
                        'value_length' => strlen(trim($value))
                    ];
                }
            }
        }
    }
    
    // Test des fonctions PHP nécessaires
    $debug['php_functions'] = [
        'curl_init' => function_exists('curl_init'),
        'json_encode' => function_exists('json_encode'),
        'file_get_contents' => function_exists('file_get_contents'),
        'file_exists' => function_exists('file_exists'),
        'is_readable' => function_exists('is_readable')
    ];
    
    // Test de connectivité (si possible)
    $debug['connectivity'] = [
        'can_make_requests' => function_exists('curl_init') || function_exists('file_get_contents')
    ];
    
    // Réponse de diagnostic
    echo json_encode([
        'success' => true,
        'message' => 'Diagnostic de configuration',
        'debug' => $debug,
        'recommendations' => [
            'env_file' => $envFile ? 'Fichier .env trouvé et accessible' : 'Fichier .env non trouvé ou non accessible',
            'required_vars' => 'Vérifiez que OPENAI_API_KEY_ADMIN (ou OPENAI_API_KEY) et OPENAI_ORG_ID sont présents',
            'security' => 'Désactivez ce endpoint en production'
        ],
        'timestamp' => date('c')
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'debug' => $debug ?? [],
        'timestamp' => date('c')
    ]);
}
?> 