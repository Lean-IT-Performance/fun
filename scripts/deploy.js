#!/usr/bin/env node

const ftp = require('basic-ftp');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');

// Configuration FTP (à personnaliser)
const ftpConfig = {
    host: 'votre-serveur-ftp.com',
    user: 'votre-username',
    password: 'votre-password',
    secure: false, // true pour FTPS
    port: 21
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

const remoteDir = '/public_html/sobre'; // Répertoire distant

// Fichiers à déployer
const filesToDeploy = [
    'index.html',
    'styles.css',
    'script.js',
    'CLAUDE.md'
];

async function deploy() {
    const client = new ftp.Client();
    
    try {
        console.log('🚀 Connexion au serveur FTP...');
        await client.access(ftpConfig);
        
        console.log('📂 Navigation vers le répertoire distant...');
        await client.ensureDir(remoteDir);
        
        console.log('📤 Upload des fichiers...');
        for (const file of filesToDeploy) {
            if (fs.existsSync(file)) {
                console.log(`  ⬆️  ${file}`);
                await client.uploadFrom(file, file);
            } else {
                console.log(`  ⚠️  ${file} - fichier non trouvé`);
            }
        }
        
        console.log('✅ Déploiement réussi !');
        
    } catch (error) {
        console.error('❌ Erreur lors du déploiement:', error.message);
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