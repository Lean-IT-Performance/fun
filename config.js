// Configuration sécurisée pour l'application
// Ce fichier charge les variables d'environnement de manière sécurisée

class ConfigManager {
    constructor() {
        this.config = {};
        this.loadConfig();
    }

    async loadConfig() {
        // Chargement côté serveur (Node.js)
        if (typeof process !== 'undefined' && process.env) {
            await this.loadFromEnv();
        } else {
            // Chargement côté client via endpoint sécurisé
            await this.loadFromEndpoint();
        }
    }

    async loadFromEnv() {
        // Chargement direct des variables d'environnement (côté serveur)
        this.config = {
            openai: {
                apiKey: process.env.OPENAI_API_KEY,
                orgId: process.env.OPENAI_ORG_ID,
                model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
                maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 1500,
                temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.8
            },
            ftp: {
                host: process.env.FTP_HOST,
                user: process.env.FTP_USER,
                password: process.env.FTP_PASS,
                port: parseInt(process.env.FTP_PORT) || 21,
                secure: process.env.FTP_SECURE === 'true',
                dir: process.env.FTP_DIR || ''
            },
            admin: {
                username: process.env.ADMIN_USERNAME,
                password: process.env.ADMIN_PASSWORD
            }
        };
    }

    async loadFromEndpoint() {
        // Chargement via endpoint sécurisé (côté client)
        try {
            const response = await fetch('/api/config');
            if (response.ok) {
                const config = await response.json();
                this.config = config;
            } else {
                console.warn('Configuration endpoint not available, using fallback');
                this.loadFallbackConfig();
            }
        } catch (error) {
            console.warn('Failed to load config from endpoint:', error);
            this.loadFallbackConfig();
        }
    }

    loadFallbackConfig() {
        // Configuration de fallback avec valeurs par défaut
        this.config = {
            openai: {
                apiKey: null, // Sera chargé dynamiquement si nécessaire
                model: 'gpt-4o-mini',
                maxTokens: 1500,
                temperature: 0.8
            },
            ftp: {
                host: null,
                user: null,
                password: null,
                port: 21,
                secure: false,
                dir: ''
            }
        };
    }

    // Getters sécurisés
    getOpenAIConfig() {
        return this.config.openai || {};
    }

    getFTPConfig() {
        return this.config.ftp || {};
    }

    getAdminConfig() {
        return this.config.admin || {};
    }

    // Méthode pour obtenir l'API key de manière sécurisée
    async getSecureAPIKey() {
        // Si on a déjà l'API key en mémoire, l'utiliser
        if (this.config.openai?.apiKey) {
            return this.config.openai.apiKey;
        }

        // Sinon, essayer de la charger depuis l'environnement
        if (typeof process !== 'undefined' && process.env.OPENAI_API_KEY) {
            return process.env.OPENAI_API_KEY;
        }

        // En dernier recours, utiliser la valeur de fallback avec avertissement
        console.warn('⚠️ API Key non trouvée dans la configuration sécurisée');
        return null;
    }

    // Validation de la configuration
    validateConfig() {
        const errors = [];

        if (!this.config.openai?.apiKey) {
            errors.push('OpenAI API Key manquante');
        }

        if (!this.config.ftp?.host || !this.config.ftp?.user) {
            errors.push('Configuration FTP incomplète');
        }

        if (!this.config.admin?.username || !this.config.admin?.password) {
            errors.push('Configuration Admin incomplète');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Debug (sans exposer les secrets)
    getDebugInfo() {
        return {
            openai: {
                hasApiKey: !!this.config.openai?.apiKey,
                hasOrgId: !!this.config.openai?.orgId,
                model: this.config.openai?.model,
                maxTokens: this.config.openai?.maxTokens,
                temperature: this.config.openai?.temperature
            },
            ftp: {
                hasHost: !!this.config.ftp?.host,
                hasUser: !!this.config.ftp?.user,
                hasPassword: !!this.config.ftp?.password,
                port: this.config.ftp?.port,
                secure: this.config.ftp?.secure
            },
            admin: {
                hasUsername: !!this.config.admin?.username,
                hasPassword: !!this.config.admin?.password
            }
        };
    }
}

// Export pour utilisation dans différents environnements
if (typeof module !== 'undefined' && module.exports) {
    // Node.js
    module.exports = ConfigManager;
} else {
    // Browser
    window.ConfigManager = ConfigManager;
}