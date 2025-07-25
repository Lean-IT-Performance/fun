class SobreApp {
    constructor() {
        this.userProfile = null;
        this.currentSession = null;
        this.drinks = [];
        this.sessionStartTime = null;
        this.bacChart = null;
        this.currentEditingDrink = null;
        
        // Définition des contenances standard
        this.containerSizes = {
            'dose': 40,           // 4cl
            'shooter': 30,        // 3cl
            'coupe': 120,         // 12cl (coupe de champagne)
            'verre-vin': 120,     // 12cl (verre de vin)
            'verre-eau': 200,     // 20cl (verre d'eau)
            'demi': 250,          // 25cl (demi-bière)
            'pinte': 500,         // 50cl (pinte)
            'bouteille-biere': 330, // 33cl (bouteille bière)
            'canette': 330        // 33cl (canette)
        };

        // Contenances par défaut selon le type de boisson
        this.defaultContainers = {
            'beer-light': 'demi',           // Bière légère -> demi-bière
            'beer-standard': 'demi',        // Bière standard -> demi-bière
            'beer-strong': 'demi',          // Bière forte -> demi-bière
            'wine-white': 'verre-vin',      // Vin blanc -> verre de vin
            'wine-red': 'verre-vin',        // Vin rouge -> verre de vin
            'champagne': 'coupe',           // Champagne -> coupe
            'spirits': 'dose',              // Spiritueux -> dose
            'custom': 'custom'              // Personnalisé -> personnalisé
        };

        // Limites d'alcoolémie selon le type de conducteur (en g/L)
        this.drivingLimits = {
            'experienced': 0.5,
            'apprentice': 0.2,
            'professional': 0.2,
            'none': null
        };
        
        this.init();
    }

    init() {
        this.loadUserProfile();
        this.loadDrinks();
        this.bindEvents();
        this.updateUI();
        this.initializeDateTime();
        
        // Mise à jour du BAC toutes les minutes
        setInterval(() => {
            if (this.currentSession) {
                this.updateBACDisplay();
                this.updateSobernessTime();
                this.updateChart();
            }
        }, 60000);
    }

    initializeDateTime() {
        // Initialiser l'heure actuelle dans le champ datetime-local
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        document.getElementById('drink-time').value = now.toISOString().slice(0, 16);
    }

    // Gestion du profil utilisateur
    loadUserProfile() {
        const savedProfile = localStorage.getItem('sobre_profile');
        if (savedProfile) {
            this.userProfile = JSON.parse(savedProfile);
            this.showSessionSection();
        }
    }

    saveUserProfile(profile) {
        this.userProfile = profile;
        localStorage.setItem('sobre_profile', JSON.stringify(profile));
        this.showSessionSection();
    }

    // Calculs scientifiques - Formule de Widmark
    calculateBAC() {
        if (!this.userProfile || this.drinks.length === 0) {
            return 0;
        }

        // Vérifications de sécurité pour éviter les NaN
        if (!this.userProfile.weight || isNaN(this.userProfile.weight) || this.userProfile.weight <= 0) {
            console.error('Poids utilisateur invalide:', this.userProfile.weight);
            return 0;
        }

        if (!this.userProfile.gender) {
            console.error('Genre utilisateur manquant');
            return 0;
        }

        const now = new Date();
        let peakBAC = 0;
        let earliestEffectiveTime = null;

        // Calculer le BAC de pointe (sans élimination)
        this.drinks.forEach(drink => {
            // Vérifications de sécurité pour chaque boisson
            if (!drink.pureAlcohol || isNaN(drink.pureAlcohol) || drink.pureAlcohol < 0) {
                console.error('Alcool pur invalide pour la boisson:', drink);
                return; // Continue avec la boisson suivante
            }

            const drinkTime = new Date(drink.time);
            const absorptionDelayMinutes = 30; // Délai d'absorption de 30 minutes
            const effectiveTime = new Date(drinkTime.getTime() + absorptionDelayMinutes * 60 * 1000);
            
            // Vérifier si l'alcool a commencé à faire effet
            if (effectiveTime <= now) {
                if (!earliestEffectiveTime || effectiveTime < earliestEffectiveTime) {
                    earliestEffectiveTime = effectiveTime;
                }

                // Facteur d'absorption selon l'état digestif de chaque boisson
                let absorptionFactor = 1.0;
                switch (drink.digestiveState) {
                    case 'eating': absorptionFactor = 0.7; break;
                    case 'full': absorptionFactor = 0.5; break;
                    default: absorptionFactor = 1.0; // empty
                }

                // Conversion ml d'alcool pur en grammes (densité alcool = 0.789)
                const alcoholGrams = drink.pureAlcohol * 0.789 * absorptionFactor;
                
                // Ajouter au BAC de pointe
                const weight = this.userProfile.weight;
                const distributionFactor = this.userProfile.gender === 'male' ? 0.68 : 0.55;
                const drinkBAC = (alcoholGrams * 0.8) / (weight * distributionFactor);
                
                // Vérification finale avant ajout
                if (!isNaN(drinkBAC) && drinkBAC >= 0) {
                    peakBAC += drinkBAC;
                }
            }
        });

        // Calculer l'élimination linéaire depuis la première prise d'effet
        if (earliestEffectiveTime && peakBAC > 0) {
            const timeSinceFirstEffect = (now - earliestEffectiveTime) / (1000 * 60 * 60); // heures
            const eliminationRate = 0.15; // 0.15 g/L par heure
            const eliminatedBAC = eliminationRate * timeSinceFirstEffect;
            
            const currentBAC = Math.max(0, peakBAC - eliminatedBAC);
            return Math.round(currentBAC * 1000) / 1000; // Arrondi à 3 décimales
        }

        return peakBAC;
    }

    // Calcul du BAC à un moment donné
    calculateBACAtTime(targetTime) {
        if (!this.userProfile || this.drinks.length === 0) {
            return 0;
        }

        const target = new Date(targetTime);
        let peakBAC = 0;
        let earliestEffectiveTime = null;

        // Calculer le BAC de pointe pour toutes les boissons ayant fait effet avant targetTime
        this.drinks.forEach(drink => {
            const drinkTime = new Date(drink.time);
            const absorptionDelayMinutes = 30; // Délai d'absorption de 30 minutes
            const effectiveTime = new Date(drinkTime.getTime() + absorptionDelayMinutes * 60 * 1000);
            
            // Vérifier si l'alcool a fait effet avant le moment cible
            if (effectiveTime <= target) {
                if (!earliestEffectiveTime || effectiveTime < earliestEffectiveTime) {
                    earliestEffectiveTime = effectiveTime;
                }

                // Facteur d'absorption selon l'état digestif
                let absorptionFactor = 1.0;
                switch (drink.digestiveState) {
                    case 'eating': absorptionFactor = 0.7; break;
                    case 'full': absorptionFactor = 0.5; break;
                    default: absorptionFactor = 1.0;
                }

                // Conversion ml d'alcool pur en grammes (densité alcool = 0.789)
                const alcoholGrams = drink.pureAlcohol * 0.789 * absorptionFactor;
                
                // Calcul du BAC pour cette boisson
                const weight = this.userProfile.weight;
                const distributionFactor = this.userProfile.gender === 'male' ? 0.68 : 0.55;
                const drinkBAC = (alcoholGrams * 0.8) / (weight * distributionFactor);
                
                peakBAC += drinkBAC;
            }
        });

        // Calculer l'élimination linéaire depuis la première prise d'effet
        if (earliestEffectiveTime && peakBAC > 0) {
            const timeSinceFirstEffect = (target - earliestEffectiveTime) / (1000 * 60 * 60); // heures
            const eliminationRate = 0.15; // 0.15 g/L par heure
            const eliminatedBAC = eliminationRate * timeSinceFirstEffect;
            
            return Math.max(0, peakBAC - eliminatedBAC);
        }

        return peakBAC;
    }

    // Prédiction de sobriété (corrigée pour prendre en compte les montées futures)
    calculateSobernessTime() {
        if (this.drinks.length === 0) return 0;

        const now = new Date();
        const absorptionDelayMinutes = 30;
        const eliminationRate = 0.15; // 0.15 g/L par heure

        // Calculer le BAC de pic total (toutes les boissons, même futures)
        let totalPeakBAC = 0;
        let lastEffectiveTime = null;

        this.drinks.forEach(drink => {
            const drinkTime = new Date(drink.time);
            const effectiveTime = new Date(drinkTime.getTime() + absorptionDelayMinutes * 60 * 1000);
            
            // Mettre à jour la dernière heure d'effet
            if (!lastEffectiveTime || effectiveTime > lastEffectiveTime) {
                lastEffectiveTime = effectiveTime;
            }

            // Facteur d'absorption selon l'état digestif
            let absorptionFactor = 1.0;
            switch (drink.digestiveState) {
                case 'eating': absorptionFactor = 0.7; break;
                case 'full': absorptionFactor = 0.5; break;
                default: absorptionFactor = 1.0;
            }

            // Conversion ml d'alcool pur en grammes (densité alcool = 0.789)
            const alcoholGrams = drink.pureAlcohol * 0.789 * absorptionFactor;
            
            // Calcul du BAC pour cette boisson
            const weight = this.userProfile.weight;
            const distributionFactor = this.userProfile.gender === 'male' ? 0.68 : 0.55;
            const drinkBAC = (alcoholGrams * 0.8) / (weight * distributionFactor);
            
            totalPeakBAC += drinkBAC;
        });

        if (totalPeakBAC <= 0) return 0;

        // Déterminer le moment où le pic sera atteint
        const peakTime = lastEffectiveTime || now;
        
        // Si le pic n'est pas encore atteint, calculer depuis le pic
        if (peakTime > now) {
            // Temps = temps jusqu'au pic + temps d'élimination depuis le pic
            const timeUntilPeak = (peakTime - now) / (1000 * 60); // en minutes
            const hoursToEliminate = totalPeakBAC / eliminationRate;
            const eliminationMinutes = hoursToEliminate * 60;
            
            return Math.ceil(timeUntilPeak + eliminationMinutes);
        } else {
            // Le pic est déjà passé, calculer l'élimination depuis maintenant
            const timeSincePeak = (now - peakTime) / (1000 * 60 * 60); // en heures
            const currentBAC = Math.max(0, totalPeakBAC - (eliminationRate * timeSincePeak));
            
            if (currentBAC <= 0) return 0;
            
            const hoursToSober = currentBAC / eliminationRate;
            return Math.ceil(hoursToSober * 60);
        }
    }

    // Gestion des boissons
    addDrink(type, volume, customAlcoholContent = null, drinkTime = null, digestiveState = null) {
        const drinkTypes = {
            'beer-light': { name: 'Bière légère', alcohol: 3.5 },
            'beer-standard': { name: 'Bière standard', alcohol: 5.0 },
            'beer-strong': { name: 'Bière forte', alcohol: 7.0 },
            'wine-white': { name: 'Vin blanc', alcohol: 11.5 },
            'wine-red': { name: 'Vin rouge', alcohol: 13.0 },
            'champagne': { name: 'Champagne', alcohol: 12.0 },
            'spirits': { name: 'Spiritueux', alcohol: 40.0 },
            'custom': { name: 'Personnalisé', alcohol: customAlcoholContent }
        };

        const drinkInfo = drinkTypes[type];
        const alcoholContent = drinkInfo.alcohol;
        const pureAlcohol = (volume * alcoholContent) / 100;

        const drink = {
            id: Date.now(),
            time: drinkTime || new Date().toISOString(),
            type: drinkInfo.name,
            volume: volume,
            alcoholContent: alcoholContent,
            pureAlcohol: pureAlcohol,
            digestiveState: digestiveState || this.getSelectedDigestiveState()
        };

        this.drinks.push(drink);
        this.saveDrinks();
        this.updateAllDisplays();
    }

    editDrink(drinkId, type, volume, customAlcoholContent, drinkTime, digestiveState) {
        const drinkIndex = this.drinks.findIndex(drink => drink.id === drinkId);
        if (drinkIndex === -1) return;

        const drinkTypes = {
            'beer-light': { name: 'Bière légère', alcohol: 3.5 },
            'beer-standard': { name: 'Bière standard', alcohol: 5.0 },
            'beer-strong': { name: 'Bière forte', alcohol: 7.0 },
            'wine-white': { name: 'Vin blanc', alcohol: 11.5 },
            'wine-red': { name: 'Vin rouge', alcohol: 13.0 },
            'champagne': { name: 'Champagne', alcohol: 12.0 },
            'spirits': { name: 'Spiritueux', alcohol: 40.0 },
            'custom': { name: 'Personnalisé', alcohol: customAlcoholContent }
        };

        const drinkInfo = drinkTypes[type];
        const alcoholContent = drinkInfo.alcohol;
        const pureAlcohol = (volume * alcoholContent) / 100;

        this.drinks[drinkIndex] = {
            ...this.drinks[drinkIndex],
            time: drinkTime,
            type: drinkInfo.name,
            volume: volume,
            alcoholContent: alcoholContent,
            pureAlcohol: pureAlcohol,
            digestiveState: digestiveState
        };

        this.saveDrinks();
        this.updateAllDisplays();
    }

    removeDrink(drinkId) {
        this.drinks = this.drinks.filter(drink => drink.id !== drinkId);
        this.saveDrinks();
        this.updateAllDisplays();
    }

    repeatDrink(drinkId) {
        const originalDrink = this.drinks.find(drink => drink.id === drinkId);
        if (!originalDrink) return;

        // Déterminer le type original pour l'ajout
        const drinkTypes = {
            'Bière légère': 'beer-light',
            'Bière standard': 'beer-standard', 
            'Bière forte': 'beer-strong',
            'Vin blanc': 'wine-white',
            'Vin rouge': 'wine-red',
            'Champagne': 'champagne',
            'Spiritueux': 'spirits'
        };

        let drinkType = 'custom';
        let customAlcohol = originalDrink.alcoholContent;

        // Vérifier si c'est un type prédéfini
        if (drinkTypes[originalDrink.type]) {
            drinkType = drinkTypes[originalDrink.type];
            customAlcohol = null;
        }

        // Ajouter la même boisson avec l'heure actuelle
        this.addDrink(
            drinkType,
            originalDrink.volume,
            customAlcohol,
            new Date().toISOString(),
            originalDrink.digestiveState
        );
    }

    // Gestion des sessions
    startNewSession() {
        this.sessionStartTime = new Date();
        this.drinks = [];
        this.currentSession = {
            startTime: this.sessionStartTime.toISOString()
        };
        this.saveSession();
        this.updateAllDisplays();
    }

    resetAllData() {
        if (confirm('Êtes-vous sûr de vouloir effacer toutes les données ? Cette action est irréversible.')) {
            localStorage.removeItem('sobre_profile');
            localStorage.removeItem('sobre_drinks');
            localStorage.removeItem('sobre_session');
            location.reload();
        }
    }

    // Persistance des données
    saveDrinks() {
        localStorage.setItem('sobre_drinks', JSON.stringify(this.drinks));
    }

    loadDrinks() {
        const savedDrinks = localStorage.getItem('sobre_drinks');
        if (savedDrinks) {
            try {
                const drinks = JSON.parse(savedDrinks);
                // Valider et nettoyer les données
                this.drinks = drinks.filter(drink => {
                    // Vérifier que la boisson a toutes les propriétés nécessaires
                    if (!drink.id || !drink.time || !drink.type || 
                        !drink.volume || isNaN(drink.volume) ||
                        !drink.alcoholContent || isNaN(drink.alcoholContent) ||
                        !drink.pureAlcohol || isNaN(drink.pureAlcohol)) {
                        console.warn('Boisson invalide supprimée:', drink);
                        return false;
                    }
                    return true;
                });
                
                // Recalculer pureAlcohol pour les boissons existantes au cas où
                this.drinks.forEach(drink => {
                    if (isNaN(drink.pureAlcohol)) {
                        drink.pureAlcohol = (drink.volume * drink.alcoholContent) / 100;
                    }
                });
                
            } catch (error) {
                console.error('Erreur lors du chargement des boissons:', error);
                this.drinks = [];
            }
        }
    }

    saveSession() {
        localStorage.setItem('sobre_session', JSON.stringify(this.currentSession));
    }

    loadSession() {
        const savedSession = localStorage.getItem('sobre_session');
        if (savedSession) {
            this.currentSession = JSON.parse(savedSession);
            this.sessionStartTime = new Date(this.currentSession.startTime);
        }
    }

    // Interface utilisateur
    showSessionSection() {
        document.getElementById('profile-section').style.display = 'none';
        document.getElementById('session-section').style.display = 'block';
        document.getElementById('session-section').classList.add('fade-in');
        
        this.loadSession();
        this.loadDrinks();
        
        if (!this.currentSession) {
            this.startNewSession();
        }
        
        this.updateAllDisplays();
        this.updateSettingsInfo();
    }

    updateAllDisplays() {
        this.updateDrinksList();
        this.updateBACDisplay();
        this.updateSobernessTime();
        this.updateDrinksTable();
        this.updateChart();
    }

    updateBACDisplay() {
        const bac = this.calculateBAC();
        const bacElement = document.getElementById('bac-value');
        const statusElement = document.getElementById('bac-status');
        const drivingStatusElement = document.getElementById('driving-status');
        const drivingIndicatorElement = document.getElementById('driving-indicator');
        const displayElement = document.querySelector('.bac-display');

        // Vérification de sécurité pour éviter l'affichage de NaN
        if (isNaN(bac) || bac < 0) {
            console.error('BAC invalide:', bac);
            bacElement.textContent = '0.00 g/L';
            statusElement.textContent = 'Erreur de calcul';
            displayElement.className = 'bac-display bac-safe';
            return;
        }

        // Affichage en g/L (le BAC est déjà en g/L)
        bacElement.textContent = bac.toFixed(2) + ' g/L';

        displayElement.className = 'bac-display';
        
        if (bac < 0.5) {
            statusElement.textContent = 'Sobre';
            displayElement.classList.add('bac-safe');
        } else if (bac < 0.8) {
            statusElement.textContent = 'Très léger';
            displayElement.classList.add('bac-safe');
        } else if (bac < 2.0) {
            statusElement.textContent = 'Léger';
            displayElement.classList.add('bac-caution');
        } else if (bac < 5.0) {
            statusElement.textContent = 'Modéré';
            displayElement.classList.add('bac-caution');
        } else {
            statusElement.textContent = 'Élevé - Danger';
            displayElement.classList.add('bac-danger');
        }

        // Gestion de l'affichage des limites de conduite
        if (this.userProfile && this.userProfile.driverType && this.userProfile.driverType !== 'none') {
            drivingStatusElement.style.display = 'block';
            const drivingLimit = this.drivingLimits[this.userProfile.driverType];
            
            // Réinitialiser les classes
            drivingStatusElement.className = 'driving-status';
            
            if (bac <= drivingLimit) {
                drivingIndicatorElement.textContent = '🚗 Conduite autorisée';
                drivingIndicatorElement.className = 'driving-indicator driving-allowed';
                drivingStatusElement.classList.add('driving-allowed');
            } else {
                drivingIndicatorElement.textContent = '🚫 Conduite interdite';
                drivingIndicatorElement.className = 'driving-indicator driving-forbidden';
                drivingStatusElement.classList.add('driving-forbidden');
            }
            
            // Ajouter l'info sur la limite
            const limitInfo = document.createElement('div');
            limitInfo.className = 'driving-limit-info';
            limitInfo.textContent = `Limite : ${drivingLimit} g/L`;
            
            // Supprimer l'ancienne info si elle existe
            const existingInfo = drivingStatusElement.querySelector('.driving-limit-info');
            if (existingInfo) {
                existingInfo.remove();
            }
            
            drivingStatusElement.appendChild(limitInfo);
        } else {
            drivingStatusElement.style.display = 'none';
        }
    }

    updateSobernessTime() {
        const minutes = this.calculateSobernessTime();
        const drivingMinutes = this.calculateDrivingTime();
        const element = document.getElementById('soberness-time');
        
        let sobernessText = '';
        if (minutes <= 0) {
            sobernessText = 'Temps avant sobriété: Déjà sobre';
        } else {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            
            if (hours > 0) {
                sobernessText = `Temps avant sobriété: ${hours}h ${remainingMinutes}min`;
            } else {
                sobernessText = `Temps avant sobriété: ${remainingMinutes}min`;
            }
        }

        // Ajouter l'info de conduite si pertinente
        if (this.userProfile && this.userProfile.driverType && this.userProfile.driverType !== 'none') {
            if (drivingMinutes <= 0) {
                sobernessText += '<br>🚗 Conduite autorisée';
            } else {
                const drivingHours = Math.floor(drivingMinutes / 60);
                const drivingRemainingMinutes = drivingMinutes % 60;
                
                if (drivingHours > 0) {
                    sobernessText += `<br>🚗 Conduite dans: ${drivingHours}h ${drivingRemainingMinutes}min`;
                } else {
                    sobernessText += `<br>🚗 Conduite dans: ${drivingRemainingMinutes}min`;
                }
            }
        }
        
        element.innerHTML = sobernessText;
    }

    calculateDrivingTime() {
        if (!this.userProfile || !this.userProfile.driverType || this.userProfile.driverType === 'none') {
            return 0;
        }

        if (this.drinks.length === 0) return 0;

        const now = new Date();
        const absorptionDelayMinutes = 30;
        const eliminationRate = 0.15; // 0.15 g/L par heure
        const drivingLimit = this.drivingLimits[this.userProfile.driverType]; // Limite déjà en g/L

        // Calculer le BAC de pic total (toutes les boissons, même futures)
        let totalPeakBAC = 0;
        let lastEffectiveTime = null;

        this.drinks.forEach(drink => {
            const drinkTime = new Date(drink.time);
            const effectiveTime = new Date(drinkTime.getTime() + absorptionDelayMinutes * 60 * 1000);
            
            // Mettre à jour la dernière heure d'effet
            if (!lastEffectiveTime || effectiveTime > lastEffectiveTime) {
                lastEffectiveTime = effectiveTime;
            }

            // Facteur d'absorption selon l'état digestif
            let absorptionFactor = 1.0;
            switch (drink.digestiveState) {
                case 'eating': absorptionFactor = 0.7; break;
                case 'full': absorptionFactor = 0.5; break;
                default: absorptionFactor = 1.0;
            }

            // Conversion ml d'alcool pur en grammes (densité alcool = 0.789)
            const alcoholGrams = drink.pureAlcohol * 0.789 * absorptionFactor;
            
            // Calcul du BAC pour cette boisson
            const weight = this.userProfile.weight;
            const distributionFactor = this.userProfile.gender === 'male' ? 0.68 : 0.55;
            const drinkBAC = (alcoholGrams * 0.8) / (weight * distributionFactor);
            
            totalPeakBAC += drinkBAC;
        });

        if (totalPeakBAC <= drivingLimit) return 0;

        // Déterminer le moment où le pic sera atteint
        const peakTime = lastEffectiveTime || now;
        
        // Si le pic n'est pas encore atteint, calculer depuis le pic
        if (peakTime > now) {
            // Temps = temps jusqu'au pic + temps d'élimination depuis le pic jusqu'à la limite
            const timeUntilPeak = (peakTime - now) / (1000 * 60); // en minutes
            const bacToEliminate = totalPeakBAC - drivingLimit;
            const hoursToEliminate = bacToEliminate / eliminationRate;
            const eliminationMinutes = hoursToEliminate * 60;
            
            return Math.ceil(timeUntilPeak + eliminationMinutes);
        } else {
            // Le pic est déjà passé, calculer l'élimination depuis maintenant
            const timeSincePeak = (now - peakTime) / (1000 * 60 * 60); // en heures
            const currentBAC = Math.max(0, totalPeakBAC - (eliminationRate * timeSincePeak));
            
            if (currentBAC <= drivingLimit) return 0;
            
            const bacToEliminate = currentBAC - drivingLimit;
            const hoursToSafe = bacToEliminate / eliminationRate;
            return Math.ceil(hoursToSafe * 60);
        }
    }

    updateDrinksList() {
        const container = document.getElementById('drinks-container');
        
        if (this.drinks.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666;">Aucune boisson ajoutée</p>';
            return;
        }

        const now = new Date();

        container.innerHTML = this.drinks
            .sort((a, b) => new Date(b.time) - new Date(a.time))
            .slice(0, 3) // Afficher seulement les 3 dernières
            .map(drink => {
                const drinkTime = new Date(drink.time);
                const effectiveTime = new Date(drinkTime.getTime() + 30 * 60 * 1000); // +30 minutes
                
                const time = drinkTime.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                const digestiveStateText = {
                    'empty': 'Estomac vide',
                    'eating': 'En mangeant',
                    'full': 'Estomac plein'
                };

                // Vérifier si l'effet a commencé
                const hasEffect = effectiveTime <= now;
                const effectStatus = hasEffect ? 
                    '✓ Effet actif' : 
                    `⏳ Effet dans ${Math.ceil((effectiveTime - now) / (60 * 1000))}min`;
                
                return `
                    <div class="drink-item">
                        <div class="drink-info">
                            <div class="drink-time">${time}</div>
                            <div class="drink-details">
                                ${drink.type} - ${drink.volume}ml (${drink.alcoholContent}%)
                            </div>
                            <div class="drink-digestive">${digestiveStateText[drink.digestiveState]}</div>
                            <div class="drink-effect ${hasEffect ? 'active' : 'pending'}">${effectStatus}</div>
                        </div>
                        <div class="drink-actions">
                            <button class="drink-repeat" onclick="app.repeatDrink(${drink.id})">
                                Une autre !
                            </button>
                            <button class="drink-edit" onclick="app.openEditModal(${drink.id})">
                                Modifier
                            </button>
                            <button class="drink-remove" onclick="app.removeDrink(${drink.id})">
                                Supprimer
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
    }

    updateDrinksTable() {
        const tbody = document.getElementById('drinks-table-body');
        
        if (this.drinks.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #666;">Aucune boisson</td></tr>';
            return;
        }

        const digestiveStateText = {
            'empty': 'Estomac vide',
            'eating': 'En mangeant',
            'full': 'Estomac plein'
        };

        tbody.innerHTML = this.drinks
            .sort((a, b) => new Date(b.time) - new Date(a.time))
            .map(drink => {
                const time = new Date(drink.time).toLocaleString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                return `
                    <tr>
                        <td>${time}</td>
                        <td>${drink.type}</td>
                        <td>${drink.volume}ml</td>
                        <td>${drink.alcoholContent}%</td>
                        <td>${digestiveStateText[drink.digestiveState]}</td>
                        <td>
                            <div class="table-actions">
                                <button class="edit-btn" onclick="app.openEditModal(${drink.id})">Modifier</button>
                                <button class="delete-btn" onclick="app.removeDrink(${drink.id})">Supprimer</button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
    }

    updateChart() {
        const canvas = document.getElementById('bac-chart');
        const ctx = canvas.getContext('2d');

        if (this.bacChart) {
            this.bacChart.destroy();
        }

        // Générer les données pour le graphique
        const now = new Date();
        const startTime = this.drinks.length > 0 ? 
            new Date(Math.min(...this.drinks.map(d => new Date(d.time)))) : 
            new Date(now.getTime() - 60 * 60 * 1000); // 1h avant maintenant

        // Calculer le moment exact de sobriété (BAC = 0)
        let endTime;
        if (this.drinks.length > 0) {
            // Trouver la première prise d'effet
            const absorptionDelayMinutes = 30;
            let earliestEffectTime = null;
            let peakBAC = 0;

            this.drinks.forEach(drink => {
                const drinkTime = new Date(drink.time);
                const effectTime = new Date(drinkTime.getTime() + absorptionDelayMinutes * 60 * 1000);
                
                if (!earliestEffectTime || effectTime < earliestEffectTime) {
                    earliestEffectTime = effectTime;
                }

                // Calculer le BAC de pointe total
                let absorptionFactor = 1.0;
                switch (drink.digestiveState) {
                    case 'eating': absorptionFactor = 0.7; break;
                    case 'full': absorptionFactor = 0.5; break;
                    default: absorptionFactor = 1.0;
                }

                const alcoholGrams = drink.pureAlcohol * 0.789 * absorptionFactor;
                const weight = this.userProfile.weight;
                const distributionFactor = this.userProfile.gender === 'male' ? 0.68 : 0.55;
                const drinkBAC = (alcoholGrams * 0.8) / (weight * distributionFactor);
                peakBAC += drinkBAC;
            });

            // Calculer le temps exact de sobriété depuis la première prise d'effet
            if (earliestEffectTime && peakBAC > 0) {
                const eliminationRate = 0.15; // 0.15 g/L par heure en décimal
                const hoursToEliminate = peakBAC / eliminationRate; // peakBAC déjà en décimal
                endTime = new Date(earliestEffectTime.getTime() + hoursToEliminate * 60 * 60 * 1000);
            } else {
                endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2h par défaut
            }
        } else {
            endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2h par défaut
        }

        const dataPoints = [];
        const labels = [];

        // Calculer la durée totale pour adapter l'intervalle
        const totalHours = (endTime - startTime) / (1000 * 60 * 60);
        let intervalMinutes = 15; // Par défaut 15 minutes
        
        if (totalHours > 12) {
            intervalMinutes = 60; // 1 heure si plus de 12h
        } else if (totalHours > 6) {
            intervalMinutes = 30; // 30 minutes si plus de 6h
        }

        // Générer des points selon l'intervalle adaptatif
        for (let time = new Date(startTime); time <= endTime; time = new Date(time.getTime() + intervalMinutes * 60 * 1000)) {
            const bac = this.calculateBACAtTime(time); // Garder en g/L
            
            // Format d'affichage adapté à la durée
            let timeLabel;
            if (totalHours > 24) {
                // Plus de 24h : afficher jour et heure
                timeLabel = time.toLocaleString('fr-FR', { 
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
            } else if (totalHours > 12) {
                // Plus de 12h : afficher date et heure
                timeLabel = time.toLocaleString('fr-FR', { 
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit'
                });
            } else {
                // Moins de 12h : afficher seulement l'heure
                timeLabel = time.toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
            }
            
            labels.push(timeLabel);
            dataPoints.push(bac);
        }

        // Préparer les datasets
        const datasets = [{
            label: 'Taux d\'alcoolémie (g/L)',
            data: dataPoints,
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
        }];

        // Ajouter la ligne de limite de conduite si applicable
        if (this.userProfile && this.userProfile.driverType && this.userProfile.driverType !== 'none') {
            const drivingLimit = this.drivingLimits[this.userProfile.driverType];
            const limitData = new Array(labels.length).fill(drivingLimit);
            
            datasets.push({
                label: `Limite de conduite (${drivingLimit} g/L)`,
                data: limitData,
                borderColor: '#e17055',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [5, 5],
                fill: false,
                pointRadius: 0,
                tension: 0
            });
        }

        this.bacChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Évolution du Taux d\'Alcoolémie'
                    },
                    legend: {
                        display: datasets.length > 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'BAC (g/L)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(2) + ' g/L';
                            }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Heure'
                        }
                    }
                }
            }
        });
    }

    updateSettingsInfo() {
        if (this.userProfile) {
            const genderText = this.userProfile.gender === 'male' ? 'Homme' : 'Femme';
            document.getElementById('profile-info').textContent = 
                `${genderText}, ${this.userProfile.weight}kg`;
        }

        if (this.currentSession) {
            const sessionStart = new Date(this.currentSession.startTime).toLocaleString('fr-FR');
            document.getElementById('session-info').textContent = 
                `Démarrée le ${sessionStart}`;
        }
    }

    // Gestion des onglets
    switchTab(tabName) {
        // Masquer tous les contenus d'onglets
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Désactiver tous les boutons d'onglets
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });
        
        // Activer l'onglet sélectionné
        document.getElementById(`${tabName}-tab`).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Mettre à jour le graphique si c'est l'onglet graphique
        if (tabName === 'chart') {
            setTimeout(() => this.updateChart(), 100);
        }
    }

    // Gestion du modal d'édition
    openEditModal(drinkId) {
        const drink = this.drinks.find(d => d.id === drinkId);
        if (!drink) return;

        this.currentEditingDrink = drinkId;

        // Remplir le formulaire avec les données existantes
        const drinkTime = new Date(drink.time);
        drinkTime.setMinutes(drinkTime.getMinutes() - drinkTime.getTimezoneOffset());
        document.getElementById('edit-drink-time').value = drinkTime.toISOString().slice(0, 16);
        
        // Déterminer le type de boisson
        let drinkTypeValue = 'custom';
        const drinkTypes = {
            'Bière légère': 'beer-light',
            'Bière standard': 'beer-standard',
            'Bière forte': 'beer-strong',
            'Vin blanc': 'wine-white',
            'Vin rouge': 'wine-red',
            'Champagne': 'champagne',
            'Spiritueux': 'spirits'
        };
        
        if (drinkTypes[drink.type]) {
            drinkTypeValue = drinkTypes[drink.type];
        }
        
        document.getElementById('edit-drink-type').value = drinkTypeValue;
        document.getElementById('edit-volume').value = drink.volume;
        this.setDigestiveState(drink.digestiveState, true);
        
        if (drinkTypeValue === 'custom') {
            document.getElementById('edit-custom-alcohol').style.display = 'block';
            document.getElementById('edit-alcohol-content').value = drink.alcoholContent;
            document.getElementById('edit-alcohol-content').required = true;
        } else {
            document.getElementById('edit-custom-alcohol').style.display = 'none';
            document.getElementById('edit-alcohol-content').required = false;
        }

        document.getElementById('edit-modal').style.display = 'block';
    }

    closeEditModal() {
        document.getElementById('edit-modal').style.display = 'none';
        this.currentEditingDrink = null;
    }

    updateUI() {
        if (this.userProfile) {
            this.showSessionSection();
        }
    }

    // Gestion des boutons d'état digestif
    getSelectedDigestiveState() {
        const activeBtn = document.querySelector('.digestive-btn.active');
        return activeBtn ? activeBtn.getAttribute('data-state') : 'empty';
    }

    getSelectedEditDigestiveState() {
        const activeBtn = document.querySelector('#edit-digestive-buttons .digestive-btn.active');
        return activeBtn ? activeBtn.getAttribute('data-state') : 'empty';
    }

    setDigestiveState(state, isEdit = false) {
        const container = isEdit ? '#edit-digestive-buttons' : '.digestive-buttons';
        const buttons = document.querySelectorAll(`${container} .digestive-btn`);
        
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-state') === state) {
                btn.classList.add('active');
            }
        });
    }

    // Gestion des événements
    bindEvents() {
        // Formulaire de profil
        document.getElementById('profile-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const weight = parseFloat(document.getElementById('weight').value);
            const gender = document.getElementById('gender').value;
            const driverType = document.getElementById('driver-type').value;
            
            this.saveUserProfile({ weight, gender, driverType });
        });

        // Formulaire d'ajout de boisson
        document.getElementById('drink-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const type = document.getElementById('drink-type').value;
            const containerType = document.getElementById('container-type').value;
            const customVolume = parseFloat(document.getElementById('volume').value);
            const volume = containerType === 'custom' ? customVolume : this.containerSizes[containerType];
            const customAlcohol = parseFloat(document.getElementById('alcohol-content').value);
            const drinkTime = document.getElementById('drink-time').value;
            const digestiveState = this.getSelectedDigestiveState();
            
            this.addDrink(type, volume, customAlcohol, drinkTime, digestiveState);
            
            // Reset du formulaire (garder l'heure et l'état digestif)
            document.getElementById('drink-type').value = '';
            document.getElementById('container-type').value = '';
            document.getElementById('volume').value = '';
            document.getElementById('alcohol-content').value = '';
            document.getElementById('custom-alcohol').style.display = 'none';
            document.getElementById('custom-volume').style.display = 'none';
            document.getElementById('volume-display').textContent = '--';
            // Déselectionner tous les boutons de contenance
            document.querySelectorAll('.container-btn').forEach(btn => btn.classList.remove('active'));
            this.initializeDateTime();
        });

        // Formulaire d'édition
        document.getElementById('edit-drink-form').addEventListener('submit', (e) => {
            e.preventDefault();
            if (!this.currentEditingDrink) return;

            const type = document.getElementById('edit-drink-type').value;
            const containerType = document.getElementById('edit-container-type').value;
            const customVolume = parseFloat(document.getElementById('edit-volume').value);
            const volume = containerType === 'custom' ? customVolume : this.containerSizes[containerType];
            const customAlcohol = parseFloat(document.getElementById('edit-alcohol-content').value);
            const drinkTime = document.getElementById('edit-drink-time').value;
            const digestiveState = this.getSelectedEditDigestiveState();
            
            this.editDrink(this.currentEditingDrink, type, volume, customAlcohol, drinkTime, digestiveState);
            this.closeEditModal();
        });

        // Gestion du type personnalisé et sélection automatique de contenance (ajout)
        document.getElementById('drink-type').addEventListener('change', (e) => {
            const customField = document.getElementById('custom-alcohol');
            const containerSelect = document.getElementById('container-type');
            const volumeDisplay = document.getElementById('volume-display');
            const customVolumeField = document.getElementById('custom-volume');
            
            // Gestion du type personnalisé
            if (e.target.value === 'custom') {
                customField.style.display = 'block';
                document.getElementById('alcohol-content').required = true;
            } else {
                customField.style.display = 'none';
                document.getElementById('alcohol-content').required = false;
            }
            
            // Sélection automatique de la contenance par défaut
            if (e.target.value && this.defaultContainers[e.target.value]) {
                const defaultContainer = this.defaultContainers[e.target.value];
                const hiddenInput = document.getElementById('container-type');
                
                // Déselectionner tous les boutons de contenance
                document.querySelectorAll('.container-btn').forEach(btn => btn.classList.remove('active'));
                
                // Sélectionner le bouton correspondant
                const targetBtn = document.querySelector(`.container-btn[data-container="${defaultContainer}"]`);
                if (targetBtn) {
                    targetBtn.classList.add('active');
                    hiddenInput.value = defaultContainer;
                    
                    // Mettre à jour l'affichage du volume
                    if (defaultContainer === 'custom') {
                        customVolumeField.style.display = 'block';
                        document.getElementById('volume').required = true;
                        volumeDisplay.textContent = '--';
                    } else if (this.containerSizes[defaultContainer]) {
                        customVolumeField.style.display = 'none';
                        document.getElementById('volume').required = false;
                        const volume = this.containerSizes[defaultContainer];
                        volumeDisplay.textContent = `${volume} ml`;
                    }
                }
            }
        });

        // Gestion du type personnalisé et sélection automatique de contenance (édition)
        document.getElementById('edit-drink-type').addEventListener('change', (e) => {
            const customField = document.getElementById('edit-custom-alcohol');
            const containerSelect = document.getElementById('edit-container-type');
            const volumeDisplay = document.getElementById('edit-volume-display');
            const customVolumeField = document.getElementById('edit-custom-volume');
            
            // Gestion du type personnalisé
            if (e.target.value === 'custom') {
                customField.style.display = 'block';
                document.getElementById('edit-alcohol-content').required = true;
            } else {
                customField.style.display = 'none';
                document.getElementById('edit-alcohol-content').required = false;
            }
            
            // Sélection automatique de la contenance par défaut
            if (e.target.value && this.defaultContainers[e.target.value]) {
                const defaultContainer = this.defaultContainers[e.target.value];
                const hiddenInput = document.getElementById('edit-container-type');
                
                // Déselectionner tous les boutons de contenance dans le modal d'édition
                document.querySelectorAll('#edit-modal .container-btn').forEach(btn => btn.classList.remove('active'));
                
                // Sélectionner le bouton correspondant dans le modal d'édition
                const targetBtn = document.querySelector(`#edit-modal .container-btn[data-container="${defaultContainer}"]`);
                if (targetBtn) {
                    targetBtn.classList.add('active');
                    hiddenInput.value = defaultContainer;
                    
                    // Mettre à jour l'affichage du volume
                    if (defaultContainer === 'custom') {
                        customVolumeField.style.display = 'block';
                        document.getElementById('edit-volume').required = true;
                        volumeDisplay.textContent = '--';
                    } else if (this.containerSizes[defaultContainer]) {
                        customVolumeField.style.display = 'none';
                        document.getElementById('edit-volume').required = false;
                        const volume = this.containerSizes[defaultContainer];
                        volumeDisplay.textContent = `${volume} ml`;
                    }
                }
            }
        });

        // Gestion des boutons de contenances (ajout)
        document.querySelectorAll('.container-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const containerType = e.currentTarget.dataset.container;
                const customVolumeField = document.getElementById('custom-volume');
                const volumeDisplay = document.getElementById('volume-display');
                const hiddenInput = document.getElementById('container-type');
                
                // Retirer la classe active de tous les boutons de ce groupe
                e.currentTarget.parentElement.querySelectorAll('.container-btn').forEach(b => b.classList.remove('active'));
                // Ajouter la classe active au bouton cliqué
                e.currentTarget.classList.add('active');
                // Mettre à jour le champ caché
                hiddenInput.value = containerType;
                
                if (containerType === 'custom') {
                    customVolumeField.style.display = 'block';
                    document.getElementById('volume').required = true;
                    volumeDisplay.textContent = '--';
                } else if (this.containerSizes[containerType]) {
                    customVolumeField.style.display = 'none';
                    document.getElementById('volume').required = false;
                    const volume = this.containerSizes[containerType];
                    volumeDisplay.textContent = `${volume} ml`;
                } else {
                    customVolumeField.style.display = 'none';
                    document.getElementById('volume').required = false;
                    volumeDisplay.textContent = '--';
                }
            });
        });

        // Gestion des boutons de contenances dans le modal d'édition (utilise event delegation)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.container-btn') && e.target.closest('#edit-modal')) {
                const btn = e.target.closest('.container-btn');
                const containerType = btn.dataset.container;
                const customVolumeField = document.getElementById('edit-custom-volume');
                const volumeDisplay = document.getElementById('edit-volume-display');
                const hiddenInput = document.getElementById('edit-container-type');
                
                // Retirer la classe active de tous les boutons de ce groupe
                btn.parentElement.querySelectorAll('.container-btn').forEach(b => b.classList.remove('active'));
                // Ajouter la classe active au bouton cliqué
                btn.classList.add('active');
                // Mettre à jour le champ caché
                hiddenInput.value = containerType;
                
                if (containerType === 'custom') {
                    customVolumeField.style.display = 'block';
                    document.getElementById('edit-volume').required = true;
                    volumeDisplay.textContent = '--';
                } else if (this.containerSizes[containerType]) {
                    customVolumeField.style.display = 'none';
                    document.getElementById('edit-volume').required = false;
                    const volume = this.containerSizes[containerType];
                    volumeDisplay.textContent = `${volume} ml`;
                } else {
                    customVolumeField.style.display = 'none';
                    document.getElementById('edit-volume').required = false;
                    volumeDisplay.textContent = '--';
                }
            }
        });

        // Gestion des onglets
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });

        // Gestion du modal
        document.querySelector('.close').addEventListener('click', () => {
            this.closeEditModal();
        });

        document.querySelector('.cancel-btn').addEventListener('click', () => {
            this.closeEditModal();
        });

        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('edit-modal')) {
                this.closeEditModal();
            }
        });

        // Boutons des paramètres
        document.getElementById('edit-profile-btn').addEventListener('click', () => {
            document.getElementById('session-section').style.display = 'none';
            document.getElementById('profile-section').style.display = 'block';
            
            // Pré-remplir le formulaire
            if (this.userProfile) {
                document.getElementById('weight').value = this.userProfile.weight;
                document.getElementById('gender').value = this.userProfile.gender;
            }
        });

        document.getElementById('new-session-btn').addEventListener('click', () => {
            if (confirm('Démarrer une nouvelle session ? Cela effacera les boissons actuelles.')) {
                this.startNewSession();
            }
        });

        document.getElementById('reset-data-btn').addEventListener('click', () => {
            this.resetAllData();
        });

        // Gestion des boutons d'état digestif
        document.querySelectorAll('.digestive-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const isEdit = e.target.closest('#edit-digestive-buttons');
                const state = e.target.getAttribute('data-state');
                this.setDigestiveState(state, !!isEdit);
            });
        });
    }

    /**
     * Sauvegarde la session actuelle dans l'historique
     */
    saveSessionToHistory() {
        if (!this.currentSession || !this.drinks.length) {
            return;
        }

        try {
            const history = JSON.parse(localStorage.getItem('sobre_history') || '[]');
            
            const sessionData = {
                id: this.currentSession.id || Date.now(),
                startTime: this.currentSession.startTime,
                endTime: new Date().toISOString(),
                profile: { ...this.userProfile },
                drinks: [...this.drinks],
                maxBAC: Math.max(...this.drinks.map(d => this.calculateBACAtTime(d.time))),
                sessionDuration: Date.now() - new Date(this.currentSession.startTime).getTime(),
                totalAlcohol: this.drinks.reduce((sum, drink) => sum + this.calculatePureAlcohol(drink), 0)
            };

            // Ajouter à l'historique
            history.push(sessionData);
            
            // Garder seulement les 50 dernières sessions
            if (history.length > 50) {
                history.splice(0, history.length - 50);
            }

            localStorage.setItem('sobre_history', JSON.stringify(history));
            console.log('📊 Session sauvegardée dans l\'historique');
            
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de l\'historique :', error);
        }
    }

    /**
     * Récupère l'historique des sessions
     */
    getSessionHistory() {
        try {
            return JSON.parse(localStorage.getItem('sobre_history') || '[]');
        } catch (error) {
            console.error('Erreur lors de la lecture de l\'historique :', error);
            return [];
        }
    }

    /**
     * Termine la session actuelle et la sauvegarde
     */
    endCurrentSession() {
        if (this.currentSession) {
            this.saveSessionToHistory();
            this.currentSession = null;
            this.drinks = [];
            this.saveDrinks();
            this.saveSession();
            console.log('📊 Session terminée et sauvegardée');
        }
    }

    /**
     * Remet à zéro toutes les données (avec confirmation)
     */
    resetAllData() {
        if (confirm('⚠️ Voulez-vous vraiment supprimer toutes les données ? Cette action est irréversible.')) {
            // Sauvegarder la session actuelle avant de tout supprimer
            this.saveSessionToHistory();
            
            // Supprimer toutes les données
            localStorage.removeItem('sobre_profile');
            localStorage.removeItem('sobre_drinks');
            localStorage.removeItem('sobre_session');
            
            // Demander si on veut aussi supprimer l'historique
            if (confirm('Voulez-vous également supprimer l\'historique des sessions ?')) {
                localStorage.removeItem('sobre_history');
            }
            
            // Recharger la page
            location.reload();
        }
    }
}

// Initialisation de l'application
const sobreApp = new SobreApp();
window.sobreApp = sobreApp;