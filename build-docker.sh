#!/bin/bash

# Script de build des images Docker
# Usage: ./build-docker.sh [tag]

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Default tag
TAG=${1:-latest}
REGISTRY=${DOCKER_REGISTRY:-your-registry.com}

echo "============================================"
echo "  Build Docker Images - Mail Manager"
echo "============================================"
echo ""
echo "Tag: ${TAG}"
echo "Registry: ${REGISTRY}"
echo ""

# Build Backend
echo -e "${GREEN}📦 Building backend image...${NC}"
docker build -t mail-manager-backend:${TAG} ./backend
docker tag mail-manager-backend:${TAG} ${REGISTRY}/mail-manager-backend:${TAG}
echo -e "${GREEN}✅ Backend image built${NC}"
echo ""

# Build Frontend
echo -e "${GREEN}📦 Building frontend image...${NC}"
docker build -t mail-manager-frontend:${TAG} ./frontend
docker tag mail-manager-frontend:${TAG} ${REGISTRY}/mail-manager-frontend:${TAG}
echo -e "${GREEN}✅ Frontend image built${NC}"
echo ""

# Summary
echo "============================================"
echo -e "${GREEN}✅ Build completed successfully!${NC}"
echo "============================================"
echo ""
echo "Images créées :"
echo "  - mail-manager-backend:${TAG}"
echo "  - mail-manager-frontend:${TAG}"
echo ""
echo "Pour pousser vers le registry :"
echo "  docker push ${REGISTRY}/mail-manager-backend:${TAG}"
echo "  docker push ${REGISTRY}/mail-manager-frontend:${TAG}"
echo ""
echo "Pour lancer avec docker-compose :"
echo "  docker-compose up -d"
echo ""
