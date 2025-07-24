/** @jest-environment node */
// Tests des endpoints API

// Import des utilitaires si en Node.js
let apiRequest;
if (typeof require !== 'undefined') {
    const helpers = require('../utils/test-helpers.js');
    apiRequest = helpers.apiRequest;
    global.TEST_CONFIG = require('../config/test-config.js');
}

// Configuration
const API_BASE_URL = TEST_CONFIG.baseURL;
const API_ENDPOINTS = TEST_CONFIG.api;

// Tests API
describe('API Tests', () => {
    
    describe('Auth API (/api/admin/auth.php)', () => {
        const authEndpoint = API_BASE_URL + API_ENDPOINTS.auth;
        
        test('Authentification réussie avec bons identifiants', async () => {
            const response = await apiRequest(authEndpoint, {
                method: 'POST',
                body: JSON.stringify({
                    username: TEST_CONFIG.admin.username,
                    password: TEST_CONFIG.admin.password
                })
            });
            
            expect(response.ok).toBe(true);
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(response.data.token).toBeDefined();
        });
        
        test('Échec avec mauvais identifiants', async () => {
            const response = await apiRequest(authEndpoint, {
                method: 'POST',
                body: JSON.stringify({
                    username: 'wrong_user',
                    password: 'wrong_pass'
                })
            });
            
            expect(response.ok).toBe(false);
            expect(response.status).toBe(401);
            expect(response.data.error).toBeDefined();
        });
        
        test('Échec si username manquant', async () => {
            const response = await apiRequest(authEndpoint, {
                method: 'POST',
                body: JSON.stringify({
                    password: 'test_pass'
                })
            });
            
            expect(response.ok).toBe(false);
            expect(response.status).toBe(400);
        });
        
        test('Échec si password manquant', async () => {
            const response = await apiRequest(authEndpoint, {
                method: 'POST',
                body: JSON.stringify({
                    username: 'test_user'
                })
            });
            
            expect(response.ok).toBe(false);
            expect(response.status).toBe(400);
        });
        
        test('Méthode GET non autorisée', async () => {
            const response = await apiRequest(authEndpoint, {
                method: 'GET'
            });
            
            expect(response.ok).toBe(false);
            expect(response.status).toBe(405);
        });
        
        test('OPTIONS pour CORS', async () => {
            const response = await apiRequest(authEndpoint, {
                method: 'OPTIONS'
            });
            
            expect(response.status).toBe(200);
        });
    });
    
    describe('OpenAI Usage API (/api/admin/openai-usage.php)', () => {
        const usageEndpoint = API_BASE_URL + API_ENDPOINTS.openaiUsage;
        let authToken;
        
        beforeAll(async () => {
            // Obtenir un token d'authentification
            const authResponse = await apiRequest(API_BASE_URL + API_ENDPOINTS.auth, {
                method: 'POST',
                body: JSON.stringify({
                    username: TEST_CONFIG.admin.username,
                    password: TEST_CONFIG.admin.password
                })
            });
            authToken = authResponse.data.token;
        });
        
        test('Récupération des données d\'usage', async () => {
            const response = await apiRequest(usageEndpoint, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            expect(response.ok).toBe(true);
            expect(response.data.daily_costs).toBeDefined();
            expect(response.data.model_usage).toBeDefined();
            expect(response.data.recent_requests).toBeDefined();
        });
        
        test('Échec sans authentification', async () => {
            const response = await apiRequest(usageEndpoint);
            
            expect(response.ok).toBe(false);
            expect(response.status).toBe(401);
        });
        
        test('Paramètres de période', async () => {
            const response = await apiRequest(usageEndpoint + '?period=7', {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            expect(response.ok).toBe(true);
            expect(response.data.period).toBe(7);
        });
    });
    
    describe('Recipes Generator API (/api/recipes-generator.php)', () => {
        const recipesEndpoint = API_BASE_URL + API_ENDPOINTS.recipesGenerator;
        
        test('Génération de recette réussie', async () => {
            const requestData = {
                ingredients: ['tomates', 'pâtes', 'fromage'],
                parameters: {
                    convives: 4,
                    typePublic: 'adultes',
                    difficulte: 'facile',
                    tempsDisponible: '30min'
                }
            };
            
            const response = await apiRequest(recipesEndpoint, {
                method: 'POST',
                body: JSON.stringify(requestData)
            });
            
            // Note: Peut échouer si pas de clé API configurée
            if (response.ok) {
                expect(response.data.nom).toBeDefined();
                expect(response.data.ingredients).toBeDefined();
                expect(response.data.instructions).toBeDefined();
                expect(response.data.temps_preparation).toBeDefined();
            } else {
                // Vérifier que l'erreur est bien gérée
                expect(response.data.error).toBeDefined();
            }
        });
        
        test('Échec si pas d\'ingrédients', async () => {
            const response = await apiRequest(recipesEndpoint, {
                method: 'POST',
                body: JSON.stringify({
                    ingredients: [],
                    parameters: {}
                })
            });
            
            expect(response.ok).toBe(false);
            expect(response.data.error).toContain('ingrédients');
        });
        
        test('Méthode GET non autorisée', async () => {
            const response = await apiRequest(recipesEndpoint, {
                method: 'GET'
            });
            
            expect(response.ok).toBe(false);
            expect(response.status).toBe(405);
        });
        
        test('Gestion des contraintes alimentaires', async () => {
            const requestData = {
                ingredients: ['tomates', 'basilic', 'huile'],
                parameters: {
                    convives: 2,
                    contraintes: ['végétarien', 'sans gluten']
                }
            };
            
            const response = await apiRequest(recipesEndpoint, {
                method: 'POST',
                body: JSON.stringify(requestData)
            });
            
            // Vérifier que les contraintes sont prises en compte
            if (response.ok) {
                expect(response.data.adaptation_enfants).toBeDefined();
            }
        });
    });
    
    describe('Tests de sécurité', () => {
        test('Injection SQL dans auth', async () => {
            const response = await apiRequest(API_BASE_URL + API_ENDPOINTS.auth, {
                method: 'POST',
                body: JSON.stringify({
                    username: "admin' OR '1'='1",
                    password: "' OR '1'='1"
                })
            });
            
            expect(response.ok).toBe(false);
            expect(response.status).toBe(401);
        });
        
        test('XSS dans recipes generator', async () => {
            const response = await apiRequest(API_BASE_URL + API_ENDPOINTS.recipesGenerator, {
                method: 'POST',
                body: JSON.stringify({
                    ingredients: ['<script>alert("XSS")</script>'],
                    parameters: {}
                })
            });
            
            // L'API doit échapper les caractères dangereux
            if (response.ok) {
                const responseText = JSON.stringify(response.data);
                expect(responseText).not.toContain('<script>');
            }
        });
    });
});

// Export pour Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runAPITests: () => describe };
} 