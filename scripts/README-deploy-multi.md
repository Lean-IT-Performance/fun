# Déploiement Multi-Sites

Ce projet inclut un système de déploiement FTP multi-sites qui permet de déployer sélectivement différentes parties du site.

## Configuration

Le script utilise automatiquement votre fichier `.env` existant avec vos informations FTP.

**Variables utilisées :**
- `FTP_HOST` : Serveur FTP
- `FTP_USER` : Nom d'utilisateur  
- `FTP_PASS` : Mot de passe
- `FTP_DIR` : Répertoire de base (ex: `/sites/fun.lean-it-performance.fr`)
- `FTP_PORT` : Port (défaut: 21)
- `FTP_SECURE` : true/false pour FTPS

**Alternative :** Vous pouvez aussi créer un fichier `deploy-env.js` qui aura la priorité sur `.env`

## Sites disponibles

- **homepage** : Page d'accueil principale (`index.html`, `styles.css`, `script.js`)
- **sobre** : Calculateur d'alcoolémie (`sobre/`)
- **recettes** : Générateur de recettes (`recettes/`)

## Utilisation

### Déploiement interactif
```bash
npm run deploy
```
Le script vous demandra quels sites déployer.

### Déploiement par scripts npm
```bash
# Déployer la page d'accueil uniquement
npm run deploy:homepage

# Déployer l'outil Sobre uniquement  
npm run deploy:sobre

# Déployer l'outil Recettes uniquement
npm run deploy:recettes

# Déployer tous les sites
npm run deploy:all
```

### Déploiement direct avec Node.js
```bash
# Déploiement interactif
node deploy-multi.js

# Avec sélection directe (expérimental)
echo "1,2" | node deploy-multi.js  # Sites 1 et 2
echo "all" | node deploy-multi.js  # Tous les sites
```

## Structure des dossiers distants

```
/sites/fun.lean-it-performance.fr/    # Votre FTP_DIR
├── index.html                        # Page d'accueil
├── styles.css
├── script.js
├── sobre/                            # Calculateur d'alcoolémie
│   ├── index.html
│   ├── styles.css
│   ├── script.js
│   └── CLAUDE.md
└── recettes/                         # Générateur de recettes
    ├── index.html
    ├── styles.css
    └── script.js
```

## Fonctionnalités

- ✅ Sélection interactive des sites à déployer
- ✅ Confirmation avant déploiement
- ✅ Résumé détaillé des opérations
- ✅ Gestion des erreurs par site
- ✅ Statistiques de déploiement
- ✅ Support multi-sites simultané

## Sécurité

⚠️ **Important :** Le script utilise votre `.env` existant. Ne commitez jamais ce fichier avec vos informations sensibles.

## Dépannage

### Erreur de connexion FTP
- Vérifiez vos informations de connexion dans `.env`
- Testez la connexion FTP avec un client tiers
- Vérifiez que le port est correct (21 pour FTP, 22 pour SFTP)

### Fichier non trouvé
- Assurez-vous que tous les fichiers existent dans les dossiers locaux
- Vérifiez la structure des dossiers

### Permissions FTP
- Vérifiez que votre utilisateur FTP a les droits d'écriture
- Assurez-vous que les dossiers distants existent ou peuvent être créés