/**
 * ♿ Accessibility Manager - Gestionnaire d'accessibilité WCAG 2.1 AA
 * Gestion complète de l'accessibilité : navigation clavier, lecteurs d'écran, focus, contrastes
 */

class AccessibilityManager {
    constructor() {
        this.focusableElements = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
            '[contenteditable="true"]'
        ].join(',');
        
        this.isHighContrast = false;
        this.reducedMotion = this.detectReducedMotion();
        this.skipLinksContainer = null;
        this.lastFocusedElement = null;
        
        this.init();
    }
    
    /**
     * Initialise le gestionnaire d'accessibilité
     */
    init() {
        this.setupSkipLinks();
        this.setupKeyboardNavigation();
        this.setupFocusManagement();
        this.setupARIALabels();
        this.setupContrastToggle();
        this.handleReducedMotion();
        this.setupModalAccessibility();
        this.setupFormAccessibility();
        
        console.log('♿ Gestionnaire d\'accessibilité initialisé (WCAG 2.1 AA)');
    }
    
    /**
     * Détecte si l'utilisateur préfère les animations réduites
     */
    detectReducedMotion() {
        try {
            return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Configure les liens d'évitement (skip links)
     */
    setupSkipLinks() {
        // Créer le conteneur des liens d'évitement
        this.skipLinksContainer = document.createElement('div');
        this.skipLinksContainer.className = 'skip-links';
        this.skipLinksContainer.setAttribute('aria-label', 'Liens d\'évitement');
        
        // Liens d'évitement principaux
        const skipLinks = [
            { href: '#main-content', text: 'Aller au contenu principal' },
            { href: '#navigation', text: 'Aller à la navigation' },
            { href: '#search', text: 'Aller à la recherche' },
            { href: '#footer', text: 'Aller au pied de page' }
        ];
        
        skipLinks.forEach(link => {
            const skipLink = document.createElement('a');
            skipLink.href = link.href;
            skipLink.textContent = link.text;
            skipLink.className = 'skip-link';
            
            // Vérifier si la cible existe
            skipLink.addEventListener('click', (e) => {
                const target = document.querySelector(link.href);
                if (target) {
                    target.focus();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                    e.preventDefault();
                }
            });
            
            this.skipLinksContainer.appendChild(skipLink);
        });
        
        // Insérer les skip links au début du body
        document.body.insertBefore(this.skipLinksContainer, document.body.firstChild);
    }
    
    /**
     * Configure la navigation au clavier
     */
    setupKeyboardNavigation() {
        // Navigation globale avec touches
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'Tab':
                    this.handleTabNavigation(e);
                    break;
                case 'Escape':
                    this.handleEscapeKey(e);
                    break;
                case 'Enter':
                case ' ':
                    this.handleActivation(e);
                    break;
                case 'ArrowDown':
                case 'ArrowUp':
                case 'ArrowLeft':
                case 'ArrowRight':
                    this.handleArrowNavigation(e);
                    break;
                case 'Home':
                case 'End':
                    this.handleHomeEndNavigation(e);
                    break;
            }
        });
        
        // Améliorer la visibilité du focus
        document.addEventListener('focusin', (e) => {
            this.enhanceFocusVisibility(e.target);
        });
        
        document.addEventListener('focusout', (e) => {
            this.removeFocusEnhancement(e.target);
        });
    }
    
    /**
     * Gère la navigation avec Tab
     */
    handleTabNavigation(e) {
        const focusableElements = Array.from(document.querySelectorAll(this.focusableElements));
        const currentIndex = focusableElements.indexOf(document.activeElement);
        
        // Si on est dans un modal, limiter la navigation à ce modal
        const modal = document.activeElement.closest('[role="dialog"]');
        if (modal) {
            const modalFocusable = Array.from(modal.querySelectorAll(this.focusableElements));
            const modalIndex = modalFocusable.indexOf(document.activeElement);
            
            if (e.shiftKey) {
                // Shift+Tab : élément précédent
                if (modalIndex <= 0) {
                    e.preventDefault();
                    modalFocusable[modalFocusable.length - 1].focus();
                }
            } else {
                // Tab : élément suivant
                if (modalIndex >= modalFocusable.length - 1) {
                    e.preventDefault();
                    modalFocusable[0].focus();
                }
            }
        }
    }
    
    /**
     * Gère la touche Escape
     */
    handleEscapeKey(e) {
        // Fermer les modales
        const modal = document.querySelector('[role="dialog"][aria-hidden="false"]');
        if (modal) {
            this.closeModal(modal);
            return;
        }
        
        // Fermer les menus déroulants
        const openMenu = document.querySelector('[aria-expanded="true"]');
        if (openMenu) {
            openMenu.setAttribute('aria-expanded', 'false');
            openMenu.focus();
            return;
        }
        
        // Retourner au contenu principal
        const mainContent = document.querySelector('#main-content, main, [role="main"]');
        if (mainContent) {
            mainContent.focus();
        }
    }
    
    /**
     * Gère l'activation avec Enter/Espace
     */
    handleActivation(e) {
        const target = e.target;
        
        // Éléments avec rôle de bouton
        if (target.getAttribute('role') === 'button' || 
            target.classList.contains('btn') ||
            target.hasAttribute('data-clickable')) {
            
            if (e.key === ' ') {
                e.preventDefault(); // Empêcher le scroll avec espace
            }
            
            target.click();
        }
        
        // Éléments avec rôle de lien
        if (target.getAttribute('role') === 'link' && target.hasAttribute('data-href')) {
            if (e.key === 'Enter') {
                window.location.href = target.getAttribute('data-href');
            }
        }
    }
    
    /**
     * Gère la navigation avec les flèches
     */
    handleArrowNavigation(e) {
        const target = e.target;
        
        // Navigation dans les menus
        if (target.closest('[role="menu"], [role="menubar"]')) {
            this.handleMenuNavigation(e);
            return;
        }
        
        // Navigation dans les tabpanels
        if (target.closest('[role="tablist"]')) {
            this.handleTablistNavigation(e);
            return;
        }
        
        // Navigation dans les grilles
        if (target.closest('[role="grid"]')) {
            this.handleGridNavigation(e);
            return;
        }
    }
    
    /**
     * Navigation dans les menus avec flèches
     */
    handleMenuNavigation(e) {
        const menu = e.target.closest('[role="menu"], [role="menubar"]');
        const menuItems = Array.from(menu.querySelectorAll('[role="menuitem"]'));
        const currentIndex = menuItems.indexOf(e.target);
        
        let nextIndex;
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                nextIndex = (currentIndex + 1) % menuItems.length;
                break;
            case 'ArrowUp':
                e.preventDefault();
                nextIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1;
                break;
            case 'Home':
                e.preventDefault();
                nextIndex = 0;
                break;
            case 'End':
                e.preventDefault();
                nextIndex = menuItems.length - 1;
                break;
            default:
                return;
        }
        
        if (nextIndex !== undefined) {
            menuItems[nextIndex].focus();
        }
    }
    
    /**
     * Navigation dans les tablist avec flèches
     */
    handleTablistNavigation(e) {
        const tablist = e.target.closest('[role="tablist"]');
        const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
        const currentIndex = tabs.indexOf(e.target);
        
        let nextIndex;
        
        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
                break;
            case 'ArrowRight':
                e.preventDefault();
                nextIndex = (currentIndex + 1) % tabs.length;
                break;
            case 'Home':
                e.preventDefault();
                nextIndex = 0;
                break;
            case 'End':
                e.preventDefault();
                nextIndex = tabs.length - 1;
                break;
            default:
                return;
        }
        
        if (nextIndex !== undefined) {
            // Activer le nouvel onglet
            tabs.forEach(tab => tab.setAttribute('aria-selected', 'false'));
            tabs[nextIndex].setAttribute('aria-selected', 'true');
            tabs[nextIndex].focus();
            
            // Afficher le panneau correspondant
            const panelId = tabs[nextIndex].getAttribute('aria-controls');
            if (panelId) {
                const panel = document.getElementById(panelId);
                if (panel) {
                    document.querySelectorAll('[role="tabpanel"]').forEach(p => p.hidden = true);
                    panel.hidden = false;
                }
            }
        }
    }
    
    /**
     * Améliore la visibilité du focus
     */
    enhanceFocusVisibility(element) {
        // Ajouter une classe pour le focus visible
        element.classList.add('focus-visible');
        
        // Annoncer aux lecteurs d'écran si nécessaire
        const ariaLabel = element.getAttribute('aria-label') || 
                         element.getAttribute('aria-labelledby') ||
                         element.textContent?.trim();
        
        if (ariaLabel && element.getAttribute('role')) {
            this.announceToScreenReader(`Focus sur ${ariaLabel}, ${element.getAttribute('role')}`);
        }
    }
    
    /**
     * Supprime l'amélioration du focus
     */
    removeFocusEnhancement(element) {
        element.classList.remove('focus-visible');
    }
    
    /**
     * Configure les étiquettes ARIA et les relations
     */
    setupARIALabels() {
        // Auto-labelling pour les éléments sans étiquettes
        document.querySelectorAll('button, input, select, textarea').forEach(element => {
            if (!element.getAttribute('aria-label') && 
                !element.getAttribute('aria-labelledby') &&
                !element.getAttribute('title')) {
                
                // Chercher un label associé
                const label = document.querySelector(`label[for="${element.id}"]`);
                if (label) {
                    element.setAttribute('aria-labelledby', element.id + '-label');
                    label.id = element.id + '-label';
                } else {
                    // Utiliser le texte du bouton ou placeholder
                    const text = element.textContent?.trim() || 
                                element.placeholder ||
                                element.value ||
                                'Élément interactif';
                    element.setAttribute('aria-label', text);
                }
            }
        });
        
        // Identifier les régions principales
        const main = document.querySelector('main') || document.querySelector('#main-content');
        if (main && !main.getAttribute('role')) {
            main.setAttribute('role', 'main');
            main.setAttribute('aria-label', 'Contenu principal');
        }
        
        const nav = document.querySelector('nav');
        if (nav && !nav.getAttribute('aria-label')) {
            nav.setAttribute('aria-label', 'Navigation principale');
        }
        
        // Améliorer les listes
        document.querySelectorAll('ul, ol').forEach(list => {
            if (!list.closest('nav') && list.children.length > 0) {
                if (!list.getAttribute('aria-label')) {
                    list.setAttribute('aria-label', `Liste de ${list.children.length} éléments`);
                }
            }
        });
        
        // Gérer les états des éléments interactifs
        document.querySelectorAll('[data-state]').forEach(element => {
            const state = element.getAttribute('data-state');
            if (state === 'loading') {
                element.setAttribute('aria-busy', 'true');
                element.setAttribute('aria-live', 'polite');
            } else if (state === 'error') {
                element.setAttribute('aria-invalid', 'true');
            }
        });
    }
    
    /**
     * Configure le contraste élevé
     */
    setupContrastToggle() {
        // Créer le bouton de contraste élevé
        const contrastToggle = document.createElement('button');
        contrastToggle.id = 'contrast-toggle';
        contrastToggle.className = 'contrast-toggle';
        contrastToggle.setAttribute('aria-label', 'Basculer le contraste élevé');
        contrastToggle.setAttribute('title', 'Contraste élevé');
        contrastToggle.textContent = '🔳';
        
        contrastToggle.addEventListener('click', () => this.toggleHighContrast());
        
        // Ajouter le bouton près du toggle de thème
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle && themeToggle.parentNode) {
            themeToggle.parentNode.insertBefore(contrastToggle, themeToggle.nextSibling);
        } else {
            document.body.appendChild(contrastToggle);
        }
        
        // Détecter les préférences de contraste système
        try {
            const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
            if (highContrastQuery.matches) {
                this.toggleHighContrast(true);
            }
            
            highContrastQuery.addEventListener('change', (e) => {
                if (e.matches) {
                    this.toggleHighContrast(true);
                }
            });
        } catch (error) {
            // Préférences de contraste non supportées
        }
    }
    
    /**
     * Bascule le mode contraste élevé
     */
    toggleHighContrast(force = null) {
        this.isHighContrast = force !== null ? force : !this.isHighContrast;
        
        const html = document.documentElement;
        
        if (this.isHighContrast) {
            html.classList.add('high-contrast');
            this.announceToScreenReader('Contraste élevé activé');
        } else {
            html.classList.remove('high-contrast');
            this.announceToScreenReader('Contraste élevé désactivé');
        }
        
        // Sauvegarder la préférence
        try {
            localStorage.setItem('highContrast', this.isHighContrast.toString());
        } catch (error) {
            // localStorage non disponible
        }
        
        // Mettre à jour le bouton
        const toggle = document.getElementById('contrast-toggle');
        if (toggle) {
            toggle.setAttribute('aria-pressed', this.isHighContrast.toString());
            toggle.textContent = this.isHighContrast ? '🔲' : '🔳';
            toggle.setAttribute('title', 
                this.isHighContrast ? 'Désactiver le contraste élevé' : 'Activer le contraste élevé'
            );
        }
    }
    
    /**
     * Gère les animations réduites
     */
    handleReducedMotion() {
        if (this.reducedMotion) {
            document.documentElement.classList.add('reduce-motion');
            console.log('♿ Animations réduites activées selon les préférences utilisateur');
        }
        
        // Écouter les changements de préférence
        try {
            const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            motionQuery.addEventListener('change', (e) => {
                this.reducedMotion = e.matches;
                if (e.matches) {
                    document.documentElement.classList.add('reduce-motion');
                } else {
                    document.documentElement.classList.remove('reduce-motion');
                }
            });
        } catch (error) {
            // MediaQuery non supporté
        }
    }
    
    /**
     * Configure l'accessibilité des modales
     */
    setupModalAccessibility() {
        // Surveiller l'ouverture/fermeture des modales
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && 
                    mutation.attributeName === 'aria-hidden') {
                    
                    const modal = mutation.target;
                    if (modal.getAttribute('role') === 'dialog') {
                        if (modal.getAttribute('aria-hidden') === 'false') {
                            this.handleModalOpen(modal);
                        } else {
                            this.handleModalClose(modal);
                        }
                    }
                }
            });
        });
        
        observer.observe(document.body, {
            attributes: true,
            subtree: true,
            attributeFilter: ['aria-hidden']
        });
    }
    
    /**
     * Gère l'ouverture d'une modale
     */
    handleModalOpen(modal) {
        // Sauvegarder l'élément focusé
        this.lastFocusedElement = document.activeElement;
        
        // Focuser le premier élément focusable de la modale
        const firstfocusable = modal.querySelector(this.focusableElements);
        if (firstFocusable) {
            setTimeout(() => firstFocusable.focus(), 100);
        }
        
        // Ajouter inert aux autres éléments
        document.querySelectorAll('body > *').forEach(element => {
            if (element !== modal && !element.contains(modal)) {
                element.setAttribute('inert', '');
                element.setAttribute('aria-hidden', 'true');
            }
        });
        
        // Annoncer aux lecteurs d'écran
        const modalTitle = modal.getAttribute('aria-labelledby');
        if (modalTitle) {
            const title = document.getElementById(modalTitle);
            if (title) {
                this.announceToScreenReader(`Modal ouverte : ${title.textContent}`);
            }
        }
    }
    
    /**
     * Gère la fermeture d'une modale
     */
    handleModalClose(modal) {
        // Supprimer inert des autres éléments
        document.querySelectorAll('[inert]').forEach(element => {
            element.removeAttribute('inert');
            element.removeAttribute('aria-hidden');
        });
        
        // Restaurer le focus
        if (this.lastFocusedElement) {
            this.lastFocusedElement.focus();
            this.lastFocusedElement = null;
        }
        
        this.announceToScreenReader('Modal fermée');
    }
    
    /**
     * Ferme une modale
     */
    closeModal(modal) {
        modal.setAttribute('aria-hidden', 'true');
        
        // Déclencher l'événement de fermeture si nécessaire
        const closeButton = modal.querySelector('[data-dismiss="modal"], .modal-close');
        if (closeButton) {
            closeButton.click();
        }
    }
    
    /**
     * Configure l'accessibilité des formulaires
     */
    setupFormAccessibility() {
        // Améliorer les messages d'erreur
        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('invalid', (e) => {
                const field = e.target;
                
                // Créer ou mettre à jour le message d'erreur
                let errorMessage = field.nextElementSibling;
                if (!errorMessage || !errorMessage.classList.contains('error-message')) {
                    errorMessage = document.createElement('div');
                    errorMessage.className = 'error-message';
                    errorMessage.setAttribute('role', 'alert');
                    errorMessage.setAttribute('aria-live', 'polite');
                    field.parentNode.insertBefore(errorMessage, field.nextSibling);
                }
                
                // Message personnalisé selon le type de validation
                const validity = field.validity;
                let message = '';
                
                if (validity.valueMissing) {
                    message = 'Ce champ est requis';
                } else if (validity.typeMismatch) {
                    message = 'Le format de ce champ n\'est pas valide';
                } else if (validity.patternMismatch) {
                    message = 'Ce champ ne respecte pas le format attendu';
                } else if (validity.tooShort) {
                    message = `Ce champ doit contenir au moins ${field.minLength} caractères`;
                } else if (validity.tooLong) {
                    message = `Ce champ ne peut pas dépasser ${field.maxLength} caractères`;
                } else {
                    message = field.validationMessage;
                }
                
                errorMessage.textContent = message;
                errorMessage.id = field.id + '-error';
                field.setAttribute('aria-describedby', errorMessage.id);
                field.setAttribute('aria-invalid', 'true');
                
                // Annoncer l'erreur
                this.announceToScreenReader(`Erreur : ${message}`);
            });
            
            // Nettoyer les erreurs quand le champ devient valide
            form.addEventListener('input', (e) => {
                const field = e.target;
                if (field.validity.valid) {
                    field.removeAttribute('aria-invalid');
                    const errorMessage = document.getElementById(field.id + '-error');
                    if (errorMessage) {
                        errorMessage.remove();
                    }
                }
            });
        });
        
        // Améliorer les groupes de champs
        document.querySelectorAll('fieldset').forEach(fieldset => {
            if (!fieldset.getAttribute('aria-labelledby')) {
                const legend = fieldset.querySelector('legend');
                if (legend) {
                    legend.id = legend.id || `legend-${Math.random().toString(36).substr(2, 9)}`;
                    fieldset.setAttribute('aria-labelledby', legend.id);
                }
            }
        });
    }
    
    /**
     * Annonce un message aux lecteurs d'écran
     */
    announceToScreenReader(message, priority = 'polite') {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', priority);
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        // Supprimer après annonce
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }
    
    /**
     * Vérifie le contraste des couleurs
     */
    checkColorContrast() {
        // Cette méthode pourrait être étendue pour vérifier automatiquement
        // les ratios de contraste et alerter sur les problèmes
        console.log('♿ Vérification du contraste des couleurs - À implémenter');
    }
    
    /**
     * Configure les raccourcis clavier globaux
     */
    setupGlobalShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Alt + 1-9 pour la navigation rapide
            if (e.altKey && e.key >= '1' && e.key <= '9') {
                e.preventDefault();
                const shortcutNumber = parseInt(e.key);
                this.executeShortcut(shortcutNumber);
            }
            
            // Ctrl + / pour l'aide
            if (e.ctrlKey && e.key === '/') {
                e.preventDefault();
                this.showAccessibilityHelp();
            }
        });
    }
    
    /**
     * Exécute un raccourci numéroté
     */
    executeShortcut(number) {
        const shortcuts = [
            () => this.focusMain(),
            () => this.focusNavigation(),
            () => this.focusSearch(),
            () => this.toggleTheme(),
            () => this.toggleHighContrast(),
            () => this.showAccessibilityHelp()
        ];
        
        if (shortcuts[number - 1]) {
            shortcuts[number - 1]();
        }
    }
    
    /**
     * Focus sur le contenu principal
     */
    focusMain() {
        const main = document.querySelector('#main-content, main, [role="main"]');
        if (main) {
            main.focus();
            this.announceToScreenReader('Focus sur le contenu principal');
        }
    }
    
    /**
     * Focus sur la navigation
     */
    focusNavigation() {
        const nav = document.querySelector('nav, [role="navigation"]');
        if (nav) {
            const firstLink = nav.querySelector('a, button');
            if (firstLink) {
                firstLink.focus();
                this.announceToScreenReader('Focus sur la navigation');
            }
        }
    }
    
    /**
     * Focus sur la recherche
     */
    focusSearch() {
        const search = document.querySelector('#search, [role="search"] input, input[type="search"]');
        if (search) {
            search.focus();
            this.announceToScreenReader('Focus sur la recherche');
        }
    }
    
    /**
     * Bascule le thème (si disponible)
     */
    toggleTheme() {
        if (window.themeManager) {
            window.themeManager.toggleTheme();
        }
    }
    
    /**
     * Affiche l'aide d'accessibilité
     */
    showAccessibilityHelp() {
        const help = `
        Raccourcis d'accessibilité disponibles :
        
        • Tab / Shift+Tab : Navigation entre les éléments
        • Échap : Fermer les modales/menus ou retourner au contenu
        • Entrée/Espace : Activer les boutons et liens
        • Flèches : Navigation dans les menus et onglets
        • Alt + 1 : Aller au contenu principal
        • Alt + 2 : Aller à la navigation
        • Alt + 3 : Aller à la recherche
        • Alt + 4 : Changer le thème
        • Alt + 5 : Basculer le contraste élevé
        • Ctrl + / : Afficher cette aide
        `;
        
        this.announceToScreenReader(help, 'assertive');
        alert(help); // Pour affichage immédiat
    }
    
    /**
     * Initialise l'accessibilité lors du chargement d'une nouvelle page
     */
    refresh() {
        this.setupARIALabels();
        this.setupFormAccessibility();
        console.log('♿ Accessibilité actualisée pour le nouveau contenu');
    }
}

// Initialisation automatique
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.accessibilityManager = new AccessibilityManager();
    });
} else {
    window.accessibilityManager = new AccessibilityManager();
}

// Export pour utilisation en module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AccessibilityManager;
}