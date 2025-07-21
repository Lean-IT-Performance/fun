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
    return new Promise(res => rl.question(question, a => { rl.close(); res(a.trim().toLowerCase()); }));
}

async function deployEnvFile(client) {
    console.log('  🔐 Déploiement sécurisé du fichier .env...');
    
    const envPath = './.env';
    if (!fs.existsSync(envPath)) {
        console.log('  ⚠️  Fichier .env non trouvé - ignoré');
        return;
    }
    
    try {
        // Lire et filtrer le contenu .env (exclure les credentials FTP pour sécurité)
        const envContent = fs.readFileSync(envPath, 'utf8');
        const filteredLines = envContent.split('\n').filter(line => {
            // Garder seulement les variables nécessaires pour l'app
            const keepLine = line.trim() && 
                           !line.startsWith('#') && 
                           !line.startsWith('FTP_') && // Exclure credentials FTP
                           (line.includes('ADMIN_') || 
                            line.includes('OPENAI_') || 
                            line.includes('NODE_ENV'));
            return keepLine;
        });
        
        if (filteredLines.length === 0) {
            console.log('  ⚠️  Aucune variable d\'environnement nécessaire trouvée');
            return;
        }
        
        // Créer un fichier .env temporaire filtré
        const tempEnvPath = './.env.deploy.tmp';
        const filteredContent = filteredLines.join('\n') + '\n';
        fs.writeFileSync(tempEnvPath, filteredContent);
        
        console.log('  📤 Upload du fichier .env filtré...');
        await client.uploadFrom(tempEnvPath, '.env');
        
        // Nettoyer le fichier temporaire
        fs.unlinkSync(tempEnvPath);
        
        console.log('  ✅ Fichier .env déployé (variables filtrées pour sécurité)');
        console.log('  🔒 Variables déployées:', filteredLines.map(l => l.split('=')[0]).join(', '));
        
    } catch (error) {
        console.log(`  ❌ Erreur déploiement .env: ${error.message}`);
    }
}

async function deployAdmin() {
    const client = new ftp.Client();
    
    try {
        console.log('\n🔄 Déploiement Console Admin (version ultra-robuste)...');
        
        // Connexion
        console.log('  📡 Connexion au serveur FTP...');
        await client.access(ftpConfig);
        
        // Vérifier le répertoire courant
        const currentDir = await client.pwd();
        console.log(`  📍 Répertoire racine: ${currentDir}`);
        
        let totalUploadedFiles = 0;
        
        // Étape 0: Déploiement sécurisé du fichier .env
        await deployEnvFile(client);
        
        // Méthode 1: Upload du dossier admin complet
        console.log('  📂 Upload du dossier admin complet...');
        try {
            await client.uploadFromDir('./admin', 'admin');
            console.log('  ✅ Dossier admin uploadé avec uploadFromDir');
            
            // Compter les fichiers uploadés
            const adminFiles = [
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
            ];
            for (const file of adminFiles) {
                if (fs.existsSync(path.join('./admin', file))) {
                    totalUploadedFiles++;
                    console.log(`    ✅ ${file}`);
                }
            }
        } catch (error) {
            console.log(`  ❌ Erreur uploadFromDir admin: ${error.message}`);
            console.log('  🔄 Tentative avec méthode fichier par fichier...');
            
            // Fallback: un par un avec pause
            const adminFiles = [
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
            ];
            
            for (const file of adminFiles) {
                const localFilePath = path.join('./admin', file);
                const remoteFilePath = `admin/${file}`;
                
                if (fs.existsSync(localFilePath)) {
                    try {
                        console.log(`    ⬆️  ${file}`);
                        await client.uploadFrom(localFilePath, remoteFilePath);
                        console.log(`    ✅ ${file} - OK`);
                        totalUploadedFiles++;
                        
                        // Pause de 500ms entre chaque fichier
                        await new Promise(resolve => setTimeout(resolve, 500));
                        
                    } catch (error) {
                        console.log(`    ❌ Erreur upload ${file}: ${error.message}`);
                    }
                } else {
                    console.log(`    ⚠️  ${file} - fichier non trouvé localement`);
                }
            }
        }
        
        // Méthode 2: Upload de l'API avec approche alternative
        console.log('  📂 Upload des endpoints API admin...');
        
        const apiFiles = [
            { local: './api/admin/auth.php', remote: 'api/admin/auth.php', name: 'auth.php' },
            { local: './api/admin/openai-usage.php', remote: 'api/admin/openai-usage.php', name: 'openai-usage.php' },
            { local: './api/admin/config-test.php', remote: 'api/admin/config-test.php', name: 'config-test.php' },
            { local: './api/recipes-generator.php', remote: 'api/recipes-generator.php', name: 'recipes-generator.php' }
        ];
        
        try {
            // Essayer uploadFromDir pour api
            await client.uploadFromDir('./api', 'api');
            console.log('  ✅ Dossier api uploadé avec uploadFromDir');
            
            // Vérifier quels fichiers API sont présents
            for (const apiFile of apiFiles) {
                if (fs.existsSync(apiFile.local)) {
                    console.log(`    ✅ ${apiFile.name}`);
                    totalUploadedFiles++;
                } else {
                    console.log(`    ⚠️  ${apiFile.name} - non trouvé localement`);
                }
            }
            
        } catch (error) {
            console.log(`  ❌ Erreur uploadFromDir api: ${error.message}`);
            
            // Fallback: upload manuel de chaque fichier PHP
            console.log('  🔄 Tentative upload fichiers API individuellement...');
            
            for (const apiFile of apiFiles) {
                if (fs.existsSync(apiFile.local)) {
                    try {
                        console.log(`    ⬆️  ${apiFile.name}`);
                        await client.uploadFrom(apiFile.local, apiFile.remote);
                        console.log(`    ✅ ${apiFile.name} - OK`);
                        totalUploadedFiles++;
                        
                        // Pause entre chaque fichier
                        await new Promise(resolve => setTimeout(resolve, 500));
                        
                    } catch (uploadError) {
                        console.log(`    ❌ Erreur upload ${apiFile.name}: ${uploadError.message}`);
                    }
                } else {
                    console.log(`    ⚠️  ${apiFile.name} - fichier non trouvé localement`);
                }
            }
        }
        
        console.log(`\n  ✅ Console Admin déployée ! (${totalUploadedFiles} fichiers)`);
        console.log('  🔐 Fichier .env déployé automatiquement (variables filtrées)');
        console.log('  🌐 Testez via: https://votre-domaine.com/admin/');
        console.log('  🧪 Diagnostic: https://votre-domaine.com/admin/test-auth.html');
        
        // Avertissements de sécurité
        console.log('\n  🛡️  SÉCURITÉ:');
        console.log('    • Fichier .env déployé avec variables filtrées uniquement');
        console.log('    • Les credentials FTP sont exclus pour sécurité');
        console.log('    • Vérifiez les permissions serveur: chmod 600 .env');
        
        return totalUploadedFiles > 0;
        
    } catch (error) {
        console.log(`  ❌ Erreur de déploiement: ${error.message}`);
        return false;
    } finally {
        client.close();
    }
}

// Exécution
if (require.main === module) {
    (async () => {
        const testsOk = await runTests();
        if (!testsOk) {
            const ans = await ask('❌ Des tests ont échoué. Continuer le déploiement ? (y/N) : ');
            if (ans !== 'y' && ans !== 'yes') {
                console.log('🛑 Déploiement annulé suite aux tests échoués');
                process.exit(1);
            }
        }

        const success = await deployAdmin();
        if (success) {
            console.log('\n🎉 Déploiement terminé avec succès !');
        } else {
            console.log('\n❌ Déploiement échoué');
            process.exit(1);
        }
    })();
}

module.exports = { deployAdmin }; 