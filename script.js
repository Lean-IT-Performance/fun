document.addEventListener('DOMContentLoaded', function() {
    // Animation d'apparition progressive des cartes
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observer toutes les cartes d'outils
    const toolCards = document.querySelectorAll('.tool-card');
    toolCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });

    // Animation des icônes au survol
    toolCards.forEach(card => {
        const icon = card.querySelector('.tool-icon');
        
        card.addEventListener('mouseenter', function() {
            if (!card.classList.contains('coming-soon')) {
                icon.style.transform = 'scale(1.1) rotate(5deg)';
                icon.style.transition = 'transform 0.3s ease';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            icon.style.transform = 'scale(1) rotate(0deg)';
        });
    });

    // Effet de typing pour le tagline
    const tagline = document.querySelector('.tagline');
    const originalText = tagline.textContent;
    
    function typeWriter(text, element, speed = 100) {
        element.textContent = '';
        let i = 0;
        
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        }
        
        // Délai avant de commencer l'animation
        setTimeout(type, 1000);
    }
    
    // Démarrer l'animation de typing
    typeWriter(originalText, tagline, 80);

    // Gestion du clic sur les cartes "coming soon"
    const comingSoonCards = document.querySelectorAll('.tool-card.coming-soon');
    comingSoonCards.forEach(card => {
        card.addEventListener('click', function() {
            const toolName = card.querySelector('h3').textContent;
            showNotification(`${toolName} sera bientôt disponible ! 🚀`);
        });
    });

    // Fonction pour afficher une notification
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Animation d'entrée
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Animation de sortie et suppression
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Smooth scroll pour les liens internes (si ajoutés plus tard)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Parallax subtil pour le header
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const header = document.querySelector('header');
        const rate = scrolled * -0.5;
        
        if (header) {
            header.style.transform = `translateY(${rate}px)`;
        }
    });

    // Easter egg : Konami Code
    let konamiCode = [];
    const konami = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
    
    document.addEventListener('keydown', function(e) {
        konamiCode.push(e.keyCode);
        
        if (konamiCode.length > konami.length) {
            konamiCode.shift();
        }
        
        if (konamiCode.length === konami.length && 
            konamiCode.every((code, index) => code === konami[index])) {
            activateEasterEgg();
        }
    });

    function activateEasterEgg() {
        showNotification('🎉 Code Konami activé ! Vous êtes un vrai geek !');
        
        // Ajout d'une classe spéciale pour des effets visuels
        document.body.classList.add('konami-mode');
        
        // Effet de confettis sur les icônes
        toolCards.forEach((card, index) => {
            setTimeout(() => {
                const icon = card.querySelector('.tool-icon');
                icon.style.animation = 'bounce 0.6s ease';
            }, index * 200);
        });

        // Retirer l'effet après 5 secondes
        setTimeout(() => {
            document.body.classList.remove('konami-mode');
            toolCards.forEach(card => {
                const icon = card.querySelector('.tool-icon');
                icon.style.animation = '';
            });
        }, 5000);
    }
});

// Styles CSS pour les animations ajoutés dynamiquement
const style = document.createElement('style');
style.textContent = `
    @keyframes bounce {
        0%, 20%, 50%, 80%, 100% {
            transform: translateY(0) scale(1);
        }
        40% {
            transform: translateY(-10px) scale(1.1);
        }
        60% {
            transform: translateY(-5px) scale(1.05);
        }
    }
    
    .konami-mode .tool-icon {
        filter: hue-rotate(180deg);
    }
`;
document.head.appendChild(style);