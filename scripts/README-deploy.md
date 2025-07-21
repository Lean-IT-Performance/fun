# 🚀 Guide de D\xE9ploiement FTP - Sobre

Ce guide pr\xE9sente les diff\xE9rentes m\xE9thodes pour mettre en ligne le projet. Les scripts sont d\xE9sormais 100\x25 multiplateformes (macOS, Linux et Windows).

## Options disponibles

### Option 1 : Script Node.js simple
```bash
# Installation des d\xE9pendances
npm install

# D\xE9ploiement (tous les sites ou un site sp\xE9cifique)
# Exemple :
node scripts/deploy-simple.js all       # tout d\xE9ployer
node scripts/deploy-simple.js homepage  # un seul site
```

Des wrappers sont fournis pour plus de confort :
- **macOS/Linux** : `./scripts/deploy.sh`
- **Windows** : `powershell ./scripts/deploy.ps1`

### Option 2 : Mode s\xE9curis\xE9 avec `.env`
```bash
npm install
cp .env.example .env
# Editer vos informations FTP dans .env
npm run deploy:env
```

## Configuration FTP

Dans `.env` ou directement dans les scripts, configurez :
```env
FTP_HOST=ftp.votre-hebergeur.com
FTP_USER=votre-nom-utilisateur
FTP_PASS=votre-mot-de-passe
FTP_DIR=/public_html/sobre
FTP_PORT=21
FTP_SECURE=false
```

## Fichiers d\xE9ploy\xE9s

- `index.html`
- `styles.css`
- `script.js`
- `CLAUDE.md`

## Pr\xE9requis

- **Node.js** install\xE9
- `npm install` ex\xE9cut\xE9

## S\xE9curit\xE9

- Ajoutez `.env` \xE0 `.gitignore`
- Ne commitez jamais vos mots de passe
- Utilisez des mots de passe FTP robustes

## D\xE9pannage

- **Erreur de connexion :** v\xE9rifiez host/port/credentials, testez avec un client FTP (FileZilla)
- **Erreur de permissions :** v\xE9rifiez les droits du r\xE9pertoire distant ou contactez votre h\xE9bergeur

