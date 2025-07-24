/** @jest-environment node */
// Tests fonctionnels pour la page d'accueil

const { setupBrowser, teardownBrowser } = require('../utils/playwright-setup.js');

describe('Homepage UI Tests', () => {
    let helpers;

    beforeAll(async () => {
        if (typeof require !== 'undefined') {
            helpers = require('../utils/test-helpers.js');
        }

        await setupBrowser();
        await page.goto(TEST_CONFIG.baseURL + TEST_CONFIG.pages.home);
    });

    beforeEach(async () => {
        await page.reload();
    });

    test('Affichage du titre et de la tagline', async () => {
        const title = await page.textContent('header h1');
        expect(title).toContain('Fun Lean IT Performance');

        const tagline = await page.textContent('.tagline');
        expect(tagline).toContain('Des outils web');
    });

    test('Présence des cartes d\'outils principales', async () => {
        const cards = await page.$$('.tool-card');
        expect(cards.length).toBeGreaterThanOrEqual(2);

        const firstTool = await page.textContent('.tool-card:nth-child(1) h3');
        const secondTool = await page.textContent('.tool-card:nth-child(2) h3');
        expect(firstTool).toContain('Sobre');
        expect(secondTool).toContain('Mes Recettes');
    });

    test('Section À propos avec bénéfices clés', async () => {
        const aboutSection = await page.$('section.about');
        expect(aboutSection).toBeTruthy();

        const benefits = await page.$$eval('.principle h4', els => els.map(e => e.textContent.trim()));
        expect(benefits).toEqual(expect.arrayContaining([
            '🔒 Confidentialité',
            '⚡ Performance',
            '📱 Responsive'
        ]));
    });

    test('Lien vers la console admin présent', async () => {
        const adminHref = await page.getAttribute('.admin-section a.btn-admin', 'href');
        expect(adminHref).toContain('admin/index.html');
    });

    afterAll(async () => {
        await teardownBrowser();
    });
});

// Export pour Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runHomepageUITests: () => describe };
}
