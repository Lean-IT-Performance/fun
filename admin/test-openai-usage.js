// Script de test pour l'API Usage d'OpenAI
// Ce script permet de tester l'intégration sans utiliser la console admin

console.log('🧪 Test de l\'API Usage OpenAI - Début des tests...\n');

// Configuration de test
const testConfig = {
    // Dates de test (30 derniers jours)
    endDate: new Date().toISOString().split('T')[0],
    startDate: (() => {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        return date.toISOString().split('T')[0];
    })()
};

console.log(`📅 Période de test: ${testConfig.startDate} → ${testConfig.endDate}\n`);

// Test 1: Vérification des variables d'environnement
async function testEnvironmentConfig() {
    console.log('🔧 Test 1: Configuration des variables d\'environnement');
    
    try {
        if (typeof process === 'undefined') {
            console.log('⚠️  Variables d\'environnement non accessibles (environnement navigateur)');
            return false;
        }

        const apiKey = process.env.OPENAI_API_KEY;
        const orgId = process.env.OPENAI_ORG_ID;

        if (!apiKey) {
            console.log('❌ OPENAI_API_KEY manquante dans .env');
            return false;
        }

        if (!orgId) {
            console.log('⚠️  OPENAI_ORG_ID manquante dans .env (optionnel mais recommandé)');
        }

        console.log(`✅ API Key configurée: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
        
        if (orgId) {
            console.log(`✅ Organisation ID configurée: ${orgId}`);
        }
        
        return true;

    } catch (error) {
        console.log(`❌ Erreur configuration: ${error.message}`);
        return false;
    }
}

// Test 2: Test de connexion basique à l'API OpenAI
async function testBasicConnection() {
    console.log('\n🌐 Test 2: Connexion basique à l\'API OpenAI');
    
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        const orgId = process.env.OPENAI_ORG_ID;
        
        const headers = {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        };

        if (orgId) {
            headers['OpenAI-Organization'] = orgId;
        }

        const response = await fetch('https://api.openai.com/v1/models', { headers });
        
        if (response.ok) {
            console.log('✅ Connexion API OpenAI réussie');
            return true;
        } else {
            console.log(`❌ Erreur connexion: ${response.status} ${response.statusText}`);
            return false;
        }

    } catch (error) {
        console.log(`❌ Erreur connexion: ${error.message}`);
        return false;
    }
}

// Test 3: Test spécifique de l'endpoint Usage
async function testUsageEndpoint() {
    console.log('\n📊 Test 3: Accès à l\'endpoint Usage');
    
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        const orgId = process.env.OPENAI_ORG_ID;
        
        const headers = {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        };

        if (orgId) {
            headers['OpenAI-Organization'] = orgId;
        }

        const response = await fetch('https://api.openai.com/v1/usage', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                start_date: testConfig.startDate,
                end_date: testConfig.endDate
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Endpoint Usage accessible');
            console.log(`📈 Données récupérées: ${data.data?.length || 0} jours de données`);
            
            if (data.data && data.data.length > 0) {
                const sample = data.data[0];
                console.log(`📊 Exemple de données:`);
                console.log(`   • Date: ${sample.aggregation_timestamp || sample.snapshot_id}`);
                console.log(`   • Requêtes: ${sample.n_requests || 0}`);
                console.log(`   • Tokens input: ${sample.n_context_tokens_total || 0}`);
                console.log(`   • Tokens output: ${sample.n_generated_tokens_total || 0}`);
            }
            
            return { success: true, data };
        } else {
            const errorText = await response.text();
            console.log(`❌ Erreur endpoint Usage: ${response.status} ${response.statusText}`);
            console.log(`   Détail: ${errorText}`);
            
            if (response.status === 403) {
                console.log('\n💡 Solution suggérée:');
                console.log('   • L\'endpoint Usage nécessite un compte organisation OpenAI');
                console.log('   • Vérifiez que votre compte a les bonnes permissions');
                console.log('   • Contactez le support OpenAI si nécessaire');
            }
            
            return { success: false, status: response.status, error: errorText };
        }

    } catch (error) {
        console.log(`❌ Erreur test endpoint: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// Test 4: Test de la classe OpenAIAPI
async function testOpenAIAPIClass() {
    console.log('\n🏗️  Test 4: Classe OpenAIAPI');
    
    try {
        // Simuler l'environnement comme dans la console admin
        if (typeof ConfigManager === 'undefined') {
            console.log('⚠️  ConfigManager non disponible, simulation...');
            
            // Mock ConfigManager pour le test
            global.ConfigManager = class {
                constructor() {
                    this.config = {
                        openai: {
                            apiKey: process.env.OPENAI_API_KEY,
                            orgId: process.env.OPENAI_ORG_ID
                        }
                    };
                }
                
                async getSecureAPIKey() {
                    return this.config.openai.apiKey;
                }
                
                getOpenAIConfig() {
                    return this.config.openai;
                }
            };
        }

        if (typeof OpenAIAPI === 'undefined') {
            console.log('❌ Classe OpenAIAPI non disponible');
            console.log('   Assurez-vous que api.js est correctement chargé');
            return false;
        }

        const configManager = new ConfigManager();
        const openaiAPI = new OpenAIAPI(configManager);
        
        console.log('✅ Classe OpenAIAPI instanciée');
        
        // Test de récupération des stats
        const usageStats = await openaiAPI.getUsageStats(testConfig.startDate, testConfig.endDate);
        
        console.log('✅ Méthode getUsageStats exécutée');
        console.log(`📊 Source des données: ${usageStats.dataSource}`);
        console.log(`💰 Coût mensuel: $${usageStats.monthlyCost}`);
        console.log(`🔢 Requêtes mensuelles: ${usageStats.monthlyRequests}`);
        console.log(`🎯 Tokens utilisés: ${usageStats.tokensUsed}`);
        
        return true;

    } catch (error) {
        console.log(`❌ Erreur test classe: ${error.message}`);
        return false;
    }
}

// Fonction principale de test
async function runAllTests() {
    console.log('🚀 Démarrage de tous les tests...\n');
    
    const results = {
        config: await testEnvironmentConfig(),
        connection: await testBasicConnection(),
        usage: await testUsageEndpoint(),
        apiClass: await testOpenAIAPIClass()
    };
    
    console.log('\n📋 Résultats des tests:');
    console.log('========================');
    console.log(`🔧 Configuration:      ${results.config ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🌐 Connexion API:      ${results.connection ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`📊 Endpoint Usage:     ${results.usage.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🏗️  Classe OpenAIAPI:  ${results.apiClass ? '✅ PASS' : '❌ FAIL'}`);
    
    const allPassed = Object.values(results).every(r => r === true || r.success === true);
    
    console.log('\n🎯 Résultat global:');
    if (allPassed) {
        console.log('✅ TOUS LES TESTS RÉUSSIS - L\'intégration est fonctionnelle !');
    } else {
        console.log('❌ CERTAINS TESTS ONT ÉCHOUÉ - Vérifiez la configuration');
    }
    
    console.log('\n📚 Consultez admin/README-OPENAI-USAGE.md pour plus d\'informations');
    
    return results;
}

// Exécution si script appelé directement
if (typeof require !== 'undefined' && require.main === module) {
    runAllTests().catch(console.error);
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runAllTests,
        testEnvironmentConfig,
        testBasicConnection,
        testUsageEndpoint,
        testOpenAIAPIClass
    };
} 