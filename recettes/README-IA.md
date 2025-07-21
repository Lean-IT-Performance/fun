# 🤖 Générateur de Recettes IA - Documentation

## 🎯 Présentation

Le générateur de recettes IA utilise **GPT-4o-mini** pour créer des recettes personnalisées basées sur vos ingrédients disponibles. Le système prend en compte de nombreux paramètres pour générer des recettes adaptées à vos besoins.

## 🔐 Sécurité

**IMPORTANT** : La clé API OpenAI est intégrée via un Service Worker pour offrir une sécurité relative. Pour une sécurité optimale en production, il est recommandé d'utiliser un backend dédié.

### Architecture de sécurité :
- ✅ Service Worker comme proxy
- ✅ Clé API non visible dans le code principal
- ⚠️ Limitation : Accessible via les outils développeur
- 🔒 Alternative recommandée : Backend Node.js/PHP

## 🧠 Fonctionnalités IA

### Paramètres pris en compte :
1. **Ingrédients disponibles** : Liste des ingrédients du frigo
2. **Nombre de convives** : 1 à 12 personnes (ajustement automatique des quantités)
3. **Type de public** : Adultes / Enfants / Mixte (adaptation des recettes)
4. **Difficulté** : Très facile à Difficile
5. **Temps disponible** : 15min à 2h+
6. **Type de repas** : Petit-déjeuner, déjeuner, dîner, etc.
7. **Contraintes alimentaires** : Végétarien, vegan, sans gluten, allergies
8. **Matériel disponible** : Four, plaques, micro-ondes, etc.

### Intelligence du système :
- **Anti-gaspillage** : Utilise uniquement les ingrédients listés
- **Adaptation enfants** : Recettes simplifiées, moins d'épices
- **Gestion des portions** : Calcul automatique selon le nombre de convives
- **Respect des contraintes** : Exclusion stricte des allergènes
- **Suggestions alternatives** : Propose des solutions si ingrédients insuffisants

## 📝 Prompt Système

Le prompt système optimisé guide l'IA pour :
- Respecter strictement les contraintes alimentaires
- Adapter les quantités au nombre de convives
- Simplifier pour les enfants
- Proposer des techniques accessibles
- Fournir des conseils pratiques

Format de réponse JSON structuré avec :
- Nom et description
- Temps de préparation/cuisson
- Liste d'ingrédients avec quantités précises
- Instructions étape par étape
- Conseils et variantes
- Niveau d'adaptation pour enfants

## 🎨 Interface Utilisateur

### Fonctionnalités :
- **Saisie d'ingrédients** : Input avec suggestions rapides
- **Slider convives** : Sélection 1-12 personnes
- **Options avancées** : Grille de paramètres organisée
- **Contraintes visuelles** : Checkboxes avec émojis
- **Animation de chargement** : Étapes de génération IA
- **Affichage enrichi** : Recette formatée avec métadonnées

### Responsive :
- Optimisé mobile et desktop
- Boutons tactiles adaptés
- Grilles responsives
- Animation fluide

## 🚀 Utilisation

### Étapes :
1. **Ajouter des ingrédients** via input ou suggestions
2. **Configurer les paramètres** (convives, contraintes, etc.)
3. **Cliquer sur "Générer une recette IA"**
4. **Attendre la génération** (animation en 4 étapes)
5. **Consulter la recette** personnalisée

### Temps de réponse :
- Génération IA : 3-8 secondes
- Affichage : Instantané
- Service Worker : ~1 seconde d'initialisation

## 🔧 Configuration Technique

### Service Worker (`sw.js`) :
- Proxy pour API OpenAI
- Validation des données entrantes
- Gestion d'erreurs robuste
- Parsing JSON avec fallback

### API OpenAI :
- Modèle : `gpt-4o-mini`
- Max tokens : 1500
- Temperature : 0.8 (créativité contrôlée)
- Système + User messages

### Clé API :
```
OPENAI_API_KEY=<votre_clé_openai>
```
La clé doit être définie dans le fichier `.env` via la variable `OPENAI_API_KEY`.

## 🐛 Gestion d'erreurs

### Cas gérés :
- Service Worker indisponible
- Pas d'ingrédients sélectionnés
- Erreur API OpenAI (quotas, réseau)
- JSON malformé de l'IA
- Timeout de requête

### Messages utilisateur :
- Notifications contextuelles
- Animation d'erreur
- Instructions de correction

## 📊 Monitoring

### Logs disponibles :
- Console : Données envoyées à l'IA
- Service Worker : Requêtes API
- Erreurs : Capture complète
- Performance : Temps de réponse

## 🔄 Améliorations futures

### Possibles :
1. **Cache intelligent** : Sauvegarde des recettes générées
2. **Favoris** : Système de marque-pages
3. **Partage** : Export PDF/image
4. **Historique** : Recettes précédentes
5. **Suggestions proactives** : Basées sur les habitudes
6. **Backend sécurisé** : API dédiée sans exposition de clé

## 💰 Coûts

### Estimation GPT-4o-mini :
- ~150 tokens par recette
- Coût : ~$0.0001 par recette
- 10 000 recettes = ~$1

### Optimisation :
- Prompts efficaces
- Réponses JSON structurées
- Cache des résultats similaires

---

*Générateur IA déployé et fonctionnel sur `fun.lean-it-performance.fr/recettes/`*