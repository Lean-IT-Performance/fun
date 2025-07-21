# 🚀 Fun Lean IT Performance

> Plateforme d'outils web pratiques et performants pour simplifier votre quotidien

## 📋 Vue d'ensemble

Fun Lean IT Performance est une collection d'applications web légères, axées sur la performance et la confidentialité. Toutes nos applications fonctionnent entièrement côté client, garantissant que vos données restent sur votre appareil.

### 🛠️ Applications disponibles

1. **[Sobre](./sobre/)** 🍷 - Calculateur scientifique de taux d'alcoolémie
   - Basé sur la formule de Widmark
   - Calculs en temps réel avec graphiques d'évolution
   - Prédictions de sobriété personnalisées

2. **[Mes Recettes](./recettes/)** 🍳 - Générateur de recettes intelligent
   - Alimenté par GPT-4o-mini
   - Création de recettes basées sur vos ingrédients disponibles
   - Prise en compte des contraintes alimentaires

3. **[Console Admin](./admin/)** ⚙️ - Monitoring et gestion
   - Suivi des coûts d'API OpenAI
   - Dashboard de monitoring en temps réel
   - Graphiques et alertes configurables

### 🔜 Applications en développement

- **Time Tracker** ⏱️ - Suivi de productivité et gestion du temps
- **Budget Manager** 💰 - Gestionnaire de budget personnel

## 🏗️ Architecture du projet

```
fun.lean-it-performance.fr/
├── 📄 index.html          # Page d'accueil
├── 🎨 styles.css          # Styles globaux
├── 🔧 script.js           # Scripts de la page d'accueil
├── ⚙️ config.js           # Configuration centralisée
│
├── 🍷 sobre/              # Calculateur d'alcoolémie
│   ├── index.html
│   ├── styles.css
│   ├── script.js
│   └── sobre_prd.md       # Document de spécifications
│
├── 🍳 recettes/           # Générateur de recettes IA
│   ├── index.html
│   ├── styles.css
│   ├── script.js
│   ├── sw.js              # Service Worker pour sécurité API
│   └── README-IA.md       # Documentation IA
│
├── ⚙️ admin/              # Console d'administration
│   ├── index.html
│   ├── styles.css
│   ├── script.js
│   ├── api.js             # Gestion API OpenAI
│   └── README.md          # Documentation admin
│
├── 🚀 scripts/            # Scripts de déploiement
│   ├── deploy-simple.js   # Déploiement principal
│   ├── deploy-admin.js    # Déploiement admin
│   └── README.md          # Documentation déploiement
│
└── 🧪 test/               # Infrastructure de tests
    ├── unit/              # Tests unitaires
    ├── api/               # Tests API
    ├── functional/        # Tests fonctionnels
    └── README.md          # Documentation tests
```

## 🚀 Installation et développement

### Prérequis

- Node.js 14+ et npm 6+
- Un serveur web local (optionnel pour développement)

### Installation

```bash
# Cloner le repository
git clone [votre-repo]
cd fun.lean-it-performance.fr

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos clés API et configurations
```

### Configuration

Créez un fichier `.env` à la racine avec :

```env
# Configuration OpenAI API
OPENAI_API_KEY=votre_cle_api_openai
OPENAI_ORG_ID=votre_org_id_openai

# Configuration Admin Console
ADMIN_USERNAME=votre_username_admin
ADMIN_PASSWORD=votre_password_securise

# Configuration FTP pour déploiement
FTP_HOST=votre_host_ftp
FTP_USER=votre_utilisateur_ftp
FTP_PASS=votre_mot_de_passe_ftp
FTP_DIR=
FTP_PORT=21
FTP_SECURE=false
```

### Développement local

```bash
# Lancer un serveur de développement
npm run serve

# Ou avec Python
python3 -m http.server 8080

# Accéder au site
# http://localhost:8080
```

## 🧪 Tests

Le projet inclut une suite de tests complète :

```bash
# Lancer tous les tests
npm test

# Tests spécifiques
npm run test:unit      # Tests unitaires
npm run test:api       # Tests API
npm run test:ui        # Tests interface

# Interface navigateur
npm run test:browser   # Ouvre test-runner.html
```

Pour plus de détails, consultez [test/README.md](./test/README.md).

## 📦 Déploiement

### Scripts de déploiement disponibles

```bash
# Déployer un site spécifique
npm run deploy:homepage    # Page d'accueil
npm run deploy:sobre       # Application Sobre
npm run deploy:recettes    # Générateur de recettes
npm run deploy:admin       # Console admin

# Déployer tout
npm run deploy:all

# Déploiement interactif
npm run deploy
```

Pour plus de détails, consultez [scripts/README.md](./scripts/README.md).

## 🔒 Sécurité

### Mesures implémentées

- ✅ **Gestion sécurisée des credentials** via variables d'environnement
- ✅ **Validation et sanitisation** de toutes les entrées utilisateur
- ✅ **Service Worker** pour proxy sécurisé des API keys (recettes)
- ✅ **Architecture client-side** : aucune donnée stockée sur serveur
- ✅ **Configuration centralisée** avec validation

### Bonnes pratiques

1. **Ne jamais committer** de clés API ou mots de passe
2. **Utiliser `.env`** pour toute configuration sensible
3. **Valider toutes les entrées** côté client
4. **Implémenter un backend** pour une sécurité maximale en production

Consultez [SECURITY.md](./SECURITY.md) pour plus de détails.

## 🎨 Principes de design

### Performance
- **Vanilla JavaScript** : Pas de frameworks lourds
- **CSS optimisé** : Utilisation de CSS Grid et Flexbox modernes
- **Lazy loading** : Chargement progressif des ressources
- **PWA-ready** : Service Workers pour fonctionnement offline

### Accessibilité
- **Responsive design** : Mobile-first, optimisé pour tous les écrans
- **Contraste élevé** : Interface lisible et accessible
- **Navigation clavier** : Support complet de la navigation au clavier
- **ARIA labels** : Balisage sémantique pour lecteurs d'écran

### Confidentialité
- **Stockage local uniquement** : LocalStorage pour la persistance
- **Aucun tracking** : Pas d'analytics ou de cookies tiers
- **Données chiffrées** : Hashage basique des données sensibles
- **Open source** : Code transparent et auditable

## 📖 Documentation additionnelle

- **[Admin Console](./admin/README.md)** - Guide complet de la console d'administration
- **[Générateur IA](./recettes/README-IA.md)** - Documentation du système IA
- **[Scripts de déploiement](./scripts/README.md)** - Guide de déploiement
- **[Tests](./test/README.md)** - Documentation complète des tests
- **[Sécurité](./SECURITY.md)** - Mesures et recommandations de sécurité

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Fork le projet
2. Créez votre branche (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📊 Stack technique

- **Frontend** : HTML5, CSS3, JavaScript ES6+
- **API** : OpenAI GPT-4o-mini (pour les recettes)
- **Backend** : PHP (endpoints admin)
- **Tests** : Jest, Playwright
- **Déploiement** : FTP via scripts Node.js
- **Hébergement** : Compatible avec tout hébergement statique

## 🚦 Status du projet

| Application | Status | Version |
|------------|--------|---------|
| Homepage | ✅ Production | 1.0.0 |
| Sobre | ✅ Production | 1.0.0 |
| Mes Recettes | ✅ Production | 1.0.0 |
| Admin Console | ✅ Production | 1.0.0 |
| Time Tracker | 🚧 En développement | - |
| Budget Manager | 📋 Planifié | - |

## 📄 License

Ce projet est sous license propriétaire. Tous droits réservés © 2025 Fun Lean IT Performance.

## 📞 Support

Pour toute question ou problème :
- Consultez d'abord la documentation spécifique de chaque module
- Vérifiez les logs dans la console du navigateur
- Créez une issue dans le repository avec les détails

---

**Version** : 1.0.0  
**Dernière mise à jour** : Janvier 2025  
**URL de production** : [fun.lean-it-performance.fr](https://fun.lean-it-performance.fr) 