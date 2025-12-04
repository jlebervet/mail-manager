#!/bin/bash

# Script de configuration pour déploiement on-premise
# Usage: ./setup.sh

set -e

echo "============================================"
echo "  Configuration Mail Manager Application"
echo "============================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env already exists
if [ -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Le fichier .env existe déjà.${NC}"
    read -p "Voulez-vous le remplacer? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Configuration annulée."
        exit 0
    fi
fi

echo "📝 Configuration des variables d'environnement..."
echo ""

# Azure AD Configuration
echo -e "${GREEN}1. Configuration Azure AD${NC}"
read -p "Tenant ID Azure AD: " AZURE_TENANT_ID
read -p "Client ID Azure AD: " AZURE_CLIENT_ID

# Generate scope from Client ID
AZURE_SCOPE="api://${AZURE_CLIENT_ID}/user_impersonation"
echo "Scope généré: ${AZURE_SCOPE}"
echo ""

# URLs Configuration
echo -e "${GREEN}2. Configuration des URLs${NC}"
read -p "URL du frontend (ex: https://votre-domaine.com): " FRONTEND_URL
read -p "URL du backend API (ex: https://api.votre-domaine.com): " BACKEND_URL
echo ""

# MongoDB Configuration
echo -e "${GREEN}3. Configuration MongoDB${NC}"
read -p "Nom de la base de données [mail_management_db]: " DB_NAME
DB_NAME=${DB_NAME:-mail_management_db}

read -p "Utilisateur MongoDB [admin]: " MONGO_USER
MONGO_USER=${MONGO_USER:-admin}

read -s -p "Mot de passe MongoDB: " MONGO_PASSWORD
echo ""
echo ""

# Generate MongoDB URL
MONGO_URL="mongodb://${MONGO_USER}:${MONGO_PASSWORD}@mongodb:27017"

# Ports Configuration
echo -e "${GREEN}4. Configuration des ports${NC}"
read -p "Port backend [8001]: " BACKEND_PORT
BACKEND_PORT=${BACKEND_PORT:-8001}

read -p "Port frontend [3000]: " FRONTEND_PORT
FRONTEND_PORT=${FRONTEND_PORT:-3000}

read -p "Port MongoDB [27017]: " MONGODB_PORT
MONGODB_PORT=${MONGODB_PORT:-27017}
echo ""

# Create main .env file
echo -e "${GREEN}5. Création du fichier .env principal...${NC}"
cat > .env << EOF
# ============================================
# CONFIGURATION MAIL MANAGER APPLICATION
# Généré le $(date)
# ============================================

# Azure AD
AZURE_TENANT_ID=${AZURE_TENANT_ID}
AZURE_CLIENT_ID=${AZURE_CLIENT_ID}
AZURE_SCOPE=${AZURE_SCOPE}

# URLs
REACT_APP_BACKEND_URL=${BACKEND_URL}
REACT_APP_AZURE_REDIRECT_URI=${FRONTEND_URL}

# MongoDB
MONGO_URL=${MONGO_URL}
DB_NAME=${DB_NAME}
MONGO_INITDB_ROOT_USERNAME=${MONGO_USER}
MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASSWORD}
MONGO_INITDB_DATABASE=${DB_NAME}

# Ports
BACKEND_PORT=${BACKEND_PORT}
FRONTEND_PORT=${FRONTEND_PORT}
MONGODB_PORT=${MONGODB_PORT}

# CORS
CORS_ORIGINS=${FRONTEND_URL}

# Frontend Azure AD
REACT_APP_AZURE_CLIENT_ID=${AZURE_CLIENT_ID}
REACT_APP_AZURE_TENANT_ID=${AZURE_TENANT_ID}
REACT_APP_AZURE_SCOPE=${AZURE_SCOPE}

# Features
REACT_APP_ENABLE_VISUAL_EDITS=false
ENABLE_HEALTH_CHECK=false
WDS_SOCKET_PORT=443
EOF

echo -e "${GREEN}✅ Fichier .env créé${NC}"
echo ""

# Create backend .env
echo -e "${GREEN}6. Création du fichier backend/.env...${NC}"
cat > backend/.env << EOF
MONGO_URL=${MONGO_URL}
DB_NAME=${DB_NAME}
CORS_ORIGINS=${FRONTEND_URL}
AZURE_TENANT_ID=${AZURE_TENANT_ID}
AZURE_CLIENT_ID=${AZURE_CLIENT_ID}
AZURE_SCOPE=${AZURE_SCOPE}
EOF

echo -e "${GREEN}✅ Fichier backend/.env créé${NC}"
echo ""

# Create frontend .env
echo -e "${GREEN}7. Création du fichier frontend/.env...${NC}"
cat > frontend/.env << EOF
REACT_APP_BACKEND_URL=${BACKEND_URL}
WDS_SOCKET_PORT=443
REACT_APP_ENABLE_VISUAL_EDITS=false
ENABLE_HEALTH_CHECK=false
REACT_APP_AZURE_CLIENT_ID=${AZURE_CLIENT_ID}
REACT_APP_AZURE_TENANT_ID=${AZURE_TENANT_ID}
REACT_APP_AZURE_REDIRECT_URI=${FRONTEND_URL}
REACT_APP_AZURE_SCOPE=${AZURE_SCOPE}
EOF

echo -e "${GREEN}✅ Fichier frontend/.env créé${NC}"
echo ""

# Summary
echo "============================================"
echo -e "${GREEN}✅ Configuration terminée !${NC}"
echo "============================================"
echo ""
echo "Fichiers créés :"
echo "  - .env (racine)"
echo "  - backend/.env"
echo "  - frontend/.env"
echo ""
echo "Prochaines étapes :"
echo ""
echo "1. Vérifiez que Docker est installé :"
echo "   docker --version"
echo "   docker-compose --version"
echo ""
echo "2. Lancez l'application :"
echo "   docker-compose up -d"
echo ""
echo "3. Initialisez les données :"
echo "   docker-compose exec backend python scripts/init_data.py"
echo "   docker-compose exec backend python scripts/set_first_admin.py"
echo ""
echo "4. Accédez à l'application :"
echo "   Frontend: ${FRONTEND_URL}"
echo "   Backend:  ${BACKEND_URL}"
echo "   API Docs: ${BACKEND_URL}/docs"
echo ""
echo -e "${YELLOW}⚠️  N'oubliez pas de configurer Azure AD avec ces URLs !${NC}"
echo ""
