#!/usr/bin/env node

require('dotenv').config();
const ftp = require('basic-ftp');
const fs = require('fs');
const { spawn } = require('child_process');
const readline = require('readline');
const path = require('path');

// Configuration sécurisée depuis variables d'environnement
const ftpConfig = {
    host: process.env.FTP_HOST,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASS,
    secure: process.env.FTP_SECURE === 'true',
    port: parseInt(process.env.FTP_PORT) || 21
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

// Validation de la configuration
function validateFTPConfig(config) {
    const errors = [];
    
    if (!config.host) errors.push('FTP_HOST manquant');
    if (!config.user) errors.push('FTP_USER manquant');
    if (!config.password) errors.push('FTP_PASS manquant');
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

const remoteDir = process.env.FTP_DIR;

const filesToDeploy = [
    'index.html',
    'styles.css', 
    'script.js',
    'CLAUDE.md'
];

async function deploy() {
    // Validation sécurisée de la configuration
    const validation = validateFTPConfig(ftpConfig);
    if (!validation.isValid) {
        console.error('❌ Configuration FTP invalide:');
        validation.errors.forEach(error => console.error(`  - ${error}`));
        console.log('💡 Vérifiez votre fichier .env et les variables d\'environnement');
        process.exit(1);
    }

    console.log('🔐 Configuration FTP validée avec succès');

    const client = new ftp.Client();
    client.ftp.verbose = true; // Pour déboguer si nécessaire
    
    try {
        console.log(`🚀 Connexion à ${ftpConfig.host}...`);
        await client.access(ftpConfig);
        
        if (remoteDir) {
            console.log(`📂 Navigation vers ${remoteDir}...`);
            await client.ensureDir(remoteDir);
        }
        
        console.log('📤 Upload des fichiers...');
        for (const file of filesToDeploy) {
            if (fs.existsSync(file)) {
                console.log(`  ⬆️  ${file}`);
                await client.uploadFrom(file, file);
                console.log(`  ✅ ${file} - OK`);
            } else {
                console.log(`  ⚠️  ${file} - fichier non trouvé, ignoré`);
            }
        }
        
        console.log('🎉 Déploiement terminé avec succès !');
        console.log(`🌐 Votre site est maintenant en ligne sur ${ftpConfig.host}`);
        
    } catch (error) {
        console.error('❌ Erreur lors du déploiement:');
        console.error(error.message);
        process.exit(1);
    } finally {
        client.close();
    }
}

async function main() {
    const testsOk = await runTests();
    if (!testsOk) {
        const ans = await ask('❌ Des tests ont échoué. Continuer le déploiement ? (y/N) : ');
        if (ans !== 'y' && ans !== 'yes') {
            console.log('🛑 Déploiement annulé suite aux tests échoués');
            return;
        }
    }
    await deploy();
}

if (require.main === module) {
    main();
}