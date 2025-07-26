class RecipeGenerator {
    constructor() {
        this.ingredients = [];
        this.serviceWorkerReady = false;
        this.currentSuggestions = [];
        this.configManager = null;
        this.openaiModel = 'gpt-4o-mini';
        this.parameters = {
            convives: 4,
            typePublic: 'mixte',  // Correspond au bouton actif par défaut
            difficulte: 'facile',
            tempsDisponible: '30min',
            typeRepas: 'déjeuner',
            contraintes: [],
            materiel: ['four', 'plaques']
        };
        
        
        this.init();
    }
    
    async init() {
        await this.initConfig();
        this.bindEvents();
        this.updateAIButton();
        await this.initServiceWorker();
    }

    async initConfig() {
        try {
            // Charger le gestionnaire de configuration
            if (typeof ConfigManager !== 'undefined') {
                this.configManager = new ConfigManager();
                await this.configManager.loadConfig();

                const validation = this.configManager.validateConfig();
                if (!validation.isValid) {
                    console.warn('⚠️ Configuration invalide:', validation.errors);
                }

                const confModel = this.configManager.getOpenAIConfig().model;
                const saved = localStorage.getItem('recettes_openai_model');
                this.openaiModel = saved || confModel || this.openaiModel;
            } else {
                console.warn('⚠️ ConfigManager non disponible, utilisation des fallbacks');
                const saved = localStorage.getItem('recettes_openai_model');
                if (saved) {
                    this.openaiModel = saved;
                }
            }
        } catch (error) {
            console.error('❌ Erreur initialisation config:', error);
        }
    }

    async initServiceWorker() {
        console.log('🛡️ Backend sécurisé activé');
        // Service worker non nécessaire pour l'API - sécurité gérée par le backend PHP
        this.serviceWorkerReady = false; // Pour compatibilité, mais non utilisé
        this.updateAIButton();
        this.showNotification('✅ Backend sécurisé activé !', 'success');
    }
    
    bindEvents() {
        // Input d'ingrédient
        const ingredientInput = document.getElementById('ingredient-input');
        const addBtn = document.getElementById('add-ingredient');
        
        ingredientInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addIngredient();
            }
        });
        
        addBtn.addEventListener('click', () => this.addIngredient());
        
        // Suggestions rapides
        document.querySelectorAll('.suggestion-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const ingredient = btn.dataset.ingredient;
                this.addIngredientToList(ingredient);
                btn.style.opacity = '0.5';
                btn.disabled = true;
            });
        });
        
        // Bouton génération IA
        const aiButton = document.getElementById('generate-ai-recipe');
        aiButton.addEventListener('click', () => this.generateAIRecipe());

        // Gestion des paramètres avancés
        this.bindAdvancedOptions();
        
        // Modal
        this.setupModal();
    }

    bindAdvancedOptions() {
        // Slider nombre de convives avec boutons + et -
        const convivesSlider = document.getElementById('convives-slider');
        const convivesValue = document.getElementById('convives-value');
        const convivesMinus = document.getElementById('convives-minus');
        const convivesPlus = document.getElementById('convives-plus');
        
        // Fonction pour mettre à jour la valeur et l'état des boutons
        const updateConvives = (value) => {
            const numValue = parseInt(value);
            convivesValue.textContent = numValue;
            convivesSlider.value = numValue;
            this.parameters.convives = numValue;
            
            // Gérer l'état des boutons
            convivesMinus.disabled = numValue <= 1;
            convivesPlus.disabled = numValue >= 12;
        };
        
        // Event listeners
        convivesSlider.addEventListener('input', (e) => {
            updateConvives(e.target.value);
        });
        
        convivesMinus.addEventListener('click', () => {
            const currentValue = parseInt(convivesSlider.value);
            if (currentValue > 1) {
                updateConvives(currentValue - 1);
            }
        });
        
        convivesPlus.addEventListener('click', () => {
            const currentValue = parseInt(convivesSlider.value);
            if (currentValue < 12) {
                updateConvives(currentValue + 1);
            }
        });
        
        // Initialiser l'état des boutons
        updateConvives(convivesSlider.value);

        // Groupes de boutons d'options
        document.querySelectorAll('.button-group').forEach(group => {
            const optionType = group.dataset.option;
            
            group.querySelectorAll('.option-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    // Désactiver tous les boutons du groupe
                    group.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
                    
                    // Activer le bouton cliqué
                    btn.classList.add('active');
                    
                    // Mettre à jour les paramètres
                    const value = btn.dataset.value;
                    this.updateOptionParameter(optionType, value);
                });
            });
        });

        // Groupes de boutons multi-sélection (contraintes et matériel)
        document.querySelectorAll('.multi-button-group').forEach(group => {
            const optionType = group.dataset.option;
            
            group.querySelectorAll('.multi-option-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    // Toggle l'état actif du bouton
                    btn.classList.toggle('active');
                    
                    // Mettre à jour les paramètres
                    const value = btn.dataset.value;
                    this.updateMultiOptionParameter(optionType, value, btn.classList.contains('active'));
                    
                    // Gérer l'affichage des informations saisonnières
                    if (btn.id === 'saison-btn') {
                        this.toggleSeasonalInfo(btn.classList.contains('active'));
                    }
                });
            });
        });
    }

    updateConstraints() {
        const constraints = [];
        document.querySelectorAll('.multi-button-group[data-option="contraintes"] .multi-option-btn.active').forEach(btn => {
            constraints.push(btn.dataset.value);
        });
        this.parameters.contraintes = constraints;
    }

    /**
     * Affiche ou masque les informations saisonnières
     */
    toggleSeasonalInfo(show) {
        const seasonalInfo = document.getElementById('seasonal-info');
        const seasonalProducts = document.getElementById('seasonal-products');
        
        if (show) {
            const seasonInfo = this.getCurrentSeasonInfo();
            
            // Créer les badges pour les produits de saison
            seasonalProducts.innerHTML = seasonInfo.seasonalProduce.map(product => 
                `<span class="seasonal-product">${product}</span>`
            ).join('');
            
            seasonalInfo.style.display = 'block';
            
            // Ajouter un message d'information
            this.showNotification(`🌱 Mode saison activé : ${seasonInfo.season}`, 'info');
        } else {
            seasonalInfo.style.display = 'none';
        }
    }

    /**
     * Met à jour un paramètre d'option basé sur le type et la valeur
     */
    updateOptionParameter(optionType, value) {
        switch (optionType) {
            case 'type-public':
                this.parameters.typePublic = value;
                break;
            case 'difficulte':
                this.parameters.difficulte = value;
                break;
            case 'temps-disponible':
                this.parameters.tempsDisponible = value;
                break;
            case 'type-repas':
                this.parameters.typeRepas = value;
                break;
            default:
                console.warn('Type d\'option non reconnu:', optionType);
        }
        
        console.log('Paramètre mis à jour:', optionType, '=', value);
    }

    updateEquipment() {
        const equipment = [];
        document.querySelectorAll('.multi-button-group[data-option="materiel"] .multi-option-btn.active').forEach(btn => {
            equipment.push(btn.dataset.value);
        });
        this.parameters.materiel = equipment;
    }

    /**
     * Met à jour un paramètre multi-sélection basé sur le type, la valeur et l'état
     */
    updateMultiOptionParameter(optionType, value, isActive) {
        switch (optionType) {
            case 'contraintes':
                if (isActive) {
                    if (!this.parameters.contraintes.includes(value)) {
                        this.parameters.contraintes.push(value);
                    }
                } else {
                    this.parameters.contraintes = this.parameters.contraintes.filter(c => c !== value);
                }
                break;
            case 'materiel':
                if (isActive) {
                    if (!this.parameters.materiel.includes(value)) {
                        this.parameters.materiel.push(value);
                    }
                } else {
                    this.parameters.materiel = this.parameters.materiel.filter(m => m !== value);
                }
                break;
            default:
                console.warn('Type d\'option multi-sélection non reconnu:', optionType);
        }
        
        console.log('Paramètre multi-sélection mis à jour:', optionType, '=', 
                   optionType === 'contraintes' ? this.parameters.contraintes : this.parameters.materiel);
    }

    updateAIButton() {
        const aiButton = document.getElementById('generate-ai-recipe');
        // Activer si on a des ingrédients (backend sécurisé)
        if (this.ingredients.length > 0) {
            aiButton.disabled = false;
        } else {
            aiButton.disabled = true;
        }
    }
    
    addIngredient() {
        const input = document.getElementById('ingredient-input');
        const ingredient = input.value.trim().toLowerCase();
        
        if (ingredient && !this.ingredients.includes(ingredient)) {
            this.addIngredientToList(ingredient);
            input.value = '';
        }
    }
    
    addIngredientToList(ingredient) {
        this.ingredients.push(ingredient);
        this.renderIngredients();
        this.updateAIButton();
    }
    
    removeIngredient(ingredient) {
        this.ingredients = this.ingredients.filter(ing => ing !== ingredient);
        this.renderIngredients();
        this.updateAIButton();
        
        // Réactiver le bouton de suggestion correspondant
        document.querySelectorAll('.suggestion-btn').forEach(btn => {
            if (btn.dataset.ingredient === ingredient) {
                btn.style.opacity = '1';
                btn.disabled = false;
            }
        });
    }
    
    renderIngredients() {
        const container = document.getElementById('ingredients-list');
        
        if (this.ingredients.length === 0) {
            container.innerHTML = '<div class="empty-state"><span>Aucun ingrédient sélectionné</span></div>';
        } else {
            container.innerHTML = this.ingredients.map(ingredient => `
                <div class="ingredient-tag">
                    ${ingredient}
                    <button class="remove-btn" onclick="recipeApp.removeIngredient('${ingredient}')">&times;</button>
                </div>
            `).join('');
        }
    }
    

    /**
     * Détermine la saison actuelle et les produits de saison
     */
    getCurrentSeasonInfo() {
        const now = new Date();
        const month = now.getMonth() + 1; // 1-12
        
        let season = '';
        let seasonalProduce = [];
        
        if (month >= 3 && month <= 5) {
            season = 'printemps';
            seasonalProduce = [
                'asperges', 'radis', 'épinards', 'petits pois', 'fèves', 'artichauts',
                'fraises', 'rhubarbe', 'ail nouveau', 'oignons nouveaux',
                'laitue', 'roquette', 'cresson', 'blettes'
            ];
        } else if (month >= 6 && month <= 8) {
            season = 'été';
            seasonalProduce = [
                'tomates', 'courgettes', 'aubergines', 'poivrons', 'concombres',
                'haricots verts', 'maïs', 'basilic', 'menthe', 'thym',
                'pêches', 'abricots', 'melons', 'pastèques', 'cerises',
                'framboises', 'myrtilles', 'cassis'
            ];
        } else if (month >= 9 && month <= 11) {
            season = 'automne';
            seasonalProduce = [
                'potirons', 'courges', 'champignons', 'poireaux', 'choux',
                'brocolis', 'céleri', 'carottes', 'navets', 'panais',
                'pommes', 'poires', 'raisins', 'figues', 'noix',
                'châtaignes', 'cranberries'
            ];
        } else {
            season = 'hiver';
            seasonalProduce = [
                'poireaux', 'choux de Bruxelles', 'chou-fleur', 'épinards',
                'mâche', 'endives', 'cardons', 'topinambours',
                'pommes de terre', 'carottes', 'betteraves', 'rutabaga',
                'oranges', 'mandarines', 'pamplemousses', 'kiwis',
                'pommes', 'poires', 'citrons'
            ];
        }
        
        return {
            season,
            seasonalProduce,
            month,
            seasonalMessage: `Produits de ${season} disponibles : ${seasonalProduce.slice(0, 8).join(', ')}`
        };
    }

    async generateAIRecipe() {
        if (this.ingredients.length === 0) {
            this.showNotification('⚠️ Ajoutez au moins un ingrédient', 'error');
            return;
        }

        // Sanitize les ingrédients
        const sanitizedIngredients = this.ingredients.map(ing => this.sanitizeInput(ing));
        
        // Obtenir les informations saisonnières
        const seasonInfo = this.getCurrentSeasonInfo();

        // Préparer les données avec validation
        const requestData = {
            ingredients: sanitizedIngredients,
            convives: this.parameters.convives,
            typePublic: this.sanitizeInput(this.parameters.typePublic),
            contraintes: this.parameters.contraintes,
            difficulte: this.sanitizeInput(this.parameters.difficulte),
            tempsDisponible: this.sanitizeInput(this.parameters.tempsDisponible),
            typeRepas: this.sanitizeInput(this.parameters.typeRepas),
            materiel: this.parameters.materiel.map(m => this.sanitizeInput(m)),
            mode: 'suggestions',
            model: this.openaiModel,
            // Ajouter les informations saisonnières si l'option est cochée
            seasonalInfo: this.parameters.contraintes.includes('fruits et légumes de saison') ? seasonInfo : null
        };

        // Valider les données
        const validation = this.validateRequestData(requestData);
        if (!validation.isValid) {
            this.showNotification(`❌ Données invalides: ${validation.errors.join(', ')}`, 'error');
            return;
        }

        // Service worker non nécessaire - utilisation du backend sécurisé

        const aiButton = document.getElementById('generate-ai-recipe');
        const originalText = aiButton.textContent;
        
        try {
            // UI de chargement
            aiButton.disabled = true;
            aiButton.classList.add('loading');
            aiButton.textContent = '🤖 Génération en cours...';

            this.showAILoading();

            console.log('Données envoyées à l\'IA:', requestData);

            // Appel au backend PHP sécurisé
            console.log('🛡️ Appel au backend sécurisé');
            const response = await fetch('/api/recipes-generator.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const result = await response.json();

            if (result.error) {
                throw new Error(result.error);
            }

            // Afficher les 3 suggestions de recettes
            this.displayRecipeSuggestions(result.suggestions || [result.recipe]);
            this.showNotification('✅ Suggestions générées avec succès !', 'success');
            
            // Log de l'usage pour l'admin
            this.logUsageToAdmin({
                model: this.openaiModel,
                tokens: result.usage?.total_tokens || 800, // Estimation si pas de données
                cost: this.calculateCost(result.usage?.total_tokens || 800, this.openaiModel),
                status: 'success',
                type: 'suggestions'
            });

        } catch (error) {
            console.error('Erreur génération IA:', error);
            this.showNotification(`❌ Erreur: ${error.message}`, 'error');
            
            // Log de l'erreur pour l'admin
            this.logUsageToAdmin({
                model: this.openaiModel,
                tokens: 0,
                cost: 0,
                status: 'error',
                error: error.message
            });
        } finally {
            // Restaurer le bouton
            aiButton.disabled = false;
            aiButton.classList.remove('loading');
            aiButton.textContent = originalText;
        }
    }

    showAILoading() {
        const recipesSection = document.getElementById('recipes-section');
        const container = document.getElementById('recipes-container');
        
        recipesSection.style.display = 'block';
        container.innerHTML = `
            <div class="ai-loading">
                <div class="ai-spinner">🤖</div>
                <h3>Intelligence Artificielle en action...</h3>
                <p>Création d'une recette personnalisée avec vos ingrédients</p>
                <div class="loading-steps">
                    <div class="step active">📝 Analyse des ingrédients</div>
                    <div class="step">🧮 Calcul des proportions</div>
                    <div class="step">👨‍🍳 Création de la recette</div>
                    <div class="step">✨ Finalisation</div>
                </div>
            </div>
        `;
        
        // Animation des étapes
        const steps = container.querySelectorAll('.step');
        let currentStep = 0;
        
        const stepInterval = setInterval(() => {
            if (currentStep < steps.length - 1) {
                steps[currentStep].classList.remove('active');
                currentStep++;
                steps[currentStep].classList.add('active');
            } else {
                clearInterval(stepInterval);
            }
        }, 1000);
        
        recipesSection.scrollIntoView({ behavior: 'smooth' });
    }

    displayRecipeSuggestions(suggestions) {
        const container = document.getElementById('recipes-container');
        
        // Stocker les suggestions pour y accéder plus tard
        this.currentSuggestions = suggestions;
        
        container.innerHTML = `
            <div class="ai-suggestions-result">
                <div class="ai-badge">🤖 3 suggestions générées par IA</div>
                <p class="selection-instruction">Choisissez la recette qui vous fait le plus envie :</p>
                <div class="suggestions-grid">
                    ${suggestions.map((suggestion, index) => `
                        <div class="suggestion-card" data-suggestion-index="${index}">
                            <div class="suggestion-emoji">${suggestion.emoji || '🍝'}</div>
                            <h3 class="suggestion-title">${suggestion.nom}</h3>
                            <p class="suggestion-description">${suggestion.description}</p>
                            <div class="suggestion-meta">
                                <span class="suggestion-time">⏱️ ${suggestion.temps_total}</span>
                                <span class="suggestion-difficulty">📊 ${suggestion.difficulte}</span>
                            </div>
                            <div class="suggestion-style">
                                <span class="style-badge">${suggestion.style || 'Classique'}</span>
                            </div>
                            <div class="suggestion-points">
                                ${(suggestion.points_forts || []).map(point => `
                                    <span class="point-badge">${point}</span>
                                `).join('')}
                            </div>
                            <div class="selection-cta">
                                <span class="cta-text">Cliquer pour détailler cette recette</span>
                                <span class="cta-arrow">→</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Ajouter les event listeners
        container.querySelectorAll('.suggestion-card').forEach((card, index) => {
            card.addEventListener('click', () => {
                this.selectRecipeSuggestion(index, suggestions[index]);
            });
        });
    }

    async selectRecipeSuggestion(index, suggestion) {
        console.log('Sélection de la suggestion:', index, suggestion);
        
        // Vérifier que la suggestion est valide
        if (!suggestion || !suggestion.nom) {
            console.error('Suggestion invalide:', suggestion);
            this.showNotification('❌ Erreur: Suggestion invalide', 'error');
            return;
        }
        
        // Afficher le chargement
        this.showDetailedRecipeLoading(suggestion.nom);
        
        try {
            // Obtenir les informations saisonnières
            const seasonInfo = this.getCurrentSeasonInfo();
            
            // Préparer les données pour la recette détaillée
            const requestData = {
                ingredients: this.ingredients,
                convives: this.parameters.convives,
                typePublic: this.parameters.typePublic,
                contraintes: this.parameters.contraintes,
                difficulte: this.parameters.difficulte,
                tempsDisponible: this.parameters.tempsDisponible,
                typeRepas: this.parameters.typeRepas,
                materiel: this.parameters.materiel,
                mode: 'detailed',
                chosenRecipe: suggestion.nom,
                model: this.openaiModel,
                // Ajouter les informations saisonnières si l'option est cochée
                seasonalInfo: this.parameters.contraintes.includes('fruits et légumes de saison') ? seasonInfo : null
            };

            console.log('Génération de la recette détaillée:', requestData);

            // Appel au backend PHP sécurisé pour recette détaillée
            console.log('🛡️ Appel au backend sécurisé pour recette détaillée');
            const response = await fetch('/api/recipes-generator.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const result = await response.json();
            console.log('Résultat reçu:', result);

            if (result.error) {
                throw new Error(result.error);
            }

            // Vérifier que nous avons une recette
            if (!result.recipe) {
                throw new Error('Aucune recette reçue de l\'IA');
            }

            // Afficher la recette détaillée
            this.displayAIRecipe(result.recipe);
            this.showNotification('✅ Recette détaillée générée !', 'success');
            
            // Log de l'usage pour l'admin
            this.logUsageToAdmin({
                model: this.openaiModel,
                tokens: result.usage?.total_tokens || 1200, // Estimation pour recette détaillée
                cost: this.calculateCost(result.usage?.total_tokens || 1200, this.openaiModel),
                status: 'success',
                type: 'detailed_recipe'
            });

        } catch (error) {
            console.error('Erreur génération recette détaillée:', error);
            this.showNotification(`❌ Erreur: ${error.message}`, 'error');
            
            // Log de l'erreur pour l'admin
            this.logUsageToAdmin({
                model: this.openaiModel,
                tokens: 0,
                cost: 0,
                status: 'error',
                error: error.message,
                type: 'detailed_recipe'
            });
            
            // En cas d'erreur, revenir aux suggestions
            if (this.currentSuggestions && this.currentSuggestions.length > 0) {
                setTimeout(() => {
                    this.displayRecipeSuggestions(this.currentSuggestions);
                }, 2000);
            }
        }
    }

    showDetailedRecipeLoading(recipeName) {
        const recipesSection = document.getElementById('recipes-section');
        const container = document.getElementById('recipes-container');
        
        // S'assurer que la section est visible
        recipesSection.style.display = 'block';
        
        container.innerHTML = `
            <div class="detailed-recipe-loading">
                <div class="detailed-spinner">👨‍🍳</div>
                <h3>Préparation de "${recipeName}"...</h3>
                <p>Création de la recette détaillée avec ingrédients et instructions</p>
                <div class="loading-bar">
                    <div class="loading-progress"></div>
                </div>
            </div>
        `;
        
        // Scroll vers la section des recettes
        recipesSection.scrollIntoView({ behavior: 'smooth' });
        
        // Animation de la barre de progression
        const progressBar = container.querySelector('.loading-progress');
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress > 90) progress = 90;
            progressBar.style.width = progress + '%';
        }, 500);
        
        // Nettoyer l'animation après 10 secondes
        setTimeout(() => {
            clearInterval(progressInterval);
        }, 10000);
    }

    displayAIRecipe(recipe) {
        const container = document.getElementById('recipes-container');
        
        container.innerHTML = `
            <div class="ai-recipe-result">
                <div class="ai-badge">🤖 Recette détaillée générée par IA</div>
                <div class="recipe-card ai-recipe">
                    <div class="recipe-header">
                        <h2>${recipe.nom || 'Recette personnalisée'}</h2>
                        <p class="recipe-description">${recipe.description || ''}</p>
                    </div>
                    
                    <div class="recipe-meta-grid">
                        <div class="meta-item">
                            <span class="meta-label">⏱️ Préparation</span>
                            <span class="meta-value">${recipe.temps_preparation || 'N/A'}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">🔥 Cuisson</span>
                            <span class="meta-value">${recipe.temps_cuisson || 'N/A'}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">👥 Portions</span>
                            <span class="meta-value">${recipe.portions || this.parameters.convives}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">📊 Difficulté</span>
                            <span class="meta-value">${recipe.difficulte || 'Facile'}</span>
                        </div>
                    </div>

                    <div class="recipe-content-grid">
                        <div class="ingredients-section">
                            <h3>🥘 Ingrédients</h3>
                            <ul class="ingredients-list">
                                ${(recipe.ingredients || []).map(ing => `
                                    <li>${ing.quantite || ''} ${ing.unite || ''} ${ing.nom || ing}</li>
                                `).join('')}
                            </ul>
                        </div>

                        <div class="instructions-section">
                            <h3>👨‍🍳 Instructions</h3>
                            <ol class="instructions-list">
                                ${(recipe.etapes || []).map(etape => `
                                    <li>${etape}</li>
                                `).join('')}
                            </ol>
                        </div>
                    </div>

                    ${recipe.conseils && recipe.conseils.length > 0 ? `
                        <div class="tips-section">
                            <h3>💡 Conseils</h3>
                            <ul class="tips-list">
                                ${recipe.conseils.map(conseil => `<li>${conseil}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}

                    ${recipe.variantes ? `
                        <div class="variants-section">
                            <h3>🔄 Variantes</h3>
                            <p>${recipe.variantes}</p>
                        </div>
                    ` : ''}

                    ${recipe.niveau_enfants ? `
                        <div class="kids-level">
                            <span class="kids-badge">👶 Niveau enfants: ${recipe.niveau_enfants}</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="recipe-actions">
                    <button onclick="recipeApp.generateAIRecipe()" class="btn-primary">
                        🔄 Générer de nouvelles suggestions
                    </button>
                </div>
            </div>
        `;
        
        // Ajouter les boutons d'export après avoir affiché la recette
        const recipeContainer = container.querySelector('.ai-recipe-result');
        if (recipeContainer && window.recipeExportManager) {
            window.recipeExportManager.addExportButtons(recipeContainer);
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        const colors = {
            success: '#48bb78',
            error: '#e53e3e',
            info: '#3182ce'
        };
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    // Méthode supprimée - migration vers backend sécurisé

    // Méthode supprimée - logique transférée vers le backend sécurisé

    // Méthode supprimée - logique transférée vers le backend sécurisé

    // Méthode supprimée - logique transférée vers le backend sécurisé
    
    setupModal() {
        const modal = document.getElementById('recipe-modal');
        const closeBtn = modal.querySelector('.close');
        
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    // Méthode supprimée - sécurité gérée par le backend

    // Calculer le coût d'une requête
    calculateCost(tokens, model = 'gpt-4o-mini') {
        if (!tokens) return 0;
        
        // Tarifs par 1K tokens (à jour janvier 2025)
        const rates = {
            'gpt-4o-mini': 0.000375, // Moyenne input/output
            'gpt-4': 0.045, // Moyenne input/output  
            'gpt-3.5-turbo': 0.002
        };
        
        const rate = rates[model] || rates['gpt-4o-mini'];
        return (tokens / 1000) * rate;
    }

    // Logger l'usage pour la console admin
    logUsageToAdmin(usageData) {
        try {
            // Ajouter des métadonnées
            const logData = {
                ...usageData,
                timestamp: new Date().toISOString(),
                source: 'recettes',
                session_id: this.getSessionId()
            };
            
            // Stocker localement pour la console admin
            const adminUsageKey = 'openai_usage_data';
            const today = new Date().toISOString().split('T')[0];
            const stored = JSON.parse(localStorage.getItem(adminUsageKey) || '{}');
            
            if (!stored[today]) {
                stored[today] = {
                    requests: 0,
                    tokens: 0,
                    cost: 0,
                    models: {}
                };
            }
            
            stored[today].requests += 1;
            stored[today].tokens += logData.tokens || 0;
            stored[today].cost += logData.cost || 0;
            
            const model = logData.model || 'unknown';
            stored[today].models[model] = (stored[today].models[model] || 0) + 1;
            
            localStorage.setItem(adminUsageKey, JSON.stringify(stored));
            
            console.log('📊 Usage loggé pour admin:', logData);
            
        } catch (error) {
            console.warn('Erreur logging usage:', error);
        }
    }

    // Obtenir ou créer un ID de session
    getSessionId() {
        let sessionId = sessionStorage.getItem('recipe_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('recipe_session_id', sessionId);
        }
        return sessionId;
    }

    // Validation d'entrée pour prévenir les injections
    sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        
        return input
            .trim()
            .replace(/[<>\"']/g, '') // Supprime caractères potentiellement dangereux
            .substring(0, 100); // Limite la longueur
    }

    // Validation des paramètres de requête
    validateRequestData(requestData) {
        const errors = [];

        // Vérifier les ingrédients
        if (!requestData.ingredients || !Array.isArray(requestData.ingredients) || requestData.ingredients.length === 0) {
            errors.push('Au moins un ingrédient est requis');
        }

        // Vérifier le nombre de convives
        const convives = parseInt(requestData.convives);
        if (isNaN(convives) || convives < 1 || convives > 20) {
            errors.push('Nombre de convives invalide (1-20)');
        }

        // Vérifier les contraintes autorisées
        const allowedConstraints = ['vegetarien', 'vegan', 'sans-gluten', 'sans-lactose', 'halal', 'casher'];
        if (requestData.contraintes && Array.isArray(requestData.contraintes)) {
            const invalidConstraints = requestData.contraintes.filter(c => !allowedConstraints.includes(c));
            if (invalidConstraints.length > 0) {
                errors.push(`Contraintes non autorisées: ${invalidConstraints.join(', ')}`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

// Initialiser l'application
const recipeApp = new RecipeGenerator();

// Styles CSS pour les détails de recette
const additionalStyles = `
    .no-results {
        text-align: center;
        padding: 3rem;
        color: #718096;
    }
    
    .no-results h3 {
        margin-bottom: 1rem;
    }
    
    .ingredients-list {
        margin: 1rem 0;
        padding-left: 1.5rem;
    }
    
    .ingredients-list li {
        margin-bottom: 0.5rem;
    }
    
    .has-ingredient {
        color: #38a169;
    }
    
    .missing-ingredient {
        color: #e53e3e;
    }
    
    .missing-warning {
        background: #fed7d7;
        border: 1px solid #feb2b2;
        padding: 1rem;
        border-radius: 8px;
        margin: 1rem 0;
    }
    
    .missing-warning h4 {
        color: #c53030;
        margin-bottom: 0.5rem;
    }
    
    .instructions-list {
        margin: 1rem 0;
        padding-left: 1.5rem;
    }
    
    .instructions-list li {
        margin-bottom: 0.75rem;
        line-height: 1.5;
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);