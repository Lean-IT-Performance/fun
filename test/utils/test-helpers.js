// Fonctions utilitaires pour les tests

// Simuler une attente
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Créer un utilisateur de test pour Sobre
function createTestUser() {
    return {
        weight: 70,
        gender: 'male',
        driverType: 'experienced'
    };
}

// Créer des boissons de test
function createTestDrinks() {
    return [
        {
            type: 'beer-standard',
            volume: 330,
            alcoholContent: 5.0,
            time: new Date().toISOString()
        },
        {
            type: 'wine-red',
            volume: 120,
            alcoholContent: 13.0,
            time: new Date(Date.now() - 3600000).toISOString() // 1 heure avant
        }
    ];
}

// Créer des ingrédients de test pour recettes
function createTestIngredients() {
    return ['tomates', 'pâtes', 'fromage', 'basilic', 'huile d\'olive'];
}

// Vérifier si un élément existe
async function elementExists(selector, timeout = 3000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        const element = document.querySelector(selector);
        if (element) return true;
        await wait(100);
    }
    return false;
}

// Simuler un clic
async function clickElement(selector) {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);
    element.click();
    await wait(100);
}

// Simuler une saisie de texte
async function typeText(selector, text) {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);
    element.value = text;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    await wait(100);
}

// Vérifier le texte d'un élément
function getElementText(selector) {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);
    return element.textContent.trim();
}

// Vérifier si une classe existe sur un élément
function hasClass(selector, className) {
    const element = document.querySelector(selector);
    if (!element) return false;
    return element.classList.contains(className);
}

// Faire une requête API
async function apiRequest(url, options = {}) {
    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.json();
    
    return {
        ok: response.ok,
        status: response.status,
        data: data
    };
}

// Nettoyer le localStorage
function clearStorage() {
    localStorage.clear();
    sessionStorage.clear();
}

// Capturer les erreurs console
function captureConsoleErrors() {
    const errors = [];
    const originalError = console.error;
    
    console.error = function(...args) {
        errors.push(args.join(' '));
        originalError.apply(console, args);
    };
    
    return {
        errors,
        restore: () => {
            console.error = originalError;
        }
    };
}

// Export pour Node.js et navigateur
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        wait,
        createTestUser,
        createTestDrinks,
        createTestIngredients,
        elementExists,
        clickElement,
        typeText,
        getElementText,
        hasClass,
        apiRequest,
        clearStorage,
        captureConsoleErrors
    };
} 