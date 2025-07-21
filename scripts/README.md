# Scripts de Déploiement

Ce dossier contient tous les scripts et configurations nécessaires pour déployer le site Fun Lean IT Performance.

## 📁 Structure

```
scripts/
├── deploy-simple.js          # Script de déploiement principal (recommandé)
├── deploy-multi.js           # Script de déploiement interactif (avancé)
├── deploy.js                 # Script de déploiement original (legacy)
├── deploy.sh                 # Script bash (legacy)
├── deploy-env.js             # Configuration FTP personnalisée
├── deploy-env.example.js     # Exemple de configuration FTP
├── README-deploy.md          # Documentation deploy.js
├── README-deploy-multi.md    # Documentation deploy-multi.js
└── README.md                 # Ce fichier
```

**Tous les scripts exécutent automatiquement `npm test` avant de démarrer le déploiement.**
Si des tests échouent, vous serez invité à confirmer ou annuler la mise en ligne.
Les journaux complets sont enregistrés dans `test/last-test.log`.

## 🚀 Utilisation Recommandée

### Scripts npm (depuis la racine du projet)

```bash
# Déployer un site spécifique
npm run deploy:homepage    # Page d'accueil uniquement
npm run deploy:sobre       # Outil Sobre uniquement  
npm run deploy:recettes    # Page recettes uniquement
npm run deploy:admin       # Console d'administration (script dédié)

# Déployer tous les sites (y compris admin)
npm run deploy:all

# Déploiement interactif (choix des sites)
npm run deploy
```

### Utilisation directe

```bash
# Depuis la racine du projet
node scripts/deploy-simple.js <site|all>

# Exemples
node scripts/deploy-simple.js homepage
node scripts/deploy-simple.js sobre
node scripts/deploy-simple.js recettes
node scripts/deploy-admin.js
node scripts/deploy-simple.js admin  # (utilise le script dédié)
node scripts/deploy-simple.js all
```

## ⚙️ Configuration

Le déploiement utilise automatiquement les variables du fichier `.env` à la racine :

```env
FTP_HOST=votre_host_ftp
FTP_USER=votre_utilisateur_ftp
FTP_PASS=votre_mot_de_passe
FTP_DIR=
FTP_PORT=21
FTP_SECURE=false
```

**Alternative :** Créez `scripts/deploy-env.js` pour une configuration personnalisée.

## 📂 Sites Configurés

| Site | Dossier Local | Dossier Distant | Fichiers |
|------|---------------|-----------------|----------|
| **homepage** | `.` (racine) | `.` (racine) | index.html, styles.css, script.js, .htaccess |
| **sobre** | `./sobre` | `sobre/` | index.html, styles.css, script.js, CLAUDE.md |
| **recettes** | `./recettes` | `recettes/` | index.html, styles.css, script.js |

## 📋 Scripts Disponibles

### deploy-simple.js ⭐ (Recommandé)
- **Usage :** `node scripts/deploy-simple.js <site|all>`
- **Avantages :** Simple, fiable, messages clairs
- **Configuration :** Utilise `.env` uniquement
- **Support :** Déploiement par site ou global

### deploy-multi.js (Avancé)
- **Usage :** `node scripts/deploy-multi.js [site]`
- **Avantages :** Interface interactive, confirmation, statistiques détaillées
- **Configuration :** `.env` ou `deploy-env.js`
- **Support :** Sélection multiple, mode interactif

### deploy.js (Legacy)
- **Usage :** `node scripts/deploy.js`
- **Note :** Script original pour Sobre uniquement
- **Status :** Conservé pour compatibilité

## 🔧 Dépannage

### Erreur "fichier non trouvé"
- Exécutez toujours depuis la racine du projet
- Vérifiez que les dossiers `sobre/` et `recettes/` existent

### Erreur de connexion FTP
- Vérifiez vos informations dans `.env`
- Testez la connexion avec un client FTP

### Erreur de permissions
- Vérifiez que votre utilisateur FTP a les droits d'écriture
- Assurez-vous que les répertoires distants peuvent être créés

## 📈 Structure de Déploiement

```
Serveur FTP (votre_host_ftp)
└── / (répertoire utilisateur = /sites/fun.lean-it-performance.fr)
    ├── index.html           # Homepage
    ├── styles.css
    ├── script.js
    ├── .htaccess
    ├── sobre/               # Calculateur d'alcoolémie
    │   ├── index.html
    │   ├── styles.css
    │   ├── script.js
    │   └── CLAUDE.md
    └── recettes/            # Générateur de recettes
        ├── index.html
        ├── styles.css
        └── script.js
```