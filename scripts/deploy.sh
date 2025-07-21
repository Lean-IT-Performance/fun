#!/bin/bash

# Script de déploiement FTP pour Sobre
# Configurez vos paramètres FTP ci-dessous

# Configuration FTP (à personnaliser)
FTP_HOST="votre-serveur-ftp.com"
FTP_USER="votre-username"
FTP_PASS="votre-password"
FTP_DIR="/public_html/sobre"  # Répertoire distant

# Couleurs pour l'affichage
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Déploiement de Sobre vers FTP...${NC}"

# Vérifier que les fichiers existent
if [ ! -f "index.html" ] || [ ! -f "styles.css" ] || [ ! -f "script.js" ]; then
    echo -e "${RED}❌ Fichiers manquants. Assurez-vous d'être dans le bon répertoire.${NC}"
    exit 1
fi

# Utiliser lftp pour le déploiement
lftp -c "
set ftp:ssl-allow no
set ftp:passive-mode true
open ftp://$FTP_USER:$FTP_PASS@$FTP_HOST
cd $FTP_DIR
put index.html
put styles.css
put script.js
put CLAUDE.md
quit
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Déploiement réussi !${NC}"
    echo -e "${GREEN}📂 Fichiers déployés vers: $FTP_HOST$FTP_DIR${NC}"
else
    echo -e "${RED}❌ Erreur lors du déploiement${NC}"
    exit 1
fi