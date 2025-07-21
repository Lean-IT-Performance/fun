<?php
/**
 * Endpoint sécurisé pour récupérer les données d'usage OpenAI
 * Garde l'API key côté serveur et expose les données au frontend
 */

// Désactiver l'affichage des erreurs PHP
ini_set('display_errors', 0);
error_reporting(0);

// Headers CORS et sécurité
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Gestion de la requête OPTIONS pour CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Seules les requêtes GET ou POST sont autorisées
if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
    exit();
}

try {
    // Vérifier l'authentification admin
    if (!checkAdminAuth()) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentification admin requise']);
        exit();
    }
    
    // Charger les variables d'environnement
    $envVars = loadEnvFile();
    
    // Utiliser la clé API dédiée à l'admin si elle existe, sinon fallback
    $apiKey = $envVars['OPENAI_API_KEY_ADMIN'] ?? $envVars['OPENAI_API_KEY'] ?? null;
    $orgId = $envVars['OPENAI_ORG_ID'] ?? null;
    $projectId = $envVars['OPENAI_PROJECT_ID'] ?? null;
    
    if (!$apiKey) {
        throw new Exception('OPENAI_API_KEY_ADMIN ou OPENAI_API_KEY manquante dans .env');
    }
    
    // Rendre l'ID de projet optionnel
    $projectIds = $projectId ? [$projectId] : [];
    
    // Récupérer les paramètres de la requête depuis GET
    $startDate = $_GET['start_date'] ?? null;
    $endDate = $_GET['end_date'] ?? null;
    
    // Si les paramètres ne sont pas dans GET, vérifier le corps POST pour la rétrocompatibilité
    if (!$startDate || !$endDate) {
        $input = json_decode(file_get_contents('php://input'), true);
        $startDate = $input['start_date'] ?? $startDate;
        $endDate = $input['end_date'] ?? $endDate;
    }
    
    if (!$startDate || !$endDate) {
        // Dates par défaut si toujours non définies
        $endDate = date('Y-m-d');
        $startDate = date('Y-m-d', strtotime('-30 days'));
    }
    
    // Valider les dates
    if (!validateDate($startDate) || !validateDate($endDate)) {
        throw new Exception('Format de date invalide (YYYY-MM-DD attendu)');
    }
    
    if (strtotime($startDate) > strtotime($endDate)) {
        throw new Exception('La date de début doit être antérieure à la date de fin');
    }
    
    // Faire l'appel à l'API OpenAI Costs
    $usageData = callOpenAIUsageAPI($apiKey, $orgId, $projectIds, $startDate, $endDate);
    
    // Traiter et formater les données
    $processedData = processUsageData($usageData, $startDate, $endDate);
    
    // Réponse avec succès
    echo json_encode([
        'success' => true,
        'data' => $processedData,
        'period' => [
            'start_date' => $startDate,
            'end_date' => $endDate
        ],
        'source' => 'openai_api',
        'timestamp' => date('c')
    ]);
    
} catch (Exception $e) {
    $errorCode = $e->getCode() ?: 500;
    http_response_code($errorCode);
    
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'timestamp' => date('c')
    ]);
}

/**
 * Vérifier l'authentification admin basique
 */
function checkAdminAuth() {
    // Pour simplifier, on peut vérifier un token simple ou utiliser les sessions
    // Ici on fait une vérification basique
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';

    // Refuser si aucun header Authorization n'est présent
    if (empty($authHeader)) {
        return false;
    }
    
    // Vérifier le token si présent
    if (strpos($authHeader, 'Bearer ') === 0) {
        $token = substr($authHeader, 7);
        // Ici vous pouvez valider le token contre votre système
        return !empty($token);
    }
    
    return false;
}

/**
 * Charger le fichier .env
 */
function loadEnvFile() {
    $currentDir = __DIR__;
    $envFile = $currentDir . '/../../.env';
    
    // Essayer différents emplacements
    $possiblePaths = [
        $currentDir . '/../../.env',
        $currentDir . '/../.env',
        $currentDir . '/.env',
        $_SERVER['DOCUMENT_ROOT'] . '/.env'
    ];
    
    $envFile = null;
    foreach ($possiblePaths as $path) {
        if (file_exists($path) && is_readable($path)) {
            $envFile = $path;
            break;
        }
    }
    
    if (!$envFile) {
        throw new Exception('Fichier .env non trouvé');
    }
    
    $envContent = file_get_contents($envFile);
    if ($envContent === false) {
        throw new Exception('Impossible de lire le fichier .env');
    }
    
    // Parser le fichier .env
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
    
    return $envVars;
}

/**
 * Valider le format de date
 */
function validateDate($date) {
    $d = DateTime::createFromFormat('Y-m-d', $date);
    return $d && $d->format('Y-m-d') === $date;
}

/**
 * Appeler l'API OpenAI Usage
 */
function callOpenAIUsageAPI($apiKey, $orgId, $projectIds, $startDate, $endDate) {
    // Utilisation de l'endpoint officiel /v1/organization/costs
    // Conversion des dates en timestamps Unix
    $startTime = strtotime($startDate . ' 00:00:00');
    // end_time est exclusif, donc on prend le début du jour suivant
    $endTime = strtotime($endDate . ' 00:00:00') + 86400;

    $params = [
        'start_time' => $startTime,
        'end_time' => $endTime,
        'bucket_width' => '1d',
        'limit' => 180 // Limite maximale pour récupérer le plus de données possible
    ];
    
    // Ajouter les IDs de projet si fournis
    if (!empty($projectIds)) {
        $params['project_ids'] = $projectIds;
    }

    $url = 'https://api.openai.com/v1/organization/costs?' . http_build_query($params);
    
    $headers = ['Authorization: Bearer ' . $apiKey];
    if ($orgId) {
        $headers[] = 'OpenAI-Organization: ' . $orgId;
    }
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPGET => true,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_USERAGENT => 'FunLeanIT-Admin/1.0'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    if ($curlError) throw new Exception('Erreur cURL: ' . $curlError);
    
    if ($httpCode !== 200) {
        $errorResponse = json_decode($response, true);
        $errorMessage = $errorResponse['error']['message'] ?? ('Erreur API - Statut ' . $httpCode);
        throw new Exception('Erreur API OpenAI (' . $httpCode . '): ' . $errorMessage, $httpCode);
    }
    
    $data = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) throw new Exception('Réponse API OpenAI invalide (JSON malformé)');
    
    return $data;
}

/**
 * Traiter les données de l'API organization/costs
 */
function processUsageData($rawData, $startDate, $endDate) {
    if (!isset($rawData['data']) || !is_array($rawData['data'])) {
        throw new Exception('Structure de données de facturation inattendue (champ data manquant)');
    }
    
    $costByDay = [];
    $totalCostForPeriod = 0;
    $totalRequests = 0;
    $totalTokens = 0;

    foreach ($rawData['data'] as $bucket) {
        $itemDate = date('Y-m-d', $bucket['start_time']);
        $dailyTotal = 0;
        if (isset($bucket['results']) && is_array($bucket['results'])) {
            foreach ($bucket['results'] as $result) {
                $dailyTotal += $result['amount']['value'] ?? 0;
            }
        }
        $costByDay[] = [
            'date' => $itemDate,
            'cost' => round($dailyTotal, 4),
            // L'API Costs ne fournit pas ces détails, on les laisse à 0
            'requests' => 0, 
            'tokens' => 0
        ];
        $totalCostForPeriod += $dailyTotal;
    }
    
    usort($costByDay, fn($a, $b) => strcmp($a['date'], $b['date']));
    
    $avgCost = $totalRequests > 0 ? $totalCostForPeriod / $totalRequests : 0;
    
    return [
        'monthlyCost' => round($totalCostForPeriod, 4),
        'costByDay' => $costByDay,
        'dataSource' => 'openai_costs_api',
        // Métriques non disponibles avec l'API Costs
        'dailyRequests' => 0, 
        'monthlyRequests' => 0, 
        'tokensUsed' => 0,
        'avgCostPerRequest' => 0, 
        'modelUsage' => [], 
        'totalDays' => count($costByDay)
    ];
}

?> 