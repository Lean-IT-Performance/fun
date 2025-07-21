# 🧪 Système de Test - Fun Lean IT Performance

## 📋 Vue d'ensemble

Ce système de test complet permet de valider toutes les fonctionnalités du site web Fun Lean IT Performance. Il couvre :

- **Tests unitaires** : Validation des algorithmes et calculs
- **Tests API** : Vérification des endpoints backend
- **Tests d'interface** : Tests fonctionnels des applications
- **Tests d'intégration** : Validation des interactions entre composants

## 🚀 Installation

### Prérequis

```bash
# Node.js et npm requis
node --version  # v14+
npm --version   # v6+
```

### Installation des dépendances

```bash
# Depuis la racine du projet
npm install --save-dev jest playwright @playwright/test
```

### Configuration

1. **Variables d'environnement** : Créez un fichier `.env.test` :

```env
# Configuration de test
TEST_URL=http://localhost:8080
TEST_ADMIN_USER=test_admin
TEST_ADMIN_PASS=test_password
```

2. **Serveur local** : Démarrez un serveur de développement :

```bash
# Avec Python
python3 -m http.server 8080

# Ou avec Node.js
npx http-server -p 8080
```

## 🏃 Exécution des Tests

### Mode Console (Node.js)

```bash
# Tous les tests
npm test

# Ou directement
node test/run-all-tests.js

# Suite spécifique
node test/run-all-tests.js --suite "Tests API"

# Test spécifique
node test/run-all-tests.js --test sobre
```

### Mode Navigateur

1. Ouvrez `test/test-runner.html` dans votre navigateur
2. Configurez l'URL de base si nécessaire
3. Sélectionnez les tests à exécuter
4. Cliquez sur "Lancer les tests"

## 📁 Structure des Tests

```
test/
├── config/
│   └── test-config.js         # Configuration globale
├── utils/
│   └── test-helpers.js        # Fonctions utilitaires
├── unit/
│   └── sobre-calculator.test.js  # Tests unitaires
├── api/
│   └── api-tests.js           # Tests des endpoints
├── functional/
│   ├── sobre-ui.test.js       # Tests UI Sobre
│   └── recettes-ui.test.js    # Tests UI Recettes
├── run-all-tests.js           # Script principal
├── test-runner.html           # Interface navigateur
└── README.md                  # Cette documentation
```

## 🧪 Types de Tests

### 1. Tests Unitaires

**Calculateur Sobre** (`unit/sobre-calculator.test.js`)
- Formule de Widmark
- Calcul du BAC (Blood Alcohol Content)
- Temps jusqu'à sobriété
- Ajustements selon l'état digestif
- Limites de conduite

### 2. Tests API

**Authentification Admin** (`api/api-tests.js`)
- Login avec bons/mauvais identifiants
- Validation des paramètres requis
- Gestion des méthodes HTTP
- Headers CORS

**OpenAI Usage**
- Récupération des statistiques
- Authentification requise
- Paramètres de période

**Générateur de Recettes**
- Génération avec ingrédients
- Gestion des contraintes alimentaires
- Validation des entrées
- Tests de sécurité (XSS, injection)

### 3. Tests Interface Utilisateur

**Page d'accueil**
- Navigation vers les outils
- Responsive design
- Liens fonctionnels

**Interface Sobre**
- Configuration du profil
- Ajout/suppression de boissons
- Calcul en temps réel
- Graphiques d'évolution
- Persistance des données

**Interface Recettes**
- Gestion des ingrédients
- Paramètres avancés
- Génération IA
- Affichage des recettes
- Gestion d'erreurs

**Console Admin**
- Authentification
- Dashboard de monitoring
- Graphiques de coûts
- Configuration des alertes

## 🛠️ Utilitaires de Test

### Helpers disponibles

```javascript
// Attendre
await wait(1000); // 1 seconde

// Créer des données de test
const user = createTestUser();
const drinks = createTestDrinks();
const ingredients = createTestIngredients();

// Interactions DOM
await elementExists('#my-element');
await clickElement('#button');
await typeText('#input', 'texte');
const text = getElementText('#element');

// Requêtes API
const response = await apiRequest('/api/endpoint', {
    method: 'POST',
    body: JSON.stringify(data)
});

// Nettoyage
clearStorage();
```

## 📊 Métriques et Rapports

### Console

Le script affiche :
- Nombre total de tests
- Tests réussis/échoués
- Durée d'exécution
- Détails des erreurs

### Interface Web

- Statut en temps réel
- Console de sortie
- Métriques visuelles
- Export des résultats

## 🔧 Débogage

### Erreurs courantes

1. **"Element not found"**
   - Vérifiez les sélecteurs CSS
   - Ajoutez des délais d'attente
   - Vérifiez que la page est chargée

2. **"API timeout"**
   - Augmentez le timeout dans la config
   - Vérifiez que le serveur répond
   - Vérifiez les CORS

3. **"Test failed randomly"**
   - Ajoutez des `wait()` appropriés
   - Nettoyez le localStorage entre tests
   - Isolez les tests dépendants

### Mode debug

```javascript
// Activer les logs détaillés
TEST_CONFIG.debug = true;

// Capturer les erreurs console
const errorCapture = captureConsoleErrors();
// ... exécuter le test
console.log('Erreurs capturées:', errorCapture.errors);
```

## 🚦 CI/CD Integration

### GitHub Actions

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
```

### Pre-commit Hook

```bash
# .git/hooks/pre-commit
#!/bin/sh
npm test
```

## 📈 Bonnes Pratiques

1. **Isolation** : Chaque test doit être indépendant
2. **Nettoyage** : Toujours nettoyer après un test
3. **Attente** : Utiliser des attentes explicites
4. **Nommage** : Noms descriptifs pour les tests
5. **Assertions** : Une assertion par test idéalement
6. **Mocking** : Mocker les appels API externes

## 🔄 Maintenance

### Ajouter un nouveau test

1. Créer le fichier dans le bon dossier
2. Suivre la structure existante
3. Ajouter à `TEST_SUITES` dans `run-all-tests.js`
4. Documenter dans ce README

### Mettre à jour les tests

- Lors de changements d'interface
- Nouvelles fonctionnalités
- Changements d'API
- Corrections de bugs

## 📞 Support

Pour toute question ou problème :
1. Consultez les logs détaillés
2. Vérifiez la configuration
3. Isolez le test problématique
4. Créez une issue avec les détails

---

**Version** : 1.0.0  
**Dernière mise à jour** : 2025-01-20  
**Mainteneur** : Équipe Fun Lean IT Performance 