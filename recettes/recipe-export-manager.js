/**
 * RecipeExportManager - Gestionnaire d'export PDF et galerie mobile pour les recettes
 * Fournit des fonctionnalités d'export client-side pour les recettes générées
 */
class RecipeExportManager {
    constructor() {
        this.jsPDF = null;
        this.html2canvas = null;
        this.initLibraries();
        this.setupEventListeners();
    }

    /**
     * Initialise les bibliothèques externes
     */
    async initLibraries() {
        try {
            // Attendre que les bibliothèques soient chargées
            await this.waitForLibraries();
            
            this.jsPDF = window.jspdf?.jsPDF || window.jsPDF;
            this.html2canvas = window.html2canvas;

            if (!this.jsPDF) {
                throw new Error('jsPDF non disponible');
            }
            if (!this.html2canvas) {
                throw new Error('html2canvas non disponible');
            }

            console.log('📄 Bibliothèques d\'export initialisées avec succès');
        } catch (error) {
            console.error('❌ Erreur initialisation bibliothèques export:', error);
        }
    }

    /**
     * Attend que les bibliothèques soient disponibles
     */
    waitForLibraries() {
        return new Promise((resolve) => {
            const checkLibraries = () => {
                if ((window.jspdf?.jsPDF || window.jsPDF) && window.html2canvas) {
                    resolve();
                } else {
                    setTimeout(checkLibraries, 100);
                }
            };
            checkLibraries();
        });
    }

    /**
     * Configure les écouteurs d'événements
     */
    setupEventListeners() {
        // Écouter les clics sur les boutons d'export qui seront ajoutés dynamiquement
        document.addEventListener('click', (event) => {
            if (event.target.matches('#export-recipe-pdf')) {
                this.exportRecipeToPDF();
            } else if (event.target.matches('#save-recipe-gallery')) {
                this.saveRecipeToGallery();
            } else if (event.target.matches('#export-recipe-history')) {
                this.exportRecipeHistory();
            }
        });
    }

    /**
     * Ajoute les boutons d'export à une recette affichée
     */
    addExportButtons(container) {
        const exportButtonsHtml = `
            <div class="recipe-export-actions" style="margin-top: 2rem; padding-top: 1.5rem; border-top: 2px solid var(--border-light);">
                <h4 style="margin-bottom: 1rem; color: var(--text-secondary);">📤 Exporter cette recette</h4>
                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <button id="export-recipe-pdf" class="btn btn-primary" aria-describedby="export-recipe-pdf-desc">
                        📄 PDF de la recette
                        <span id="export-recipe-pdf-desc" class="sr-only">Télécharger la recette au format PDF</span>
                    </button>
                    <button id="save-recipe-gallery" class="btn btn-secondary" aria-describedby="save-recipe-gallery-desc">
                        📱 Sauver en galerie
                        <span id="save-recipe-gallery-desc" class="sr-only">Sauvegarder la recette dans la galerie mobile</span>
                    </button>
                    <button id="export-recipe-history" class="btn btn-outline" aria-describedby="export-recipe-history-desc">
                        📚 Historique PDF
                        <span id="export-recipe-history-desc" class="sr-only">Exporter l'historique des recettes générées</span>
                    </button>
                </div>
            </div>
        `;

        // Insérer les boutons à la fin du contenu de la recette
        if (container) {
            container.insertAdjacentHTML('beforeend', exportButtonsHtml);
        }
    }

    /**
     * Exporte la recette actuelle en PDF
     */
    async exportRecipeToPDF() {
        if (!this.jsPDF || !this.html2canvas) {
            this.showToast('❌ Bibliothèques d\'export non disponibles', 'error');
            return;
        }

        const button = document.getElementById('export-recipe-pdf');
        this.setButtonLoading(button, true);

        try {
            const recipe = this.getCurrentRecipe();
            if (!recipe) {
                throw new Error('Aucune recette à exporter');
            }

            // Créer un conteneur d'export temporaire
            const exportContainer = await this.createRecipeExportContainer(recipe);
            
            // Capturer le contenu en image
            const canvas = await this.html2canvas(exportContainer, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: true,
                allowTaint: true,
                scrollX: 0,
                scrollY: 0
            });

            // Nettoyer le conteneur temporaire
            document.body.removeChild(exportContainer);

            // Créer le PDF
            const imgData = canvas.toDataURL('image/png');
            const pdf = new this.jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // Calculer les dimensions pour ajuster l'image
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgAspectRatio = canvas.width / canvas.height;
            const pdfAspectRatio = pdfWidth / pdfHeight;

            let imgWidth = pdfWidth - 20; // Marges de 10mm de chaque côté
            let imgHeight = imgWidth / imgAspectRatio;

            // Si l'image est trop haute, ajuster
            if (imgHeight > pdfHeight - 20) {
                imgHeight = pdfHeight - 20;
                imgWidth = imgHeight * imgAspectRatio;
            }

            // Centrer l'image
            const x = (pdfWidth - imgWidth) / 2;
            const y = (pdfHeight - imgHeight) / 2;

            pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);

            // Générer le nom de fichier
            const timestamp = new Date().toISOString().slice(0, 10);
            const recipeName = recipe.nom || 'recette';
            const fileName = `${recipeName.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.pdf`;

            // Télécharger le PDF
            pdf.save(fileName);

            this.showToast('✅ Recette exportée en PDF !', 'success');
            this.saveToRecipeHistory(recipe, 'pdf_export');

        } catch (error) {
            console.error('❌ Erreur export PDF:', error);
            this.showToast(`❌ Erreur lors de l'export: ${error.message}`, 'error');
        } finally {
            this.setButtonLoading(button, false);
        }
    }

    /**
     * Sauvegarde la recette dans la galerie mobile
     */
    async saveRecipeToGallery() {
        if (!this.html2canvas) {
            this.showToast('❌ Fonctionnalité non disponible', 'error');
            return;
        }

        const button = document.getElementById('save-recipe-gallery');
        this.setButtonLoading(button, true);

        try {
            const recipe = this.getCurrentRecipe();
            if (!recipe) {
                throw new Error('Aucune recette à sauvegarder');
            }

            // Créer un conteneur d'export temporaire optimisé pour mobile
            const exportContainer = await this.createRecipeExportContainer(recipe, true);
            
            // Capturer en image haute qualité
            const canvas = await this.html2canvas(exportContainer, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: true,
                allowTaint: true,
                scrollX: 0,
                scrollY: 0
            });

            // Nettoyer le conteneur temporaire
            document.body.removeChild(exportContainer);

            // Convertir en blob
            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/png', 0.95);
            });

            const recipeName = recipe.nom || 'recette';
            const timestamp = new Date().toISOString().slice(0, 10);
            const fileName = `${recipeName}_${timestamp}.png`;

            // Essayer d'utiliser l'API Web Share (mobile)
            if (navigator.share && navigator.canShare) {
                const file = new File([blob], fileName, { type: 'image/png' });
                
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: `Recette: ${recipeName}`,
                        text: `Recette générée par Mes Recettes`
                    });
                    
                    this.showToast('✅ Recette partagée !', 'success');
                    this.saveToRecipeHistory(recipe, 'gallery_save');
                    return;
                }
            }

            // Fallback: téléchargement direct
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showToast('✅ Recette sauvegardée !', 'success');
            this.saveToRecipeHistory(recipe, 'gallery_save');

        } catch (error) {
            console.error('❌ Erreur sauvegarde galerie:', error);
            this.showToast(`❌ Erreur: ${error.message}`, 'error');
        } finally {
            this.setButtonLoading(button, false);
        }
    }

    /**
     * Exporte l'historique des recettes en PDF
     */
    async exportRecipeHistory() {
        if (!this.jsPDF) {
            this.showToast('❌ Fonctionnalité non disponible', 'error');
            return;
        }

        const button = document.getElementById('export-recipe-history');
        this.setButtonLoading(button, true);

        try {
            const history = this.getRecipeHistory();
            if (!history || history.length === 0) {
                throw new Error('Aucun historique de recettes disponible');
            }

            const pdf = new this.jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // Page de titre
            pdf.setFontSize(24);
            pdf.text('Mes Recettes - Historique', 20, 30);
            
            pdf.setFontSize(12);
            pdf.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')}`, 20, 45);
            pdf.text(`${history.length} recette(s) dans l'historique`, 20, 55);

            let yPos = 75;
            
            // Parcourir l'historique
            history.slice(0, 20).forEach((entry, index) => { // Limiter à 20 recettes
                if (yPos > 250) {
                    pdf.addPage();
                    yPos = 30;
                }

                pdf.setFontSize(16);
                pdf.text(`${index + 1}. ${entry.recipe?.nom || 'Recette sans nom'}`, 20, yPos);
                yPos += 10;

                pdf.setFontSize(10);
                if (entry.timestamp) {
                    pdf.text(`Générée le: ${new Date(entry.timestamp).toLocaleDateString('fr-FR')}`, 25, yPos);
                    yPos += 5;
                }

                if (entry.recipe?.description) {
                    const description = entry.recipe.description.slice(0, 100) + '...';
                    pdf.text(`Description: ${description}`, 25, yPos);
                    yPos += 5;
                }

                if (entry.ingredients && entry.ingredients.length > 0) {
                    pdf.text(`Ingrédients: ${entry.ingredients.slice(0, 5).join(', ')}`, 25, yPos);
                    yPos += 5;
                }

                yPos += 5; // Espacement entre les recettes
            });

            const timestamp = new Date().toISOString().slice(0, 10);
            const fileName = `historique_recettes_${timestamp}.pdf`;
            
            pdf.save(fileName);
            this.showToast('✅ Historique exporté en PDF !', 'success');

        } catch (error) {
            console.error('❌ Erreur export historique:', error);
            this.showToast(`❌ Erreur: ${error.message}`, 'error');
        } finally {
            this.setButtonLoading(button, false);
        }
    }

    /**
     * Crée un conteneur temporaire pour l'export de recette
     */
    async createRecipeExportContainer(recipe, mobileOptimized = false) {
        const container = document.createElement('div');
        container.className = 'recipe-export-container';
        
        const maxWidth = mobileOptimized ? '375px' : '800px';
        
        container.style.cssText = `
            position: absolute;
            top: -10000px;
            left: -10000px;
            width: ${maxWidth};
            background: white;
            padding: 30px;
            border-radius: 12px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #2d3748;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;

        const timestamp = new Date().toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        container.innerHTML = `
            <div class="export-header" style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px;">
                <h1 style="color: #1a202c; margin: 0 0 10px 0; font-size: ${mobileOptimized ? '20px' : '28px'};">${recipe.nom || 'Recette personnalisée'}</h1>
                <p style="color: #718096; margin: 5px 0; font-size: ${mobileOptimized ? '12px' : '14px'};">Générée par Mes Recettes</p>
                <p style="color: #a0aec0; margin: 0; font-size: ${mobileOptimized ? '10px' : '12px'};">Exportée le ${timestamp}</p>
            </div>

            ${recipe.description ? `
                <div class="export-description" style="margin-bottom: 25px; padding: 15px; background: #f7fafc; border-radius: 8px;">
                    <p style="margin: 0; font-style: italic; color: #4a5568; font-size: ${mobileOptimized ? '13px' : '16px'};">${recipe.description}</p>
                </div>
            ` : ''}

            <div class="export-meta" style="display: grid; grid-template-columns: repeat(${mobileOptimized ? '2' : '4'}, 1fr); gap: 15px; margin-bottom: 30px;">
                <div style="text-align: center; padding: 10px; background: #edf2f7; border-radius: 6px;">
                    <div style="font-weight: 600; color: #2d3748; font-size: ${mobileOptimized ? '12px' : '14px'};">⏱️ Préparation</div>
                    <div style="color: #718096; font-size: ${mobileOptimized ? '11px' : '12px'};">${recipe.temps_preparation || 'N/A'}</div>
                </div>
                <div style="text-align: center; padding: 10px; background: #edf2f7; border-radius: 6px;">
                    <div style="font-weight: 600; color: #2d3748; font-size: ${mobileOptimized ? '12px' : '14px'};">🔥 Cuisson</div>
                    <div style="color: #718096; font-size: ${mobileOptimized ? '11px' : '12px'};">${recipe.temps_cuisson || 'N/A'}</div>
                </div>
                <div style="text-align: center; padding: 10px; background: #edf2f7; border-radius: 6px;">
                    <div style="font-weight: 600; color: #2d3748; font-size: ${mobileOptimized ? '12px' : '14px'};">👥 Portions</div>
                    <div style="color: #718096; font-size: ${mobileOptimized ? '11px' : '12px'};">${recipe.portions || '4'}</div>
                </div>
                <div style="text-align: center; padding: 10px; background: #edf2f7; border-radius: 6px;">
                    <div style="font-weight: 600; color: #2d3748; font-size: ${mobileOptimized ? '12px' : '14px'};">📊 Difficulté</div>
                    <div style="color: #718096; font-size: ${mobileOptimized ? '11px' : '12px'};">${recipe.difficulte || 'Facile'}</div>
                </div>
            </div>

            <div class="export-content" style="display: grid; grid-template-columns: ${mobileOptimized ? '1fr' : '1fr 1fr'}; gap: 30px;">
                <div class="export-ingredients">
                    <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: ${mobileOptimized ? '16px' : '20px'}; border-bottom: 2px solid #4299e1; padding-bottom: 5px;">🥘 Ingrédients</h3>
                    <ul style="margin: 0; padding: 0; list-style: none;">
                        ${(recipe.ingredients || []).map(ing => `
                            <li style="margin: 8px 0; padding: 8px 12px; background: #f7fafc; border-left: 3px solid #4299e1; border-radius: 0 4px 4px 0; font-size: ${mobileOptimized ? '12px' : '14px'};">
                                ${typeof ing === 'string' ? ing : `${ing.quantite || ''} ${ing.unite || ''} ${ing.nom || ing}`}
                            </li>
                        `).join('')}
                    </ul>
                </div>

                <div class="export-instructions">
                    <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: ${mobileOptimized ? '16px' : '20px'}; border-bottom: 2px solid #48bb78; padding-bottom: 5px;">👨‍🍳 Instructions</h3>
                    <ol style="margin: 0; padding: 0 0 0 20px;">
                        ${(recipe.etapes || []).map((etape, index) => `
                            <li style="margin: 10px 0; padding: 10px; background: #f0fff4; border-radius: 6px; border-left: 3px solid #48bb78; font-size: ${mobileOptimized ? '12px' : '14px'};">
                                ${etape}
                            </li>
                        `).join('')}
                    </ol>
                </div>
            </div>

            ${recipe.conseils && recipe.conseils.length > 0 ? `
                <div class="export-tips" style="margin-top: 25px; padding: 15px; background: #fffaf0; border-radius: 8px; border-left: 4px solid #ed8936;">
                    <h3 style="color: #2d3748; margin: 0 0 10px 0; font-size: ${mobileOptimized ? '14px' : '18px'};">💡 Conseils</h3>
                    <ul style="margin: 0; padding: 0 0 0 20px;">
                        ${recipe.conseils.map(conseil => `
                            <li style="margin: 5px 0; color: #744210; font-size: ${mobileOptimized ? '11px' : '13px'};">${conseil}</li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}

            <div class="export-footer" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #a0aec0; font-size: ${mobileOptimized ? '10px' : '12px'};">
                <p style="margin: 0;">Recette générée par intelligence artificielle - Mes Recettes</p>
                <p style="margin: 5px 0 0 0;">Fun Lean IT Performance © 2025</p>
            </div>
        `;

        document.body.appendChild(container);
        return container;
    }

    /**
     * Récupère la recette actuellement affichée
     */
    getCurrentRecipe() {
        try {
            // Rechercher la recette dans le DOM
            const recipeContainer = document.querySelector('.ai-recipe-result .recipe-card.ai-recipe');
            if (!recipeContainer) {
                return null;
            }

            const recipe = {
                nom: recipeContainer.querySelector('.recipe-header h2')?.textContent || 'Recette sans nom',
                description: recipeContainer.querySelector('.recipe-description')?.textContent || '',
                temps_preparation: recipeContainer.querySelector('.meta-item:nth-child(1) .meta-value')?.textContent || 'N/A',
                temps_cuisson: recipeContainer.querySelector('.meta-item:nth-child(2) .meta-value')?.textContent || 'N/A',
                portions: recipeContainer.querySelector('.meta-item:nth-child(3) .meta-value')?.textContent || '4',
                difficulte: recipeContainer.querySelector('.meta-item:nth-child(4) .meta-value')?.textContent || 'Facile',
                ingredients: [],
                etapes: [],
                conseils: []
            };

            // Extraire les ingrédients
            const ingredientItems = recipeContainer.querySelectorAll('.ingredients-list li');
            recipe.ingredients = Array.from(ingredientItems).map(item => item.textContent.trim());

            // Extraire les étapes
            const stepItems = recipeContainer.querySelectorAll('.instructions-list li');
            recipe.etapes = Array.from(stepItems).map(item => item.textContent.trim());

            // Extraire les conseils
            const tipItems = recipeContainer.querySelectorAll('.tips-list li');
            recipe.conseils = Array.from(tipItems).map(item => item.textContent.trim());

            return recipe;
        } catch (error) {
            console.error('❌ Erreur récupération recette:', error);
            return null;
        }
    }

    /**
     * Sauvegarde une recette dans l'historique
     */
    saveToRecipeHistory(recipe, actionType) {
        try {
            const history = JSON.parse(localStorage.getItem('recettes_history') || '[]');
            
            const entry = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                recipe: recipe,
                action: actionType,
                ingredients: window.recipeApp ? window.recipeApp.ingredients : []
            };

            history.push(entry);
            
            // Garder seulement les 100 dernières entrées
            if (history.length > 100) {
                history.splice(0, history.length - 100);
            }

            localStorage.setItem('recettes_history', JSON.stringify(history));
            console.log('📚 Recette sauvegardée dans l\'historique');
            
        } catch (error) {
            console.error('❌ Erreur sauvegarde historique:', error);
        }
    }

    /**
     * Récupère l'historique des recettes
     */
    getRecipeHistory() {
        try {
            return JSON.parse(localStorage.getItem('recettes_history') || '[]');
        } catch (error) {
            console.error('❌ Erreur lecture historique:', error);
            return [];
        }
    }

    /**
     * Gère l'état de chargement d'un bouton
     */
    setButtonLoading(button, isLoading) {
        if (!button) return;

        if (isLoading) {
            button.disabled = true;
            button.classList.add('loading');
            const spinner = document.createElement('span');
            spinner.className = 'loading-spinner';
            button.insertBefore(spinner, button.firstChild);
            button.style.pointerEvents = 'none';
        } else {
            button.disabled = false;
            button.classList.remove('loading');
            const spinner = button.querySelector('.loading-spinner');
            if (spinner) {
                spinner.remove();
            }
            button.style.pointerEvents = 'auto';
        }
    }

    /**
     * Affiche une notification toast
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const colors = {
            success: '#48bb78',
            error: '#e53e3e',
            info: '#3182ce'
        };

        toast.style.cssText = `
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
            font-weight: 500;
        `;

        toast.textContent = message;
        document.body.appendChild(toast);

        // Animation d'entrée
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);

        // Animation de sortie
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 4000);
    }
}

// Initialiser le gestionnaire d'export dès que possible
window.recipeExportManager = new RecipeExportManager();

// Exposer globalement pour faciliter l'intégration
window.RecipeExportManager = RecipeExportManager;