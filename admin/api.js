// Module API pour la console d'administration
// Gestion des appels à l'API OpenAI pour le monitoring

class OpenAIAPI {
    constructor(configManager) {
        this.configManager = configManager;
        this.baseURL = 'https://api.openai.com/v1';
    }

    async getHeaders() {
        const apiKey = await this.configManager.getSecureAPIKey();
        const config = this.configManager.getOpenAIConfig();
        
        const headers = {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        };

        // Ajouter l'org ID si disponible
        if (config.orgId) {
            headers['OpenAI-Organization'] = config.orgId;
        }

        return headers;
    }

    // Récupérer les statistiques d'usage avec l'API Usage réelle d'OpenAI via backend sécurisé
    async getUsageStats(startDate = null, endDate = null) {
        console.log('🔍 Récupération des données d\'usage OpenAI via backend...');
        
        try {
            // Préparer les dates par défaut si non fournies
            if (!startDate || !endDate) {
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - 30); // 30 derniers jours par défaut
                
                endDate = this.formatDateForAPI(end);
                startDate = this.formatDateForAPI(start);
            }

            console.log(`📅 Période demandée: ${startDate} à ${endDate}`);

            // Correction: Utiliser GET avec les dates dans l'URL
            const params = new URLSearchParams({
                start_date: startDate,
                end_date: endDate
            });

            const options = {};
            const authToken = sessionStorage.getItem('admin_auth_token');
            if (authToken) {
                options.headers = { 'Authorization': `Bearer ${authToken}` };
            }

            const response = await fetch(`/api/admin/openai-usage.php?${params}`, options);
            
            const responseData = await response.json();
            
            if (!response.ok || !responseData.success) {
                const errorMessage = responseData.error || `Erreur ${response.status} (backend)`;
                 if (response.status === 401) throw new Error('❌ Session admin expirée. Reconnectez-vous.');
                throw new Error(`❌ Erreur backend: ${errorMessage}`);
            }

            // Correction : Utiliser responseData.data qui contient les vraies informations
            const processedData = responseData.data; 
            console.log('✅ Vraies données d\'usage récupérées via backend:', processedData);
            
            // Ajouter les métadonnées de la réponse
            processedData.lastUpdated = responseData.timestamp || new Date().toISOString();
            processedData.period = responseData.period;
            
            this.storeUsageDataCache(processedData, startDate, endDate);
            
            return processedData;

        } catch (error) {
            console.warn('⚠️ Impossible de récupérer les vraies données:', error.message);
            
            // Essayer d'utiliser le cache local si disponible
            const cachedData = this.getCachedUsageData(startDate, endDate);
            if (cachedData) {
                console.log('📁 Utilisation des données mises en cache');
                cachedData.dataSource = 'cached';
                return cachedData;
            }
            
            // Vérifier si on a des données stockées localement
            const localData = this.getLocalUsageData();
            if (localData && Object.keys(localData).length > 0) {
                console.log('📁 Utilisation des données locales stockées');
                return localData;
            }
            
            // En dernier recours, afficher des données simulées avec un avertissement clair
            console.warn('🎭 Affichage de données simulées suite à une erreur.');
            const simulatedData = this.generateRealisticUsageData();
            simulatedData.error = error.message; // Transmettre le message d'erreur
            return simulatedData;
        }
    }

    // Traiter les vraies données d'usage de l'API OpenAI
    processRealUsageData(rawData, startDate, endDate) {
        console.log('📊 Traitement des vraies données d\'usage...');
        
        if (!rawData || !rawData.data) {
            console.warn('⚠️ Structure de données d\'usage inattendue');
            return this.generateRealisticUsageData();
        }

        const today = new Date().toISOString().split('T')[0];
        const monthStart = new Date();
        monthStart.setDate(1);
        const monthStartStr = monthStart.toISOString().split('T')[0];

        let dailyRequests = 0;
        let monthlyRequests = 0;
        let tokensUsed = 0;
        let monthlyCost = 0;
        const costByDay = [];
        const modelUsage = new Map();

        // Traiter chaque entrée de données
        rawData.data.forEach(item => {
            const itemDate = item.aggregation_timestamp ? 
                item.aggregation_timestamp.split('T')[0] : 
                (item.snapshot_id || item.date);
            
            const dayRequests = item.n_requests || 0;
            const dayTokensIn = item.n_context_tokens_total || 0;
            const dayTokensOut = item.n_generated_tokens_total || 0;
            const dayTokensTotal = dayTokensIn + dayTokensOut;
            const dayCost = this.calculateRealCost(item);

            // Statistiques journalières
            if (itemDate === today) {
                dailyRequests = dayRequests;
            }

            // Statistiques mensuelles
            if (itemDate >= monthStartStr) {
                monthlyRequests += dayRequests;
                tokensUsed += dayTokensTotal;
                monthlyCost += dayCost;
            }

            // Données pour graphiques
            costByDay.push({
                date: itemDate,
                cost: dayCost,
                requests: dayRequests,
                tokens: dayTokensTotal,
                tokensIn: dayTokensIn,
                tokensOut: dayTokensOut
            });

            // Traitement des données par modèle si disponible
            if (item.ft_data) {
                item.ft_data.forEach(model => {
                    const modelName = model.model_id || 'unknown';
                    if (!modelUsage.has(modelName)) {
                        modelUsage.set(modelName, {
                            model: modelName,
                            requests: 0,
                            cost: 0,
                            tokens: 0
                        });
                    }
                    const existing = modelUsage.get(modelName);
                    existing.requests += model.n_requests || 0;
                    existing.cost += this.calculateModelCost(model);
                    existing.tokens += (model.n_context_tokens_total || 0) + (model.n_generated_tokens_total || 0);
                });
            }
            
            // Si pas de données ft_data, essayer d'extraire des infos par modèle depuis d'autres champs
            if (item.models_data) {
                item.models_data.forEach(model => {
                    const modelName = model.model || 'unknown';
                    if (!modelUsage.has(modelName)) {
                        modelUsage.set(modelName, {
                            model: modelName,
                            requests: 0,
                            cost: 0,
                            tokens: 0
                        });
                    }
                    const existing = modelUsage.get(modelName);
                    existing.requests += model.requests || 0;
                    existing.cost += model.cost || 0;
                    existing.tokens += model.tokens || 0;
                });
            }
        });

        const avgCostPerRequest = monthlyRequests > 0 ? monthlyCost / monthlyRequests : 0;

        // Trier les données par date
        costByDay.sort((a, b) => new Date(a.date) - new Date(b.date));

        const result = {
            dailyRequests,
            monthlyRequests,
            tokensUsed,
            monthlyCost: monthlyCost.toFixed(4),
            avgCostPerRequest: avgCostPerRequest.toFixed(6),
            costByDay: costByDay.slice(-30), // 30 derniers jours max
            modelUsage: Array.from(modelUsage.values()),
            period: {
                startDate,
                endDate
            },
            totalDays: costByDay.length,
            lastUpdated: new Date().toISOString()
        };

        console.log('✅ Données d\'usage traitées:', result);
        return result;
    }

    // Calculer le coût réel basé sur les données d'usage OpenAI
    calculateRealCost(dayData) {
        let cost = 0;
        
        // Si les coûts sont déjà fournis par l'API, les utiliser
        if (dayData.cost !== undefined) {
            return parseFloat(dayData.cost) || 0;
        }
        
        // Sinon calculer basé sur les tokens
        const inputTokens = dayData.n_context_tokens_total || 0;
        const outputTokens = dayData.n_generated_tokens_total || 0;
        
        // Utiliser les tarifs moyens (peut être affiné selon les modèles utilisés)
        const inputRate = 0.00015;  // $0.15 per 1K tokens (GPT-4o-mini input)
        const outputRate = 0.0006;  // $0.60 per 1K tokens (GPT-4o-mini output)
        
        cost += (inputTokens / 1000) * inputRate;
        cost += (outputTokens / 1000) * outputRate;

        return cost;
    }

    // Calculer le coût pour un modèle spécifique
    calculateModelCost(modelData) {
        const tokens = (modelData.n_context_tokens_total || 0) + (modelData.n_generated_tokens_total || 0);
        
        // Tarifs selon le modèle
        let ratePerThousand = 0.00015; // défaut GPT-4o-mini
        
        if (modelData.model_id?.includes('gpt-4')) {
            ratePerThousand = 0.03; // GPT-4 plus cher
        } else if (modelData.model_id?.includes('gpt-3.5')) {
            ratePerThousand = 0.002; // GPT-3.5-turbo
        }

        return (tokens / 1000) * ratePerThousand;
    }

    // Récupérer les informations sur les modèles disponibles
    async getModels() {
        try {
            const headers = await this.getHeaders();
            const response = await fetch(`${this.baseURL}/models`, { headers });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            return data.data || [];

        } catch (error) {
            console.warn('Erreur récupération modèles:', error);
            return [];
        }
    }

    // Tester la connexion à l'API
    async testConnection() {
        try {
            const headers = await this.getHeaders();
            const response = await fetch(`${this.baseURL}/models`, { headers });
            
            return {
                success: response.ok,
                status: response.status,
                message: response.ok ? 'Connexion réussie' : `Erreur ${response.status}`
            };

        } catch (error) {
            return {
                success: false,
                status: 0,
                message: `Erreur de connexion: ${error.message}`
            };
        }
    }

    // Récupérer les logs d'usage récents (simulation)
    async getRecentRequests(limit = 10) {
        try {
            // Pour l'instant, on simule car OpenAI n'a pas d'endpoint pour les logs détaillés
            const requests = [];
            const models = ['gpt-4o-mini', 'gpt-4', 'gpt-3.5-turbo'];
            const sources = ['recettes', 'sobre', 'admin'];
            
            for (let i = 0; i < limit; i++) {
                const now = new Date();
                now.setMinutes(now.getMinutes() - i * 15);
                
                requests.push({
                    id: `req_${Date.now()}_${i}`,
                    timestamp: now.toISOString(),
                    model: models[Math.floor(Math.random() * models.length)],
                    tokens: Math.floor(Math.random() * 1000) + 100,
                    cost: (Math.random() * 0.05 + 0.001).toFixed(4),
                    source: sources[Math.floor(Math.random() * sources.length)],
                    status: Math.random() > 0.1 ? 'success' : 'error',
                    prompt_tokens: Math.floor(Math.random() * 500) + 50,
                    completion_tokens: Math.floor(Math.random() * 500) + 50
                });
            }
            
            return requests;

        } catch (error) {
            console.error('Erreur récupération requêtes récentes:', error);
            return [];
        }
    }

    // Méthode utilitaire pour formater les dates pour l'API
    formatDateForAPI(date) {
        return date.toISOString().split('T')[0];
    }

    // Obtenir les données des N derniers jours
    async getRecentUsage(days = 30) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        return await this.getUsageStats(
            this.formatDateForAPI(startDate),
            this.formatDateForAPI(endDate)
        );
    }

    // Stocker les données d'usage localement pour un suivi réel
    storeLocalUsage(requestData) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const stored = JSON.parse(localStorage.getItem('openai_usage_data') || '{}');
            
            if (!stored[today]) {
                stored[today] = {
                    requests: 0,
                    tokens: 0,
                    cost: 0,
                    models: {}
                };
            }
            
            stored[today].requests += 1;
            stored[today].tokens += requestData.tokens || 0;
            stored[today].cost += requestData.cost || 0;
            
            const model = requestData.model || 'unknown';
            stored[today].models[model] = (stored[today].models[model] || 0) + 1;
            
            // Garder seulement les 90 derniers jours
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 90);
            const cutoffStr = cutoff.toISOString().split('T')[0];
            
            Object.keys(stored).forEach(date => {
                if (date < cutoffStr) {
                    delete stored[date];
                }
            });
            
            localStorage.setItem('openai_usage_data', JSON.stringify(stored));
            console.log('💾 Données d\'usage stockées localement');
            
        } catch (error) {
            console.warn('Erreur stockage local:', error);
        }
    }

    // Récupérer les données stockées localement
    getLocalUsageData() {
        try {
            const stored = JSON.parse(localStorage.getItem('openai_usage_data') || '{}');
            if (Object.keys(stored).length === 0) {
                return null;
            }
            
            // Convertir au format attendu
            const today = new Date().toISOString().split('T')[0];
            const monthStart = new Date();
            monthStart.setDate(1);
            const monthStartStr = monthStart.toISOString().split('T')[0];
            
            let dailyRequests = 0;
            let monthlyRequests = 0;
            let tokensUsed = 0;
            let monthlyCost = 0;
            const costByDay = [];
            const modelUsage = new Map();
            
            Object.keys(stored).sort().forEach(date => {
                const day = stored[date];
                
                if (date === today) {
                    dailyRequests = day.requests;
                }
                
                if (date >= monthStartStr) {
                    monthlyRequests += day.requests;
                    tokensUsed += day.tokens;
                    monthlyCost += day.cost;
                }
                
                costByDay.push({
                    date: date,
                    cost: day.cost,
                    requests: day.requests,
                    tokens: day.tokens
                });
                
                // Usage par modèle
                Object.keys(day.models).forEach(model => {
                    if (!modelUsage.has(model)) {
                        modelUsage.set(model, { model, requests: 0, cost: 0 });
                    }
                    const existing = modelUsage.get(model);
                    existing.requests += day.models[model];
                });
            });
            
            const avgCostPerRequest = monthlyRequests > 0 ? monthlyCost / monthlyRequests : 0;
            
            return {
                dailyRequests,
                monthlyRequests,
                tokensUsed,
                monthlyCost: monthlyCost.toFixed(4),
                avgCostPerRequest: avgCostPerRequest.toFixed(6),
                costByDay: costByDay.slice(-30),
                modelUsage: Array.from(modelUsage.values()),
                dataSource: 'local'
            };
            
        } catch (error) {
            console.warn('Erreur lecture données locales:', error);
            return null;
        }
    }

    // Stocker les données d'usage en cache
    storeUsageDataCache(data, startDate, endDate) {
        try {
            const cacheKey = `usage_cache_${startDate}_${endDate}`;
            const cacheData = {
                ...data,
                cachedAt: new Date().toISOString()
            };
            localStorage.setItem(cacheKey, JSON.stringify(cacheData));
            
            // Nettoyer les anciens caches (garder seulement les 10 plus récents)
            const allKeys = Object.keys(localStorage).filter(key => key.startsWith('usage_cache_'));
            if (allKeys.length > 10) {
                allKeys.sort().slice(0, allKeys.length - 10).forEach(key => {
                    localStorage.removeItem(key);
                });
            }
            
            console.log('💾 Données d\'usage mises en cache');
        } catch (error) {
            console.warn('⚠️ Erreur lors de la mise en cache:', error);
        }
    }

    // Récupérer les données d'usage du cache
    getCachedUsageData(startDate, endDate) {
        try {
            const cacheKey = `usage_cache_${startDate}_${endDate}`;
            const cached = localStorage.getItem(cacheKey);
            
            if (cached) {
                const data = JSON.parse(cached);
                const cacheAge = Date.now() - new Date(data.cachedAt).getTime();
                
                // Utiliser le cache s'il a moins de 1 heure
                if (cacheAge < 60 * 60 * 1000) {
                    return data;
                }
            }
            
            return null;
        } catch (error) {
            console.warn('⚠️ Erreur lecture cache:', error);
            return null;
        }
    }

    // Générer des données réalistes pour la démo
    generateRealisticUsageData() {
        const today = new Date().toISOString().split('T')[0];
        const monthStart = new Date();
        monthStart.setDate(1);
        
        // Données basées sur une utilisation réaliste
        const baseRequests = 15; // Requests par jour en moyenne
        const baseTokens = 800; // Tokens par request en moyenne
        
        const dailyRequests = Math.floor(Math.random() * 10) + baseRequests;
        const daysInMonth = new Date().getDate();
        const monthlyRequests = Math.floor(baseRequests * daysInMonth * (0.8 + Math.random() * 0.4));
        const tokensUsed = Math.floor(monthlyRequests * baseTokens * (0.8 + Math.random() * 0.4));
        
        // Coût basé sur GPT-4o-mini ($0.15 input + $0.60 output per 1K tokens)
        const avgCost = (tokensUsed / 1000) * 0.375; // Moyenne input/output
        const monthlyCost = avgCost;
        const avgCostPerRequest = monthlyRequests > 0 ? monthlyCost / monthlyRequests : 0;
        
        // Données pour graphiques
        const costByDay = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            costByDay.push({
                date: date.toISOString().split('T')[0],
                cost: Math.random() * 2 + 0.1,
                requests: Math.floor(Math.random() * 20) + 5,
                tokens: Math.floor(Math.random() * 1000) + 200
            });
        }
        
        return {
            dailyRequests,
            monthlyRequests,
            tokensUsed,
            monthlyCost: monthlyCost,
            avgCostPerRequest: avgCostPerRequest,
            costByDay,
            modelUsage: [
                { model: 'gpt-4o-mini', requests: Math.floor(monthlyRequests * 0.7), cost: monthlyCost * 0.6 },
                { model: 'gpt-4', requests: Math.floor(monthlyRequests * 0.2), cost: monthlyCost * 0.3 },
                { model: 'gpt-3.5-turbo', requests: Math.floor(monthlyRequests * 0.1), cost: monthlyCost * 0.1 }
            ],
            dataSource: 'simulated'
        };
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OpenAIAPI;
} else {
    window.OpenAIAPI = OpenAIAPI;
}