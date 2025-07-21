<?php
/**
 * Endpoint sécurisé pour la génération de recettes avec OpenAI
 * Remplace le service worker pour protéger la clé API
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
    // Charger les variables d'environnement
    $envFile = __DIR__ . '/../.env';
    
    // Essayer différents emplacements pour .env
    $alternativePaths = [
        __DIR__ . '/.env',
        __DIR__ . '/../.env',
        __DIR__ . '/../../.env',
        $_SERVER['DOCUMENT_ROOT'] . '/.env'
    ];
    
    $envVars = [];
    $envFound = false;
    
    foreach ($alternativePaths as $envPath) {
        if (file_exists($envPath) && is_readable($envPath)) {
            $envContent = file_get_contents($envPath);
            if ($envContent !== false) {
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
                $envFound = true;
                break;
            }
        }
    }
    
    if (!$envFound) {
        throw new Exception('Fichier .env non trouvé. Veuillez configurer les variables d\'environnement.');
    }
    
    // Récupérer la clé API OpenAI
    $openaiApiKey = $envVars['OPENAI_API_KEY'] ?? null;
    
    if (!$openaiApiKey) {
        throw new Exception('Clé API OpenAI manquante. Veuillez configurer OPENAI_API_KEY dans .env');
    }
    
    // Récupérer et valider les données de la requête
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        throw new Exception('Données JSON invalides');
    }
    
    // Validation des données
    $validationResult = validateRequestData($input);
    if (!$validationResult['isValid']) {
        http_response_code(400);
        echo json_encode([
            'error' => 'Données invalides',
            'details' => implode(', ', $validationResult['errors'])
        ]);
        exit();
    }
    
    // Sanitiser les données
    $sanitizedData = sanitizeRequestData($input);
    
    // Construire les prompts
    $systemPrompt = getSystemPrompt($sanitizedData['mode']);
    $userPrompt = buildRecipePrompt($sanitizedData);

    $allowedModels = ['gpt-4o-mini', 'gpt-4', 'gpt-3.5-turbo'];
    $selectedModel = $sanitizedData['model'];
    if (!$selectedModel || !in_array($selectedModel, $allowedModels)) {
        $selectedModel = $envVars['OPENAI_MODEL'] ?? 'gpt-4o-mini';
    }
    
    // Préparer la requête vers OpenAI
    $openaiRequest = [
        'model' => $selectedModel,
        'messages' => [
            [
                'role' => 'system',
                'content' => $systemPrompt
            ],
            [
                'role' => 'user',
                'content' => $userPrompt
            ]
        ],
        'max_tokens' => $sanitizedData['mode'] === 'suggestions' ? 800 : 1500,
        'temperature' => 0.8
    ];
    
    // Appel à l'API OpenAI
    $response = callOpenAI($openaiApiKey, $openaiRequest);
    
    if (!$response['success']) {
        throw new Exception($response['error']);
    }
    
    // Parser la réponse
    $result = parseOpenAIResponse($response['data'], $sanitizedData['mode']);
    
    // Log de l'usage (optionnel)
    logAPIUsage([
        'model' => $selectedModel,
        'tokens' => $response['data']['usage']['total_tokens'] ?? 0,
        'mode' => $sanitizedData['mode'],
        'timestamp' => date('Y-m-d H:i:s'),
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
    ]);
    
    // Réponse de succès
    echo json_encode([
        'success' => true,
        ...$result,
        'usage' => $response['data']['usage'] ?? null
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Erreur serveur interne',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}

/**
 * Valider les données de la requête
 */
function validateRequestData($data) {
    $errors = [];
    
    // Vérifier les ingrédients
    if (!isset($data['ingredients']) || !is_array($data['ingredients']) || empty($data['ingredients'])) {
        $errors[] = 'Au moins un ingrédient est requis';
    }
    
    // Vérifier le nombre de convives
    $convives = isset($data['convives']) ? (int)$data['convives'] : 0;
    if ($convives < 1 || $convives > 20) {
        $errors[] = 'Nombre de convives invalide (1-20)';
    }
    
    // Vérifier le mode
    $validModes = ['suggestions', 'detailed'];
    if (!isset($data['mode']) || !in_array($data['mode'], $validModes)) {
        $errors[] = 'Mode invalide (suggestions ou detailed requis)';
    }
    
    // Vérifier les contraintes autorisées
    $allowedConstraints = ['vegetarien', 'vegan', 'sans-gluten', 'sans-lactose', 'halal', 'casher'];
    if (isset($data['contraintes']) && is_array($data['contraintes'])) {
        $invalidConstraints = array_diff($data['contraintes'], $allowedConstraints);
        if (!empty($invalidConstraints)) {
            $errors[] = 'Contraintes non autorisées: ' . implode(', ', $invalidConstraints);
        }
    }

    $allowedModels = ['gpt-4o-mini', 'gpt-4', 'gpt-3.5-turbo'];
    if (isset($data['model']) && !in_array($data['model'], $allowedModels)) {
        $errors[] = 'Modèle OpenAI invalide';
    }
    
    return [
        'isValid' => empty($errors),
        'errors' => $errors
    ];
}

/**
 * Sanitiser les données de la requête
 */
function sanitizeRequestData($data) {
    $sanitized = [];
    
    // Sanitiser les ingrédients
    $sanitized['ingredients'] = [];
    if (isset($data['ingredients']) && is_array($data['ingredients'])) {
        foreach ($data['ingredients'] as $ingredient) {
            $clean = sanitizeString($ingredient);
            if (!empty($clean)) {
                $sanitized['ingredients'][] = $clean;
            }
        }
    }
    
    // Sanitiser les autres champs
    $sanitized['convives'] = min(20, max(1, (int)($data['convives'] ?? 4)));
    $sanitized['typePublic'] = sanitizeString($data['typePublic'] ?? 'adultes');
    $sanitized['difficulte'] = sanitizeString($data['difficulte'] ?? 'facile');
    $sanitized['tempsDisponible'] = sanitizeString($data['tempsDisponible'] ?? '30min');
    $sanitized['typeRepas'] = sanitizeString($data['typeRepas'] ?? 'déjeuner');
    $sanitized['mode'] = in_array($data['mode'] ?? '', ['suggestions', 'detailed']) ? $data['mode'] : 'suggestions';
    $sanitized['chosenRecipe'] = sanitizeString($data['chosenRecipe'] ?? '');
    
    // Sanitiser les tableaux
    $sanitized['contraintes'] = [];
    if (isset($data['contraintes']) && is_array($data['contraintes'])) {
        foreach ($data['contraintes'] as $contrainte) {
            $clean = sanitizeString($contrainte);
            if (!empty($clean)) {
                $sanitized['contraintes'][] = $clean;
            }
        }
    }
    
    $sanitized['materiel'] = [];
    if (isset($data['materiel']) && is_array($data['materiel'])) {
        foreach ($data['materiel'] as $equipment) {
            $clean = sanitizeString($equipment);
            if (!empty($clean)) {
                $sanitized['materiel'][] = $clean;
            }
        }
    }

    $allowedModels = ['gpt-4o-mini', 'gpt-4', 'gpt-3.5-turbo'];
    $model = sanitizeString($data['model'] ?? '');
    $sanitized['model'] = in_array($model, $allowedModels) ? $model : null;

    return $sanitized;
}

/**
 * Sanitiser une chaîne de caractères
 */
function sanitizeString($input) {
    if (!is_string($input)) return '';
    
    return trim(strip_tags(substr($input, 0, 100)));
}

/**
 * Obtenir le prompt système selon le mode
 */
function getSystemPrompt($mode = 'suggestions') {
    if ($mode === 'suggestions') {
        return 'Tu es un chef cuisinier expert spécialisé dans la création de suggestions de recettes personnalisées et anti-gaspillage.

MISSION : Génère 3 suggestions de recettes différentes basées uniquement sur les ingrédients fournis.

RÈGLES ABSOLUES :
1. Utilise UNIQUEMENT les ingrédients listés + condiments de base (sel, poivre, huile, épices courantes)
2. Propose 3 recettes VRAIMENT différentes (techniques, styles, origines culinaires variées)
3. Adapte au nombre de convives et type de public
4. Respecte STRICTEMENT toutes les contraintes alimentaires
5. Privilégie des techniques simples et accessibles
6. Donne des informations concises mais attractives

FORMAT DE RÉPONSE (JSON strict) :
{
  "suggestions": [
    {
      "id": 1,
      "nom": "Nom accrocheur de la recette 1",
      "description": "Description courte et appétissante (max 2 phrases)",
      "temps_total": "X min",
      "difficulte": "Très facile|Facile|Moyen|Difficile",
      "style": "Français|Italien|Asiatique|Méditerranéen|etc.",
      "points_forts": ["Rapide", "Économique", "Savoureux"],
      "emoji": "🍝"
    },
    {
      "id": 2,
      "nom": "Nom accrocheur de la recette 2",
      "description": "Description courte et appétissante (max 2 phrases)",
      "temps_total": "X min",
      "difficulte": "Très facile|Facile|Moyen|Difficile",
      "style": "Français|Italien|Asiatique|Méditerranéen|etc.",
      "points_forts": ["Sain", "Original", "Réconfortant"],
      "emoji": "🥘"
    },
    {
      "id": 3,
      "nom": "Nom accrocheur de la recette 3",
      "description": "Description courte et appétissante (max 2 phrases)",
      "temps_total": "X min",
      "difficulte": "Très facile|Facile|Moyen|Difficile",
      "style": "Français|Italien|Asiatique|Méditerranéen|etc.",
      "points_forts": ["Créatif", "Festif", "Facile"],
      "emoji": "🍲"
    }
  ]
}

IMPORTANT : Réponds UNIQUEMENT en JSON valide, sans texte avant ou après.';
    } else {
        return 'Tu es un chef cuisinier expert spécialisé dans la création de recettes personnalisées et anti-gaspillage. 

MISSION : Génère UNE SEULE recette détaillée basée uniquement sur les ingrédients fournis.

RÈGLES ABSOLUES :
1. Utilise UNIQUEMENT les ingrédients listés + condiments de base (sel, poivre, huile, épices courantes)
2. Adapte les quantités précisément au nombre de convives
3. Simplifie pour les enfants : moins d\'épices, textures douces, présentation amusante
4. Respecte STRICTEMENT toutes les contraintes alimentaires
5. Si les ingrédients sont insuffisants, propose des alternatives simples
6. Privilégie des techniques simples et accessibles
7. Donne des conseils pratiques pour éviter les échecs

FORMAT DE RÉPONSE (JSON strict) :
{
  "nom": "Nom accrocheur de la recette",
  "description": "Description courte et appétissante",
  "temps_preparation": "X min",
  "temps_cuisson": "X min",
  "difficulte": "Très facile|Facile|Moyen|Difficile",
  "portions": nombre_de_convives,
  "ingredients": [
    {"nom": "ingrédient", "quantite": "nombre", "unite": "g|ml|pièces|c.à.s|c.à.c"}
  ],
  "etapes": [
    "Étape 1 détaillée et claire",
    "Étape 2 avec timing si nécessaire"
  ],
  "conseils": [
    "Conseil pratique 1",
    "Astuce pour réussir"
  ],
  "variantes": "Suggestions de variations selon saison/goûts",
  "temps_total": "X min",
  "niveau_enfants": "Adapté|Avec aide|Déconseillé"
}

IMPORTANT : Réponds UNIQUEMENT en JSON valide, sans texte avant ou après.';
    }
}

/**
 * Construire le prompt utilisateur
 */
function buildRecipePrompt($params) {
    $ingredients = implode(', ', $params['ingredients']);
    $contraintes = !empty($params['contraintes']) ? implode(', ', $params['contraintes']) : 'Aucune';
    $materiel = !empty($params['materiel']) ? implode(', ', $params['materiel']) : 'Basique (casseroles, poêle)';
    
    if ($params['mode'] === 'suggestions') {
        return "Propose 3 suggestions de recettes avec ces paramètres :

INGRÉDIENTS DISPONIBLES : {$ingredients}
NOMBRE DE CONVIVES : {$params['convives']}
TYPE DE PUBLIC : {$params['typePublic']}
CONTRAINTES : {$contraintes}
DIFFICULTÉ SOUHAITÉE : {$params['difficulte']}
TEMPS DISPONIBLE : {$params['tempsDisponible']}
TYPE DE REPAS : {$params['typeRepas']}
MATÉRIEL DISPONIBLE : {$materiel}

Génère 3 suggestions de recettes différentes sous forme de résumés courts pour que l'utilisateur puisse choisir.";
    } else {
        return "Crée une recette détaillée avec ces paramètres :

INGRÉDIENTS DISPONIBLES : {$ingredients}
NOMBRE DE CONVIVES : {$params['convives']}
TYPE DE PUBLIC : {$params['typePublic']}
CONTRAINTES : {$contraintes}
DIFFICULTÉ SOUHAITÉE : {$params['difficulte']}
TEMPS DISPONIBLE : {$params['tempsDisponible']}
TYPE DE REPAS : {$params['typeRepas']}
MATÉRIEL DISPONIBLE : {$materiel}
RECETTE CHOISIE : {$params['chosenRecipe']}

Génère une recette complète et détaillée qui respecte tous ces critères.";
    }
}

/**
 * Appeler l'API OpenAI
 */
function callOpenAI($apiKey, $requestData) {
    $ch = curl_init();
    
    curl_setopt_array($ch, [
        CURLOPT_URL => 'https://api.openai.com/v1/chat/completions',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json'
        ],
        CURLOPT_POSTFIELDS => json_encode($requestData),
        CURLOPT_TIMEOUT => 60,
        CURLOPT_SSL_VERIFYPEER => true
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    
    curl_close($ch);
    
    if ($error) {
        return [
            'success' => false,
            'error' => 'Erreur cURL: ' . $error
        ];
    }
    
    if ($httpCode !== 200) {
        return [
            'success' => false,
            'error' => 'Erreur API OpenAI: HTTP ' . $httpCode
        ];
    }
    
    $data = json_decode($response, true);
    
    if (!$data) {
        return [
            'success' => false,
            'error' => 'Réponse API invalide'
        ];
    }
    
    return [
        'success' => true,
        'data' => $data
    ];
}

/**
 * Parser la réponse OpenAI
 */
function parseOpenAIResponse($data, $mode) {
    if (!isset($data['choices'][0]['message']['content'])) {
        throw new Exception('Réponse OpenAI invalide');
    }
    
    $content = $data['choices'][0]['message']['content'];
    
    // Tentative de parsing JSON
    $result = json_decode($content, true);
    
    if ($result === null) {
        // Fallback si le JSON n'est pas valide
        if ($mode === 'suggestions') {
            $result = ['suggestions' => [parseTextRecipe($content)]];
        } else {
            $result = ['recipe' => parseTextRecipe($content)];
        }
    }
    
    // S'assurer que le format est correct selon le mode
    if ($mode === 'suggestions' && !isset($result['suggestions'])) {
        $result = ['suggestions' => [$result]];
    } elseif ($mode === 'detailed' && !isset($result['recipe'])) {
        $result = ['recipe' => $result];
    }
    
    return $result;
}

/**
 * Parser un texte en recette fallback
 */
function parseTextRecipe($text) {
    return [
        'nom' => 'Recette générée',
        'description' => 'Recette créée à partir de vos ingrédients',
        'temps_preparation' => '20 min',
        'temps_cuisson' => '15 min',
        'difficulte' => 'Facile',
        'portions' => 4,
        'ingredients' => [],
        'etapes' => array_filter(explode("\n", $text)),
        'conseils' => ['Goûtez et ajustez l\'assaisonnement'],
        'variantes' => 'Adaptez selon vos goûts',
        'temps_total' => '35 min',
        'niveau_enfants' => 'Avec aide'
    ];
}

/**
 * Logger l'usage de l'API (optionnel)
 */
function logAPIUsage($data) {
    try {
        $logFile = __DIR__ . '/../logs/openai_usage.log';
        $logDir = dirname($logFile);
        
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
        
        $logEntry = json_encode($data) . "\n";
        file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
    } catch (Exception $e) {
        // Log silencieux en cas d'erreur
        error_log('Erreur logging OpenAI usage: ' . $e->getMessage());
    }
}

?> 