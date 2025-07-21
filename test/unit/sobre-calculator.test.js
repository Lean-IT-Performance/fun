// Tests unitaires pour le calculateur d'alcoolémie Sobre

// Mock de la classe SobreApp pour tests
class SobreCalculator {
    // Formule de Widmark : BAC = ((A × 0.8) / (W × r)) × 0.1 - (β × t)
    calculateBAC(drinks, profile, timeElapsed) {
        const r = profile.gender === 'male' ? 0.68 : 0.55;
        const beta = 0.015; // Taux d'élimination par heure
        
        let totalAlcohol = 0;
        drinks.forEach(drink => {
            totalAlcohol += drink.pureAlcohol;
        });
        
        // Convertir le volume d'alcool pur en grammes (densité = 0.789)
        const alcoholGrams = totalAlcohol * 0.789;

        // Calcul du BAC en g/L
        const rawBac = (alcoholGrams / (profile.weight * r)) * 0.1;
        const bac = rawBac - (beta * timeElapsed);
        
        return Math.max(0, bac);
    }
    
    // Calculer le temps jusqu'à sobriété
    calculateSobrietyTime(currentBAC) {
        const beta = 0.015;
        return currentBAC / beta;
    }
    
    // Ajuster selon l'état digestif
    adjustForDigestiveState(bac, state) {
        const factors = {
            'empty': 1.0,
            'eating': 0.7,
            'full': 0.5
        };
        return bac * (factors[state] || 1.0);
    }
    
    // Vérifier si peut conduire
    canDrive(bac, driverType) {
        const limits = {
            'experienced': 0.05,
            'apprentice': 0.02,
            'professional': 0.02,
            'none': null
        };
        
        const limit = limits[driverType];
        if (limit === null) return true;
        return bac < limit;
    }
}

// Tests
describe('Sobre Calculator Tests', () => {
    let calculator;
    
    beforeEach(() => {
        calculator = new SobreCalculator();
    });
    
    describe('Calcul du BAC', () => {
        test('Calcul basique pour homme', () => {
            const drinks = [{ pureAlcohol: 13.2 }]; // 330ml bière à 5%
            const profile = { weight: 70, gender: 'male' };
            const bac = calculator.calculateBAC(drinks, profile, 0);
            
            expect(bac).toBeCloseTo(0.022, 3);
        });
        
        test('Calcul basique pour femme', () => {
            const drinks = [{ pureAlcohol: 13.2 }];
            const profile = { weight: 60, gender: 'female' };
            const bac = calculator.calculateBAC(drinks, profile, 0);
            
            expect(bac).toBeCloseTo(0.032, 3);
        });
        
        test('Plusieurs boissons', () => {
            const drinks = [
                { pureAlcohol: 13.2 }, // Bière
                { pureAlcohol: 15.6 }  // Vin
            ];
            const profile = { weight: 75, gender: 'male' };
            const bac = calculator.calculateBAC(drinks, profile, 0);
            
            expect(bac).toBeCloseTo(0.045, 3);
        });
        
        test('Élimination dans le temps', () => {
            const drinks = [{ pureAlcohol: 20 }];
            const profile = { weight: 70, gender: 'male' };
            
            // BAC après 2 heures
            const bacAfter2h = calculator.calculateBAC(drinks, profile, 2);
            expect(bacAfter2h).toBeCloseTo(0.003, 3);
        });
        
        test('BAC ne peut pas être négatif', () => {
            const drinks = [{ pureAlcohol: 10 }];
            const profile = { weight: 80, gender: 'male' };
            
            // Après 10 heures, BAC devrait être 0
            const bac = calculator.calculateBAC(drinks, profile, 10);
            expect(bac).toBe(0);
        });
    });
    
    describe('Temps de sobriété', () => {
        test('Calcul du temps jusqu\'à 0', () => {
            const time = calculator.calculateSobrietyTime(0.045);
            expect(time).toBeCloseTo(3, 1); // 3 heures
        });
        
        test('Temps pour BAC élevé', () => {
            const time = calculator.calculateSobrietyTime(0.150);
            expect(time).toBeCloseTo(10, 1); // 10 heures
        });
    });
    
    describe('État digestif', () => {
        test('Estomac vide - pas de changement', () => {
            const bac = 0.030;
            const adjusted = calculator.adjustForDigestiveState(bac, 'empty');
            expect(adjusted).toBe(0.030);
        });
        
        test('En mangeant - réduction 30%', () => {
            const bac = 0.030;
            const adjusted = calculator.adjustForDigestiveState(bac, 'eating');
            expect(adjusted).toBeCloseTo(0.021, 3);
        });
        
        test('Estomac plein - réduction 50%', () => {
            const bac = 0.030;
            const adjusted = calculator.adjustForDigestiveState(bac, 'full');
            expect(adjusted).toBeCloseTo(0.015, 3);
        });
    });
    
    describe('Limites de conduite', () => {
        test('Conducteur expérimenté', () => {
            expect(calculator.canDrive(0.04, 'experienced')).toBe(true);
            expect(calculator.canDrive(0.06, 'experienced')).toBe(false);
        });
        
        test('Jeune conducteur', () => {
            expect(calculator.canDrive(0.01, 'apprentice')).toBe(true);
            expect(calculator.canDrive(0.03, 'apprentice')).toBe(false);
        });
        
        test('Conducteur professionnel', () => {
            expect(calculator.canDrive(0.01, 'professional')).toBe(true);
            expect(calculator.canDrive(0.03, 'professional')).toBe(false);
        });
        
        test('Pas de conduite', () => {
            expect(calculator.canDrive(0.10, 'none')).toBe(true);
        });
    });
});

// Export pour Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SobreCalculator };
} 