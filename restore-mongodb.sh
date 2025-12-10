#!/bin/bash
# ============================================
# Script de Restauration MongoDB
# Pour l'application de Gestion de Messages
# ============================================

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
BACKUP_DIR="/opt/mail-manager/backups"
CONTAINER_NAME="mail-manager-mongodb"
MONGO_USER="${MONGO_INITDB_ROOT_USERNAME:-admin}"
MONGO_PASS="${MONGO_INITDB_ROOT_PASSWORD:-changeme123}"
MONGO_DB="${MONGO_INITDB_DATABASE:-mail_management_db}"

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERREUR:${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ATTENTION:${NC} $1"
}

# Fonction d'aide
show_usage() {
    echo ""
    echo "Usage: $0 [BACKUP_FILE]"
    echo ""
    echo "Arguments:"
    echo "  BACKUP_FILE  Chemin vers le fichier de backup (optionnel)"
    echo "               Si non spécifié, utilise le dernier backup"
    echo ""
    echo "Exemples:"
    echo "  $0                                    # Restaure le dernier backup"
    echo "  $0 /opt/mail-manager/backups/backup_20250109_143022.archive"
    echo ""
}

# Vérifier si le conteneur existe
if ! docker ps | grep -q $CONTAINER_NAME; then
    error "Le conteneur MongoDB '$CONTAINER_NAME' n'est pas en cours d'exécution"
    exit 1
fi

# Déterminer quel backup restaurer
if [ -z "$1" ]; then
    # Utiliser le dernier backup
    if [ -L "$BACKUP_DIR/latest.archive" ]; then
        BACKUP_FILE=$(readlink -f $BACKUP_DIR/latest.archive)
        log "Utilisation du dernier backup : $BACKUP_FILE"
    else
        # Chercher le dernier backup par date
        BACKUP_FILE=$(ls -t $BACKUP_DIR/backup_*.archive 2>/dev/null | head -1)
        if [ -z "$BACKUP_FILE" ]; then
            error "Aucun backup trouvé dans $BACKUP_DIR"
            show_usage
            exit 1
        fi
        log "Dernier backup trouvé : $BACKUP_FILE"
    fi
else
    BACKUP_FILE="$1"
    if [ ! -f "$BACKUP_FILE" ]; then
        error "Le fichier de backup n'existe pas : $BACKUP_FILE"
        show_usage
        exit 1
    fi
fi

# Afficher les informations du backup
BACKUP_SIZE=$(du -h $BACKUP_FILE | cut -f1)
BACKUP_DATE=$(stat -c %y $BACKUP_FILE | cut -d. -f1)
echo ""
echo "📦 Informations du backup :"
echo "   Fichier : $BACKUP_FILE"
echo "   Taille  : $BACKUP_SIZE"
echo "   Date    : $BACKUP_DATE"
echo ""

# Demander confirmation
warning "Cette opération va REMPLACER toutes les données actuelles !"
echo -n "Êtes-vous sûr de vouloir continuer ? (oui/non) : "
read CONFIRMATION

if [ "$CONFIRMATION" != "oui" ]; then
    log "Restauration annulée par l'utilisateur"
    exit 0
fi

log "Début de la restauration..."

# Copier le backup dans le conteneur
BACKUP_NAME=$(basename $BACKUP_FILE)
log "Copie du backup dans le conteneur..."
if ! docker cp $BACKUP_FILE $CONTAINER_NAME:/tmp/$BACKUP_NAME; then
    error "Échec de la copie du backup dans le conteneur"
    exit 1
fi

# Restaurer avec mongorestore
log "Restauration de la base de données..."
if docker exec $CONTAINER_NAME mongorestore \
    --username=$MONGO_USER \
    --password=$MONGO_PASS \
    --db=$MONGO_DB \
    --drop \
    --archive=/tmp/$BACKUP_NAME \
    --quiet; then
    
    log "Restauration réussie !"
    
    # Nettoyer le fichier temporaire
    docker exec $CONTAINER_NAME rm /tmp/$BACKUP_NAME
    
    # Vérifier les collections
    log "Vérification des données..."
    echo ""
    docker exec $CONTAINER_NAME mongosh \
        --username=$MONGO_USER \
        --password=$MONGO_PASS \
        --authenticationDatabase=admin \
        --eval "
            use $MONGO_DB;
            print('📊 Collections restaurées :');
            db.getCollectionNames().forEach(function(name) {
                var count = db[name].countDocuments();
                print('  - ' + name + ': ' + count + ' documents');
            });
        " --quiet
    
    echo ""
    log "✅ Restauration terminée avec succès !"
    warning "Pensez à redémarrer l'application si nécessaire"
    echo ""
    
    exit 0
else
    error "Échec de la restauration"
    docker exec $CONTAINER_NAME rm /tmp/$BACKUP_NAME 2>/dev/null
    exit 1
fi
