#!/bin/bash
# ============================================
# Script de Vérification MongoDB
# Vérifie si MongoDB est utilisé et son état
# ============================================

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
CONTAINER_NAME="mail-manager-mongodb"
MONGO_USER="${MONGO_INITDB_ROOT_USERNAME:-admin}"
MONGO_PASS="${MONGO_INITDB_ROOT_PASSWORD:-changeme123}"
MONGO_DB="${MONGO_INITDB_DATABASE:-mail_management_db}"

echo ""
echo "========================================"
echo "  🔍 VÉRIFICATION MONGODB"
echo "========================================"
echo ""

# 1. Vérifier si le conteneur existe et tourne
echo -e "${BLUE}1. État du conteneur${NC}"
if docker ps | grep -q $CONTAINER_NAME; then
    echo -e "   ${GREEN}✅ Conteneur MongoDB en cours d'exécution${NC}"
    
    # Obtenir les infos du conteneur
    UPTIME=$(docker ps --filter "name=$CONTAINER_NAME" --format "{{.Status}}")
    echo -e "   ${GREEN}   Uptime: $UPTIME${NC}"
else
    echo -e "   ${RED}❌ Conteneur MongoDB non trouvé ou arrêté${NC}"
    echo ""
    echo "Pour démarrer MongoDB :"
    echo "  docker-compose -f docker-compose-portainer.yml up -d mongodb"
    exit 1
fi
echo ""

# 2. Vérifier la connexion MongoDB
echo -e "${BLUE}2. Test de connexion${NC}"
if docker exec $CONTAINER_NAME mongosh --username=$MONGO_USER --password=$MONGO_PASS --authenticationDatabase=admin --quiet --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Connexion MongoDB réussie${NC}"
else
    echo -e "   ${RED}❌ Impossible de se connecter à MongoDB${NC}"
    exit 1
fi
echo ""

# 3. Vérifier si la base de données existe et contient des données
echo -e "${BLUE}3. Base de données : $MONGO_DB${NC}"

# Vérifier si la base existe
DB_EXISTS=$(docker exec $CONTAINER_NAME mongosh \
    --username=$MONGO_USER \
    --password=$MONGO_PASS \
    --authenticationDatabase=admin \
    --quiet \
    --eval "db.getMongo().getDBNames().includes('$MONGO_DB')")

if [ "$DB_EXISTS" = "true" ]; then
    echo -e "   ${GREEN}✅ Base de données existe${NC}"
else
    echo -e "   ${YELLOW}⚠️  Base de données non trouvée (elle sera créée au premier usage)${NC}"
    exit 0
fi
echo ""

# 4. Lister les collections et compter les documents
echo -e "${BLUE}4. Collections et données${NC}"

docker exec $CONTAINER_NAME mongosh \
    --username=$MONGO_USER \
    --password=$MONGO_PASS \
    --authenticationDatabase=admin \
    --quiet \
    --eval "
        use $MONGO_DB;
        var collections = db.getCollectionNames();
        var totalDocs = 0;
        
        if (collections.length === 0) {
            print('   ${YELLOW}⚠️  Aucune collection trouvée${NC}');
        } else {
            collections.forEach(function(name) {
                var count = db[name].countDocuments();
                totalDocs += count;
                var icon = count > 0 ? '${GREEN}✅' : '${YELLOW}⚠️';
                print(icon + ' ' + name + ': ' + count + ' documents${NC}');
            });
            print('');
            print('   ${GREEN}📊 Total: ' + totalDocs + ' documents dans ' + collections.length + ' collections${NC}');
        }
    "
echo ""

# 5. Vérifier les connexions actives
echo -e "${BLUE}5. Connexions actives${NC}"

CONNECTIONS=$(docker exec $CONTAINER_NAME mongosh \
    --username=$MONGO_USER \
    --password=$MONGO_PASS \
    --authenticationDatabase=admin \
    --quiet \
    --eval "db.serverStatus().connections.current" 2>/dev/null)

if [ ! -z "$CONNECTIONS" ]; then
    echo -e "   ${GREEN}🔗 $CONNECTIONS connexions actives${NC}"
else
    echo -e "   ${YELLOW}⚠️  Impossible d'obtenir le nombre de connexions${NC}"
fi
echo ""

# 6. Vérifier l'utilisation de l'espace disque
echo -e "${BLUE}6. Utilisation du stockage${NC}"

# Taille du volume Docker
VOLUME_PATH=$(docker volume inspect mail-manager_mongodb_data --format '{{.Mountpoint}}' 2>/dev/null)
if [ ! -z "$VOLUME_PATH" ]; then
    VOLUME_SIZE=$(sudo du -sh $VOLUME_PATH 2>/dev/null | cut -f1)
    if [ ! -z "$VOLUME_SIZE" ]; then
        echo -e "   ${GREEN}💾 Taille du volume: $VOLUME_SIZE${NC}"
    fi
fi

# Statistiques MongoDB
DB_STATS=$(docker exec $CONTAINER_NAME mongosh \
    --username=$MONGO_USER \
    --password=$MONGO_PASS \
    --authenticationDatabase=admin \
    --quiet \
    --eval "
        use $MONGO_DB;
        var stats = db.stats();
        print('   Taille des données: ' + (stats.dataSize / 1024 / 1024).toFixed(2) + ' MB');
        print('   Taille du stockage: ' + (stats.storageSize / 1024 / 1024).toFixed(2) + ' MB');
        print('   Nombre d\\'index: ' + stats.indexes);
    " 2>/dev/null)

echo "$DB_STATS"
echo ""

# 7. Dernière activité
echo -e "${BLUE}7. Dernière activité${NC}"

# Dernière opération dans les logs
LAST_LOG=$(docker logs $CONTAINER_NAME --tail 5 2>/dev/null | grep -E "GET|POST|PUT|DELETE" | tail -1)
if [ ! -z "$LAST_LOG" ]; then
    echo -e "   ${GREEN}📝 Dernière opération détectée dans les logs${NC}"
else
    echo -e "   ${YELLOW}ℹ️  Pas d'opération récente dans les logs${NC}"
fi

# Dernier document créé (si la collection mails existe)
LAST_MAIL=$(docker exec $CONTAINER_NAME mongosh \
    --username=$MONGO_USER \
    --password=$MONGO_PASS \
    --authenticationDatabase=admin \
    --quiet \
    --eval "
        use $MONGO_DB;
        if (db.mails) {
            var lastMail = db.mails.find().sort({created_at: -1}).limit(1).toArray()[0];
            if (lastMail) {
                print('   ${GREEN}📬 Dernier message: ' + lastMail.reference + ' (' + lastMail.created_at + ')${NC}');
            }
        }
    " 2>/dev/null)

if [ ! -z "$LAST_MAIL" ]; then
    echo "$LAST_MAIL"
fi
echo ""

# 8. Résumé final
echo "========================================"
echo -e "${GREEN}✅ MONGODB EST UTILISÉ ET FONCTIONNEL${NC}"
echo "========================================"
echo ""
echo "Pour plus de détails :"
echo "  - Logs MongoDB    : docker logs $CONTAINER_NAME"
echo "  - Console MongoDB : docker exec -it $CONTAINER_NAME mongosh -u $MONGO_USER -p"
echo "  - Statistiques    : docker stats $CONTAINER_NAME"
echo ""
