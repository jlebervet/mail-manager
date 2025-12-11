# ============================================
# GUIDE RAPIDE - Vérifier MongoDB sur Docker On-Premise
# ============================================

## 🎯 Vous Avez Demandé : Comment Vérifier si MongoDB est Utilisé ?

### ✅ Réponse Courte

**Vos données MongoDB sont dans un VOLUME DOCKER persistant.**
Même si vous ne voyez pas de dossier `/app`, vos données sont bien là !

---

## 🔍 Commandes de Vérification sur Votre Serveur

### 1. Vérifier que MongoDB tourne

```bash
# Vérifier le conteneur MongoDB
docker ps | grep mongodb

# Devrait afficher :
# mail-manager-mongodb   Up X minutes   0.0.0.0:27017->27017/tcp
```

### 2. Vérifier les Données dans MongoDB

```bash
# Se connecter à MongoDB et voir les collections
docker exec mail-manager-mongodb mongosh \
  --username=admin \
  --password=changeme123 \
  --authenticationDatabase=admin \
  --eval "use mail_management_db; db.getCollectionNames()"

# Compter les documents
docker exec mail-manager-mongodb mongosh \
  --username=admin \
  --password=changeme123 \
  --authenticationDatabase=admin \
  --eval "
    use mail_management_db;
    print('users: ' + db.users.countDocuments());
    print('mails: ' + db.mails.countDocuments());
    print('correspondents: ' + db.correspondents.countDocuments());
    print('services: ' + db.services.countDocuments());
  "
```

### 3. Voir les Derniers Messages

```bash
docker exec mail-manager-mongodb mongosh \
  --username=admin \
  --password=changeme123 \
  --authenticationDatabase=admin \
  --eval "
    use mail_management_db;
    db.mails.find().sort({created_at: -1}).limit(5).forEach(function(m) {
      print(m.reference + ' - ' + m.subject);
    });
  "
```

### 4. Vérifier l'Espace Utilisé par MongoDB

```bash
# Trouver où sont stockées les données
docker volume inspect mail-manager_mongodb_data

# Résultat typique :
# "Mountpoint": "/var/lib/docker/volumes/mail-manager_mongodb_data/_data"

# Voir la taille
docker exec mail-manager-mongodb mongosh \
  --username=admin \
  --password=changeme123 \
  --authenticationDatabase=admin \
  --eval "use mail_management_db; db.stats()"
```

### 5. Console Interactive MongoDB

```bash
# Ouvrir une console MongoDB
docker exec -it mail-manager-mongodb mongosh \
  --username=admin \
  --password=changeme123 \
  --authenticationDatabase=admin

# Une fois dans la console :
use mail_management_db;
show collections;
db.mails.countDocuments();
db.users.find().pretty();
exit
```

---

## 📍 Où Sont VOS Données ?

### Dans l'Environnement Docker/Portainer

Vos données NE SONT PAS dans `/app` !

Elles sont dans un **volume Docker** :
- **Nom du volume** : `mail-manager_mongodb_data`
- **Emplacement physique** : `/var/lib/docker/volumes/mail-manager_mongodb_data/_data`

Ce volume est **indépendant des conteneurs** :
- ✅ Survit aux mises à jour du code
- ✅ Survit aux rebuilds
- ✅ Survit aux redémarrages
- ❌ Supprimé seulement si vous faites `docker-compose down -v` (flag -v)

---

## 🔐 Vérifier la Persistance

### Test 1 : Redémarrer MongoDB sans perte

```bash
# 1. Compter les messages actuels
docker exec mail-manager-mongodb mongosh \
  --username=admin --password=changeme123 \
  --authenticationDatabase=admin \
  --eval "use mail_management_db; print(db.mails.countDocuments())"
# Résultat : X messages

# 2. Redémarrer le conteneur
docker restart mail-manager-mongodb

# 3. Attendre 10 secondes
sleep 10

# 4. Recompter - DOIT être identique
docker exec mail-manager-mongodb mongosh \
  --username=admin --password=changeme123 \
  --authenticationDatabase=admin \
  --eval "use mail_management_db; print(db.mails.countDocuments())"
# Résultat : X messages (même nombre)
```

### Test 2 : Vérifier le Volume Docker

```bash
# Lister les volumes
docker volume ls | grep mongodb

# Devrait afficher :
# local     mail-manager_mongodb_data

# Inspecter le volume
docker volume inspect mail-manager_mongodb_data

# Vérifier que "Mountpoint" existe
```

---

## 📊 Dashboard de Vérification Complet

Créez ce script sur votre serveur : `/opt/mail-manager/check-db.sh`

```bash
#!/bin/bash
echo "=========================================="
echo "  🔍 VÉRIFICATION MONGODB"
echo "=========================================="
echo ""

# Conteneur
echo "1. Conteneur:"
docker ps | grep mongodb && echo "   ✅ Running" || echo "   ❌ Stopped"
echo ""

# Volume
echo "2. Volume:"
docker volume ls | grep mongodb_data && echo "   ✅ Exists" || echo "   ❌ Missing"
echo ""

# Données
echo "3. Collections:"
docker exec mail-manager-mongodb mongosh \
  --username=admin --password=changeme123 \
  --authenticationDatabase=admin \
  --quiet \
  --eval "
    use mail_management_db;
    db.getCollectionNames().forEach(c => {
      print('   ' + c + ': ' + db[c].countDocuments() + ' docs');
    });
  "
echo ""

# Taille
echo "4. Stockage:"
docker exec mail-manager-mongodb mongosh \
  --username=admin --password=changeme123 \
  --authenticationDatabase=admin \
  --quiet \
  --eval "
    use mail_management_db;
    var s = db.stats();
    print('   ' + (s.dataSize/1024/1024).toFixed(2) + ' MB');
  "
echo ""
echo "=========================================="
echo "✅ Vérification terminée"
echo "=========================================="
```

**Rendre exécutable :**
```bash
chmod +x /opt/mail-manager/check-db.sh
```

**Utiliser :**
```bash
/opt/mail-manager/check-db.sh
```

---

## ⚠️ IMPORTANT : Configuration pour Portainer

### Vos Fichiers Docker Actuels

Vous avez deux fichiers docker-compose :
1. **`docker-compose.yml`** - Pour développement local
2. **`docker-compose-portainer.yml`** - Pour déploiement Portainer ✅ (CELUI À UTILISER)

### Dans Portainer

Vos données sont dans le volume défini dans `docker-compose-portainer.yml` :

```yaml
volumes:
  mongodb_data:
    driver: local
```

**Vérifier dans Portainer :**
1. Portainer > Volumes
2. Chercher `mail-manager_mongodb_data` ou `[nom-stack]_mongodb_data`
3. Cliquer dessus → Voir la taille utilisée

---

## ✅ Résumé

**Pour vérifier si MongoDB est utilisé sur votre serveur Docker :**

**Méthode Rapide (1 commande) :**
```bash
docker exec mail-manager-mongodb mongosh \
  --username=admin --password=changeme123 \
  --authenticationDatabase=admin \
  --eval "use mail_management_db; db.getCollectionNames().forEach(c => print(c + ': ' + db[c].countDocuments()))"
```

**Méthode Via Portainer (Interface Web) :**
1. Containers > mail-manager-mongodb > Console
2. Taper : `mongosh -u admin -p changeme123`
3. Taper : `use mail_management_db`
4. Taper : `db.mails.countDocuments()`

**Vos données SONT bien sauvegardées dans le volume Docker !** 🎯
