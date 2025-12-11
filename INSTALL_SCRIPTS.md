# ============================================
# INSTALLATION DES SCRIPTS SUR VOTRE SERVEUR
# ============================================

## 📦 Étape 1 : Créer la Structure sur Votre Serveur

Sur votre serveur on-premise, exécutez :

```bash
# Créer le dossier principal
sudo mkdir -p /opt/mail-manager/backups
sudo mkdir -p /opt/mail-manager/scripts

# Définir les permissions
sudo chmod 755 /opt/mail-manager
sudo chmod 700 /opt/mail-manager/backups
```

---

## 📥 Étape 2 : Copier les Scripts

### Option A : Via Git (RECOMMANDÉ)

Si vous utilisez Git pour gérer votre code :

```bash
# Sur votre machine locale, dans votre repo
# Les scripts sont déjà dans /app/, poussez-les vers Git
git add backup-mongodb.sh restore-mongodb.sh check-mongodb-simple.sh BACKUP_GUIDE.md
git commit -m "Ajout scripts de backup MongoDB"
git push

# Sur votre serveur, clonez ou pullez
cd /opt/mail-manager
git clone <votre-repo-git> .
# OU si déjà cloné
git pull

# Copier les scripts
sudo cp backup-mongodb.sh restore-mongodb.sh check-mongodb-simple.sh scripts/
```

### Option B : Copie Manuelle via SCP

Depuis votre machine locale où vous avez téléchargé les fichiers :

```bash
# Télécharger les scripts depuis Emergent
# (utilisez l'interface Emergent ou copiez le contenu)

# Puis copiez vers votre serveur
scp backup-mongodb.sh restore-mongodb.sh check-mongodb-simple.sh user@votre-serveur:/tmp/

# Sur votre serveur
ssh user@votre-serveur
sudo mv /tmp/*.sh /opt/mail-manager/scripts/
```

### Option C : Créer Directement sur le Serveur

Connectez-vous à votre serveur et créez les fichiers avec le contenu fourni ci-dessous.

---

## 📝 Étape 3 : Contenu des Scripts pour Docker/Portainer

### Script 1 : `/opt/mail-manager/scripts/backup-mongodb.sh`

```bash
#!/bin/bash
# ============================================
# Script de Backup MongoDB - Docker/Portainer
# ============================================

# Configuration
BACKUP_DIR="/opt/mail-manager/backups"
CONTAINER_NAME="mail-manager-mongodb"
MONGO_USER="admin"
MONGO_PASS="changeme123"
MONGO_DB="mail_management_db"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERREUR:${NC} $1"
}

# Vérifier si le conteneur existe
if ! docker ps | grep -q $CONTAINER_NAME; then
    error "Le conteneur MongoDB '$CONTAINER_NAME' n'est pas en cours d'exécution"
    exit 1
fi

log "Début du backup MongoDB"
mkdir -p $BACKUP_DIR

# Créer le backup
log "Création du backup..."
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
        
        # Nettoyer
        docker exec $CONTAINER_NAME rm /tmp/backup_$DATE.archive
        
        # Taille
        BACKUP_SIZE=$(du -h $BACKUP_DIR/backup_$DATE.archive | cut -f1)
        log "Taille du backup : $BACKUP_SIZE"
        
        # Nettoyer anciens backups
        log "Nettoyage des backups de plus de $RETENTION_DAYS jours..."
        find $BACKUP_DIR -name "backup_*.archive" -type f -mtime +$RETENTION_DAYS -delete
        
        # Lien vers le dernier
        ln -sf $BACKUP_DIR/backup_$DATE.archive $BACKUP_DIR/latest.archive
        
        log "✅ Backup terminé avec succès !"
        
        # Liste des backups
        echo ""
        echo "📋 Backups disponibles :"
        ls -lh $BACKUP_DIR/backup_*.archive | awk '{print "  " $9 " (" $5 ")"}'
        echo ""
        
        exit 0
    else
        error "Échec de la copie du backup"
        exit 1
    fi
else
    error "Échec de la création du dump"
    exit 1
fi
```

### Script 2 : `/opt/mail-manager/scripts/check-mongodb.sh`

```bash
#!/bin/bash
# ============================================
# Script de Vérification MongoDB - Docker
# ============================================

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

CONTAINER_NAME="mail-manager-mongodb"
MONGO_USER="admin"
MONGO_PASS="changeme123"
MONGO_DB="mail_management_db"

echo ""
echo "========================================"
echo "  🔍 VÉRIFICATION MONGODB"
echo "========================================"
echo ""

# 1. Vérifier le conteneur
echo -e "${BLUE}1. État du conteneur${NC}"
if docker ps | grep -q $CONTAINER_NAME; then
    echo -e "   ${GREEN}✅ Conteneur MongoDB en cours d'exécution${NC}"
    UPTIME=$(docker ps --filter "name=$CONTAINER_NAME" --format "{{.Status}}")
    echo -e "   ${GREEN}   Status: $UPTIME${NC}"
else
    echo -e "   ${YELLOW}⚠️  Conteneur non trouvé${NC}"
    exit 1
fi
echo ""

# 2. Test de connexion
echo -e "${BLUE}2. Test de connexion${NC}"
if docker exec $CONTAINER_NAME mongosh --username=$MONGO_USER --password=$MONGO_PASS --authenticationDatabase=admin --quiet --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Connexion réussie${NC}"
else
    echo -e "   ${YELLOW}⚠️  Impossible de se connecter${NC}"
    exit 1
fi
echo ""

# 3. Collections et données
echo -e "${BLUE}3. Base de données: $MONGO_DB${NC}"
echo ""

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
            print('   ⚠️  Aucune collection');
        } else {
            collections.forEach(function(name) {
                var count = db[name].countDocuments();
                totalDocs += count;
                var icon = count > 0 ? '✅' : '⚠️';
                var spaces = '                    '.substring(0, 20 - name.length);
                print('   ' + icon + ' ' + name + spaces + ': ' + count + ' documents');
            });
            print('');
            print('   📊 TOTAL: ' + totalDocs + ' documents dans ' + collections.length + ' collections');
        }
    "
echo ""

# 4. Utilisation du stockage
echo -e "${BLUE}4. Utilisation du stockage${NC}"
docker exec $CONTAINER_NAME mongosh \
    --username=$MONGO_USER \
    --password=$MONGO_PASS \
    --authenticationDatabase=admin \
    --quiet \
    --eval "
        use $MONGO_DB;
        var stats = db.stats();
        print('   💾 Taille données : ' + (stats.dataSize / 1024 / 1024).toFixed(2) + ' MB');
        print('   💾 Taille stockage: ' + (stats.storageSize / 1024 / 1024).toFixed(2) + ' MB');
    "
echo ""

echo "========================================"
echo -e "${GREEN}✅ MONGODB EST ACTIF${NC}"
echo "========================================"
echo ""
