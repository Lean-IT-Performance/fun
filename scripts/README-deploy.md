# 🚀 Guide de Déploiement FTP - Sobre

## Options disponibles

### Option 1 : Script Bash (simple)
```bash
# Éditer deploy.sh avec vos paramètres FTP
nano deploy.sh

# Exécuter
./deploy.sh
```

### Option 2 : Script Node.js (recommandé)
```bash
# Installation
npm install

# Éditer deploy.js avec vos paramètres
nano deploy.js

# Déploiement
npm run deploy
```

### Option 3 : Configuration sécurisée (le plus sûr)
```bash
# Installation
npm install

# Créer le fichier de configuration
cp .env.example .env

# Éditer .env avec vos vraies données FTP
nano .env

# Déploiement sécurisé
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

## Fichiers déployés

✅ `index.html` - Page principale  
✅ `styles.css` - Styles CSS  
✅ `script.js` - Logique JavaScript  
✅ `CLAUDE.md` - Documentation  

## Prérequis

### Pour Bash :
- `lftp` installé : `brew install lftp` (macOS) ou `apt-get install lftp` (Linux)

### Pour Node.js :
- Node.js installé
- `npm install` exécuté

## Sécurité

⚠️ **Important :** 
- Ajoutez `.env` à `.gitignore` 
- Ne commitez jamais vos mots de passe
- Utilisez des mots de passe FTP robustes

## Dépannage

**Erreur de connexion :**
- Vérifiez host/port/credentials
- Testez avec un client FTP (FileZilla)

**Erreur de permissions :**
- Vérifiez les droits du répertoire distant
- Contactez votre hébergeur si nécessaire