#!/usr/bin/env node

const ftp = require('basic-ftp');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { spawn } = require('child_process');

// Configuration FTP depuis .env ou deploy-env.js
require('dotenv').config();

let ftpConfig;
try {
    // Essayer d'abord deploy-env.js dans le dossier scripts
    ftpConfig = require('./deploy-env.js');
    console.log('📄 Configuration FTP chargée depuis scripts/deploy-env.js');
} catch (error) {
    // Sinon utiliser les variables d'environnement .env
    if (process.env.FTP_HOST) {
        ftpConfig = {
            host: process.env.FTP_HOST,
            user: process.env.FTP_USER,
            password: process.env.FTP_PASS,
            secure: process.env.FTP_SECURE === 'true',
            port: parseInt(process.env.FTP_PORT || '21')
        };
        console.log('📄 Configuration FTP chargée depuis .env');
    } else {
        console.log('📄 Aucune configuration FTP trouvée, utilisation par défaut');
        ftpConfig = {
            host: 'votre-serveur-ftp.com',
            user: 'votre-username',
            password: 'votre-password',
            secure: false,
            port: 21
        };
    }
}

// Configuration des sites
const sites = {
    homepage: {
        name: "Page d'accueil",
        localPath: "..",
        remoteDir: ".", // Racine du serveur FTP
        files: ['index.html', 'styles.css', 'script.js', 'config.js', 'shared-styles.css', 'theme-manager.js', 'animation-manager.js', 'accessibility-manager.js', '.htaccess']
    },
    sobre: {
        name: "Sobre - Calculateur d'alcoolémie",
        localPath: "../sobre",
        remoteDir: "sobre", // Sous-répertoire sobre
        files: ['index.html', 'styles.css', 'script.js', 'export-manager.js', 'CLAUDE.md']
    },
    recettes: {
        name: "Mes Recettes - Générateur de recettes",
        localPath: "../recettes",
        remoteDir: "recettes", // Sous-répertoire recettes
        files: ['index.html', 'styles.css', 'script.js', 'sw.js']
    },
    admin: {
        name: "Console Admin - Monitoring API",
        localPath: "../admin",
        remoteDir: "admin", // Sous-répertoire admin
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
    },
    api: {
        name: "API Admin - Endpoints Backend",
        localPath: "../api",
        remoteDir: "api", // Sous-répertoire api
        files: ['admin/auth.php', 'admin/openai-usage.php', 'admin/config-test.php', 'recipes-generator.php', 'config.php']
    }
};

// ---------- Tests avant déploiement ----------

async function runTests() {
    return new Promise((resolve) => {
        console.log('\n🧪 Lancement des tests...');
        const logPath = path.join('test', 'last-test.log');
        const logStream = fs.createWriteStream(logPath);
        const child = spawn('npm', ['test'], { shell: true });
        child.stdout.on('data', d => { process.stdout.write(d); logStream.write(d); });
        child.stderr.on('data', d => { process.stderr.write(d); logStream.write(d); });
        child.on('close', code => { console.log(`📄 Logs complets: ${logPath}`); resolve(code === 0); });
    });
}

function ask(question) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => rl.question(question, a => { rl.close(); resolve(a.trim().toLowerCase()); }));
}

function createInterface() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

async function selectSites() {
    const rl = createInterface();
    
    console.log('\n🚀 Déploiement Multi-Sites\n');
    console.log('Sites disponibles :');
    
    Object.keys(sites).forEach((key, index) => {
        console.log(`${index + 1}. ${sites[key].name} (${key})`);
    });
    
    console.log(`${Object.keys(sites).length + 1}. Tous les sites`);
    console.log('0. Annuler');
    
    return new Promise((resolve) => {
        rl.question('\nSélectionnez les sites à déployer (ex: 1,2 ou "all" pour tous) : ', (answer) => {
            rl.close();
            
            if (answer === '0') {
                resolve([]);
                return;
            }
            
            if (answer.toLowerCase() === 'all' || answer === String(Object.keys(sites).length + 1)) {
                resolve(Object.keys(sites));
                return;
            }
            
            const selectedIndexes = answer.split(',').map(s => parseInt(s.trim()) - 1);
            const selectedSites = selectedIndexes
                .filter(index => index >= 0 && index < Object.keys(sites).length)
                .map(index => Object.keys(sites)[index]);
            
            resolve(selectedSites);
        });
    });
}

async function confirmDeployment(selectedSites) {
    if (selectedSites.length === 0) {
        console.log('❌ Aucun site sélectionné');
        return false;
    }
    
    const rl = createInterface();
    
    console.log('\n📋 Résumé du déploiement :');
    selectedSites.forEach(siteKey => {
        const site = sites[siteKey];
        console.log(`  • ${site.name}`);
        console.log(`    Dossier local: ${site.localPath}`);
        console.log(`    Dossier distant: ${site.remoteDir}`);
        console.log(`    Fichiers: ${site.files.join(', ')}`);
        console.log('');
    });
    
    return new Promise((resolve) => {
        rl.question('Confirmer le déploiement ? (y/N) : ', (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
    });
}

async function deploySite(siteKey, site) {
    const client = new ftp.Client();
    
    try {
        console.log(`\n🔄 Déploiement de "${site.name}"...`);
        
        // Connexion FTP
        console.log('  📡 Connexion au serveur FTP...');
        await client.access(ftpConfig);
        
        // Gestion des répertoires
        console.log(`  📂 Préparation répertoire: ${site.remoteDir}`);
        
        if (site.remoteDir !== '.' && site.remoteDir !== '') {
            // Créer le sous-répertoire et y naviguer
            try {
                await client.mkdir(site.remoteDir);
                console.log(`  ✅ Répertoire ${site.remoteDir} créé`);
            } catch (error) {
                console.log(`  ℹ️ Répertoire ${site.remoteDir} existe déjà`);
            }
            
            await client.cd(site.remoteDir);
            console.log(`  📁 Positionné dans ${site.remoteDir}`);
        } else {
            console.log(`  📁 Déploiement à la racine`);
        }
        
        // Upload des fichiers
        console.log('  📤 Upload des fichiers...');
        let uploadedFiles = 0;
        let errors = 0;
        
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
                    errors++;
                }
            } else {
                console.log(`    ⚠️  ${file} - fichier non trouvé, ignoré`);
                // Ne pas compter comme erreur pour les fichiers optionnels
            }
        }
        
        if (errors === 0) {
            console.log(`  ✅ ${site.name} déployé avec succès ! (${uploadedFiles} fichiers)`);
        } else {
            console.log(`  ⚠️  ${site.name} déployé avec ${errors} erreur(s) (${uploadedFiles} fichiers réussis)`);
        }
        
        return { success: errors === 0, uploaded: uploadedFiles, errors };
        
    } catch (error) {
        console.log(`  ❌ Erreur lors du déploiement de "${site.name}": ${error.message}`);
        return { success: false, uploaded: 0, errors: 1 };
    } finally {
        client.close();
    }
}

async function deploy() {
    try {
        // Vérification de la configuration FTP
        if (ftpConfig.host === 'votre-serveur-ftp.com') {
            console.log('⚠️  Configuration FTP par défaut détectée');
            console.log('   Veuillez configurer vos informations FTP dans .env ou deploy-env.js');
            
            const rl = createInterface();
            const continueAnyway = await new Promise((resolve) => {
                rl.question('Continuer avec la configuration par défaut ? (y/N) : ', (answer) => {
                    rl.close();
                    resolve(answer.toLowerCase() === 'y');
                });
            });
            
            if (!continueAnyway) {
                console.log('❌ Déploiement annulé');
                return;
            }
        }
        
        // Sélection des sites
        const selectedSites = await selectSites();
        
        if (selectedSites.length === 0) {
            console.log('👋 Déploiement annulé');
            return;
        }
        
        // Confirmation
        const confirmed = await confirmDeployment(selectedSites);
        
        if (!confirmed) {
            console.log('❌ Déploiement annulé');
            return;
        }
        
        // Déploiement
        console.log('\n🚀 Début du déploiement...');
        const startTime = Date.now();
        
        const results = [];
        for (const siteKey of selectedSites) {
            const result = await deploySite(siteKey, sites[siteKey]);
            results.push({ site: siteKey, ...result });
        }
        
        // Résumé final
        const endTime = Date.now();
        const duration = Math.round((endTime - startTime) / 1000);
        
        console.log('\n📊 Résumé du déploiement :');
        console.log('================================');
        
        let totalUploaded = 0;
        let totalErrors = 0;
        let successfulSites = 0;
        
        results.forEach(result => {
            const site = sites[result.site];
            const status = result.success ? '✅' : '❌';
            console.log(`${status} ${site.name}: ${result.uploaded} fichiers, ${result.errors} erreurs`);
            
            totalUploaded += result.uploaded;
            totalErrors += result.errors;
            if (result.success) successfulSites++;
        });
        
        console.log('================================');
        console.log(`📈 Total: ${totalUploaded} fichiers uploadés, ${totalErrors} erreurs`);
        console.log(`⏱️  Durée: ${duration} secondes`);
        console.log(`🎯 Sites réussis: ${successfulSites}/${selectedSites.length}`);
        
        if (totalErrors === 0) {
            console.log('\n🎉 Déploiement terminé avec succès !');
            console.log(`🌐 Votre site est maintenant en ligne sur ${ftpConfig.host}`);
        } else {
            console.log('\n⚠️  Déploiement terminé avec des erreurs');
        }
        
    } catch (error) {
        console.error('💥 Erreur critique:', error.message);
        process.exit(1);
    }
}

// Fonction de déploiement direct sans interaction
async function deployDirect(selectedSites) {
    try {
        console.log(`\n🚀 Déploiement de ${selectedSites.length} site(s)...`);
        const startTime = Date.now();
        
        const results = [];
        for (const siteKey of selectedSites) {
            const result = await deploySite(siteKey, sites[siteKey]);
            results.push({ site: siteKey, ...result });
        }
        
        // Résumé final
        const endTime = Date.now();
        const duration = Math.round((endTime - startTime) / 1000);
        
        console.log('\n📊 Résumé du déploiement :');
        console.log('================================');
        
        let totalUploaded = 0;
        let totalErrors = 0;
        let successfulSites = 0;
        
        results.forEach(result => {
            const site = sites[result.site];
            const status = result.success ? '✅' : '❌';
            console.log(`${status} ${site.name}: ${result.uploaded} fichiers, ${result.errors} erreurs`);
            
            totalUploaded += result.uploaded;
            totalErrors += result.errors;
            if (result.success) successfulSites++;
        });
        
        console.log('================================');
        console.log(`📈 Total: ${totalUploaded} fichiers uploadés, ${totalErrors} erreurs`);
        console.log(`⏱️  Durée: ${duration} secondes`);
        console.log(`🎯 Sites réussis: ${successfulSites}/${selectedSites.length}`);
        
        if (totalErrors === 0) {
            console.log('\n🎉 Déploiement terminé avec succès !');
            console.log(`🌐 Votre site est maintenant en ligne sur ${ftpConfig.host}`);
        } else {
            console.log('\n⚠️  Déploiement terminé avec des erreurs');
        }
        
    } catch (error) {
        console.error('💥 Erreur critique:', error.message);
        process.exit(1);
    }
}

// Script principal
if (require.main === module) {
    (async () => {
        const args = process.argv.slice(2);

        const testsOk = await runTests();
        if (!testsOk) {
            const ans = await ask('❌ Des tests ont échoué. Continuer le déploiement ? (y/N) : ');
            if (ans !== 'y' && ans !== 'yes') {
                console.log('🛑 Déploiement annulé suite aux tests échoués');
                process.exit(1);
            }
        }

        if (args.length > 0) {
            const siteArg = args[0].toLowerCase();
            if (siteArg === 'all') {
                deployDirect(Object.keys(sites));
            } else if (sites[siteArg]) {
                deployDirect([siteArg]);
            } else {
                console.log(`❌ Site "${siteArg}" non reconnu`);
                console.log('Sites disponibles:', Object.keys(sites).join(', '));
                process.exit(1);
            }
        } else {
            deploy();
        }
    })();
}

module.exports = { deploy, deployDirect, sites };