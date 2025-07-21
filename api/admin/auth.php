<?php
/**
 * Endpoint d'authentification admin sécurisé
 * Valide les credentials contre les variables d'environnement
 */

// Désactiver l'affichage des erreurs PHP pour éviter l'HTML dans la réponse JSON
ini_set('display_errors', 0);
error_reporting(0);

// Headers CORS et sécurité
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Gestion de la requête OPTIONS pour CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Seules les requêtes POST sont autorisées
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
    exit();
}

try {
    // Debug : Vérifier le chemin actuel
    $currentDir = __DIR__;
    $envFile = $currentDir . '/../../.env';
    
    // Debug étape par étape
    $debug = [
        'current_dir' => $currentDir,
        'env_file_path' => $envFile,
        'env_file_exists' => file_exists($envFile),
        'env_file_readable' => is_readable($envFile)
    ];
    
    // Charger les variables d'environnement
    if (!file_exists($envFile)) {
        // Essayer d'autres emplacements possibles
        $alternativePaths = [
            $currentDir . '/.env',
            $currentDir . '/../.env',
            $currentDir . '/../../.env',
            $_SERVER['DOCUMENT_ROOT'] . '/.env'
        ];
        
        $found = false;
        foreach ($alternativePaths as $altPath) {
            if (file_exists($altPath)) {
                $envFile = $altPath;
                $found = true;
                $debug['found_alternative'] = $altPath;
                break;
            }
        }
        
        if (!$found) {
            $debug['tried_paths'] = $alternativePaths;
            throw new Exception('Fichier .env non trouvé dans aucun emplacement. Debug: ' . json_encode($debug));
        }
    }
    
    if (!is_readable($envFile)) {
        throw new Exception('Fichier .env trouvé mais non lisible: ' . $envFile);
    }
    
    // Lire le contenu du fichier .env manuellement (plus robuste que parse_ini_file)
    $envContent = file_get_contents($envFile);
    if ($envContent === false) {
        throw new Exception('Impossible de lire le contenu du fichier .env');
    }
    
    // Parser manuellement le fichier .env
    $envVars = [];
    $lines = explode("\n", $envContent);
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line) || $line[0] === '#') {
            continue;
        }
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $envVars[trim($key)] = trim($value);
        }
    }
    
    // Récupérer les credentials attendus
    $expectedUsername = $envVars['ADMIN_USERNAME'] ?? null;
    $expectedPassword = $envVars['ADMIN_PASSWORD'] ?? null;
    
    if (!$expectedUsername || !$expectedPassword) {
        $debug['env_vars_found'] = array_keys($envVars);
        throw new Exception('Variables ADMIN_USERNAME et ADMIN_PASSWORD manquantes dans .env. Variables trouvées: ' . json_encode($debug['env_vars_found']));
    }
    
    // Récupérer les données de la requête
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        throw new Exception('Données JSON invalides');
    }
    
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';
    $debugMode = $input['debug'] ?? false; // Mode debug pour les tests
    
    if (empty($username) || empty($password)) {
        throw new Exception('Username et password requis');
    }
    
    // Validation des credentials
    $isValid = ($username === $expectedUsername) && ($password === $expectedPassword);
    
    // Log de tentative de connexion (optionnel)
    $logData = [
        'timestamp' => date('Y-m-d H:i:s'),
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'username' => $username,
        'success' => $isValid
    ];
    
    // Réponse
    if ($isValid) {
        echo json_encode([
            'valid' => true,
            'message' => 'Authentification réussie',
            'debug' => $debug // Inclure debug en cas de succès
        ]);
    } else {
        http_response_code(401);
        $response = [
            'valid' => false,
            'message' => 'Identifiants invalides'
        ];
        
        // Inclure les infos de debug si c'est demandé (pour les tests de configuration)
        if ($debugMode) {
            $response['debug'] = $debug;
            $response['note'] = 'Debug activé - Informations de configuration disponibles';
        }
        
        echo json_encode($response);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'valid' => false,
        'error' => $e->getMessage(),
        'debug' => $debug ?? []
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'valid' => false,
        'error' => 'Erreur serveur: ' . $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
?> 