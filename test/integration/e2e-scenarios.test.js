/** @jest-environment node */
// Tests d'intégration End-to-End
const { setupBrowser, teardownBrowser } = require('../utils/playwright-setup.js');

describe('Scénarios E2E', () => {
    
    beforeAll(async () => {
        await setupBrowser();
    });

    describe('Parcours utilisateur Sobre', () => {
        test('Parcours complet : configuration, ajout de boissons, calcul BAC', async () => {
            // 1. Aller sur la page d'accueil
            await page.goto(TEST_CONFIG.baseURL);
            expect(await page.title()).toContain('Fun Lean IT Performance');
            
            // 2. Naviguer vers Sobre
            await page.click('a[href="sobre/index.html"]');
            await page.waitForLoadState('networkidle');
            
            // 3. Configurer le profil
            await page.fill('#weight', '75');
            await page.selectOption('#gender', 'male');
            await page.selectOption('#driver-type', 'experienced');
            await page.click('#profile-form button[type="submit"]');
            
            // 4. Vérifier qu'on est sur la session
            const sessionVisible = await page.isVisible('#session-section');
            expect(sessionVisible).toBe(true);
            
            // 5. Ajouter une première boisson (bière)
            await page.selectOption('#drink-type', 'beer-standard');
            await page.click('[data-container="pinte"]'); // 500ml
            await page.click('[data-state="eating"]'); // En mangeant
            await page.click('#add-drink-btn');
            
            // 6. Attendre et ajouter une deuxième boisson
            await page.waitForTimeout(1000);
            await page.selectOption('#drink-type', 'wine-red');
            await page.click('[data-container="verre-vin"]'); // 120ml
            await page.click('#add-drink-btn');
            
            // 7. Vérifier le calcul du BAC
            const bacText = await page.textContent('#current-bac');
            const bacValue = parseFloat(bacText);
            expect(bacValue).toBeGreaterThan(0);
            expect(bacValue).toBeLessThan(0.1); // Raisonnable pour ces boissons
            
            // 8. Vérifier l'indicateur de conduite
            const drivingStatus = await page.textContent('.driving-status');
            expect(drivingStatus).toBeTruthy();
            
            // 9. Aller voir le graphique
            await page.click('[data-tab="chart"]');
            await page.waitForTimeout(500);
            
            // 10. Vérifier que le graphique est affiché
            const chartCanvas = await page.$('#bac-chart');
            expect(chartCanvas).toBeTruthy();
        });
    });
    
    describe('Parcours utilisateur Recettes', () => {
        test('Parcours complet : ingrédients, paramètres, génération IA', async () => {
            // 1. Naviguer vers Recettes
            await page.goto(TEST_CONFIG.baseURL + TEST_CONFIG.pages.recettes);
            
            // 2. Ajouter des ingrédients via suggestions rapides
            await page.click('.quick-ingredient:has-text("Tomates")');
            await page.click('.quick-ingredient:has-text("Pâtes")');
            await page.click('.quick-ingredient:has-text("Fromage")');
            
            // 3. Ajouter un ingrédient personnalisé
            await page.fill('#ingredient-input', 'basilic frais');
            await page.press('#ingredient-input', 'Enter');
            
            // 4. Vérifier que tous les ingrédients sont ajoutés
            const ingredients = await page.$$('.ingredient-tag');
            expect(ingredients.length).toBe(4);
            
            // 5. Ouvrir les options avancées
            await page.click('#toggle-advanced');
            
            // 6. Modifier les paramètres
            await page.fill('#convives-slider', '6');
            await page.selectOption('#type-public', 'mixte');
            await page.check('#constraint-vegetarien');
            
            // 7. Mock la réponse de l'API pour éviter l'appel réel
            await page.route('**/api/recipes-generator.php', route => {
                route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        nom: "Pâtes au fromage et tomates fraîches",
                        description: "Un plat végétarien simple et délicieux pour toute la famille",
                        temps_preparation: "15 minutes",
                        temps_cuisson: "20 minutes",
                        portions: 6,
                        niveau_difficulte: "Facile",
                        ingredients: [
                            { nom: "Pâtes", quantite: "600g" },
                            { nom: "Tomates", quantite: "8 moyennes" },
                            { nom: "Fromage râpé", quantite: "200g" },
                            { nom: "Basilic frais", quantite: "1 bouquet" }
                        ],
                        instructions: [
                            "Faire cuire les pâtes al dente",
                            "Couper les tomates en dés",
                            "Faire revenir les tomates avec le basilic",
                            "Mélanger avec les pâtes et le fromage"
                        ],
                        conseils: ["Parfait pour les enfants", "Peut être préparé à l'avance"],
                        adaptation_enfants: "Excellent choix pour les enfants"
                    })
                });
            });
            
            // 8. Générer la recette
            await page.click('#generate-ai-recipe');
            
            // 9. Attendre l'affichage
            await page.waitForSelector('.recipe-card', { timeout: 10000 });
            
            // 10. Vérifier le contenu de la recette
            const recipeName = await page.textContent('.recipe-card h2');
            expect(recipeName).toContain('Pâtes');
            
            const portions = await page.textContent('.recipe-meta');
            expect(portions).toContain('6 portions');
            
            const adaptation = await page.textContent('.adaptation-enfants');
            expect(adaptation).toContain('enfants');
        });
    });
    
    describe('Parcours administrateur', () => {
        test('Login admin et consultation des statistiques', async () => {
            // 1. Aller sur la console admin
            await page.goto(TEST_CONFIG.baseURL + TEST_CONFIG.pages.admin);
            
            // 2. Vérifier qu'on est sur la page de login
            const loginForm = await page.$('#login-form');
            expect(loginForm).toBeTruthy();
            
            // 3. Se connecter avec les identifiants de test
            await page.fill('#username', TEST_CONFIG.admin.username);
            await page.fill('#password', TEST_CONFIG.admin.password);
            
            // Mock la réponse d'authentification
            await page.route('**/api/admin/auth.php', route => {
                route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        token: 'test-token-123'
                    })
                });
            });
            
            // Mock les données d'usage
            await page.route('**/api/admin/openai-usage.php', route => {
                route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        daily_costs: [
                            { date: '2025-01-18', cost: 1.23, requests: 45 },
                            { date: '2025-01-19', cost: 2.34, requests: 67 },
                            { date: '2025-01-20', cost: 1.89, requests: 52 }
                        ],
                        model_usage: {
                            'gpt-4o-mini': { requests: 150, tokens: 45000, cost: 4.50 },
                            'gpt-4': { requests: 14, tokens: 12000, cost: 0.96 }
                        },
                        recent_requests: [
                            {
                                timestamp: '2025-01-20T15:30:00Z',
                                model: 'gpt-4o-mini',
                                tokens_used: 350,
                                cost: 0.035,
                                type: 'recipe_generation'
                            }
                        ],
                        total_cost_month: 5.46,
                        total_requests_month: 164
                    })
                });
            });
            
            // 4. Soumettre le formulaire
            await page.click('#login-form button[type="submit"]');
            
            // 5. Attendre le dashboard
            await page.waitForSelector('#dashboard', { timeout: 5000 });
            
            // 6. Vérifier les statistiques affichées
            const monthCost = await page.textContent('#total-cost-month');
            expect(monthCost).toContain('5.46');
            
            // 7. Vérifier le graphique
            const chartCanvas = await page.$('#cost-chart');
            expect(chartCanvas).toBeTruthy();
            
            // 8. Changer la période
            await page.selectOption('#chart-period', '7');
            
            // 9. Vérifier la mise à jour
            await page.waitForTimeout(500);
            
            // 10. Se déconnecter
            await page.click('#logout-btn');
            const loggedOut = await page.isVisible('#login-form');
            expect(loggedOut).toBe(true);
        });
    });
    
    describe('Tests de navigation et responsive', () => {
        test('Navigation entre toutes les pages', async () => {
            // Page d'accueil
            await page.goto(TEST_CONFIG.baseURL);
            expect(await page.title()).toBeTruthy();
            
            // Sobre
            await page.click('a[href="sobre/index.html"]');
            await page.waitForLoadState('networkidle');
            expect(await page.url()).toContain('/sobre/');
            
            // Retour accueil via breadcrumb
            await page.click('.breadcrumb a[href="../"]');
            expect(await page.url()).toBe(TEST_CONFIG.baseURL + '/');
            
            // Recettes
            await page.click('a[href="recettes/index.html"]');
            await page.waitForLoadState('networkidle');
            expect(await page.url()).toContain('/recettes/');
            
            // Admin
            await page.goto(TEST_CONFIG.baseURL);
            await page.click('a[href="admin/index.html"]');
            await page.waitForLoadState('networkidle');
            expect(await page.url()).toContain('/admin/');
        });
        
        test('Responsive sur mobile', async () => {
            // Définir viewport mobile
            await page.setViewportSize({ width: 375, height: 812 });
            
            // Tester la page d'accueil
            await page.goto(TEST_CONFIG.baseURL);
            const toolsGrid = await page.$('.tools-grid');
            const gridStyle = await toolsGrid.evaluate(el => 
                window.getComputedStyle(el).gridTemplateColumns
            );
            expect(gridStyle).not.toContain('3'); // Pas 3 colonnes sur mobile
            
            // Tester Sobre
            await page.goto(TEST_CONFIG.baseURL + TEST_CONFIG.pages.sobre);
            const containers = await page.$$('.container-buttons');
            expect(containers.length).toBeGreaterThan(0);
            
            // Restaurer viewport desktop
            await page.setViewportSize({ width: 1280, height: 720 });
        });
    });
    
    describe('Tests de persistance et rechargement', () => {
        test('Les données Sobre survivent au rechargement', async () => {
            // 1. Configuration initiale
            await page.goto(TEST_CONFIG.baseURL + TEST_CONFIG.pages.sobre);
            await page.fill('#weight', '80');
            await page.selectOption('#gender', 'female');
            await page.click('#profile-form button[type="submit"]');
            
            // 2. Ajouter des boissons
            await page.selectOption('#drink-type', 'spirits');
            await page.click('[data-container="dose"]');
            await page.click('#add-drink-btn');
            
            // 3. Récupérer le BAC actuel
            const bacBefore = await page.textContent('#current-bac');
            
            // 4. Recharger la page
            await page.reload();
            
            // 5. Vérifier que les données sont restaurées
            const sessionVisible = await page.isVisible('#session-section');
            expect(sessionVisible).toBe(true);
            
            const bacAfter = await page.textContent('#current-bac');
            expect(bacAfter).toBeTruthy();
            
            // 6. Vérifier les boissons dans le tableau
            const drinkRows = await page.$$('#drinks-table-body tr');
            expect(drinkRows.length).toBeGreaterThan(0);
        });
    });

    afterAll(async () => {
        await teardownBrowser();
    });
});

// Export pour Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runE2ETests: () => describe };
} 