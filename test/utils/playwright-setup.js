const { chromium } = require('playwright');

let browser;

async function setupBrowser() {
    if (!browser) {
        browser = await chromium.launch({ headless: true });
        global.page = await browser.newPage();
    }
}

async function teardownBrowser() {
    if (browser) {
        await browser.close();
        browser = null;
        global.page = null;
    }
}

module.exports = { setupBrowser, teardownBrowser };
