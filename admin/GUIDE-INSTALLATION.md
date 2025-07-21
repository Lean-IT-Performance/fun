# 🔧 Guide d'Installation et Résolution des Problèmes

Ce guide vous aidera à résoudre les deux problèmes principaux identifiés :
1. **Authentification** : Le couple user/mot de passe du .env n'est pas pris en compte
2. **Données API** : Les données affichées sont simulées au lieu d'être réelles

## 🚨 Problème 1 : Authentification Sécurisée

### Problème Identifié
L'authentification utilise des valeurs par défaut au lieu des variables du fichier `.env`.

### ✅ Solution Complète

#### Étape 1 : Configurer le .env
Créez ou complétez votre fichier `.env` à la racine du projet :

```bash
# Variables d'authentification admin (OBLIGATOIRES)
ADMIN_USERNAME=votre_admin_securise
ADMIN_PASSWORD=VotreMotDePasseComplexe2025!

# API OpenAI
OPENAI_API_KEY=sk-proj-votre_cle_api_ici
OPENAI_ORG_ID=org-votre_org_id_ici
```

#### Étape 2 : Vérifier la Structure des Fichiers
Assurez-vous d'avoir cette structure :
```
votre-projet/
├── .env                    # Variables d'environnement
├── .htaccess              # Configuration Apache
├── api/
│   └── admin/
│       └── auth.php       # Endpoint d'authentification
└── admin/
    ├── index.html         # Console admin
    ├── script.js          # Logique frontend
    └── test-auth.html     # Page de test
```

#### Étape 3 : Tester l'Authentification

1. **Test avec la page de diagnostic** :
   - Accédez à `/admin/test-auth.html`
   - Testez avec vos vrais identifiants du .env
   - Vérifiez que tous les voyants sont verts

2. **Test manuel de l'endpoint** :
   ```bash
   curl -X POST https://votre-domaine.com/api/admin/auth \
        -H "Content-Type: application/json" \
        -d '{"username":"votre_admin","password":"votre_password"}'
   ```

3. **Réponse attendue** :
   ```json
   {
     "valid": true,
     "message": "Authentification réussie"
   }
   ```

#### Étape 4 : Résolution des Problèmes Courants

**❌ "Variables manquantes dans .env"**
- Vérifiez que le fichier `.env` est à la racine du projet
- Vérifiez la syntaxe : `ADMIN_USERNAME=admin` (pas d'espaces)
- Rechargez le serveur après modification du .env

**❌ "Endpoint non trouvé"**
- Vérifiez que le fichier `api/admin/auth.php` existe
- Vérifiez que le `.htaccess` redirige correctement
- Testez : `https://votre-domaine.com/api/admin/auth.php` directement

**❌ "Permission denied"**
- Vérifiez les permissions du fichier .env : `chmod 600 .env`
- Vérifiez les permissions PHP : `chmod 644 api/admin/auth.php`

## 🔍 Problème 2 : Données API Réelles

### Problème Identifié
Les données affichées sont simulées car l'endpoint OpenAI `/usage` n'est pas accessible.

### ✅ Solution Améliorée

#### Comprendre les Sources de Données

La console admin utilise maintenant **3 sources de données** dans cet ordre :

1. **🔗 Données OpenAI API** (idéal)
   - Endpoint : `/v1/usage`
   - Nécessite : Compte organisation OpenAI
   - Status : Affiché en vert "Données OpenAI API"

2. **📁 Données Locales** (réaliste)
   - Source : Stockage des vraies requêtes de votre app
   - Données : Vraies requêtes de `recettes/` trackées
   - Status : Affiché en bleu "Données Locales"

3. **🎭 Données Simulées** (fallback)
   - Source : Algorithme de simulation réaliste
   - Usage : Quand aucune vraie donnée disponible
   - Status : Affiché en orange "Données Simulées"

#### Option A : Obtenir de Vraies Données OpenAI (Recommandé)

**Pour les Comptes Individuels :**
L'endpoint `/usage` n'est plus disponible. La console utilise automatiquement le tracking local.

**Pour les Comptes Organisation :**
1. Convertissez votre compte en compte organisation
2. Ajoutez `OPENAI_ORG_ID=org-xxxxxxxxx` dans le .env
3. Les vraies données OpenAI seront automatiquement utilisées

#### Option B : Utiliser le Tracking Local (Fonctionnel Maintenant)

**Fonctionnement Automatique :**
- Chaque requête de l'app `recettes/` est maintenant trackée
- Les données sont stockées dans localStorage
- La console admin lit ces vraies données

**Tester le Tracking :**
1. Allez sur `/recettes/`
2. Générez quelques recettes IA
3. Retournez sur `/admin/`
4. Vous devriez voir "📁 Données Locales" au lieu de "🎭 Données Simulées"

**Forcer des Données de Test :**
1. Allez sur `/admin/test-auth.html`
2. Cliquez "Générer Données Test"
3. Retournez sur `/admin/`
4. Les données de test sont maintenant affichées

#### Option C : Debugging des Données

**Console JavaScript :**
```javascript
// Voir les données stockées
console.log(localStorage.getItem('openai_usage_data'));

// Forcer le rechargement des données
window.location.reload();
```

**Vérifier le Source des Données :**
- L'indicateur en haut à droite de l'admin indique la source
- Vert = OpenAI API / Bleu = Local / Orange = Simulé

## 🔧 Tests et Validation

### Test Complet du Système

#### 1. Test d'Authentification
```bash
# Test endpoint auth
curl -X POST votre-domaine.com/api/admin/auth \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"wrongpass"}'
# Doit retourner: {"valid":false}

curl -X POST votre-domaine.com/api/admin/auth \
     -H "Content-Type: application/json" \
     -d '{"username":"VOTRE_ADMIN","password":"VOTRE_PASSWORD"}'
# Doit retourner: {"valid":true}
```

#### 2. Test des Données
1. **Générer de vraies données** :
   - Utilisez l'app recettes pour faire 3-4 requêtes IA
   - Vérifiez la console : `localStorage.getItem('openai_usage_data')`

2. **Vérifier l'affichage admin** :
   - Connectez-vous à `/admin/`
   - L'indicateur doit montrer "📁 Données Locales"
   - Les graphiques doivent refléter vos vraies requêtes

#### 3. Validation Console

**Logs à vérifier :**
```javascript
// Dans la console navigateur de /admin/
🔍 Tentative de récupération des vraies données d'usage...
📁 Utilisation des données locales stockées
✅ Données locales trouvées et affichées
```

**Logs à éviter :**
```javascript
❌ API Key non trouvée
🎭 Affichage de données simulées
⚠️ Utilisation des credentials de fallback
```

## 📋 Checklist de Validation

### ✅ Authentification Sécurisée
- [ ] Fichier `.env` créé avec ADMIN_USERNAME et ADMIN_PASSWORD
- [ ] Endpoint `/api/admin/auth` accessible et fonctionnel
- [ ] Test avec `/admin/test-auth.html` réussi
- [ ] Connexion admin `/admin/` avec vrais identifiants
- [ ] Aucun mot de passe par défaut dans le code

### ✅ Données Réelles
- [ ] Application recettes tracke les requêtes (console : "📊 Usage loggé")
- [ ] Données stockées dans localStorage visible
- [ ] Console admin affiche "📁 Données Locales" ou "🔗 Données OpenAI API"
- [ ] Plus de "🎭 Données Simulées" après utilisation réelle
- [ ] Graphiques cohérents avec l'usage réel

### ✅ Fonctionnalités Avancées
- [ ] Auto-refresh fonctionne (30 secondes par défaut)
- [ ] Alertes configurables dans les paramètres
- [ ] Graphiques Chart.js s'affichent correctement
- [ ] Interface responsive sur mobile

## 🆘 Support et Debugging

### Logs Utiles

**Côté Serveur (PHP) :**
```bash
# Voir les logs d'erreur PHP
tail -f /var/log/apache2/error.log
# ou
tail -f /var/log/nginx/error.log
```

**Côté Client (JavaScript) :**
```javascript
// Activer le mode debug
localStorage.setItem('admin_debug', 'true');

// Voir l'état complet de l'admin
console.log(window.adminConsole);
```

### Problèmes Fréquents

**🚨 "CORS Error"**
- Ajoutez les en-têtes CORS dans `.htaccess`
- Vérifiez que le serveur supporte les requêtes POST

**🚨 "500 Internal Server Error"**
- Vérifiez les permissions du fichier `.env`
- Vérifiez la syntaxe PHP dans `auth.php`
- Consultez les logs serveur

**🚨 "localStorage Empty"**
- Vérifiez que l'app recettes charge bien les nouvelles fonctions
- Testez manuellement : générez une recette IA
- Videz le cache navigateur et rechargez

### Contact et Assistance

Si vous rencontrez encore des problèmes :

1. **Utilisez la page de test** : `/admin/test-auth.html`
2. **Vérifiez les logs** navigateur et serveur
3. **Testez étape par étape** selon ce guide
4. **Partagez les messages d'erreur** exacts pour un diagnostic

---

**✅ Après avoir suivi ce guide, vous devriez avoir :**
- Une authentification sécurisée basée sur votre .env
- Des données réelles provenant de vos vraies requêtes OpenAI
- Une console admin pleinement fonctionnelle

**Version du guide :** 1.0.0  
**Dernière mise à jour :** 2025-01-20 