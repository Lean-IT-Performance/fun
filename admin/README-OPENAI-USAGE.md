# 📊 Intégration OpenAI Usage API - Console Admin

## Vue d'ensemble

La console administrateur a été améliorée pour visualiser les **vraies données d'utilisation** d'OpenAI grâce à l'API Usage officielle. Cette fonctionnalité permet de suivre précisément les coûts, requêtes et tokens consommés.

## 🔧 Configuration requise

### 1. Compte Organisation OpenAI
**IMPORTANT** : L'API Usage nécessite un **compte organisation OpenAI**. Les comptes personnels n'ont pas accès à cet endpoint.

### 2. Variables d'environnement
Assurez-vous que ces variables sont configurées dans votre fichier `.env` :

```env
# Clé API dédiée à la console admin (lecture des coûts)
OPENAI_API_KEY_ADMIN=sk-admin-your-admin-key-here

# Clé API générale (utilisée par les autres parties du site)
OPENAI_API_KEY=sk-proj-your-general-api-key-here

# ID d'organisation (requis pour l'API Costs)
OPENAI_ORG_ID=org-your-organization-id-here

# ID de projet (optionnel, pour filtrer les coûts)
OPENAI_PROJECT_ID=proj_your-project-id-here
```

### 3. Vérification des permissions
Testez votre accès avec cette commande curl :

```bash
curl https://api.openai.com/v1/usage \
  -H "Authorization: Bearer VOTRE_API_KEY" \
  -H "OpenAI-Organization: VOTRE_ORG_ID" \
  -H "Content-Type: application/json" \
  -d '{"start_date":"2025-01-01", "end_date":"2025-01-20"}'
```

## 🎯 Fonctionnalités

### Interface de contrôle des dates
- **Sélection de période personnalisée** : Choisissez les dates de début et fin
- **Périodes rapides** : 7 jours, 30 jours, 90 jours, mois en cours, mois dernier
- **Validation automatique** : Vérification des dates et limites

### Sources de données multiples
1. **🔗 API OpenAI** : Données officielles en temps réel
2. **📂 Cache local** : Données récentes mises en cache (valides 1h)
3. **📁 Stockage local** : Historique accumulé localement
4. **🎭 Simulation** : Données de démonstration si l'API n'est pas accessible

### Métriques affichées
- **Coût mensuel** : Total des dépenses pour la période
- **Requêtes quotidiennes** : Nombre d'appels API par jour
- **Tokens utilisés** : Input + Output tokens consommés
- **Coût moyen par requête** : Efficacité économique
- **Usage par modèle** : Répartition GPT-4, GPT-4o-mini, etc.

### 🔄 API Usage - Détails techniques

**Endpoint officiel utilisé** : `https://api.openai.com/v1/organization/costs`

C'est l'API publique et documentée fournie par OpenAI pour le suivi des coûts.

**Méthode** : `GET`

**Paramètres d'URL** :
- `start_time` : Timestamp Unix (début, inclusif)
- `end_time` : Timestamp Unix (fin, exclusif)
- `bucket_width`: `1d` (regroupement par jour)
- `project_ids[]`: `proj_...` (optionnel, pour filtrer par projet)

**Structure de réponse** :
```json
{
    "data": [
        {
            "start_time": 1730419200,
            "end_time": 1730505600,
            "results": [
                {
                    "amount": { "value": 0.06 },
                    "project_id": "proj_..."
                }
            ]
        }
    ]
}
```

**Métriques disponibles** :
- ✅ **Coût total** pour la période
- ✅ **Coût par jour**

**Métriques non disponibles** :
- ❌ Nombre de requêtes
- ❌ Nombre de tokens
- ❌ Coût par modèle (l'API ne le détaille pas pour l'instant)

L'interface affichera "N/A" pour les données non disponibles.

## 💡 Utilisation

### 1. Accès à la console
1. Connectez-vous avec vos identifiants admin
2. La section "📅 Période d'Analyse OpenAI Usage" s'affiche

### 2. Sélection de période
```
Méthode 1 - Dates personnalisées :
• Sélectionnez date de début et fin
• Cliquez "📊 Charger les données"

Méthode 2 - Périodes rapides :
• Cliquez "⚡ Périodes rapides ▼"
• Choisissez une option prédéfinie
```

### 3. Interprétation des indicateurs

| Indicateur | Signification |
|------------|---------------|
| ✅ Données OpenAI API | Vraies données récupérées |
| 📁 Données mises en cache | Cache local (< 1h) |
| 📁 Données locales | Historique stocké |
| 🎭 Données simulées | Démo ou erreur API |

## ⚠️ Troubleshooting

### Erreur 403 - Accès refusé
```
❌ Endpoint /usage non disponible pour votre compte OpenAI. 
   Un compte organisation est requis pour accéder aux données d'usage.
```
**Solution** : Créez un compte organisation OpenAI ou contactez votre administrateur.

### Erreur 401 - Non autorisé
```
❌ API Key invalide ou expirée
```
**Solutions** :
1. Vérifiez votre `OPENAI_API_KEY` dans `.env`
2. Régénérez votre API key sur platform.openai.com
3. Vérifiez les permissions de l'API key

### Erreur 429 - Limite de taux
```
⚠️ Limite de taux atteinte. Veuillez réessayer dans quelques minutes.
```
**Solution** : Attendez quelques minutes avant de réessayer.

### Données simulées affichées
Si vous voyez constamment des données simulées :
1. Vérifiez votre configuration `.env`
2. Testez l'API avec curl
3. Vérifiez que vous avez un compte organisation
4. Consultez les logs de la console développeur

## 🔐 Sécurité

### Protection des API keys
- Les API keys ne sont **jamais exposées** côté client
- Accès via `ConfigManager` sécurisé
- Chiffrement des données sensibles en transit

### Cache et stockage
- Cache local avec expiration (1h)
- Nettoyage automatique des anciennes données
- Pas de persistance des API keys

## 📈 Améliorations futures

### Prévues
- [ ] Export des données en CSV/Excel
- [ ] Alertes automatiques par email
- [ ] Comparaison période vs période
- [ ] Prédictions de coûts basées sur les tendances
- [ ] Intégration avec d'autres providers AI

### En cours d'évaluation
- [ ] API webhooks pour notifications en temps réel
- [ ] Dashboard multi-organisation
- [ ] Intégration avec des outils de facturation

## 📞 Support

### Logs et debug
Ouvrez la console développeur (F12) pour voir les logs détaillés :
```javascript
// Logs utiles pour le debug
🔍 Récupération des données d'usage OpenAI...
📅 Période demandée: 2025-01-01 à 2025-01-20
✅ Vraies données d'usage récupérées: {...}
📊 Traitement des vraies données d'usage...
💾 Données d'usage mises en cache
```

### Fichiers de configuration
- **Console admin** : `/admin/`
- **Configuration** : `/config.js`
- **API wrapper** : `/admin/api.js`
- **Variables d'environnement** : `/.env`

---

*Dernière mise à jour : Janvier 2025*
*Version : 2.0.0 avec intégration OpenAI Usage API* 