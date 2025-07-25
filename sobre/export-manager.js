/**
 * 📊 Export Manager - Gestionnaire d'export PDF et sauvegarde galerie
 * Gère l'export des graphiques BAC en PDF et la sauvegarde en galerie mobile
 */

class ExportManager {
    constructor() {
        this.jsPDF = window.jspdf?.jsPDF;
        this.html2canvas = window.html2canvas;
        this.isSupported = this.checkSupport();
        
        this.init();
    }
    
    /**
     * Vérifie le support des fonctionnalités d'export
     */
    checkSupport() {
        const support = {
            jsPDF: !!this.jsPDF,
            html2canvas: !!this.html2canvas,
            webShare: !!navigator.share,
            download: !!document.createElement('a').download
        };
        
        console.log('📊 Support d\'export :', support);
        return support;
    }
    
    /**
     * Initialise le gestionnaire d'export
     */
    init() {
        if (!this.isSupported.jsPDF || !this.isSupported.html2canvas) {
            console.warn('📊 Bibliothèques d\'export manquantes');
            return;
        }
        
        this.bindEvents();
        console.log('📊 Export Manager initialisé');
    }
    
    /**
     * Lie les événements aux boutons d'export
     */
    bindEvents() {
        const exportPdfBtn = document.getElementById('export-pdf');
        const saveToGalleryBtn = document.getElementById('save-to-gallery');
        const exportHistoryBtn = document.getElementById('export-history');
        
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', () => this.exportChartToPDF());
        }
        
        if (saveToGalleryBtn) {
            saveToGalleryBtn.addEventListener('click', () => this.saveToMobileGallery());
        }
        
        if (exportHistoryBtn) {
            exportHistoryBtn.addEventListener('click', () => this.exportHistoryToPDF());
        }
    }
    
    /**
     * Exporte le graphique actuel en PDF
     */
    async exportChartToPDF() {
        try {
            this.showLoadingState('export-pdf', true);
            
            const chartContainer = document.querySelector('.chart-container');
            const canvas = document.getElementById('bac-chart');
            
            if (!canvas || !chartContainer) {
                throw new Error('Graphique non trouvé');
            }
            
            // Créer une capture du graphique avec les informations contextuelles
            const exportContainer = await this.createExportContainer();
            
            // Générer l'image avec html2canvas
            const canvasImg = await this.html2canvas(exportContainer, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: true,
                allowTaint: true,
                width: 800,
                height: 600
            });
            
            // Créer le PDF
            const pdf = new this.jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });
            
            // Ajouter les métadonnées
            this.addPDFMetadata(pdf);
            
            // Ajouter l'en-tête
            this.addPDFHeader(pdf);
            
            // Ajouter le graphique
            const imgData = canvasImg.toDataURL('image/png');
            const imgWidth = 250;
            const imgHeight = (canvasImg.height * imgWidth) / canvasImg.width;
            
            pdf.addImage(imgData, 'PNG', 20, 40, imgWidth, Math.min(imgHeight, 150));
            
            // Ajouter les informations de session
            this.addSessionInfo(pdf, 40 + Math.min(imgHeight, 150) + 10);
            
            // Ajouter le disclaimer
            this.addDisclaimer(pdf);
            
            // Télécharger le PDF
            const filename = this.generateFilename('graphique-bac');
            pdf.save(filename);
            
            this.showSuccessMessage('Graphique exporté en PDF avec succès !');
            
        } catch (error) {
            console.error('Erreur lors de l\'export PDF :', error);
            this.showErrorMessage('Erreur lors de l\'export PDF : ' + error.message);
        } finally {
            this.showLoadingState('export-pdf', false);
        }
    }
    
    /**
     * Sauvegarde le graphique en galerie mobile
     */
    async saveToMobileGallery() {
        try {
            this.showLoadingState('save-to-gallery', true);
            
            const chartContainer = document.querySelector('.chart-container');
            if (!chartContainer) {
                throw new Error('Graphique non trouvé');
            }
            
            // Créer le conteneur d'export
            const exportContainer = await this.createExportContainer();
            
            // Générer l'image
            const canvas = await this.html2canvas(exportContainer, {
                backgroundColor: '#ffffff',
                scale: 3, // Haute résolution pour mobile
                useCORS: true,
                allowTaint: true,
                width: 800,
                height: 800
            });
            
            // Convertir en blob
            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/png', 0.95);
            });
            
            // Essayer différentes méthodes de sauvegarde
            if (this.isSupported.webShare && navigator.canShare && navigator.canShare({ files: [new File([blob], 'graphique.png', { type: 'image/png' })] })) {
                // Web Share API (recommandé sur mobile)
                await this.shareToGallery(blob);
            } else {
                // Fallback : téléchargement direct
                await this.downloadImage(blob);
            }
            
            this.showSuccessMessage('Image sauvegardée avec succès !');
            
        } catch (error) {
            console.error('Erreur lors de la sauvegarde :', error);
            this.showErrorMessage('Erreur lors de la sauvegarde : ' + error.message);
        } finally {
            this.showLoadingState('save-to-gallery', false);
        }
    }
    
    /**
     * Exporte l'historique complet des sessions en PDF
     */
    async exportHistoryToPDF() {
        try {
            this.showLoadingState('export-history', true);
            
            // Récupérer l'historique des sessions
            const history = this.getSessionHistory();
            
            if (!history || history.length === 0) {
                throw new Error('Aucun historique disponible');
            }
            
            // Créer le PDF d'historique
            const pdf = new this.jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            this.addPDFMetadata(pdf);
            this.addHistoryHeader(pdf);
            
            let yPosition = 40;
            
            // Ajouter chaque session
            history.forEach((session, index) => {
                if (yPosition > 250) {
                    pdf.addPage();
                    yPosition = 20;
                }
                
                yPosition = this.addSessionToHistory(pdf, session, yPosition);
                yPosition += 10;
            });
            
            this.addDisclaimer(pdf);
            
            const filename = this.generateFilename('historique-sobre');
            pdf.save(filename);
            
            this.showSuccessMessage('Historique exporté en PDF avec succès !');
            
        } catch (error) {
            console.error('Erreur lors de l\'export historique :', error);
            this.showErrorMessage('Erreur lors de l\'export : ' + error.message);
        } finally {
            this.showLoadingState('export-history', false);
        }
    }
    
    /**
     * Crée un conteneur optimisé pour l'export
     */
    async createExportContainer() {
        const container = document.createElement('div');
        container.style.cssText = `
            background: white;
            padding: 20px;
            width: 800px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            position: absolute;
            top: -9999px;
            left: -9999px;
        `;
        
        // Titre
        const title = document.createElement('h2');
        title.textContent = 'Graphique de Taux d\'Alcoolémie - Sobre';
        title.style.cssText = 'text-align: center; color: #2d3748; margin-bottom: 20px; font-size: 24px;';
        container.appendChild(title);
        
        // Informations de session
        const sessionInfo = this.getCurrentSessionInfo();
        if (sessionInfo) {
            const info = document.createElement('div');
            info.innerHTML = sessionInfo;
            info.style.cssText = 'background: #f7fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 14px;';
            container.appendChild(info);
        }
        
        // Cloner le graphique
        const originalChart = document.querySelector('.chart-container');
        const chartClone = originalChart.cloneNode(true);
        chartClone.style.cssText = 'background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);';
        container.appendChild(chartClone);
        
        // Ajouter timestamp
        const timestamp = document.createElement('div');
        timestamp.textContent = `Généré le ${new Date().toLocaleString('fr-FR')}`;
        timestamp.style.cssText = 'text-align: center; color: #718096; font-size: 12px; margin-top: 15px;';
        container.appendChild(timestamp);
        
        document.body.appendChild(container);
        
        // Attendre que le rendu soit terminé
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return container;
    }
    
    /**
     * Partage l'image via Web Share API
     */
    async shareToGallery(blob) {
        const file = new File([blob], this.generateFilename('graphique-bac', 'png'), {
            type: 'image/png'
        });
        
        await navigator.share({
            title: 'Graphique Sobre - Taux d\'Alcoolémie',
            text: 'Mon graphique de taux d\'alcoolémie généré par Sobre',
            files: [file]
        });
    }
    
    /**
     * Télécharge l'image (fallback)
     */
    async downloadImage(blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.generateFilename('graphique-bac', 'png');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    /**
     * Génère un nom de fichier unique
     */
    generateFilename(prefix, extension = 'pdf') {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
        return `${prefix}-${dateStr}-${timeStr}.${extension}`;
    }
    
    /**
     * Ajoute les métadonnées au PDF
     */
    addPDFMetadata(pdf) {
        pdf.setProperties({
            title: 'Graphique Sobre - Taux d\'Alcoolémie',
            subject: 'Analyse du taux d\'alcoolémie',
            author: 'Sobre - Fun Lean IT Performance',
            creator: 'Sobre App',
            producer: 'jsPDF'
        });
    }
    
    /**
     * Ajoute l'en-tête du PDF
     */
    addPDFHeader(pdf) {
        pdf.setFontSize(20);
        pdf.setTextColor(45, 55, 72);
        pdf.text('Rapport de Taux d\'Alcoolémie', 148, 20, { align: 'center' });
        
        pdf.setFontSize(12);
        pdf.setTextColor(113, 128, 150);
        pdf.text(`Généré le ${new Date().toLocaleString('fr-FR')}`, 148, 30, { align: 'center' });
    }
    
    /**
     * Ajoute les informations de session au PDF
     */
    addSessionInfo(pdf, yPosition) {
        const sessionInfo = this.getCurrentSessionInfo();
        if (!sessionInfo) return yPosition;
        
        pdf.setFontSize(14);
        pdf.setTextColor(45, 55, 72);
        pdf.text('Informations de la session :', 20, yPosition);
        
        pdf.setFontSize(10);
        pdf.setTextColor(74, 85, 104);
        
        const lines = sessionInfo.split('<br>').map(line => line.replace(/<[^>]*>/g, ''));
        lines.forEach((line, index) => {
            if (line.trim()) {
                pdf.text(line, 25, yPosition + 10 + (index * 5));
            }
        });
        
        return yPosition + 10 + (lines.length * 5);
    }
    
    /**
     * Ajoute le disclaimer au PDF
     */
    addDisclaimer(pdf) {
        const pageHeight = pdf.internal.pageSize.height;
        
        pdf.setFontSize(8);
        pdf.setTextColor(160, 174, 192);
        
        const disclaimer = [
            'AVERTISSEMENT : Cette application fournit des estimations uniquement.',
            'Ne vous fiez jamais à ces calculs pour prendre le volant.',
            'Consultez toujours un professionnel de santé.',
            '',
            'Généré par Sobre - Fun Lean IT Performance'
        ];
        
        disclaimer.forEach((line, index) => {
            pdf.text(line, 148, pageHeight - 20 + (index * 3), { align: 'center' });
        });
    }
    
    /**
     * Récupère les informations de la session actuelle
     */
    getCurrentSessionInfo() {
        if (!window.sobreApp || !window.sobreApp.currentSession) {
            return null;
        }
        
        const app = window.sobreApp;
        const profile = app.userProfile;
        const session = app.currentSession;
        
        const info = [
            `<strong>Profil :</strong> ${profile.weight}kg, ${profile.gender === 'male' ? 'Homme' : 'Femme'}`,
            `<strong>Type de conducteur :</strong> ${this.getDriverTypeLabel(profile.driverType)}`,
            `<strong>Session débutée :</strong> ${new Date(session.startTime).toLocaleString('fr-FR')}`,
            `<strong>Nombre de consommations :</strong> ${app.drinks.length}`,
            `<strong>Taux actuel :</strong> ${app.calculateCurrentBAC().toFixed(2)} g/L`
        ];
        
        const nextSober = app.calculateSobernessTime();
        if (nextSober) {
            info.push(`<strong>Sobriété estimée :</strong> ${nextSober.toLocaleString('fr-FR')}`);
        }
        
        return info.join('<br>');
    }
    
    /**
     * Récupère l'historique des sessions
     */
    getSessionHistory() {
        try {
            const history = JSON.parse(localStorage.getItem('sobre_history') || '[]');
            return history.slice(-10); // Dernières 10 sessions
        } catch (error) {
            console.warn('Impossible de récupérer l\'historique :', error);
            return [];
        }
    }
    
    /**
     * Libellé du type de conducteur
     */
    getDriverTypeLabel(type) {
        const labels = {
            'experienced': 'Conducteur expérimenté',
            'apprentice': 'Conducteur apprenti',
            'professional': 'Conducteur professionnel',
            'none': 'Ne conduit pas'
        };
        return labels[type] || type;
    }
    
    /**
     * Affiche un état de chargement sur un bouton
     */
    showLoadingState(buttonId, loading) {
        const button = document.getElementById(buttonId);
        if (!button) return;
        
        if (loading) {
            button.disabled = true;
            button.classList.add('loading');
            const originalText = button.textContent;
            button.setAttribute('data-original-text', originalText);
            button.innerHTML = '<span class="loading-spinner"></span> Génération...';
        } else {
            button.disabled = false;
            button.classList.remove('loading');
            const originalText = button.getAttribute('data-original-text');
            if (originalText) {
                button.textContent = originalText;
            }
        }
    }
    
    /**
     * Affiche un message de succès
     */
    showSuccessMessage(message) {
        this.showToast(message, 'success');
    }
    
    /**
     * Affiche un message d'erreur
     */
    showErrorMessage(message) {
        this.showToast(message, 'error');
    }
    
    /**
     * Affiche un toast de notification
     */
    showToast(message, type = 'info') {
        // Créer le toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#4299e1'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        // Animation d'entrée
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        // Suppression automatique
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// Initialisation automatique
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.exportManager = new ExportManager();
    });
} else {
    window.exportManager = new ExportManager();
}

// Export pour utilisation en module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExportManager;
}