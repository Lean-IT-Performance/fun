#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification des fichiers pour déploiement\n');

// Configuration des sites (reprend celle de deploy-simple.js)
const sites = {
    homepage: {
        name: "Page d'accueil",
        localPath: ".",
        files: ['index.html', 'styles.css', 'script.js', 'config.js', 'shared-styles.css', 'theme-manager.js', 'animation-manager.js', 'accessibility-manager.js', '.htaccess']
    },
    sobre: {
        name: "Sobre - Calculateur d'alcoolémie",
        localPath: "./sobre",
        files: ['index.html', 'styles.css', 'script.js', 'export-manager.js', 'CLAUDE.md']
    },
    recettes: {
        name: "Mes Recettes - Générateur de recettes",
        localPath: "./recettes",
        files: ['index.html', 'styles.css', 'script.js', 'sw.js']
    },
    admin: {
        name: "Console Admin - Monitoring API",
        localPath: "./admin", 
        files: [
            'index.html', 
            'styles.css', 
            'script.js', 
            'api.js', 
            'README.md', 
            'README-OPENAI-USAGE.md'
        ]
    },
    api: {
        name: "API Admin - Endpoints Backend",
        localPath: "./api",
        files: [
            'admin/auth.php', 
            'admin/openai-usage.php', 
            'admin/config-test.php',
            'recipes-generator.php',
            'config.php'
        ]
    }
};

// Fichiers sensibles qui ne doivent PAS être déployés
const sensitiveFiles = [
    '.env',
    'logs/',
    'node_modules/',
    'scripts/',
    '.git/',
    'package.json',
    'package-lock.json'
];

function checkSiteFiles(siteKey, site) {
    console.log(`\n📁 ${site.name} (${siteKey})`);
    
    let foundFiles = 0;
    let missingFiles = [];
    
    for (const file of site.files) {
        const filePath = path.join(site.localPath, file);
        
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            const sizeKB = (stats.size / 1024).toFixed(1);
            console.log(`  ✅ ${file} (${sizeKB} KB)`);
            foundFiles++;
        } else {
            console.log(`  ❌ ${file} - MANQUANT`);
            missingFiles.push(file);
        }
    }
    
    console.log(`  📊 ${foundFiles}/${site.files.length} fichiers trouvés`);
    
    if (missingFiles.length > 0) {
        console.log(`  ⚠️  Fichiers manquants: ${missingFiles.join(', ')}`);
    }
    
    return {
        total: site.files.length,
        found: foundFiles,
        missing: missingFiles
    };
}

function checkSecurityConfig() {
    console.log('\n🔒 Vérification de la configuration de sécurité');
    
    // Vérifier que .env existe
    if (fs.existsSync('.env')) {
        console.log('  ✅ Fichier .env trouvé');
        
        // Vérifier la présence de OPENAI_API_KEY
        const envContent = fs.readFileSync('.env', 'utf8');
        if (envContent.includes('OPENAI_API_KEY=')) {
            console.log('  ✅ OPENAI_API_KEY configurée dans .env');
        } else {
            console.log('  ❌ OPENAI_API_KEY manquante dans .env');
        }
    } else {
        console.log('  ❌ Fichier .env manquant - Requis pour le backend sécurisé');
    }
    
    // Vérifier que les logs sont créés
    if (fs.existsSync('logs/')) {
        console.log('  ✅ Dossier logs/ créé');
        if (fs.existsSync('logs/openai_usage.log')) {
            console.log('  ✅ Fichier de log OpenAI prêt');
        } else {
            console.log('  ⚠️  logs/openai_usage.log sera créé au premier usage');
        }
    } else {
        console.log('  ⚠️  Dossier logs/ manquant - sera créé automatiquement');
    }
}

function checkNewSecurityFiles() {
    console.log('\n🛡️ Vérification des nouveaux fichiers de sécurité');
    
    const securityFiles = [
        { path: 'api/recipes-generator.php', description: 'Backend sécurisé pour OpenAI' },
        { path: 'recettes/SECURITY-MIGRATION.md', description: 'Documentation migration sécurité' }
    ];
    
    for (const file of securityFiles) {
        if (fs.existsSync(file.path)) {
            const stats = fs.statSync(file.path);
            const sizeKB = (stats.size / 1024).toFixed(1);
            console.log(`  ✅ ${file.path} (${sizeKB} KB) - ${file.description}`);
        } else {
            console.log(`  ❌ ${file.path} - MANQUANT (${file.description})`);
        }
    }
}

function generateDeploymentSummary(results) {
    console.log('\n📋 RÉSUMÉ DU DÉPLOIEMENT');
    console.log('='.repeat(50));
    
    let totalFiles = 0;
    let totalFound = 0;
    let hasMissingFiles = false;
    
    for (const [siteKey, result] of Object.entries(results)) {
        totalFiles += result.total;
        totalFound += result.found;
        
        const status = result.missing.length > 0 ? '⚠️' : '✅';
        console.log(`${status} ${sites[siteKey].name}: ${result.found}/${result.total} fichiers`);
        
        if (result.missing.length > 0) {
            hasMissingFiles = true;
        }
    }
    
    console.log('-'.repeat(50));
    console.log(`📊 Total: ${totalFound}/${totalFiles} fichiers prêts`);
    
    if (hasMissingFiles) {
        console.log('\n⚠️  ATTENTION: Des fichiers sont manquants pour le déploiement');
        console.log('Vérifiez les chemins et assurez-vous que tous les fichiers existent.');
    } else {
        console.log('\n✅ Tous les fichiers sont prêts pour le déploiement !');
    }
    
    console.log('\n🚀 Commandes de déploiement disponibles:');
    console.log('  npm run deploy:recettes    # Déployer uniquement les recettes');
    console.log('  npm run deploy:admin       # Déployer la console admin + API');
    console.log('  npm run deploy:all         # Déployer tout le site');
}

// Exécution du script
console.log('🔍 Début de la vérification...\n');

const results = {};

// Vérifier chaque site
for (const [siteKey, site] of Object.entries(sites)) {
    results[siteKey] = checkSiteFiles(siteKey, site);
}

// Vérifications de sécurité
checkSecurityConfig();
checkNewSecurityFiles();

// Résumé final
generateDeploymentSummary(results); 