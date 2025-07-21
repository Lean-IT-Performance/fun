# 🔧 Outils de Diagnostic - Console Admin

## Vue d'ensemble

Suite aux problèmes de configuration identifiés, j'ai créé des outils de diagnostic avancés pour faciliter le troubleshooting de la console admin et de l'intégration OpenAI.

## 🛠️ Nouveaux outils

### 1. **Endpoint de diagnostic** (`/api/admin/config-test.php`)
- **Objectif** : Diagnostiquer la configuration sans authentification
- **Usage** : Tests automatisés et debug rapide
- **Sécurité** : ⚠️ À désactiver en production

#### Fonctionnalités :
- ✅ Test d'accès au fichier `.env`
- ✅ Vérification des variables d'environnement
- ✅ Test des fonctions PHP nécessaires
- ✅ Diagnostic de connectivité
- ✅ Analyse des chemins de fichiers

### 2. **Mode debug amélioré** (`auth.php`)
- **Objectif** : Retourner les infos de debug même en cas d'échec d'auth
- **Usage** : `{"username": "test", "password": "test", "debug": true}`
- **Avantage** : Diagnostic sans connaître les vrais identifiants

### 3. **Interface de test améliorée** (`test-backend.html`)
- **Objectif** : Tests plus complets et informatifs
- **Fonctionnalités** : Diagnostic automatique + fallback

## 📋 Comment diagnostiquer les problèmes

### Étape 1: Test de configuration général
```
URL: /admin/test-backend.html
Section: "Test 1: Variables d'environnement"
Bouton: "🔍 Tester .env"
```

**Résultats possibles :**
- ✅ **Succès** : Configuration complète trouvée
- ⚠️ **Partiel** : Fichier `.env` trouvé mais variables manquantes
- ❌ **Échec** : Fichier `.env` non accessible

### Étape 2: Test OpenAI Usage API
```
URL: /admin/test-backend.html
Section: "Test 2: Endpoint OpenAI Usage"
Action: Sélectionner dates + "📊 Tester API Usage"
```

**Résultats possibles :**
- ✅ **Succès** : Vraies données OpenAI récupérées
- ❌ **403** : Compte organisation requis
- ❌ **401** : API Key invalide
- ❌ **500** : Erreur de configuration

### Étape 3: Test authentification
```
URL: /admin/test-auth.html
Section: "Test Endpoint d'Authentification"
Action: Entrer vrais identifiants + "Tester Auth"
```

## 🔍 Interprétation des résultats

### Diagnostic de configuration (`config-test.php`)

#### **Fichier .env trouvé** ✅
```json
{
  "debug": {
    "found_path": "/chemin/vers/.env",
    "env_file_exists": true,
    "env_file_readable": true,
    "env_vars_found": [
      {"key": "OPENAI_API_KEY", "has_value": true},
      {"key": "OPENAI_ORG_ID", "has_value": true}
    ]
  }
}
```

#### **Fichier .env manquant** ❌
```json
{
  "debug": {
    "found_path": null,
    "tried_paths": [
      {"path": "/chemin1/.env", "exists": false},
      {"path": "/chemin2/.env", "exists": false}
    ]
  }
}
```

### Variables d'environnement requises

#### **Obligatoires :**
- `OPENAI_API_KEY_ADMIN` (ou `OPENAI_API_KEY`) : Clé pour lire les coûts.
- `OPENAI_ORG_ID` : ID d'organisation.
- `ADMIN_USERNAME` : Nom d'utilisateur admin.
- `ADMIN_PASSWORD` : Mot de passe admin.

#### **Optionnelles :**
- `OPENAI_PROJECT_ID` : ID de projet pour filtrer les coûts.

---

### Problème : "API Key invalide" ou "Permissions insuffisantes"
**Causes possibles :**
- Les variables `OPENAI_API_KEY_ADMIN` et `OPENAI_API_KEY` sont manquantes ou incorrectes.
- La clé API utilisée n'a pas la permission `api.usage.read` sur l'organisation.

**Solutions :**
1. **Utilisez une clé dédiée** pour la console admin via `OPENAI_API_KEY_ADMIN`.
2. Assurez-vous que la clé a les permissions "Read" sur "Organization" ou le scope `api.usage.read`.
3. Régénérez la clé sur platform.openai.com si nécessaire.

## 🚨 Résolution des problèmes courants

### Problème : "Fichier .env non trouvé"
**Causes possibles :**
- Fichier `.env` absent de la racine du projet
- Permissions de lecture insuffisantes
- Serveur web dans un répertoire différent

**Solutions :**
1. Vérifier que `.env` est à la racine
2. Vérifier les permissions : `chmod 644 .env`
3. Tester les chemins dans le diagnostic

### Problème : "API Key invalide"
**Causes possibles :**
- Variable `OPENAI_API_KEY` manquante ou incorrecte
- API Key expirée
- Problème de format (espaces, caractères spéciaux)

**Solutions :**
1. Régénérer l'API Key sur platform.openai.com
2. Vérifier qu'il n'y a pas d'espaces dans le `.env`
3. Tester avec curl pour valider l'API Key

### Problème : "Compte organisation requis"
**Cause :** L'API Usage nécessite un compte organisation OpenAI

**Solutions :**
1. Créer un compte organisation sur OpenAI
2. Ajouter `OPENAI_ORG_ID` dans le `.env`
3. Utiliser le mode simulation en attendant

### Problème : "Endpoint non accessible"
**Causes possibles :**
- Serveur PHP non configuré
- Fichiers PHP non déployés
- Problèmes de routage

**Solutions :**
1. Vérifier que PHP fonctionne
2. Redéployer avec `node scripts/deploy-admin.js`
3. Tester l'accès direct aux endpoints

## 🔐 Sécurité

### ⚠️ **IMPORTANT - Production**
Avant de mettre en production :

1. **Désactiver `config-test.php`** :
   ```bash
   # Renommer ou supprimer le fichier
   mv api/admin/config-test.php api/admin/config-test.php.disabled
   ```

2. **Désactiver le mode debug** dans `auth.php` :
   ```php
   $debugMode = false; // Forcer à false en production
   ```

3. **Protéger les pages de test** :
   - Restreindre l'accès par IP
   - Utiliser un `.htaccess` pour protéger `/admin/test-*.html`

### 🛡️ **Bonnes pratiques**
- Changer régulièrement les mots de passe admin
- Surveiller les logs d'accès aux endpoints de diagnostic
- Utiliser HTTPS en production
- Limiter les tentatives de connexion

## 📊 Monitoring

### Logs à surveiller
- Accès aux endpoints `/api/admin/*`
- Tentatives d'authentification échouées
- Erreurs 500 dans les logs PHP
- Utilisation de l'endpoint de diagnostic

### Métriques importantes
- Temps de réponse des endpoints
- Taux d'erreur des appels OpenAI
- Fréquence d'utilisation de la console admin

---

*Documentation mise à jour : Janvier 2025*  
*Version : 2.1 avec outils de diagnostic avancés* 