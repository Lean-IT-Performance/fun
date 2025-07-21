// Console d'Administration - Script Principal
class AdminConsole {
    constructor() {
        this.isAuthenticated = false;
        this.configManager = null;
        this.refreshInterval = null;
        this.charts = {};
        this.settings = {
            costThreshold: 50,
            notificationsEnabled: true,
            refreshInterval: 30
        };
        
        this.init();
    }

    async init() {
        console.log('🚀 Initialisation de la console admin');
        
        // Initialiser le gestionnaire de configuration
        if (typeof ConfigManager !== 'undefined') {
            this.configManager = new ConfigManager();
            await this.configManager.loadConfig();
        }
        
        // Initialiser l'API OpenAI
        if (typeof OpenAIAPI !== 'undefined' && this.configManager) {
            this.openaiAPI = new OpenAIAPI(this.configManager);
        }
        
        // Vérifier l'authentification existante
        this.checkExistingAuth();
        
        // Configurer les événements
        this.setupEventListeners();
        
        // Charger les paramètres sauvegardés
        this.loadSettings();
    }

    checkExistingAuth() {
        const authToken = sessionStorage.getItem('admin_auth_token');
        const authTime = sessionStorage.getItem('admin_auth_time');
        
        if (authToken && authTime) {
            const timeElapsed = Date.now() - parseInt(authTime);
            // Session valide pendant 4 heures
            if (timeElapsed < 4 * 60 * 60 * 1000) {
                this.isAuthenticated = true;
                this.showDashboard();
                return;
            }
        }
        
        this.showLoginScreen();
    }

    setupEventListeners() {
        // Formulaire de connexion
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Bouton de déconnexion
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Changement de période pour les graphiques
        const chartPeriod = document.getElementById('chart-period');
        if (chartPeriod) {
            chartPeriod.addEventListener('change', (e) => this.updateChartsData(e.target.value));
        }

        // Initialiser les contrôles de date par défaut
        this.initializeDateControls();
    }

    initializeDateControls() {
        // Définir les dates par défaut (30 derniers jours)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        
        console.log('📅 Contrôles de date initialisés:', { startDate: startDateStr, endDate: endDateStr });
        
        // Stocker les dates par défaut pour utilisation dans loadDashboardData
        this.defaultStartDate = startDateStr;
        this.defaultEndDate = endDateStr;
    }

    setQuickPeriod(days, period) {
        const endDate = new Date();
        let startDate = new Date();

        if (days) {
            // Période basée sur nombre de jours
            startDate.setDate(startDate.getDate() - parseInt(days));
        } else if (period) {
            // Périodes spéciales
            switch (period) {
                case 'current-month':
                    startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
                    break;
                case 'last-month':
                    startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1);
                    endDate.setDate(0); // Dernier jour du mois précédent
                    break;
                default:
                    startDate.setDate(startDate.getDate() - 30);
            }
        }

        // Mettre à jour les champs de date
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        document.getElementById('start-date').value = startDateStr;
        document.getElementById('end-date').value = endDateStr;

        // Charger automatiquement les données pour cette période
        this.loadCustomUsageData();
    }

    async loadCustomUsageData() {
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;

        if (!startDate || !endDate) {
            this.showNotification('⚠️ Veuillez sélectionner les dates de début et de fin', 'warning');
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            this.showNotification('⚠️ La date de début doit être antérieure à la date de fin', 'warning');
            return;
        }

        console.log(`🔄 Chargement des données d'usage pour la période: ${startDate} à ${endDate}`);

        // Afficher l'état de chargement
        this.updateDataStatus('loading', '⏳ Chargement des données OpenAI...');
        
        // Désactiver le bouton pendant le chargement
        const loadBtn = document.getElementById('load-usage-data');
        loadBtn.disabled = true;
        loadBtn.innerHTML = '<span class="loading-spinner"></span> Chargement...';

        try {
            // Charger les nouvelles données
            const usageData = await this.openaiAPI.getUsageStats(startDate, endDate);
            
            // Mettre à jour les statistiques
            this.updateUsageStats(usageData);
            
            // Mettre à jour les graphiques avec les nouvelles données
            this.currentUsageData = usageData;
            await this.loadCostData();
            // await this.loadModelUsage(); // SUPPRIMÉ : Graphique modèles non nécessaire
            this.initializeCharts();
            
            // Afficher les informations sur les données chargées
            this.updateDataInfo(usageData, startDate, endDate);
            
            // Vérifier les alertes
            // this.checkAlerts(); // SUPPRIMÉ : Gestion des alertes supprimée
            
            // Mettre à jour le statut
            const statusMessage = this.getDataStatusMessage(usageData.dataSource);
            this.updateDataStatus('success', statusMessage);
            
            this.showNotification('✅ Données d\'usage chargées avec succès', 'success');

        } catch (error) {
            console.error('❌ Erreur lors du chargement des données d\'usage:', error);
            this.updateDataStatus('error', '❌ Erreur de chargement');
            this.showNotification(`❌ Erreur: ${error.message}`, 'error');
        } finally {
            // Réactiver le bouton
            loadBtn.disabled = false;
            loadBtn.innerHTML = '📊 Charger les données';
        }
    }

    updateDataStatus(status, message) {
        // Les éléments de statut ont été supprimés, on utilise seulement la console
        console.log(`📊 Status: ${status} - ${message}`);
        
        // Optionnel : afficher une notification si c'est une erreur
        if (status === 'error') {
            this.showNotification(message, 'error');
        }
    }

    getDataStatusMessage(dataSource) {
        const messages = {
            openai: '✅ Données OpenAI API récupérées',
            cached: '📁 Données mises en cache utilisées',
            local: '📁 Données locales utilisées',
            simulated: '🎭 Données simulées - Configurez un compte organisation OpenAI'
        };

        return messages[dataSource] || '❓ Source de données inconnue';
    }

    updateDataInfo(usageData, startDate, endDate) {
        // Les éléments d'information de données ont été supprimés
        // On utilise seulement la console pour l'instant
        console.log('📊 Informations des données:', {
            source: this.getDataSourceLabel(usageData.dataSource),
            period: `${startDate} → ${endDate}`,
            lastUpdated: usageData.lastUpdated ? new Date(usageData.lastUpdated).toLocaleString('fr-FR') : 'Non disponible',
            totalDays: usageData.totalDays || 'Non disponible'
        });
    }

    getDataSourceLabel(dataSource) {
        const labels = {
            openai: '🔗 API OpenAI (Usage)',
            openai_billing: '💰 API OpenAI (Facturation)',
            openai_costs_api: '📈 API OpenAI (Coûts)',
            cached: '📂 Cache local',
            local: '📁 Stockage local',
            simulated: '🎭 Simulation'
        };

        return labels[dataSource] || '❓ Inconnue';
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('login-error');
        
        try {
            // Validation côté client (en attendant la config serveur)
            const isValid = await this.validateCredentials(username, password);
            
            if (isValid) {
                // Créer un token de session
                const authToken = this.generateAuthToken();
                sessionStorage.setItem('admin_auth_token', authToken);
                sessionStorage.setItem('admin_auth_time', Date.now().toString());
                
                this.isAuthenticated = true;
                this.showDashboard();
                
                // Notification de succès
                this.showNotification('✅ Connexion réussie', 'success');
            } else {
                throw new Error('Identifiants incorrects');
            }
        } catch (error) {
            console.error('Erreur de connexion:', error);
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
            
            // Masquer l'erreur après 5 secondes
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }
    }

    async validateCredentials(username, password) {
        try {
            // Essayer d'abord via un endpoint backend si disponible
            try {
                const response = await fetch('/api/admin/auth', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    return result.valid;
                }
            } catch (apiError) {
                console.log('Endpoint backend non disponible, validation côté client');
            }

            // Si pas de backend, vérifier via ConfigManager côté serveur
            if (this.configManager && typeof process !== 'undefined' && process.env) {
                const adminUsername = process.env.ADMIN_USERNAME;
                const adminPassword = process.env.ADMIN_PASSWORD;
                
                if (!adminUsername || !adminPassword) {
                    throw new Error('❌ Variables ADMIN_USERNAME et ADMIN_PASSWORD manquantes dans .env');
                }
                
                return username === adminUsername && password === adminPassword;
            }
            
            // ERREUR: Pas de configuration sécurisée disponible
            throw new Error('❌ Configuration admin non trouvée. Vérifiez votre fichier .env et redémarrez le serveur.');
            
        } catch (error) {
            console.error('Erreur validation credentials:', error);
            // Afficher l'erreur à l'utilisateur au lieu d'utiliser des valeurs par défaut
            throw error;
        }
    }

    generateAuthToken() {
        return btoa(Date.now() + '-' + Math.random().toString(36).substr(2, 9));
    }

    handleLogout() {
        sessionStorage.removeItem('admin_auth_token');
        sessionStorage.removeItem('admin_auth_time');
        this.isAuthenticated = false;
        
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        this.showLoginScreen();
        this.showNotification('👋 Déconnexion réussie', 'info');
    }

    showLoginScreen() {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('admin-dashboard').style.display = 'none';
    }

    showDashboard() {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
        
        // Charger les données du dashboard avec les contrôles de date
        this.loadDashboardData();
        
        // Démarrer l'auto-refresh
        // this.startAutoRefresh(); // DÉSACTIVÉ : Rafraîchissement automatique supprimé
    }

    async loadDashboardData() {
        console.log('📊 Chargement des données du dashboard');
        
        try {
            // Initialiser le statut des données
            this.updateDataStatus('loading', '⏳ Chargement initial des données...');
            
            // Utiliser les dates par défaut stockées lors de l'initialisation
            const startDate = this.defaultStartDate;
            const endDate = this.defaultEndDate;
            
            // Charger les stats d'usage
            await this.loadUsageStatsWithDates(startDate, endDate);
            
            // Charger les données pour les graphiques et tableaux
            await this.loadCostData();
            
            // Initialiser les graphiques
            this.initializeCharts();
            
            // Mettre à jour les informations si on a des données d'usage valides
            if (this.currentUsageData && startDate && endDate) {
                this.updateDataInfo(this.currentUsageData, startDate, endDate);
                
                const statusMessage = this.getDataStatusMessage(this.currentUsageData.dataSource);
                this.updateDataStatus('success', statusMessage);
            }
            
        } catch (error) {
            console.error('Erreur chargement dashboard:', error);
            this.updateDataStatus('error', '❌ Erreur de chargement du dashboard');
            this.showNotification('❌ Erreur de chargement des données', 'error');
        } finally {
            this.hideLoadingState();
        }

        // Démarrer l'actualisation automatique
        // this.startAutoRefresh(); // DÉSACTIVÉ : Rafraîchissement automatique supprimé
    }

    async loadUsageStatsWithDates(startDate, endDate) {
        try {
            if (!this.openaiAPI) {
                 console.warn('OpenAI API non disponible, simulation des données');
                 this.simulateUsageStats();
                 return;
            }

            // Utiliser l'API wrapper avec les dates spécifiées
            const usageData = await this.openaiAPI.getUsageStats(startDate, endDate);
            
            // Vérifier si des données valides ont été retournées (pas de simulation)
            if (usageData && usageData.dataSource !== 'simulated') {
                console.log(`📊 Affichage des données réelles d'OpenAI (source: ${usageData.dataSource}).`);
                this.updateUsageStats(usageData);
                this.currentUsageData = usageData;
            } else {
                 console.warn('⚠️ Aucune donnée réelle retournée, basculement vers la simulation.');
                 // Si une erreur est attachée aux données simulées, l'afficher
                 if (usageData && usageData.error) {
                     this.showNotification(`Erreur chargement: ${usageData.error}`, 'error');
                 }
                 this.simulateUsageStats();
            }
        } catch (error) {
            console.error('❌ Erreur critique lors du chargement des stats:', error);
            this.showNotification(`Erreur: ${error.message}`, 'error');
            this.simulateUsageStats();
        }
    }

    async loadUsageStats() {
        try {
            if (this.openaiAPI) {
                // Utiliser l'API wrapper
                const usageData = await this.openaiAPI.getRecentUsage(30);
                this.updateUsageStats(usageData);
            } else {
                // Fallback sur les données simulées
                console.warn('OpenAI API non disponible, simulation des données');
                this.simulateUsageStats();
            }
        } catch (error) {
            console.warn('Erreur chargement usage stats:', error);
            this.simulateUsageStats();
        }
    }

    simulateUsageStats() {
        // Données simulées pour les tests
        const mockData = {
            monthlyRequests: Math.floor(Math.random() * 1000) + 500,
            dailyRequests: Math.floor(Math.random() * 50) + 20,
            tokensUsed: Math.floor(Math.random() * 50000) + 10000,
            monthlyCost: (Math.random() * 20 + 5),
            avgCostPerRequest: (Math.random() * 0.01 + 0.001)
        };
        
        this.updateUsageStats(mockData);
    }

    updateUsageStats(data) {
        try {
            // Assurer que les coûts sont des nombres avant de les formater
            const monthlyCost = parseFloat(data.monthlyCost);
            const avgCost = parseFloat(data.avgCostPerRequest);

            if (isNaN(monthlyCost)) {
                console.error('DataError: data.monthlyCost n\'est pas un nombre. Reçu:', data.monthlyCost);
            }
            if (isNaN(avgCost)) {
                console.error('DataError: data.avgCostPerRequest n\'est pas un nombre. Reçu:', data.avgCostPerRequest);
            }

            // Afficher le coût mensuel (toujours disponible)
            document.getElementById('monthly-cost').textContent = `$${!isNaN(monthlyCost) ? monthlyCost.toFixed(2) : 'N/A'}`;
            
            // Gestion spéciale pour les métriques selon la source des données
            if (data.dataSource === 'openai_costs_api') {
                // L'API Costs ne fournit que les coûts, pas les requêtes/tokens
                document.getElementById('daily-requests').textContent = 'N/A';
                document.getElementById('tokens-used').textContent = 'N/A';
                document.getElementById('avg-cost').textContent = 'N/A';
                
                // Ajouter des tooltips explicatifs
                document.getElementById('daily-requests').title = "Données non disponibles via l'API Costs OpenAI";
                document.getElementById('tokens-used').title = "Données non disponibles via l'API Costs OpenAI";
                document.getElementById('avg-cost').title = "Données non disponibles via l'API Costs OpenAI";
            } else {
                // Pour les autres sources (simulation, local, etc.), afficher les valeurs
                document.getElementById('daily-requests').textContent = data.dailyRequests?.toLocaleString() || '--';
                document.getElementById('tokens-used').textContent = data.tokensUsed?.toLocaleString() || '--';
                document.getElementById('avg-cost').textContent = `$${!isNaN(avgCost) ? avgCost.toFixed(4) : 'N/A'}`;
                
                // Nettoyer les tooltips
                document.getElementById('daily-requests').title = "";
                document.getElementById('tokens-used').title = "";
                document.getElementById('avg-cost').title = "";
            }

            // Mettre à jour les changements (si disponible)
            this.updateStatChange('monthly-change', data.change?.monthlyCost);
            this.updateStatChange('daily-change', data.change?.dailyRequests);
            this.updateStatChange('tokens-change', data.change?.tokensUsed);
            this.updateStatChange('avg-change', data.change?.avgCostPerRequest);

            // Afficher la source des données (maintenant géré par updateDataInfo)
            // this.updateDataSourceIndicator(data.dataSource);
            
            // Stocker les données pour référence
            this.currentUsageData = data;
        } catch (error) {
            console.error('Erreur lors de la mise à jour des statistiques:', error);
            // Ne pas rappeler simulateUsageStats ici pour éviter une boucle infinie
            // Vous pouvez afficher un message d'erreur utilisateur ou laisser les stats vides
            document.getElementById('monthly-cost').textContent = 'Erreur';
        }
    }

    updateStatChange(id, value) {
        const element = document.getElementById(id);
        if (!element) return;

        // Gestion défensive : si la valeur n'est pas un nombre, afficher "--" et appliquer la classe neutre
        const numericValue = parseFloat(value);
        if (isNaN(numericValue)) {
            element.textContent = '--';
            element.className = 'stat-change neutral';
            return;
        }

        const isPositive = numericValue > 0;
        const className = isPositive ? 'positive' : (numericValue < 0 ? 'negative' : 'neutral');
        const sign = isPositive ? '+' : '';
        element.textContent = `${sign}${numericValue.toFixed(1)}%`;
        element.className = `stat-change ${className}`;
    }

    updateDataSourceIndicator(dataSource) {
        // Créer ou mettre à jour l'indicateur de source de données
        let indicator = document.getElementById('data-source-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'data-source-indicator';
            indicator.style.cssText = `
                position: fixed;
                top: 70px;
                right: 20px;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 0.8rem;
                font-weight: 500;
                z-index: 1000;
                transition: all 0.3s ease;
            `;
            document.body.appendChild(indicator);
        }
        
        switch (dataSource) {
            case 'openai':
                indicator.textContent = '🔗 Données OpenAI API';
                indicator.style.background = '#10b981';
                indicator.style.color = 'white';
                break;
            case 'local':
                indicator.textContent = '📁 Données Locales';
                indicator.style.background = '#3b82f6';
                indicator.style.color = 'white';
                break;
            case 'simulated':
            default:
                indicator.textContent = '🎭 Données Simulées';
                indicator.style.background = '#f59e0b';
                indicator.style.color = 'white';
                break;
        }
    }

    updateStatChanges() {
        const changes = [
            { id: 'monthly-change', value: Math.random() * 20 - 10 },
            { id: 'daily-change', value: Math.random() * 40 - 20 },
            { id: 'tokens-change', value: Math.random() * 30 - 15 },
            { id: 'avg-change', value: Math.random() * 10 - 5 }
        ];
        
        changes.forEach(change => {
            const element = document.getElementById(change.id);
            const isPositive = change.value > 0;
            const className = isPositive ? 'positive' : (change.value < 0 ? 'negative' : 'neutral');
            const sign = isPositive ? '+' : '';
            
            element.textContent = `${sign}${change.value.toFixed(1)}%`;
            element.className = `stat-change ${className}`;
        });
    }

    async loadCostData() {
        // Utiliser les données de currentUsageData si disponibles
        if (this.currentUsageData && this.currentUsageData.costByDay) {
            const days = parseInt(document.getElementById('chart-period')?.value || 30);
            this.costData = this.currentUsageData.costByDay.slice(-days);
            return;
        }
        
        // Fallback : simulation de données
        const days = parseInt(document.getElementById('chart-period')?.value || 30);
        const costData = [];
        const now = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            
            costData.push({
                date: date.toISOString().split('T')[0],
                cost: Math.random() * 2 + 0.5,
                requests: Math.floor(Math.random() * 20) + 5
            });
        }
        
        this.costData = costData;
    }

    async loadModelUsage() {
        // Utiliser les données de currentUsageData si disponibles
        if (this.currentUsageData && this.currentUsageData.modelUsage) {
            this.modelData = this.currentUsageData.modelUsage;
            return;
        }
        
        // Fallback : simulation des données d'usage par modèle
        this.modelData = [
            { model: 'gpt-4o-mini', requests: 450, cost: 12.34 },
            { model: 'gpt-4', requests: 50, cost: 8.76 },
            { model: 'gpt-3.5-turbo', requests: 120, cost: 2.45 }
        ];
    }

    async loadRecentRequests() {
        try {
            if (this.openaiAPI) {
                const requests = await this.openaiAPI.getRecentRequests(10);
                this.updateRequestsTable(requests);
            } else {
                // Fallback simulation
                this.simulateRecentRequests();
            }
        } catch (error) {
            console.warn('Erreur chargement requêtes récentes:', error);
            this.simulateRecentRequests();
        }
    }

    simulateRecentRequests() {
        // Simulation des requêtes récentes
        const requests = [];
        const models = ['gpt-4o-mini', 'gpt-4', 'gpt-3.5-turbo'];
        const sources = ['recettes', 'sobre', 'admin'];
        
        for (let i = 0; i < 10; i++) {
            const now = new Date();
            now.setMinutes(now.getMinutes() - i * 15);
            
            requests.push({
                timestamp: now.toISOString(),
                model: models[Math.floor(Math.random() * models.length)],
                tokens: Math.floor(Math.random() * 1000) + 100,
                cost: (Math.random() * 0.05 + 0.001).toFixed(4),
                source: sources[Math.floor(Math.random() * sources.length)],
                status: Math.random() > 0.1 ? 'success' : 'error'
            });
        }
        
        this.updateRequestsTable(requests);
    }

    updateRequestsTable(requests) {
        const tbody = document.getElementById('requests-tbody');
        if (!tbody) return;
        
        tbody.innerHTML = requests.map(req => `
            <tr>
                <td>${new Date(req.timestamp).toLocaleString('fr-FR')}</td>
                <td>${req.model}</td>
                <td>${this.formatNumber(req.tokens)}</td>
                <td>$${req.cost}</td>
                <td>${req.source}</td>
                <td class="status-${req.status}">${req.status === 'success' ? '✅ OK' : '❌ Erreur'}</td>
            </tr>
        `).join('');
    }

    initializeCharts() {
        this.initializeCostChart();
        // this.initializeModelChart(); // SUPPRIMÉ : Graphique par modèle non nécessaire
    }

    initializeCostChart() {
        const ctx = document.getElementById('cost-chart');
        console.log('🔍 Initialisation graphique - Element canvas:', ctx);
        console.log('🔍 Données du graphique:', this.costData);
        
        if (!ctx) {
            console.error('❌ Element canvas cost-chart non trouvé');
            return;
        }
        if (!this.costData) {
            console.error('❌ Données costData non disponibles');
            return;
        }
        
        if (this.charts.cost) {
            this.charts.cost.destroy();
        }
        
        // Vérifier si les données de requêtes sont disponibles
        const hasRequestData = this.costData.every(d => d.requests !== undefined && d.requests > 0);
        console.log('🔍 Données de requêtes disponibles:', hasRequestData);
        
        const datasets = [{
            label: 'Coût quotidien ($)',
            data: this.costData.map(d => d.cost),
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            tension: 0.3,
            fill: true
        }];
        
        // N'ajouter le dataset des requêtes que si les données sont disponibles
        if (hasRequestData) {
            datasets.push({
                label: 'Requêtes',
                data: this.costData.map(d => d.requests),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.3,
                yAxisID: 'y1'
            });
        }
        
        console.log('🔍 Datasets du graphique:', datasets);
        console.log('🔍 Labels du graphique:', this.costData.map(d => d.date));
        
        try {
            this.charts.cost = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: this.costData.map(d => d.date),
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Coût ($)'
                            }
                        },
                        y1: hasRequestData ? {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: {
                                display: true,
                                text: 'Requêtes'
                            },
                            grid: {
                                drawOnChartArea: false,
                            },
                        } : undefined
                    },
                    plugins: {
                        legend: {
                            display: true
                        }
                    }
                }
            });
            
            console.log('✅ Graphique initialisé avec succès');
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation du graphique:', error);
        }
    }

    initializeModelChart() {
        const ctx = document.getElementById('model-chart');
        if (!ctx || !this.modelData) return;

        // Si pas de données de modèle, afficher un message
        if (this.modelData.length === 0) {
            const chartContainer = ctx.parentElement;
            chartContainer.innerHTML = '<div class="chart-placeholder">Données par modèle non disponibles via l\'API de facturation.</div>';
            return;
        }
        
        if (this.charts.model) {
            this.charts.model.destroy();
        }
        
        this.charts.model = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: this.modelData.map(d => d.model),
                datasets: [{
                    data: this.modelData.map(d => d.requests),
                    backgroundColor: [
                        '#2563eb',
                        '#10b981',
                        '#f59e0b',
                        '#6366f1',
                        '#ec4899'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    async updateChartsData(period) {
        await this.loadCostData();
        this.initializeCostChart();
    }

    async refreshData() {
        console.log('🔄 Actualisation des données');
        await this.loadDashboardData();
        this.showNotification('✅ Données actualisées', 'success');
    }

    startAutoRefresh() {
        // DÉSACTIVÉ : Fonction de rafraîchissement automatique supprimée
        console.log('🔕 Rafraîchissement automatique désactivé');
    }

    async getSecureAPIKey() {
        if (this.configManager) {
            return await this.configManager.getSecureAPIKey();
        }
        
        console.warn('⚠️ ConfigManager non disponible');
        return null;
    }

    showLoadingState() {
        const statsCards = document.querySelectorAll('.stat-value');
        statsCards.forEach(card => {
            card.textContent = '--';
            card.parentElement.classList.add('pulse');
        });
    }

    hideLoadingState() {
        const statsCards = document.querySelectorAll('.stat-card');
        statsCards.forEach(card => {
            card.classList.remove('pulse');
        });
    }

    showNotification(message, type = 'info') {
        // Créer une notification temporaire
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 1000;
            font-weight: 500;
            box-shadow: var(--shadow-lg);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        // Styles selon le type
        switch (type) {
            case 'success':
                notification.style.background = '#10b981';
                notification.style.color = 'white';
                break;
            case 'error':
                notification.style.background = '#ef4444';
                notification.style.color = 'white';
                break;
            case 'warning':
                notification.style.background = '#f59e0b';
                notification.style.color = 'white';
                break;
            default:
                notification.style.background = '#2563eb';
                notification.style.color = 'white';
        }
        
        document.body.appendChild(notification);
        
        // Animer l'entrée
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Supprimer après 3 secondes
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
}

// Initialisation de la console admin
document.addEventListener('DOMContentLoaded', () => {
    new AdminConsole();
});