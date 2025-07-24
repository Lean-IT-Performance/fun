/**
 * 🌙 Theme Manager - Gestionnaire de thème sombre/clair
 * Permet le basculement manuel et la sauvegarde des préférences
 */

class ThemeManager {
    constructor() {
        this.themes = {
            LIGHT: 'light',
            DARK: 'dark'
        };
        
        this.currentTheme = this.getStoredTheme();
        this.init();
    }
    
    /**
     * Initialise le gestionnaire de thème
     */
    init() {
        this.applyTheme(this.currentTheme);
        this.createThemeToggle();
        this.setupMediaQueryListener();
    }
    
    /**
     * Récupère le thème stocké ou détecte automatiquement
     */
    getStoredTheme() {
        try {
            const stored = localStorage.getItem('theme');
            if (stored && (stored === this.themes.LIGHT || stored === this.themes.DARK)) {
                return stored;
            }
            // Auto-détection selon les préférences système
            return window.matchMedia('(prefers-color-scheme: dark)').matches 
                ? this.themes.DARK 
                : this.themes.LIGHT;
        } catch (error) {
            console.warn('ThemeManager: Impossible de lire localStorage, utilisation de la détection automatique');
            return window.matchMedia('(prefers-color-scheme: dark)').matches 
                ? this.themes.DARK 
                : this.themes.LIGHT;
        }
    }
    
    /**
     * Sauvegarde le thème sélectionné
     */
    setStoredTheme(theme) {
        try {
            localStorage.setItem('theme', theme);
        } catch (error) {
            console.warn('ThemeManager: Impossible de sauvegarder dans localStorage');
        }
    }
    
    /**
     * Applique le thème sélectionné
     */
    applyTheme(theme) {
        const html = document.documentElement;
        
        // Nettoie les classes existantes
        html.classList.remove('theme-light', 'theme-dark');
        
        switch (theme) {
            case this.themes.LIGHT:
                html.classList.add('theme-light');
                html.style.colorScheme = 'light';
                break;
            case this.themes.DARK:
                html.classList.add('theme-dark');
                html.style.colorScheme = 'dark';
                break;
            default:
                // Par défaut, utilise le mode clair
                html.classList.add('theme-light');
                html.style.colorScheme = 'light';
                break;
        }
        
        this.currentTheme = theme;
        this.updateToggleButton();
    }
    
    /**
     * Crée le bouton de basculement du thème
     */
    createThemeToggle() {
        // Vérifier si le bouton existe déjà
        if (document.getElementById('theme-toggle')) {
            return;
        }
        
        const toggle = document.createElement('button');
        toggle.id = 'theme-toggle';
        toggle.className = 'theme-toggle';
        toggle.setAttribute('aria-label', 'Basculer le thème');
        toggle.setAttribute('title', 'Changer le thème');
        
        toggle.addEventListener('click', () => this.toggleTheme());
        
        // Ajouter le bouton au header ou au body
        const header = document.querySelector('.header') || document.querySelector('header');
        if (header) {
            const container = header.querySelector('.container');
            if (container) {
                container.appendChild(toggle);
            } else {
                header.appendChild(toggle);
            }
        } else {
            document.body.appendChild(toggle);
        }
        
        this.updateToggleButton();
    }
    
    /**
     * Met à jour l'apparence du bouton de basculement
     */
    updateToggleButton() {
        const toggle = document.getElementById('theme-toggle');
        if (!toggle) return;
        
        let icon, text;
        
        switch (this.currentTheme) {
            case this.themes.LIGHT:
                icon = '☀️';
                text = 'Passer en mode sombre';
                break;
            case this.themes.DARK:
                icon = '🌙';
                text = 'Passer en mode clair';
                break;
            default:
                icon = '☀️';
                text = 'Passer en mode sombre';
                break;
        }
        
        toggle.innerHTML = icon;
        toggle.setAttribute('title', text);
        toggle.setAttribute('aria-label', text);
    }
    
    /**
     * Bascule entre les thèmes
     */
    toggleTheme() {
        const nextTheme = this.currentTheme === this.themes.LIGHT 
            ? this.themes.DARK 
            : this.themes.LIGHT;
        
        this.setStoredTheme(nextTheme);
        this.applyTheme(nextTheme);
        
        // Animation de feedback
        this.animateToggle();
    }
    
    /**
     * Animation du bouton lors du changement
     */
    animateToggle() {
        const toggle = document.getElementById('theme-toggle');
        if (!toggle) return;
        
        toggle.style.transform = 'scale(1.2)';
        setTimeout(() => {
            toggle.style.transform = 'scale(1)';
        }, 150);
    }
    
    /**
     * Écoute les changements de préférence système (pour la détection initiale uniquement)
     */
    setupMediaQueryListener() {
        // Cette méthode est conservée pour compatibilité mais n'est plus nécessaire
        // car on utilise maintenant un système à 2 modes uniquement
        console.log('✨ Gestionnaire de thème initialisé : Mode binaire (Clair/Sombre)');
    }
    
    /**
     * Retourne le thème effectif actuellement appliqué
     */
    getEffectiveTheme() {
        return this.currentTheme;
    }
    
    /**
     * Vérifie si le mode sombre est actif
     */
    isDarkMode() {
        return this.currentTheme === this.themes.DARK;
    }
}

// Initialisation automatique quand le DOM est chargé
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeManager = new ThemeManager();
    });
} else {
    window.themeManager = new ThemeManager();
}

// Export pour utilisation en module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}