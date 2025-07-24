/**
 * ✨ Animation Manager - Gestionnaire d'animations et micro-interactions
 * Gère les animations au scroll, les interactions utilisateur et les effets visuels
 */

class AnimationManager {
    constructor() {
        this.scrollObserver = null;
        this.animatedElements = new Set();
        this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        this.init();
    }
    
    /**
     * Initialise le gestionnaire d'animations
     */
    init() {
        if (this.isReducedMotion) {
            console.log('✨ Animations réduites détectées - Mode respectueux activé');
            return;
        }
        
        this.setupScrollAnimations();
        this.setupMicroInteractions();
        this.setupFormAnimations();
        this.setupLoadingAnimations();
        this.setupCelebrationEffects();
        this.initStaggeredAnimations();
        
        console.log('✨ Animation Manager initialisé');
    }
    
    /**
     * Configure les animations au scroll
     */
    setupScrollAnimations() {
        // Observer pour les éléments qui apparaissent au scroll
        this.scrollObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.revealElement(entry.target);
                    }
                });
            },
            {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            }
        );
        
        // Observer tous les éléments avec data-animate
        this.observeAnimatedElements();
        
        // Parallax léger pour certains éléments
        this.setupParallax();
    }
    
    /**
     * Observe les éléments à animer
     */
    observeAnimatedElements() {
        const elements = document.querySelectorAll('[data-animate]');
        
        elements.forEach(element => {
            // Préparer l'élément pour l'animation
            element.classList.add('scroll-reveal');
            this.scrollObserver.observe(element);
        });
        
        // Auto-détection des cartes et éléments importants
        const autoElements = document.querySelectorAll('.card, .alert, .badge');
        autoElements.forEach((element, index) => {
            if (!element.hasAttribute('data-animate')) {
                element.setAttribute('data-animate', 'fade-in');
                element.setAttribute('data-delay', index * 100);
                element.classList.add('scroll-reveal');
                this.scrollObserver.observe(element);
            }
        });
    }
    
    /**
     * Révèle un élément avec animation
     */
    revealElement(element) {
        if (this.animatedElements.has(element)) return;
        
        const animationType = element.getAttribute('data-animate') || 'fade-in';
        const delay = element.getAttribute('data-delay') || 0;
        
        setTimeout(() => {
            element.classList.add('revealed');
            element.classList.add(`animate-${animationType}`);
            this.animatedElements.add(element);
        }, parseInt(delay));
        
        // Ne plus observer cet élément
        this.scrollObserver.unobserve(element);
    }
    
    /**
     * Configure le parallax léger
     */
    setupParallax() {
        const parallaxElements = document.querySelectorAll('.parallax, [data-parallax]');
        
        if (parallaxElements.length === 0) return;
        
        const handleScroll = () => {
            const scrolled = window.pageYOffset;
            
            parallaxElements.forEach(element => {
                const rate = scrolled * -0.5;
                element.style.transform = `translateY(${rate}px)`;
            });
        };
        
        // Throttle pour les performances
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }
    
    /**
     * Configure les micro-interactions
     */
    setupMicroInteractions() {
        // Effet ripple sur les boutons
        this.setupRippleEffect();
        
        // Animations hover améliorées
        this.setupHoverEffects();
        
        // Feedback tactile
        this.setupTouchFeedback();
    }
    
    /**
     * Effet ripple sur les boutons
     */
    setupRippleEffect() {
        const buttons = document.querySelectorAll('.btn, button');
        
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                const ripple = document.createElement('span');
                const rect = button.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                ripple.classList.add('ripple');
                
                // Styles du ripple
                Object.assign(ripple.style, {
                    position: 'absolute',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.6)',
                    transform: 'scale(0)',
                    animation: 'ripple 600ms linear',
                    pointerEvents: 'none'
                });
                
                button.appendChild(ripple);
                
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });
        
        // Animation CSS pour le ripple
        if (!document.getElementById('ripple-styles')) {
            const style = document.createElement('style');
            style.id = 'ripple-styles';
            style.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(4);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    /**
     * Effets hover améliorés
     */
    setupHoverEffects() {
        // Cartes interactives
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            card.classList.add('interactive');
            
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-8px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
        });
        
        // Icônes rotatives
        const icons = document.querySelectorAll('.icon, [class*="icon-"]');
        icons.forEach(icon => {
            if (!icon.classList.contains('no-rotate')) {
                icon.classList.add('icon-rotate');
            }
        });
    }
    
    /**
     * Feedback tactile pour mobile
     */
    setupTouchFeedback() {
        const interactiveElements = document.querySelectorAll('.btn, .card, .badge, [data-interactive]');
        
        interactiveElements.forEach(element => {
            element.addEventListener('touchstart', () => {
                element.style.transform = 'scale(0.95)';
            });
            
            element.addEventListener('touchend', () => {
                setTimeout(() => {
                    element.style.transform = '';
                }, 150);
            });
        });
    }
    
    /**
     * Animations de formulaires
     */
    setupFormAnimations() {
        const formInputs = document.querySelectorAll('.form-input, .form-select, .form-textarea');
        
        formInputs.forEach(input => {
            const formGroup = input.closest('.form-group');
            
            // Animation au focus
            input.addEventListener('focus', () => {
                if (formGroup) formGroup.classList.add('focused');
                input.classList.add('animate-pulse');
            });
            
            // Animation à la perte de focus
            input.addEventListener('blur', () => {
                if (formGroup) formGroup.classList.remove('focused');
                input.classList.remove('animate-pulse');
            });
            
            // Animation lors de la saisie
            input.addEventListener('input', () => {
                if (input.value) {
                    input.classList.add('has-value');
                } else {
                    input.classList.remove('has-value');
                }
            });
        });
    }
    
    /**
     * Animations de chargement
     */
    setupLoadingAnimations() {
        // Remplace les indicateurs de chargement simples par des versions animées
        const loadingElements = document.querySelectorAll('.loading');
        
        loadingElements.forEach(loader => {
            // Crée un container avec dots animés
            const container = document.createElement('div');
            container.className = 'loading-container';
            
            const dots = document.createElement('div');
            dots.className = 'loading-dots';
            
            for (let i = 0; i < 3; i++) {
                const dot = document.createElement('div');
                dot.className = 'loading-dot';
                dots.appendChild(dot);
            }
            
            container.appendChild(dots);
            loader.parentNode.replaceChild(container, loader);
        });
    }
    
    /**
     * Effets de célébration
     */
    setupCelebrationEffects() {
        // Detecte les succès (formulaires soumis, actions réussies)
        document.addEventListener('success', (e) => {
            this.celebrate(e.target);
        });
        
        // Célébration sur les boutons de succès
        const successButtons = document.querySelectorAll('.btn-success, [data-celebrate]');
        successButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.celebrate(button);
            });
        });
    }
    
    /**
     * Déclenche un effet de célébration
     */
    celebrate(element) {
        element.classList.add('celebrate');
        
        // Particules
        this.createParticles(element);
        
        // Nettoyage après animation
        setTimeout(() => {
            element.classList.remove('celebrate');
        }, 2000);
    }
    
    /**
     * Crée des particules de célébration
     */
    createParticles(element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const emojis = ['🎉', '✨', '🌟', '💫', '🎊'];
        
        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            particle.style.cssText = `
                position: fixed;
                left: ${centerX}px;
                top: ${centerY}px;
                font-size: 1.5rem;
                pointer-events: none;
                z-index: 9999;
                animation: particle ${Math.random() * 2 + 1}s ease-out forwards;
            `;
            
            document.body.appendChild(particle);
            
            setTimeout(() => particle.remove(), 3000);
        }
        
        // Animation CSS pour les particules
        if (!document.getElementById('particle-styles')) {
            const style = document.createElement('style');
            style.id = 'particle-styles';
            style.textContent = `
                @keyframes particle {
                    0% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(0);
                    }
                    50% {
                        opacity: 1;
                        transform: translate(${Math.random() * 200 - 100}px, ${Math.random() * 200 - 100}px) scale(1);
                    }
                    100% {
                        opacity: 0;
                        transform: translate(${Math.random() * 400 - 200}px, ${Math.random() * 400 - 200}px) scale(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    /**
     * Initialise les animations décalées (staggered)
     */
    initStaggeredAnimations() {
        const groups = document.querySelectorAll('[data-stagger]');
        
        groups.forEach(group => {
            const children = group.children;
            const delay = parseInt(group.getAttribute('data-stagger')) || 100;
            
            Array.from(children).forEach((child, index) => {
                child.style.animationDelay = `${index * delay}ms`;
                child.classList.add('animate-fade-in');
            });
        });
    }
    
    /**
     * Ajoute une animation à un élément
     */
    animate(element, animation, options = {}) {
        if (this.isReducedMotion) return;
        
        const { delay = 0, duration, callback } = options;
        
        setTimeout(() => {
            element.classList.add(`animate-${animation}`);
            
            if (callback) {
                element.addEventListener('animationend', callback, { once: true });
            }
        }, delay);
    }
    
    /**
     * Supprime les animations d'un élément
     */
    stopAnimation(element) {
        const animationClasses = Array.from(element.classList).filter(cls => 
            cls.startsWith('animate-')
        );
        
        animationClasses.forEach(cls => {
            element.classList.remove(cls);
        });
    }
    
    /**
     * Nettoyage et destruction
     */
    destroy() {
        if (this.scrollObserver) {
            this.scrollObserver.disconnect();
        }
        
        this.animatedElements.clear();
        console.log('✨ Animation Manager détruit');
    }
}

// Initialisation automatique
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.animationManager = new AnimationManager();
    });
} else {
    window.animationManager = new AnimationManager();
}

// Utilitaires d'animation globaux
window.animate = (element, animation, options) => {
    if (window.animationManager) {
        window.animationManager.animate(element, animation, options);
    }
};

window.celebrate = (element) => {
    if (window.animationManager) {
        window.animationManager.celebrate(element);
    }
};

// Export pour utilisation en module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimationManager;
}