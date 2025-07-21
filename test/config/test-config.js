// Configuration globale pour les tests
const TEST_CONFIG = {
    // URL de base pour les tests (changez selon votre environnement)
    baseURL: process.env.TEST_URL || 'http://localhost:8080',
    
    // Timeouts
    timeout: {
        default: 5000,
        api: 10000,
        ui: 3000
    },
    
    // Credentials de test
    admin: {
        username: process.env.TEST_ADMIN_USER || 'test_admin',
        password: process.env.TEST_ADMIN_PASS || 'test_password'
    },
    
    // Configuration des endpoints API
    api: {
        auth: '/api/admin/auth.php',
        openaiUsage: '/api/admin/openai-usage.php',
        recipesGenerator: '/api/recipes-generator.php'
    },
    
    // Configuration des pages
    pages: {
        home: '/',
        sobre: '/sobre/',
        recettes: '/recettes/',
        admin: '/admin/'
    },
    
    // Options de test
    options: {
        headless: true,
        screenshot: true,
        video: false,
        retry: 2
    }
};

// Export pour Node.js et navigateur
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TEST_CONFIG;
} 