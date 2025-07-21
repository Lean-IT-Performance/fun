// Service Worker sécurisé - Redirection vers backend
// ✅ SÉCURISÉ : Plus de clé API exposée côté client !

console.log('🛡️ Service Worker sécurisé chargé');

self.addEventListener('fetch', event => {
    // Intercepter les anciens appels à l'API pour les rediriger
    if (event.request.url.includes('/api/recipes/generate')) {
        console.log('🔄 Redirection vers le backend sécurisé');
        event.respondWith(redirectToSecureBackend(event.request));
    }
});

async function redirectToSecureBackend(request) {
    try {
        console.log('📤 Redirection vers le backend PHP sécurisé');
        
        // Récupérer les données de la requête originale
        const requestData = await request.json();
        
        // Rediriger vers le backend PHP sécurisé
        const response = await fetch('/api/recipes-generator.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        return response;

    } catch (error) {
        console.error('❌ Erreur redirection backend:', error);
        return new Response(JSON.stringify({
            error: 'Erreur lors de la redirection vers le backend sécurisé',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Installation du service worker
self.addEventListener('install', event => {
    console.log('✅ Service Worker sécurisé installé');
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    console.log('🛡️ Service Worker sécurisé activé - API sécurisée via backend');
    event.waitUntil(self.clients.claim());
});