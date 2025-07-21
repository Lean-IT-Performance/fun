#!/usr/bin/env node

/**
 * Script principal pour exécuter tous les tests du site
 * Peut être utilisé en mode navigateur ou Node.js
 */

const path = require('path');
const { spawn } = require('child_process');

// Configuration des tests
const TEST_SUITES = [
    {
        name: 'Tests Unitaires',
        tests: [
            'unit/sobre-calculator.test.js'
        ]
    }
];

// Les suites lourdes (API, UI, E2E) ne sont lancées que si la variable
// d'environnement FULL_TEST est positionnée à "true". Cela évite des erreurs
// sur des environnements dépourvus de navigateur ou de serveur.
if (process.env.FULL_TEST === 'true') {
    TEST_SUITES.push(
        {
            name: 'Tests API',
            tests: ['api/api-tests.js']
        },
        {
            name: 'Tests Fonctionnels UI',
            tests: [
                'functional/sobre-ui.test.js',
                'functional/recettes-ui.test.js'
            ]
        },
        {
            name: 'Tests E2E',
            tests: ['integration/e2e-scenarios.test.js']
        }
    );
}

// Couleurs pour la console
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// Fonction pour exécuter un test
async function runTest(testFile, runner = 'jest') {
    return new Promise((resolve, reject) => {
        console.log(`${colors.cyan}► Exécution de ${testFile}...${colors.reset}`);
        
        const testPath = path.join(__dirname, testFile);
        const child = spawn(runner, [testPath], {
            stdio: 'inherit',
            shell: true
        });
        
        child.on('close', (code) => {
            if (code === 0) {
                console.log(`${colors.green}✓ ${testFile} réussi${colors.reset}\n`);
                resolve(true);
            } else {
                console.log(`${colors.red}✗ ${testFile} échoué${colors.reset}\n`);
                resolve(false);
            }
        });
        
        child.on('error', (error) => {
            console.error(`${colors.red}Erreur lors de l'exécution de ${testFile}:`, error);
            resolve(false);
        });
    });
}

// Fonction pour exécuter une suite de tests
async function runTestSuite(suite) {
    console.log(`\n${colors.bright}${colors.blue}═══ ${suite.name} ═══${colors.reset}\n`);
    
    const results = [];
    for (const test of suite.tests) {
        const result = await runTest(test);
        results.push({ test, success: result });
    }
    
    return results;
}

// Fonction principale
async function runAllTests() {
    console.log(`${colors.bright}${colors.yellow}🧪 Démarrage des tests pour Fun Lean IT Performance${colors.reset}\n`);
    
    const startTime = Date.now();
    const allResults = [];
    
    // Exécuter chaque suite de tests
    for (const suite of TEST_SUITES) {
        const results = await runTestSuite(suite);
        allResults.push({ suite: suite.name, results });
    }
    
    // Afficher le résumé
    console.log(`\n${colors.bright}${colors.blue}═══ RÉSUMÉ DES TESTS ═══${colors.reset}\n`);
    
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    
    allResults.forEach(({ suite, results }) => {
        const passed = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        
        totalTests += results.length;
        passedTests += passed;
        failedTests += failed;
        
        console.log(`${colors.bright}${suite}:${colors.reset}`);
        console.log(`  ${colors.green}✓ ${passed} réussi(s)${colors.reset}`);
        if (failed > 0) {
            console.log(`  ${colors.red}✗ ${failed} échoué(s)${colors.reset}`);
        }
        console.log('');
    });
    
    // Durée totale
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // Résultat final
    console.log(`${colors.bright}Total:${colors.reset} ${totalTests} tests`);
    console.log(`${colors.green}Réussis:${colors.reset} ${passedTests}`);
    console.log(`${colors.red}Échoués:${colors.reset} ${failedTests}`);
    console.log(`${colors.cyan}Durée:${colors.reset} ${duration}s\n`);
    
    if (failedTests === 0) {
        console.log(`${colors.bright}${colors.green}✨ Tous les tests sont passés ! ✨${colors.reset}`);
        process.exit(0);
    } else {
        console.log(`${colors.bright}${colors.red}❌ ${failedTests} test(s) ont échoué${colors.reset}`);
        process.exit(1);
    }
}

// Gestion des arguments en ligne de commande
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
    console.log(`
${colors.bright}Usage:${colors.reset} node run-all-tests.js [options]

${colors.bright}Options:${colors.reset}
  --help, -h     Afficher cette aide
  --suite NAME   Exécuter uniquement une suite spécifique
  --test FILE    Exécuter uniquement un test spécifique
  --watch        Mode watch (relancer les tests automatiquement)

${colors.bright}Exemples:${colors.reset}
  node run-all-tests.js                    # Exécuter tous les tests
  node run-all-tests.js --suite "Tests API" # Exécuter seulement les tests API
  node run-all-tests.js --test sobre       # Exécuter les tests contenant "sobre"
`);
    process.exit(0);
}

// Filtrer les tests si nécessaire
if (args.includes('--suite')) {
    const suiteIndex = args.indexOf('--suite');
    const suiteName = args[suiteIndex + 1];
    const suite = TEST_SUITES.find(s => s.name.toLowerCase().includes(suiteName.toLowerCase()));
    
    if (suite) {
        runTestSuite(suite).then(() => process.exit(0));
    } else {
        console.error(`${colors.red}Suite de tests "${suiteName}" non trouvée${colors.reset}`);
        process.exit(1);
    }
} else if (args.includes('--test')) {
    const testIndex = args.indexOf('--test');
    const testName = args[testIndex + 1];
    const tests = TEST_SUITES.flatMap(s => s.tests).filter(t => 
        t.toLowerCase().includes(testName.toLowerCase())
    );
    
    if (tests.length > 0) {
        Promise.all(tests.map(t => runTest(t))).then(() => process.exit(0));
    } else {
        console.error(`${colors.red}Test "${testName}" non trouvé${colors.reset}`);
        process.exit(1);
    }
} else {
    // Exécuter tous les tests
    runAllTests().catch(error => {
        console.error(`${colors.red}Erreur fatale:`, error);
        process.exit(1);
    });
} 