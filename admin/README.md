# 🔐 Console d'Administration

Console de monitoring des coûts d'usage de l'API OpenAI pour le projet Fun Lean IT Performance.

## 🎯 Fonctionnalités

### Dashboard Principal
- **Statistiques en temps réel** : Coûts mensuels, requêtes quotidiennes, tokens utilisés
- **Graphiques interactifs** : Évolution des coûts sur 7/30/90 jours
- **Usage par modèle** : Répartition des requêtes entre GPT-4o-mini, GPT-4, etc.
- **Tableau des requêtes** : Historique détaillé des 10 dernières requêtes

### Système d'Alertes
- **Seuils configurables** : Alerte automatique si coût mensuel > seuil
- **Monitoring d'erreurs** : Détection des erreurs API récurrentes
- **Notifications visuelles** : Système de notifications temporaires

### Configuration
- **Seuils d'alerte personnalisables**
- **Auto-refresh configurable** (10-300 secondes)
- **Paramètres sauvegardés localement**

## 🔧 Installation et Configuration

### 1. Variables d'environnement

Créez un fichier `.env` à la racine du projet avec :

```bash
# Configuration OpenAI API
OPENAI_API_KEY=votre_cle_api_openai
OPENAI_ORG_ID=votre_org_id_openai

# Configuration Admin Console  
ADMIN_USERNAME=votre_username_admin
ADMIN_PASSWORD=votre_password_securise

# Autres configurations...
FTP_HOST=votre_host_ftp
FTP_USER=votre_utilisateur_ftp
FTP_PASS=votre_mot_de_passe_ftp
```

### 2. Sécurité

⚠️ **IMPORTANT** : Pour une sécurité maximale en production :

1. **Utilisez un backend** pour les appels API et l'authentification
2. **Chiffrez les mots de passe** admin dans la base de données
3. **Configurez HTTPS** obligatoire pour la console admin
4. **Limitez l'accès** par IP si possible

### 3. Accès à la Console

- **URL** : `https://votre-domaine.com/admin/`
- **Identifiants** définis via les variables d'environnement :
  - `ADMIN_USERNAME`
  - `ADMIN_PASSWORD`

## 🚀 Utilisation

### Connexion
1. Accédez à `/admin/`
2. Saisissez vos identifiants admin
3. La session reste active 4 heures

### Dashboard
- **Actualisation automatique** : Toutes les 30 secondes par défaut
- **Actualisation manuelle** : Bouton "🔄 Actualiser"
- **Période des graphiques** : Sélecteur 7/30/90 jours

### Monitoring des Coûts
- **Coût mensuel** : Total du mois en cours
- **Évolution** : Pourcentage de variation vs période précédente
- **Détail par jour** : Graphique linéaire avec coûts et nb requêtes
- **Par modèle** : Graphique en donut de la répartition

### Alertes
- **Seuil de coût** : Configurable dans les paramètres
- **Erreurs API** : Alerte si > 2 erreurs dans les requêtes récentes
- **Notifications** : Activables/désactivables

## 📊 API OpenAI Integration

### Intégration OpenAI Usage API

La console utilise l'**API OpenAI Usage officielle** (`/v1/organization/costs`) pour obtenir les vraies données d'utilisation.

**Configuration requise :**
- Compte organisation OpenAI (requis)
- Variables `.env` : `OPENAI_API_KEY`, `OPENAI_ORG_ID`, `OPENAI_PROJECT_ID`

**Fonctionnalités :**
- Sélection de période personnalisée et périodes rapides
- Sources multiples : API temps réel, cache local, simulation
- Métriques : coût mensuel, requêtes quotidiennes, tokens, coût moyen par requête

Pour la documentation technique complète, consultez `README-OPENAI-USAGE.md`.

## 🔒 Sécurité

### Authentification
- **Session-based** : Token stocké en sessionStorage
- **Expiration** : 4 heures d'inactivité
- **Validation côté client** : À améliorer avec backend

### Protection des Données
- **API Key** : Jamais exposée côté client
- **ConfigManager** : Gestion sécurisée des credentials
- **Logs sécurisés** : Masquage des informations sensibles

### Bonnes Pratiques
```javascript
// ✅ Bon usage
const config = this.configManager.getAdminConfig();

// ❌ À éviter
const password = 'mon_password'; // Hard-coded
```

## 🎨 Interface

### Design System
- **Framework CSS** : Vanilla CSS avec variables CSS
- **Couleurs** : Palette cohérente (bleu primaire, gris neutres)
- **Typography** : System fonts (-apple-system, Segoe UI)
- **Responsive** : Mobile-first, breakpoints 768px et 480px

### Composants
- **Cards de statistiques** : Icône + valeur + évolution
- **Graphiques** : Chart.js pour visualisations
- **Tableau responsive** : Overflow horizontal sur mobile
- **Notifications** : Toast temporaires (3 secondes)

## 📱 Responsive Design

### Desktop (> 1024px)
- **Grille 4 colonnes** pour les stats
- **Graphiques côte à côte** (2fr + 1fr)
- **Tableau complet** visible

### Tablet (768px - 1024px)  
- **Grille 2 colonnes** pour les stats
- **Graphiques empilés** (1 colonne)
- **Navigation simplifiée**

### Mobile (< 768px)
- **Grille 1 colonne** pour tout
- **Header vertical** centré
- **Tableau scrollable** horizontalement
- **Touch-friendly** boutons 44px minimum

## 🐛 Debugging

### Logs Console
```javascript
// Activation debugging
localStorage.setItem('admin_debug', 'true');

// Logs disponibles
🚀 Initialisation console admin
📊 Chargement données dashboard  
🔄 Actualisation données
✅ Données actualisées
❌ Erreur chargement données
```

### Variables d'Inspection
```javascript
// Dans la console navigateur
window.adminConsole.configManager.getDebugInfo();
window.adminConsole.openaiAPI.testConnection();
window.adminConsole.settings;
```

### Simulation de Données
Si l'API OpenAI n'est pas accessible, la console utilise des données simulées réalistes pour les tests.

## 🔄 Auto-refresh

### Configuration
- **Intervalle par défaut** : 30 secondes
- **Minimum** : 10 secondes  
- **Maximum** : 300 secondes (5 minutes)
- **Pause automatique** : Si onglet inactif

### Optimisations
- **Requêtes groupées** : Parallel loading des données
- **Cache local** : Évite les re-calculs inutiles
- **Lazy loading** : Graphiques initialisés uniquement si visibles

## 📈 Métriques Importantes

### KPIs Monitorés
1. **Coût mensuel total** ($)
2. **Coût moyen par requête** ($)
3. **Tokens utilisés par jour** (K)
4. **Taux d'erreur API** (%)
5. **Modèle le plus utilisé**

### Alertes Recommandées
- **Coût mensuel > $50** : Alerte budget
- **Erreurs > 5%** : Problème API
- **Usage GPT-4 > 20%** : Optimisation possible vers GPT-4o-mini

## 🚀 Améliorations Futures

### Court Terme
- [ ] **Backend d'authentification** sécurisé
- [ ] **Cache Redis** pour performances
- [ ] **Webhooks** OpenAI pour données temps réel
- [ ] **Export PDF** des rapports

### Moyen Terme  
- [ ] **Multi-utilisateurs** avec rôles
- [ ] **Historique long terme** (> 90 jours)
- [ ] **Prédictions coûts** avec ML
- [ ] **Integration Slack** pour alertes

### Long Terme
- [ ] **Multi-providers** (Anthropic, etc.)
- [ ] **Optimisation automatique** des prompts
- [ ] **A/B testing** des modèles
- [ ] **Compliance SOC2** pour entreprises

## 📞 Support

### Problèmes Courants

**🔑 "API Key non trouvée"**
- Vérifiez le fichier `.env`
- Rechargez le ConfigManager
- Testez la clé directement sur OpenAI

**🔐 "Identifiants incorrects"**  
- Vérifiez `ADMIN_USERNAME` et `ADMIN_PASSWORD`
- Effacez le cache navigateur
- Vérifiez la casse (sensible)

**📊 "Données non disponibles"**
- Mode simulation activé automatiquement
- API OpenAI peut avoir des limites
- Vérifiez les quotas de votre compte

**🎨 "Interface cassée"**
- Videz le cache CSS/JS
- Vérifiez la console pour erreurs JavaScript
- Testez en navigation privée

### Contact
Pour assistance technique ou suggestions d'amélioration, créez une issue dans le repository du projet.

---

**Version** : 1.0.0  
**Dernière mise à jour** : 2025-01-20  
**Compatibilité** : Chrome 80+, Firefox 75+, Safari 13+, Edge 80+ 