#!/usr/bin/env node

const ftp = require('basic-ftp');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');
require('dotenv').config();

// Configuration FTP depuis .env
const ftpConfig = {
    host: process.env.FTP_HOST,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASS,
    secure: process.env.FTP_SECURE === 'true',
    port: parseInt(process.env.FTP_PORT || '21')
};

// Configuration des sites
const sites = {
    homepage: {
        name: "Page d'accueil",
        localPath: ".",
        remoteDir: null, // Racine
        files: ['index.html', 'styles.css', 'script.js', 'config.js', '.htaccess']
    },
    sobre: {
        name: "Sobre - Calculateur d'alcoolémie",
        localPath: "./sobre",
        remoteDir: "sobre",
        files: ['index.html', 'styles.css', 'script.js', 'CLAUDE.md']
    },
    recettes: {
        name: "Mes Recettes - Générateur de recettes",
        localPath: "./recettes",
        remoteDir: "recettes",
        files: ['index.html', 'styles.css', 'script.js', 'sw.js', 'SECURITY-MIGRATION.md']
    },
    admin: {
        name: "Console Admin - Monitoring API",
        localPath: "./admin",
        remoteDir: "admin",
        files: [
            'index.html',
            'styles.css',
            'script.js',
            'api.js',
            'test-auth.html',
            'test-backend.html',
            'test-openai-usage.js',
            'README.md',
            'README-OPENAI-USAGE.md',
            'DIAGNOSTIC-TOOLS.md',
            'GUIDE-INSTALLATION.md'
        ]
    }
};

// ---------- Tests avant déploiement ----------

async function runTests() {
    return new Promise((resolve) => {
        console.log('\n🧪 Lancement des tests...');

        const logPath = path.join('test', 'last-test.log');
        const logStream = fs.createWriteStream(logPath);

        const child = spawn('npm', ['test'], { shell: true });
        child.stdout.on('data', data => {
            process.stdout.write(data);
            logStream.write(data);
        });
        child.stderr.on('data', data => {
            process.stderr.write(data);
            logStream.write(data);
        });
        child.on('close', (code) => {
            console.log(`📄 Logs complets: ${logPath}`);
            resolve(code === 0);
        });
    });
}

function ask(question) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => rl.question(question, ans => {
        rl.close();
        resolve(ans.trim().toLowerCase());
    }));
}

async function deploySite(siteKey) {
    const site = sites[siteKey];
    if (!site) {
        console.log(`❌ Site "${siteKey}" non reconnu`);
        return false;
    }

    // Gestion spéciale pour admin : utiliser le script dédié
    if (siteKey === 'admin') {
        console.log(`\n🔄 Déploiement de "${site.name}" avec script dédié...`);
        try {
            const { deployAdmin } = require('./deploy-admin.js');
            return await deployAdmin();
        } catch (error) {
            console.log(`❌ Erreur script admin: ${error.message}`);
            return false;
        }
    }

    const client = new ftp.Client();
    
    try {
        console.log(`\n🔄 Déploiement de "${site.name}"...`);
        
        // Connexion
        console.log('  📡 Connexion au serveur FTP...');
        await client.access(ftpConfig);
        
        // Gestion des répertoires
        if (site.remoteDir) {
            console.log(`  📂 Création/navigation vers ${site.remoteDir}...`);
            
            // Créer le répertoire
            try {
                await client.mkdir(site.remoteDir);
                console.log(`  ✅ Répertoire ${site.remoteDir} créé`);
            } catch (error) {
                console.log(`  ℹ️ Répertoire ${site.remoteDir} existe déjà`);
            }
            
            // Naviguer dans le répertoire
            await client.cd(site.remoteDir);
            console.log(`  📁 Positionné dans ${site.remoteDir}`);
        } else {
            console.log(`  📁 Déploiement à la racine`);
        }
        
        // Upload des fichiers
        console.log('  📤 Upload des fichiers...');
        let uploadedFiles = 0;
        
        for (const file of site.files) {
            const localFilePath = path.join(site.localPath, file);
            
            if (fs.existsSync(localFilePath)) {
                try {
                    console.log(`    ⬆️  ${file}`);
                    await client.uploadFrom(localFilePath, file);
                    console.log(`    ✅ ${file} - OK`);
                    uploadedFiles++;
                } catch (error) {
                    console.log(`    ❌ Erreur upload ${file}: ${error.message}`);
                }
            } else {
                console.log(`    ⚠️  ${file} - fichier non trouvé`);
            }
        }
        
        console.log(`  ✅ ${site.name} déployé avec succès ! (${uploadedFiles} fichiers)`);
        return true;
        
    } catch (error) {
        console.log(`  ❌ Erreur: ${error.message}`);
        return false;
    } finally {
        client.close();
    }
}

async function deployAll() {
    console.log('🚀 Déploiement de tous les sites...\n');
    
    let totalSuccess = 0;
    for (const siteKey of Object.keys(sites)) {
        const success = await deploySite(siteKey);
        if (success) totalSuccess++;
    }
    
    console.log(`\n📊 Résumé: ${totalSuccess}/${Object.keys(sites).length} sites déployés avec succès`);
    
    if (totalSuccess === Object.keys(sites).length) {
        console.log('\n🎉 Déploiement global terminé avec succès !');
    } else {
        console.log('\n⚠️  Déploiement terminé avec des erreurs');
    }
}

// Script principal avec exécution des tests
async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.log('Usage: node deploy-simple.js <site|all>');
        console.log('Sites disponibles:', Object.keys(sites).join(', '));
        process.exit(1);
    }

    const testsOk = await runTests();
    if (!testsOk) {
        const answer = await ask('❌ Des tests ont échoué. Continuer le déploiement ? (y/N) : ');
        if (answer !== 'y' && answer !== 'yes') {
            console.log('🛑 Déploiement annulé suite aux tests échoués');
            return;
        }
    }

    const target = args[0].toLowerCase();

    if (target === 'all') {
        await deployAll();
    } else if (sites[target]) {
        await deploySite(target);
    } else {
        console.log(`❌ Site "${target}" non reconnu`);
        console.log('Sites disponibles:', Object.keys(sites).join(', '), 'all');
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}