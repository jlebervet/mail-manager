#!/bin/bash
# ============================================
# Script de Backup Automatique MongoDB
# Pour l'application de Gestion de Messages
# ============================================

# Configuration
BACKUP_DIR="/opt/mail-manager/backups"
CONTAINER_NAME="mail-manager-mongodb"
MONGO_USER="${MONGO_INITDB_ROOT_USERNAME:-admin}"
MONGO_PASS="${MONGO_INITDB_ROOT_PASSWORD:-changeme123}"
MONGO_DB="${MONGO_INITDB_DATABASE:-mail_management_db}"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Couleurs pour les messages
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction de log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERREUR:${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ATTENTION:${NC} $1"
}

# Vérifier si le conteneur existe et tourne
if ! docker ps | grep -q $CONTAINER_NAME; then
    error "Le conteneur MongoDB '$CONTAINER_NAME' n'est pas en cours d'exécution"
    exit 1
fi

log "Début du backup MongoDB"

# Créer le dossier de backup s'il n'existe pas
mkdir -p $BACKUP_DIR

# Vérifier l'espace disque disponible
AVAILABLE_SPACE=$(df -BG $BACKUP_DIR | awk 'NR==2 {print $4}' | sed 's/G//')
if [ "$AVAILABLE_SPACE" -lt 1 ]; then
    error "Espace disque insuffisant (moins de 1GB disponible)"
    exit 1
fi

log "Création du backup..."

# Backup MongoDB avec mongodump
if docker exec $CONTAINER_NAME mongodump \
    --username=$MONGO_USER \
    --password=$MONGO_PASS \
    --db=$MONGO_DB \
    --archive=/tmp/backup_$DATE.archive \
    --quiet; then
    
    log "Dump MongoDB créé avec succès"
    
    # Copier le backup hors du conteneur
    if docker cp $CONTAINER_NAME:/tmp/backup_$DATE.archive $BACKUP_DIR/; then
        log "Backup copié vers $BACKUP_DIR/backup_$DATE.archive"
        
        # Nettoyer le backup temporaire dans le conteneur
        docker exec $CONTAINER_NAME rm /tmp/backup_$DATE.archive
        
        # Obtenir la taille du backup
        BACKUP_SIZE=$(du -h $BACKUP_DIR/backup_$DATE.archive | cut -f1)
        log "Taille du backup : $BACKUP_SIZE"
        
        # Nettoyer les anciens backups (garder seulement les N derniers jours)
        log "Nettoyage des backups de plus de $RETENTION_DAYS jours..."
        find $BACKUP_DIR -name "backup_*.archive" -type f -mtime +$RETENTION_DAYS -delete
        
        # Compter les backups restants
        BACKUP_COUNT=$(ls -1 $BACKUP_DIR/backup_*.archive 2>/dev/null | wc -l)
        log "Nombre de backups conservés : $BACKUP_COUNT"
        
        # Créer un lien symbolique vers le dernier backup
        ln -sf $BACKUP_DIR/backup_$DATE.archive $BACKUP_DIR/latest.archive
        
        log "✅ Backup terminé avec succès !"
        
        # Afficher la liste des backups
        echo ""
        echo "📋 Liste des backups disponibles :"
        ls -lh $BACKUP_DIR/backup_*.archive | awk '{print "  " $9 " (" $5 ")"}'
        echo ""
        
        exit 0
    else
        error "Échec de la copie du backup hors du conteneur"
        exit 1
    fi
else
    error "Échec de la création du dump MongoDB"
    exit 1
fi
