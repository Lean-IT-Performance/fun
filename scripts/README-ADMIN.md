# 🎛️ Script de Déploiement Console Admin

> Compatible macOS, Linux et Windows

## 🚀 Usage Simple

```bash
# Déploiement admin seul
npm run deploy:admin

# Déploiement complet (tous les sites + admin)
npm run deploy:all
```

**Note :** La console admin est maintenant **incluse automatiquement** dans `deploy:all` !

## 📁 Ce qui est Déployé

- **Frontend Admin** → `/admin/` (interface, styles, scripts)
- **Backend API** → `/api/admin/auth.php` (authentification)

## 🛠️ Fonctionnement

### Déploiement Individuel (`npm run deploy:admin`)
- Utilise le script dédié `deploy-admin.js` 
- Méthodes ultra-robustes avec fallbacks automatiques

### Déploiement Global (`npm run deploy:all`)
- Déploie homepage, sobre, recettes **+ admin**
- Admin utilise automatiquement le script dédié
- Permet de tout mettre à jour en une commande

Le script utilise plusieurs méthodes automatiquement :

1. **Déploiement .env sécurisé** - Variables filtrées automatiquement
2. **Upload par dossier** (`uploadFromDir`) - Le plus rapide
3. **Upload fichier par fichier** - Fallback compatible
4. **Pauses intelligentes** - Pour serveurs lents

## ✅ Après Déploiement

1. **Fichier `.env` déployé automatiquement** (variables filtrées pour sécurité) ⭐
2. **Testez** : `https://votre-domaine.com/admin/`
3. **Diagnostic** : `https://votre-domaine.com/admin/test-auth.html`
4. **Sécurisez** : `chmod 600 .env` sur le serveur

## 🔧 Configuration Requise

### Fichier `.env` (local et serveur)
```bash
# FTP
FTP_HOST=votre-serveur.com
FTP_USER=username
FTP_PASS=password

# Admin
ADMIN_USERNAME=admin_user
ADMIN_PASSWORD=secure_password

# OpenAI
OPENAI_API_KEY=sk-proj-votre_cle
```

## 📊 Structure Créée

```
serveur/
├── admin/
│   ├── index.html           # Interface principale
│   ├── styles.css           # Styles
│   ├── script.js            # Logique frontend
│   ├── api.js               # Wrapper OpenAI
│   ├── test-auth.html       # Page de test
│   └── documentation...
└── api/
    └── admin/
        └── auth.php         # Endpoint sécurisé
```

## 🐛 En Cas de Problème

### Erreurs FTP communes :
- **"No such file"** → Script essaie automatiquement d'autres méthodes
- **"Permission denied"** → Vérifiez vos credentials FTP
- **"500 Server Error"** → Vérifiez que `.env` existe sur le serveur

### Test rapide :
```bash
# Vérifiez vos fichiers locaux
ls -la admin/
ls -la api/admin/

# Vérifiez votre config FTP
cat .env | grep FTP
```

## 🔐 Sécurité du .env

Le fichier `.env` est **déployé automatiquement** avec filtrage sécurisé :

- ✅ **Variables incluses :** `ADMIN_*`, `OPENAI_*`, `NODE_ENV`
- ❌ **Variables exclues :** `FTP_*` (credentials sensibles)
- 🛡️ **Protection :** Voir `scripts/DEPLOY-SECURITY.md` pour détails

---

**Le script est conçu pour être robuste et sécurisé.** 