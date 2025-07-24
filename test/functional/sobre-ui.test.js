/** @jest-environment node */
// Tests fonctionnels pour l'interface Sobre
const { setupBrowser, teardownBrowser } = require('../utils/playwright-setup.js');

describe('Sobre UI Tests', () => {
    let helpers;
    
    beforeAll(async () => {
        // Charger les helpers
        if (typeof require !== 'undefined') {
            helpers = require('../utils/test-helpers.js');
        }

        await setupBrowser();
        // Naviguer vers la page Sobre
        await page.goto(TEST_CONFIG.baseURL + TEST_CONFIG.pages.sobre);
    });
    
    beforeEach(async () => {
        // Nettoyer le stockage avant chaque test
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
        await page.reload();
    });
    
    describe('Configuration du profil', () => {
        test('Affichage du formulaire de profil au premier lancement', async () => {
            const profileSection = await page.$('#profile-section');
            const isVisible = await profileSection.isVisible();
            expect(isVisible).toBe(true);
        });
        
        test('Enregistrement du profil utilisateur', async () => {
            // Remplir le formulaire
            await page.fill('#weight', '70');
            await page.selectOption('#gender', 'male');
            await page.selectOption('#driver-type', 'experienced');
            
            // Soumettre
            await page.click('#profile-form button[type="submit"]');
            
            // Vérifier que le profil est sauvegardé
            const profile = await page.evaluate(() => {
                return JSON.parse(localStorage.getItem('userProfile'));
            });
            
            expect(profile.weight).toBe(70);
            expect(profile.gender).toBe('male');
            expect(profile.driverType).toBe('experienced');
        });
        
        test('Validation du poids', async () => {
            // Tester poids invalide
            await page.fill('#weight', '0');
            await page.click('#profile-form button[type="submit"]');
            
            // Vérifier message d'erreur
            const error = await page.textContent('.error-message');
            expect(error).toContain('poids');
        });
    });
    
    describe('Ajout de boissons', () => {
        beforeEach(async () => {
            // Configurer un profil de test
            await page.evaluate(() => {
                const testProfile = {
                    weight: 70,
                    gender: 'male',
                    driverType: 'experienced'
                };
                localStorage.setItem('userProfile', JSON.stringify(testProfile));
            });
            await page.reload();
        });
        
        test('Ajout d\'une bière standard', async () => {
            // Sélectionner type de boisson
            await page.selectOption('#drink-type', 'beer-standard');
            
            // Sélectionner contenant
            await page.click('[data-container="demi"]');
            
            // Vérifier le volume affiché
            const volumeDisplay = await page.textContent('#volume-display');
            expect(volumeDisplay).toBe('250ml');
            
            // Ajouter la boisson
            await page.click('#add-drink-btn');
            
            // Vérifier qu'elle apparaît dans la liste
            const drinksList = await page.textContent('#drinks-list');
            expect(drinksList).toContain('Bière standard');
            expect(drinksList).toContain('250ml');
        });
        
        test('Ajout d\'une boisson personnalisée', async () => {
            // Sélectionner type personnalisé
            await page.selectOption('#drink-type', 'custom');
            
            // Le champ alcool doit apparaître
            const customAlcohol = await page.$('#custom-alcohol');
            const isVisible = await customAlcohol.isVisible();
            expect(isVisible).toBe(true);
            
            // Remplir les valeurs
            await page.fill('#volume', '100');
            await page.fill('#alcohol-content', '15');
            
            // Ajouter
            await page.click('#add-drink-btn');
            
            // Vérifier
            const drinksList = await page.textContent('#drinks-list');
            expect(drinksList).toContain('Personnalisé');
            expect(drinksList).toContain('100ml');
            expect(drinksList).toContain('15%');
        });
        
        test('État digestif', async () => {
            // Sélectionner état digestif
            await page.click('[data-state="eating"]');
            
            // Vérifier que le bouton est actif
            const hasActiveClass = await page.evaluate(() => {
                const btn = document.querySelector('[data-state="eating"]');
                return btn.classList.contains('active');
            });
            expect(hasActiveClass).toBe(true);
        });
    });
    
    describe('Calcul et affichage du BAC', () => {
        beforeEach(async () => {
            // Setup profil et boissons
            await page.evaluate(() => {
                const profile = {
                    weight: 70,
                    gender: 'male',
                    driverType: 'experienced'
                };
                localStorage.setItem('userProfile', JSON.stringify(profile));
                
                const drinks = [{
                    id: Date.now(),
                    time: new Date().toISOString(),
                    type: 'Bière standard',
                    volume: 330,
                    alcoholContent: 5.0,
                    pureAlcohol: 13.2,
                    digestiveState: 'empty'
                }];
                localStorage.setItem('drinks', JSON.stringify(drinks));
            });
            await page.reload();
        });
        
        test('Affichage du BAC actuel', async () => {
            const bacDisplay = await page.textContent('#current-bac');
            expect(bacDisplay).toMatch(/0\.\d{3}/); // Format 0.XXX
        });
        
        test('Indicateur de conduite', async () => {
            // Vérifier l'indicateur
            const canDrive = await page.$('.can-drive');
            const cantDrive = await page.$('.cant-drive');
            
            // Un des deux doit être visible
            const canDriveVisible = canDrive ? await canDrive.isVisible() : false;
            const cantDriveVisible = cantDrive ? await cantDrive.isVisible() : false;
            
            expect(canDriveVisible || cantDriveVisible).toBe(true);
        });
        
        test('Temps jusqu\'à sobriété', async () => {
            const sobrietyTime = await page.textContent('#sobriety-time');
            expect(sobrietyTime).toMatch(/\d+h\d+/); // Format XhXX
        });
    });
    
    describe('Gestion des boissons', () => {
        test('Suppression d\'une boisson', async () => {
            // Ajouter une boisson
            await page.selectOption('#drink-type', 'beer-light');
            await page.click('[data-container="demi"]');
            await page.click('#add-drink-btn');
            
            // Supprimer
            await page.click('.delete-drink-btn');
            
            // Vérifier que la liste est vide
            const drinksList = await page.textContent('#drinks-list');
            expect(drinksList).toContain('Aucune boisson');
        });
        
        test('Modification d\'une boisson', async () => {
            // Ajouter une boisson
            await page.selectOption('#drink-type', 'beer-light');
            await page.click('[data-container="demi"]');
            await page.click('#add-drink-btn');
            
            // Ouvrir modal d'édition
            await page.click('.edit-drink-btn');
            
            // Modifier le type
            await page.selectOption('#edit-drink-type', 'beer-strong');
            await page.click('#save-edit-btn');
            
            // Vérifier la modification
            const drinksList = await page.textContent('#drinks-list');
            expect(drinksList).toContain('Bière forte');
        });
    });
    
    describe('Graphique d\'évolution', () => {
        test('Affichage du graphique', async () => {
            // Aller sur l'onglet graphique
            await page.click('[data-tab="chart"]');
            
            // Vérifier que le canvas existe
            const canvas = await page.$('#bac-chart');
            expect(canvas).toBeTruthy();
            
            // Vérifier qu'il y a des données
            const hasData = await page.evaluate(() => {
                const chart = window.app?.bacChart;
                return chart && chart.data.datasets[0].data.length > 0;
            });
            expect(hasData).toBe(true);
        });
    });
    
    describe('Responsive design', () => {
        test('Adaptation mobile', async () => {
            // Simuler viewport mobile
            await page.setViewportSize({ width: 375, height: 667 });
            
            // Vérifier que le menu est adapté
            const mobileMenu = await page.$('.mobile-menu');
            if (mobileMenu) {
                const isVisible = await mobileMenu.isVisible();
                expect(isVisible).toBe(true);
            }
            
            // Restaurer viewport
            await page.setViewportSize({ width: 1280, height: 720 });
        });
    });
    
    describe('Persistance des données', () => {
        test('Les données survivent au rechargement', async () => {
            // Ajouter des données
            await page.selectOption('#drink-type', 'wine-red');
            await page.click('[data-container="verre-vin"]');
            await page.click('#add-drink-btn');
            
            // Recharger la page
            await page.reload();
            
            // Vérifier que les données sont toujours là
            const drinksList = await page.textContent('#drinks-table-body');
            expect(drinksList).toContain('Vin rouge');
        });
    });

    afterAll(async () => {
        await teardownBrowser();
    });
});

// Export pour Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runSobreUITests: () => describe };
} 