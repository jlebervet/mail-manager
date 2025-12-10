# 🗄️ Guide de Sauvegarde et Persistance MongoDB
# Pour Déploiement Docker On-Premise avec Portainer

## ✅ Votre Configuration Actuelle

**Bonne nouvelle !** Votre `docker-compose-portainer.yml` est déjà configuré pour la persistance :

```yaml
volumes:
  mongodb_data:
    driver: local
```

Le volume `mongodb_data` est mappé à `/data/db` dans le conteneur MongoDB (ligne 41).
**Cela signifie que vos données survivent automatiquement aux mises à jour du code !**

---

## 📋 Ce qui est Conservé vs Perdu

### ✅ CONSERVÉ Automatiquement (grâce au volume)
- ✅ Tous vos messages
- ✅ Tous vos correspondants
- ✅ Tous vos services
- ✅ Tous vos utilisateurs
- ✅ Historique complet des workflows
- ✅ Pièces jointes

### ❌ PERDU si vous supprimez le volume
- ❌ Suppression manuelle du volume via Portainer
- ❌ Commande `docker-compose down -v` (avec le flag -v)
- ❌ Suppression complète du stack dans Portainer

---

## 🔄 Mises à Jour SANS Perte de Données

### Scénario 1 : Mise à jour du code (Backend/Frontend)

```bash
# Dans Portainer :
# Stacks > mail-manager > Editor > Update the stack
# ✅ Les données MongoDB sont CONSERVÉES
```

**Pourquoi ?** Le volume `mongodb_data` est indépendant des conteneurs backend/frontend.

### Scénario 2 : Rebuild complet de l'application

```bash
# Même avec "Re-pull images" et "Re-deploy"
# ✅ Les données MongoDB sont CONSERVÉES
```

### Scénario 3 : Arrêt/Redémarrage du serveur

```bash
sudo reboot
# Après redémarrage :
# ✅ Les données MongoDB sont CONSERVÉES
```

---

## 💾 Stratégie de Backup Recommandée

### Option 1 : Backup Automatique avec Script (RECOMMANDÉ)

Créez un script de backup automatique sur votre serveur :

```bash
#!/bin/bash
# /opt/mail-manager/backup-mongodb.sh

# Configuration
BACKUP_DIR="/opt/mail-manager/backups"
CONTAINER_NAME="mail-manager-mongodb"
MONGO_USER="admin"
MONGO_PASS="changeme123"
MONGO_DB="mail_management_db"
DATE=$(date +%Y%m%d_%H%M%S)

# Créer le dossier de backup
mkdir -p $BACKUP_DIR

# Backup MongoDB avec mongodump
docker exec $CONTAINER_NAME mongodump \
  --username=$MONGO_USER \
  --password=$MONGO_PASS \
  --db=$MONGO_DB \
  --archive=/tmp/backup_$DATE.archive

# Copier le backup hors du conteneur
docker cp $CONTAINER_NAME:/tmp/backup_$DATE.archive $BACKUP_DIR/

# Nettoyer le backup temporaire dans le conteneur
docker exec $CONTAINER_NAME rm /tmp/backup_$DATE.archive

# Garder seulement les 7 derniers backups
cd $BACKUP_DIR
ls -t | tail -n +8 | xargs -r rm

echo "✅ Backup terminé : $BACKUP_DIR/backup_$DATE.archive"
```

**Rendre le script exécutable :**
```bash
chmod +x /opt/mail-manager/backup-mongodb.sh
```

**Tester le backup :**
```bash
/opt/mail-manager/backup-mongodb.sh
```

### Option 2 : Backup Automatique Quotidien avec Cron

```bash
# Éditer le crontab
sudo crontab -e

# Ajouter cette ligne (backup tous les jours à 2h du matin)
0 2 * * * /opt/mail-manager/backup-mongodb.sh >> /var/log/mongodb-backup.log 2>&1
```

### Option 3 : Backup Manuel via Portainer

1. **Via Console Portainer :**
   ```bash
   # Containers > mail-manager-mongodb > Console > Connect
   mongodump --username=admin --password=changeme123 --db=mail_management_db --archive=/tmp/backup.archive
   ```

2. **Copier le backup hors du conteneur :**
   ```bash
   # Sur votre serveur hôte
   docker cp mail-manager-mongodb:/tmp/backup.archive ./backup_$(date +%Y%m%d).archive
   ```

### Option 4 : Export du Volume via Portainer

1. Aller dans **Portainer > Volumes**
2. Sélectionner `mail-manager_mongodb_data`
3. Cliquer sur **Export**
4. Télécharger l'archive

---

## 🔙 Restauration d'un Backup

### Méthode 1 : Avec mongorestore (RECOMMANDÉ)

```bash
# 1. Copier le backup dans le conteneur
docker cp backup_20250109.archive mail-manager-mongodb:/tmp/

# 2. Restaurer avec mongorestore
docker exec mail-manager-mongodb mongorestore \
  --username=admin \
  --password=changeme123 \
  --db=mail_management_db \
  --archive=/tmp/backup_20250109.archive

# 3. Nettoyer
docker exec mail-manager-mongodb rm /tmp/backup_20250109.archive
```

### Méthode 2 : Restauration complète du volume

```bash
# 1. Arrêter le stack
docker-compose -f docker-compose-portainer.yml down

# 2. Restaurer le volume depuis une archive
docker run --rm -v mail-manager_mongodb_data:/data -v $(pwd):/backup \
  alpine sh -c "cd /data && tar xzf /backup/mongodb_backup.tar.gz"

# 3. Redémarrer le stack
docker-compose -f docker-compose-portainer.yml up -d
```

---

## 🎯 Bonnes Pratiques

### 1. Backups Réguliers
✅ **Quotidien** : Backups automatiques via cron
✅ **Avant mise à jour** : Backup manuel
✅ **Rétention** : Garder au moins 7 jours de backups

### 2. Stockage des Backups
✅ **Local** : `/opt/mail-manager/backups`
✅ **NAS/Externe** : Copie sur serveur de fichiers
✅ **Cloud** : Synchronisation vers cloud (Dropbox, S3, etc.)

### 3. Tests de Restauration
✅ **Mensuel** : Tester la restauration d'un backup
✅ **Documentation** : Documenter la procédure

### 4. Monitoring
✅ **Espace disque** : Vérifier régulièrement
✅ **Logs de backup** : Surveiller les erreurs

---

## 📊 Vérifier l'Emplacement des Données

### Trouver où sont stockées vos données sur le serveur

```bash
# Inspecter le volume
docker volume inspect mail-manager_mongodb_data

# Résultat :
# "Mountpoint": "/var/lib/docker/volumes/mail-manager_mongodb_data/_data"
```

### Vérifier l'espace utilisé

```bash
# Taille du volume MongoDB
du -sh /var/lib/docker/volumes/mail-manager_mongodb_data/_data

# Espace disque disponible
df -h /var/lib/docker/volumes
```

---

## 🚨 Cas d'Urgence : Récupération après Suppression

### Si vous avez supprimé le volume par erreur

1. **STOP** : Ne redémarrez pas les conteneurs
2. **Restauration** : Utilisez le dernier backup
3. **Procédure** :
   ```bash
   # 1. Recréer le volume
   docker volume create mail-manager_mongodb_data
   
   # 2. Restaurer depuis backup (voir section Restauration)
   
   # 3. Redémarrer le stack
   docker-compose -f docker-compose-portainer.yml up -d
   ```

---

## 📝 Checklist de Mise à Jour Sécurisée

Avant chaque mise à jour majeure :

- [ ] 1. **Backup** : Créer un backup manuel
  ```bash
  /opt/mail-manager/backup-mongodb.sh
  ```

- [ ] 2. **Vérification** : Confirmer que le backup existe
  ```bash
  ls -lh /opt/mail-manager/backups/
  ```

- [ ] 3. **Mise à jour** : Mettre à jour via Portainer
  ```
  Stacks > Editor > Update the stack
  ```

- [ ] 4. **Test** : Vérifier que l'application fonctionne
  ```
  - Connexion OK ?
  - Messages visibles ?
  - Création de message OK ?
  ```

- [ ] 5. **Confirmation** : Si problème, restaurer le backup

---

## 🔐 Sécurité des Backups

### Chiffrement des Backups (Optionnel mais recommandé)

```bash
# Chiffrer un backup avec GPG
gpg --symmetric --cipher-algo AES256 backup_20250109.archive

# Déchiffrer
gpg backup_20250109.archive.gpg
```

### Permissions Strictes

```bash
# Sécuriser le dossier de backups
sudo chmod 700 /opt/mail-manager/backups
sudo chown root:root /opt/mail-manager/backups
```

---

## 📞 Support et Documentation

**En cas de problème :**
1. Consulter les logs : `docker logs mail-manager-mongodb`
2. Vérifier l'état du volume : `docker volume inspect mail-manager_mongodb_data`
3. Tester la connexion MongoDB : `docker exec mail-manager-mongodb mongosh`

**Ressources :**
- MongoDB Backup : https://www.mongodb.com/docs/manual/core/backups/
- Docker Volumes : https://docs.docker.com/storage/volumes/
- Portainer Docs : https://docs.portainer.io/

---

## ✅ Résumé

**Vos données sont DÉJÀ protégées grâce au volume Docker `mongodb_data` !**

**Pour une protection optimale :**
1. ✅ Mettre en place des backups automatiques quotidiens
2. ✅ Stocker les backups hors du serveur
3. ✅ Tester la restauration régulièrement
4. ✅ Toujours faire un backup avant une mise à jour majeure

**Vos données survivent automatiquement à :**
- ✅ Mise à jour du code
- ✅ Rebuild des conteneurs
- ✅ Redémarrage du serveur
- ✅ Mise à jour de Docker
