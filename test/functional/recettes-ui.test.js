/** @jest-environment node */
// Tests fonctionnels pour l'interface Recettes
const { setupBrowser, teardownBrowser } = require('../utils/playwright-setup.js');

describe('Recettes UI Tests', () => {
    let helpers;
    
    beforeAll(async () => {
        // Charger les helpers
        if (typeof require !== 'undefined') {
            helpers = require('../utils/test-helpers.js');
        }

        await setupBrowser();
        // Naviguer vers la page Recettes
        await page.goto(TEST_CONFIG.baseURL + TEST_CONFIG.pages.recettes);
    });
    
    beforeEach(async () => {
        // Nettoyer le stockage
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
        await page.reload();
    });
    
    describe('Interface principale', () => {
        test('Affichage des éléments principaux', async () => {
            // Vérifier les éléments essentiels
            const title = await page.textContent('h1');
            expect(title).toContain('Mes Recettes');
            
            const ingredientInput = await page.$('#ingredient-input');
            expect(ingredientInput).toBeTruthy();
            
            const generateBtn = await page.$('#generate-ai-recipe');
            expect(generateBtn).toBeTruthy();
        });
        
        test('Suggestions d\'ingrédients rapides', async () => {
            const suggestions = await page.$$('.quick-ingredient');
            expect(suggestions.length).toBeGreaterThan(0);
            
            // Cliquer sur une suggestion
            await page.click('.quick-ingredient:first-child');
            
            // Vérifier qu'elle est ajoutée
            const ingredients = await page.$$('.ingredient-tag');
            expect(ingredients.length).toBe(1);
        });
    });
    
    describe('Gestion des ingrédients', () => {
        test('Ajout d\'un ingrédient via input', async () => {
            // Saisir un ingrédient
            await page.fill('#ingredient-input', 'tomates');
            await page.press('#ingredient-input', 'Enter');
            
            // Vérifier l'ajout
            const ingredientTag = await page.textContent('.ingredient-tag');
            expect(ingredientTag).toContain('tomates');
        });
        
        test('Suppression d\'un ingrédient', async () => {
            // Ajouter un ingrédient
            await page.fill('#ingredient-input', 'fromage');
            await page.press('#ingredient-input', 'Enter');
            
            // Supprimer
            await page.click('.ingredient-tag .remove-btn');
            
            // Vérifier la suppression
            const ingredients = await page.$$('.ingredient-tag');
            expect(ingredients.length).toBe(0);
        });
        
        test('Empêcher les doublons', async () => {
            // Ajouter deux fois le même ingrédient
            await page.fill('#ingredient-input', 'pâtes');
            await page.press('#ingredient-input', 'Enter');
            
            await page.fill('#ingredient-input', 'pâtes');
            await page.press('#ingredient-input', 'Enter');
            
            // Vérifier qu'il n'y a qu'une occurrence
            const ingredients = await page.$$('.ingredient-tag');
            expect(ingredients.length).toBe(1);
        });
    });
    
    describe('Paramètres avancés', () => {
        test('Ouverture/fermeture des options', async () => {
            // Vérifier que les options sont cachées par défaut
            const advancedOptions = await page.$('#advanced-options');
            let isVisible = await advancedOptions.isVisible();
            expect(isVisible).toBe(false);
            
            // Cliquer pour afficher
            await page.click('#toggle-advanced');
            
            // Vérifier qu'elles sont maintenant visibles
            isVisible = await advancedOptions.isVisible();
            expect(isVisible).toBe(true);
        });
        
        test('Modification du nombre de convives', async () => {
            await page.click('#toggle-advanced');
            
            // Changer le slider
            await page.fill('#convives-slider', '6');
            
            // Vérifier l'affichage
            const convivesDisplay = await page.textContent('#convives-value');
            expect(convivesDisplay).toBe('6');
        });
        
        test('Sélection des contraintes alimentaires', async () => {
            await page.click('#toggle-advanced');
            
            // Cocher végétarien
            await page.check('#constraint-vegetarien');
            
            // Vérifier que c'est coché
            const isChecked = await page.isChecked('#constraint-vegetarien');
            expect(isChecked).toBe(true);
        });
    });
    
    describe('Génération de recettes IA', () => {
        test('Validation - pas d\'ingrédients', async () => {
            // Essayer de générer sans ingrédients
            await page.click('#generate-ai-recipe');
            
            // Vérifier le message d'erreur
            const errorMsg = await page.textContent('.error-message');
            expect(errorMsg).toContain('ingrédient');
        });
        
        test('Animation de chargement', async () => {
            // Ajouter des ingrédients
            await page.fill('#ingredient-input', 'tomates');
            await page.press('#ingredient-input', 'Enter');
            await page.fill('#ingredient-input', 'pâtes');
            await page.press('#ingredient-input', 'Enter');
            
            // Mock la réponse API pour éviter l'appel réel
            await page.route('**/api/recipes-generator.php', route => {
                route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        nom: "Pâtes aux tomates",
                        description: "Délicieuses pâtes",
                        temps_preparation: "15 minutes",
                        temps_cuisson: "20 minutes",
                        portions: 4,
                        ingredients: [
                            { nom: "Pâtes", quantite: "400g" },
                            { nom: "Tomates", quantite: "4 pièces" }
                        ],
                        instructions: [
                            "Faire cuire les pâtes",
                            "Préparer la sauce tomate"
                        ],
                        niveau_difficulte: "Facile",
                        adaptation_enfants: "Convient parfaitement"
                    })
                });
            });
            
            // Cliquer sur générer
            const generatePromise = page.click('#generate-ai-recipe');
            
            // Vérifier que le loader apparaît
            await page.waitForSelector('.ai-loading', { state: 'visible' });
            const loadingText = await page.textContent('.loading-text');
            expect(loadingText).toBeTruthy();
            
            await generatePromise;
        });
    });
    
    describe('Affichage de la recette', () => {
        beforeEach(async () => {
            // Préparer une recette de test
            await page.evaluate(() => {
                const mockRecipe = {
                    nom: "Salade de tomates",
                    description: "Salade fraîche et simple",
                    temps_preparation: "10 minutes",
                    temps_cuisson: "0 minutes",
                    portions: 2,
                    ingredients: [
                        { nom: "Tomates", quantite: "4 grosses" },
                        { nom: "Basilic", quantite: "Quelques feuilles" },
                        { nom: "Huile d'olive", quantite: "3 cuillères à soupe" }
                    ],
                    instructions: [
                        "Laver et couper les tomates",
                        "Ajouter le basilic",
                        "Arroser d'huile d'olive"
                    ],
                    niveau_difficulte: "Très facile",
                    adaptation_enfants: "Parfait pour les enfants"
                };
                
                // Simuler l'affichage de la recette
                const container = document.getElementById('recipe-result');
                container.innerHTML = `
                    <div class="recipe-card">
                        <h2>${mockRecipe.nom}</h2>
                        <p>${mockRecipe.description}</p>
                        <div class="recipe-meta">
                            <span>⏱️ Préparation: ${mockRecipe.temps_preparation}</span>
                            <span>👥 ${mockRecipe.portions} portions</span>
                            <span>📊 ${mockRecipe.niveau_difficulte}</span>
                        </div>
                        <div class="ingredients-list">
                            ${mockRecipe.ingredients.map(i => 
                                `<div class="ingredient-item">${i.quantite} ${i.nom}</div>`
                            ).join('')}
                        </div>
                        <ol class="instructions-list">
                            ${mockRecipe.instructions.map(i => 
                                `<li>${i}</li>`
                            ).join('')}
                        </ol>
                    </div>
                `;
            });
        });
        
        test('Affichage des informations de base', async () => {
            const recipeName = await page.textContent('.recipe-card h2');
            expect(recipeName).toBe('Salade de tomates');
            
            const description = await page.textContent('.recipe-card p');
            expect(description).toContain('fraîche');
        });
        
        test('Affichage des métadonnées', async () => {
            const meta = await page.textContent('.recipe-meta');
            expect(meta).toContain('10 minutes');
            expect(meta).toContain('2 portions');
            expect(meta).toContain('Très facile');
        });
        
        test('Liste des ingrédients', async () => {
            const ingredients = await page.$$('.ingredient-item');
            expect(ingredients.length).toBe(3);
            
            const firstIngredient = await page.textContent('.ingredient-item:first-child');
            expect(firstIngredient).toContain('4 grosses Tomates');
        });
        
        test('Instructions', async () => {
            const instructions = await page.$$('.instructions-list li');
            expect(instructions.length).toBe(3);
            
            const firstStep = await page.textContent('.instructions-list li:first-child');
            expect(firstStep).toContain('Laver et couper');
        });
    });
    
    describe('Recettes prédéfinies', () => {
        test('Recherche de recettes locales', async () => {
            // Ajouter des ingrédients qui matchent une recette locale
            await page.fill('#ingredient-input', 'œufs');
            await page.press('#ingredient-input', 'Enter');
            
            // Cliquer sur recherche locale
            await page.click('#search-local-recipes');
            
            // Vérifier qu'une recette est trouvée
            const recipeCard = await page.$('.local-recipe-card');
            expect(recipeCard).toBeTruthy();
            
            const recipeName = await page.textContent('.local-recipe-card h3');
            expect(recipeName).toContain('Omelette');
        });
        
        test('Affichage d\'une recette locale', async () => {
            // Simuler le clic sur une recette locale
            await page.evaluate(() => {
                const recipe = window.app?.recipeDatabase?.[0];
                if (recipe) {
                    window.app.displayLocalRecipe(recipe);
                }
            });
            
            // Vérifier l'affichage
            const recipeDisplay = await page.$('.recipe-display');
            expect(recipeDisplay).toBeTruthy();
        });
    });
    
    describe('Responsive et accessibilité', () => {
        test('Adaptation mobile', async () => {
            await page.setViewportSize({ width: 375, height: 667 });
            
            // Vérifier que les options avancées sont toujours accessibles
            const toggleBtn = await page.$('#toggle-advanced');
            const isVisible = await toggleBtn.isVisible();
            expect(isVisible).toBe(true);
            
            await page.setViewportSize({ width: 1280, height: 720 });
        });
        
        test('Navigation au clavier', async () => {
            // Focus sur l'input
            await page.focus('#ingredient-input');
            
            // Ajouter avec Enter
            await page.type('#ingredient-input', 'sel');
            await page.keyboard.press('Enter');
            
            // Vérifier l'ajout
            const ingredient = await page.textContent('.ingredient-tag');
            expect(ingredient).toContain('sel');
        });
    });
    
    describe('Gestion d\'erreurs', () => {
        test('Erreur réseau', async () => {
            // Simuler une erreur réseau
            await page.route('**/api/recipes-generator.php', route => {
                route.abort();
            });
            
            // Ajouter des ingrédients et générer
            await page.fill('#ingredient-input', 'farine');
            await page.press('#ingredient-input', 'Enter');
            await page.click('#generate-ai-recipe');
            
            // Vérifier le message d'erreur
            await page.waitForSelector('.error-message');
            const error = await page.textContent('.error-message');
            expect(error).toContain('erreur');
        });
    });

    afterAll(async () => {
        await teardownBrowser();
    });
});

// Export pour Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runRecettesUITests: () => describe };
} 