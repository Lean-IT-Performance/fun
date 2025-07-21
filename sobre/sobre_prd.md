# Overview

**Sobre** est une application web progressive dédiée à la consommation responsable d'alcool. Elle utilise des calculs scientifiques basés sur la formule de Widmark pour estimer le taux d'alcoolémie en temps réel et aider les utilisateurs à prendre des décisions éclairées.

**Problème résolu :** Les consommateurs d'alcool manquent d'outils fiables pour évaluer leur état d'ébriété et le temps nécessaire pour retrouver la sobriété.

**Public cible :** Adultes responsables souhaitant monitorer leur consommation d'alcool de manière scientifique et sécurisée.

**Valeur ajoutée :** Algorithme précis, interface intuitive, stockage local pour la confidentialité, et approche éducative basée sur la science.

# Core Features

## 1. Calculateur de Taux d'Alcoolémie Avancé
- **Fonction :** Calcul en temps réel du BAC (Blood Alcohol Content) selon la formule de Widmark améliorée
- **Importance :** Fournit une estimation scientifiquement fondée du niveau d'intoxication
- **Fonctionnement :** Intègre le poids, le genre, l'état digestif et le temps écoulé pour calculer précisément le taux

## 2. Profil Utilisateur Personnalisé
- **Fonction :** Configuration des paramètres physiologiques individuels
- **Importance :** Permet des calculs adaptés à chaque utilisateur
- **Fonctionnement :** Collecte et sauvegarde localement le poids, genre, et préférences de consommation

## 3. Bibliothèque de Boissons Complète
- **Fonction :** Catalogue extensif des boissons alcoolisées avec taux d'alcool précis
- **Importance :** Facilite la saisie et assure la précision des calculs
- **Fonctionnement :** Base de données locale avec bières, vins, spiritueux, et cocktails populaires

## 4. Suivi de Session en Temps Réel
- **Fonction :** Monitoring continu pendant une session de consommation
- **Importance :** Permet d'ajuster la consommation en cours de soirée
- **Fonctionnement :** Mise à jour automatique des calculs avec chronométrage précis

## 5. Prédiction de Sobriété
- **Fonction :** Estimation du temps nécessaire pour atteindre un BAC de 0,00%
- **Importance :** Aide à planifier le retour en sécurité
- **Fonctionnement :** Calcul basé sur le taux d'élimination personnalisé de l'alcool

## 6. Visualisations et Graphiques
- **Fonction :** Représentation graphique de l'évolution du taux d'alcoolémie
- **Importance :** Facilite la compréhension et la prise de conscience
- **Fonctionnement :** Graphiques interactifs montrant la courbe d'alcoolémie et projections

# User Experience

## Personas Principales

### 1. "Alex le Responsable" (25-35 ans)
- Professionnel actif qui sort occasionnellement
- Veut s'assurer de ne pas conduire en état d'ébriété
- Utilise l'app avant les sorties professionnelles

### 2. "Sarah la Planificatrice" (28-40 ans)
- Mère de famille qui sort rarement mais veut être prudente
- Recherche des informations fiables et scientifiques
- Utilise l'app pour les occasions spéciales

### 3. "Marc l'Étudiant" (20-25 ans)
- Vie sociale active avec consommation régulière
- Veut comprendre les effets de l'alcool sur son corps
- Utilise l'app pour l'éducation et la prévention

## Flux Utilisateur Principal

1. **Première utilisation :** Configuration du profil (poids, genre, préférences)
2. **Début de session :** Sélection de l'état digestif et début du monitoring
3. **Ajout de consommations :** Sélection rapide des boissons consommées
4. **Suivi en temps réel :** Visualisation continue du BAC et estimations
5. **Fin de session :** Consultation du temps avant sobriété totale

## Considérations UI/UX

- **Design minimaliste :** Interface claire privilégiant la lisibilité
- **Accessibilité :** Contraste élevé, textes lisibles, navigation simple
- **Responsive :** Optimisé mobile-first pour utilisation en déplacement
- **Feedback visuel :** Codes couleurs intuitifs (vert=sûr, jaune=attention, rouge=danger)
- **Onboarding :** Guide initial expliquant les fonctionnalités et limitations

# Technical Architecture

## Composants Système

### Frontend (Single Page Application)
- **HTML5 :** Structure sémantique et accessibilité
- **CSS3 :** Styling responsive avec CSS Grid/Flexbox
- **JavaScript Vanilla :** Logique métier et interactions, pas de framework lourd
- **Progressive Web App :** Manifest et Service Worker pour utilisation offline

### Stockage Local
- **localStorage :** Persistance des données utilisateur et sessions
- **Structure de données :** JSON optimisé pour performances et lisibilité
- **Chiffrement basique :** Hashage des données sensibles côté client

### Calculs Scientifiques
- **Moteur de calcul :** Implémentation de la formule de Widmark améliorée
- **Facteurs de correction :** Ajustements selon genre, poids, état digestif
- **Algorithme temporel :** Calculs d'élimination avec courbes non-linéaires

## Modèles de Données

### Profil Utilisateur
```javascript
{
  id: "user_unique_id",
  weight: 70, // kg
  gender: "male|female",
  created_at: "2025-01-01T00:00:00Z",
  settings: {
    units: "metric|imperial",
    warnings_enabled: true,
    dark_mode: false
  }
}
```

### Session de Consommation
```javascript
{
  id: "session_unique_id",
  start_time: "2025-01-01T20:00:00Z",
  digestive_state: "empty|eating|full",
  drinks: [
    {
      time: "2025-01-01T20:15:00Z",
      type: "beer",
      volume: 330, // ml
      alcohol_content: 5.0, // %
      pure_alcohol: 13.2 // ml
    }
  ],
  bac_timeline: [
    {
      time: "2025-01-01T20:15:00Z",
      bac: 0.025
    }
  ]
}
```

### Base de Données des Boissons
```javascript
{
  categories: {
    beer: [
      {
        name: "Bière blonde standard",
        alcohol_content: 5.0,
        common_volumes: [250, 330, 500]
      }
    ],
    wine: [...],
    spirits: [...]
  }
}
```

## APIs et Intégrations

- **Aucune API externe :** Fonctionnement 100% offline
- **Géolocalisation (optionnelle) :** Pour suggestions de transport alternatif
- **Notifications browser :** Alertes pour rappels de sobriété

## Infrastructure

- **Hébergement :** Fichiers statiques (GitHub Pages, Netlify, ou serveur simple)
- **CDN :** Pas nécessaire pour un MVP, fichiers locaux
- **SSL :** Obligatoire pour localStorage et géolocalisation
- **Compatibilité :** Chrome 60+, Firefox 55+, Safari 11+, Edge 79+

# Development Roadmap

## Phase 1 : MVP Core (Foundation)
### Fonctionnalités Essentielles
- Configuration profil utilisateur basique (poids, genre)
- Calcul BAC simplifié avec formule de Widmark
- Interface de saisie manuelle des consommations
- Affichage du taux actuel en temps réel
- Stockage localStorage basique

### Livrables Techniques
- Architecture HTML/CSS/JS propre
- Moteur de calcul fonctionnel et testé
- Interface responsive mobile-first
- Système de persistance des données

## Phase 2 : Interface Utilisateur Avancée
### Fonctionnalités
- Bibliothèque de boissons pré-configurée
- Sélection rapide des boissons populaires
- Amélioration de l'état digestif dans les calculs
- Interface de chronométrage automatique
- Première version des visualisations (graphique simple)

### Livrables Techniques
- Composants UI réutilisables
- Système de gestion d'état amélioré
- Base de données locale optimisée
- Tests unitaires pour les calculs

## Phase 3 : Prédictions et Visualisations
### Fonctionnalités
- Algorithme de prédiction de sobriété
- Graphiques interactifs d'évolution du BAC
- Historique des sessions précédentes
- Système d'alertes et notifications
- Export/import des données

### Livrables Techniques
- Bibliothèque de graphiques légère (Chart.js ou D3.js)
- Algorithmes prédictifs avancés
- Système de notification browser
- Interface d'export/import JSON

## Phase 4 : Fonctionnalités Avancées
### Fonctionnalités
- Mode PWA complet (installation, offline)
- Géolocalisation et suggestions de transport
- Calculateur de coût par session
- Partage sécurisé avec contacts de confiance
- Thèmes et personnalisation avancée

### Livrables Techniques
- Service Worker et cache intelligent
- API Géolocalisation
- Système de thèmes CSS variables
- Optimisations performances

## Phase 5 : Polissage et Optimisation
### Fonctionnalités
- Tests utilisateurs et améliorations UX
- Optimisations performances
- Accessibilité complète (WCAG 2.1)
- Documentation utilisateur intégrée
- Système de feedback

### Livrables Techniques
- Tests end-to-end automatisés
- Audit de performance complet
- Certification accessibilité
- Analytics usage anonymes

# Logical Dependency Chain

## Ordre de Développement Logique

### 1. Fondations Techniques (Semaine 1)
**Priorité Absolue :** Structure de base fonctionnelle
- Setup projet HTML/CSS/JS
- Architecture modulaire des fichiers
- Système de stockage localStorage
- **Livrable :** Page web vide mais techniquement solide

### 2. Moteur de Calcul (Semaine 1-2)
**Dépendance :** Fondations
- Implémentation formule de Widmark
- Tests unitaires des calculs
- Interface de saisie manuelle simple
- **Livrable :** Calculateur fonctionnel avec input/output basique

### 3. Interface Utilisateur Minimale (Semaine 2)
**Dépendance :** Moteur de calcul
- Formulaire de profil utilisateur
- Interface de saisie des consommations
- Affichage du résultat BAC
- **Livrable :** Application utilisable end-to-end

### 4. Persistance et Sessions (Semaine 2-3)
**Dépendance :** Interface minimale
- Sauvegarde/chargement profil
- Gestion des sessions de consommation
- Historique basique
- **Livrable :** Application mémorisant les données

### 5. Amélioration de l'Expérience (Semaine 3-4)
**Dépendance :** Persistance
- Bibliothèque de boissons
- Interface de sélection rapide
- Améliorations visuelles
- **Livrable :** Application agréable à utiliser

### 6. Fonctionnalités Avancées (Semaine 4+)
**Dépendance :** Expérience de base
- Graphiques et visualisations
- Prédictions temporelles
- PWA et features avancées
- **Livrable :** Application complète et polie

## Stratégie d'Itération Rapide

1. **Construire le minimum viable dès le premier jour**
2. **Chaque étape doit produire quelque chose de démontrable**
3. **Tester les calculs scientifiques en priorité absolue**
4. **Privilégier la fonctionnalité avant l'esthétique**
5. **Valider l'expérience utilisateur à chaque itération majeure**

# Risks and Mitigations

## Risques Techniques

### 1. Précision des Calculs Scientifiques
**Risque :** Imprécision des estimations de BAC
**Impact :** Critique - sécurité des utilisateurs
**Mitigation :** 
- Recherche approfondie des formules scientifiques
- Tests croisés avec calculateurs existants
- Avertissements clairs sur les limitations

### 2. Performance du JavaScript
**Risque :** Lenteur sur appareils anciens
**Impact :** Moyen - expérience utilisateur dégradée
**Mitigation :**
- Code optimisé et testé sur anciens devices
- Chargement progressif des fonctionnalités
- Fallbacks pour navigateurs limités

### 3. Fiabilité du localStorage
**Risque :** Perte de données utilisateur
**Impact :** Moyen - frustration utilisateur
**Mitigation :**
- Système de backup automatique
- Import/export manuel
- Validation des données à chaque chargement

## Risques Produit

### 1. Responsabilité Légale
**Risque :** Utilisation inappropriée pour prendre le volant
**Impact :** Critique - responsabilité légale
**Mitigation :**
- Avertissements explicites et répétés
- Disclaimer légal prominent
- Éducation sur les limitations des estimations

### 2. Définition du MVP Optimal
**Risque :** Scope trop ambitieux ou trop limité
**Impact :** Élevé - échec du produit
**Mitigation :**
- Feedback utilisateur précoce
- Développement en phases courtes
- Métriques d'usage pour orienter les priorités

### 3. Adoption Utilisateur
**Risque :** Interface trop complexe ou peu intuitive
**Impact :** Élevé - échec commercial
**Mitigation :**
- Tests utilisateur dès le MVP
- Design simple et focalisé
- Onboarding progressif

## Contraintes de Ressources

### 1. Développement Solo
**Contrainte :** Une seule personne pour tout développer
**Impact :** Moyen - délais étendus
**Mitigation :**
- Priorisation stricte des fonctionnalités
- Réutilisation de composants existants
- Documentation pour faciliter la maintenance

### 2. Budget Zéro
**Contrainte :** Pas de budget pour outils payants
**Impact :** Faible - solutions gratuites disponibles
**Mitigation :**
- Hébergement gratuit (GitHub Pages)
- Outils open source uniquement
- Design minimaliste sans assets payants

# Appendix

## Recherches Scientifiques

### Formule de Widmark Améliorée
```
BAC = (A × 0.8) / (W × r) - (β × t)
```
Où :
- A = alcool pur consommé (grammes)
- W = poids corporel (kg)
- r = facteur de distribution (0.68 homme, 0.55 femme)
- β = taux d'élimination (0.015-0.018 par heure)
- t = temps écoulé (heures)

### Facteurs de Correction

#### État Digestif
- Estomac vide : absorption maximale (facteur 1.0)
- En mangeant : absorption ralentie (facteur 0.7)
- Estomac plein : absorption très ralentie (facteur 0.5)

#### Différences Physiologiques
- Hommes : ratio eau/corps plus élevé
- Femmes : métabolisme légèrement différent
- Âge : ralentissement du métabolisme après 65 ans

## Spécifications Techniques Détaillées

### Performance Targets
- **Temps de chargement initial :** < 2 secondes
- **Réactivité interface :** < 100ms pour les interactions
- **Taille totale application :** < 500KB (sans images)
- **Consommation mémoire :** < 50MB sur mobile

### Compatibilité Navigateurs
- **Chrome :** 60+ (90% de compatibilité)
- **Firefox :** 55+ (ES6 support complet)
- **Safari :** 11+ (localStorage moderne)
- **Edge :** 79+ (Chromium base)

### Standards de Code
- **ES6+ :** Modules, arrow functions, const/let
- **CSS3 :** Grid, Flexbox, custom properties
- **HTML5 :** Semantic elements, accessibility
- **PWA :** Manifest, Service Worker, responsive

### Métriques de Succès
- **Précision calculs :** < 5% d'écart vs calculateurs professionnels
- **Facilité d'usage :** < 30 secondes pour première utilisation
- **Retention :** > 50% d'utilisateurs reviennent dans les 7 jours
- **Performance :** Score Lighthouse > 90/100