# ============================================
# PROCÉDURE PAS À PAS - RECRÉER LE STACK DANS PORTAINER
# ============================================

## 📋 ÉTAPE 1 : Vérifier si le Volume MongoDB Existe

**Commande à exécuter sur votre serveur :**

```bash
docker volume ls | grep mongodb
```

**✅ Si vous voyez** : `mail-manager_mongodb_data` ou similaire
→ VOS DONNÉES SONT SAUVEGARDÉES ! Passez à l'étape 2.

**❌ Si aucun résultat** :
→ Les données sont perdues. Vous repartirez de zéro (je vous guiderai).

---

## 📂 ÉTAPE 2 : Récupérer les Fichiers depuis GitHub

**Sur votre serveur :**

```bash
# Créer/vider le dossier de travail
mkdir -p /opt/mail-manager
cd /opt/mail-manager

# Si le dossier contient déjà des fichiers :
rm -rf * .git

# Cloner votre repo GitHub
git clone https://github.com/VOTRE-UTILISATEUR/VOTRE-REPO.git .

# Vérifier que les fichiers sont bien là
ls -la
# Vous devriez voir : backend/ frontend/ docker-compose-portainer.yml etc.
```

---

## 🌐 ÉTAPE 3 : Ouvrir Portainer

**Dans votre navigateur :**

```
http://VOTRE_IP_SERVEUR:9000
OU
http://VOTRE_DOMAINE:9000
```

**Connectez-vous avec vos identifiants Portainer**

---

## ➕ ÉTAPE 4 : Créer un Nouveau Stack

**Navigation dans Portainer :**

```
1. Menu de gauche → "Stacks"
2. Cliquez sur le bouton "+ Add stack" (en haut à droite)
```

---

## 📝 ÉTAPE 5 : Configurer le Stack - Informations de Base

**Dans le formulaire qui s'ouvre :**

**1. Name :**
```
mail-manager
```

**2. Build method :**
```
Sélectionnez : "Web editor" (l'onglet du milieu)
```

---

## 📄 ÉTAPE 6 : Copier le Contenu docker-compose

**Dans la zone de texte "Web editor" :**

**Copiez-collez EXACTEMENT ce contenu :**

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: mail-manager-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_INITDB_ROOT_USERNAME:-admin}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_INITDB_ROOT_PASSWORD:-changeme123}
      MONGO_INITDB_DATABASE: ${MONGO_INITDB_DATABASE:-mail_management_db}
    ports:
      - "${MONGODB_PORT:-27017}:27017"
    volumes:
      - mongodb_data:/data/db
    networks:
      - mail-manager-network
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 20s

  backend:
    build:
      context: https://github.com/VOTRE-UTILISATEUR/VOTRE-REPO.git#main:backend
      dockerfile: Dockerfile
    container_name: mail-manager-backend
    restart: unless-stopped
    environment:
      - MONGO_URL=mongodb://${MONGO_INITDB_ROOT_USERNAME:-admin}:${MONGO_INITDB_ROOT_PASSWORD:-changeme123}@mongodb:27017
      - DB_NAME=${MONGO_INITDB_DATABASE:-mail_management_db}
      - CORS_ORIGINS=${CORS_ORIGINS:-*}
      - AZURE_TENANT_ID=${AZURE_TENANT_ID}
      - AZURE_CLIENT_ID=${AZURE_CLIENT_ID}
      - AZURE_SCOPE=${AZURE_SCOPE}
      - JWT_SECRET=${JWT_SECRET:-fallback_secret_key_2025}
    ports:
      - "${BACKEND_PORT:-8888}:8888"
    depends_on:
      mongodb:
        condition: service_healthy
    networks:
      - mail-manager-network
    command: uvicorn server:app --host 0.0.0.0 --port 8888

  frontend:
    build:
      context: https://github.com/VOTRE-UTILISATEUR/VOTRE-REPO.git#main:frontend
      dockerfile: Dockerfile.simple
      args:
        - REACT_APP_BACKEND_URL=${REACT_APP_BACKEND_URL}
        - REACT_APP_AZURE_CLIENT_ID=${REACT_APP_AZURE_CLIENT_ID}
        - REACT_APP_AZURE_TENANT_ID=${REACT_APP_AZURE_TENANT_ID}
        - REACT_APP_AZURE_REDIRECT_URI=${REACT_APP_AZURE_REDIRECT_URI}
        - REACT_APP_AZURE_SCOPE=${REACT_APP_AZURE_SCOPE}
    container_name: mail-manager-frontend
    restart: unless-stopped
    ports:
      - "${FRONTEND_PORT:-3333}:80"
    depends_on:
      - backend
    networks:
      - mail-manager-network

networks:
  mail-manager-network:
    driver: bridge

volumes:
  mongodb_data:
    driver: local
```

**⚠️ IMPORTANT : Remplacez `VOTRE-UTILISATEUR/VOTRE-REPO` par votre vrai repo GitHub !**

Exemple : `https://github.com/jeanmairie/gestion-messages.git#main:backend`

---

## 🔧 ÉTAPE 7 : Configurer les Variables d'Environnement

**Scrollez vers le bas jusqu'à "Environment variables"**

**Cliquez sur "Advanced mode"**

**Dans la zone de texte, copiez-collez :**

```env
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=changeme123
MONGO_INITDB_DATABASE=mail_management_db
MONGODB_PORT=27017
BACKEND_PORT=8888
FRONTEND_PORT=3333
CORS_ORIGINS=*
AZURE_TENANT_ID=dd1d7dff-fcc8-45f7-8966-fbdf17b2f70a
AZURE_CLIENT_ID=3636e564-b7a6-405a-8a6f-4d5f15db49bb
AZURE_SCOPE=api://3636e564-b7a6-405a-8a6f-4d5f15db49bb/user_impersonation
JWT_SECRET=fallback_secret_key_2025
REACT_APP_AZURE_CLIENT_ID=3636e564-b7a6-405a-8a6f-4d5f15db49bb
REACT_APP_AZURE_TENANT_ID=dd1d7dff-fcc8-45f7-8966-fbdf17b2f70a
REACT_APP_AZURE_SCOPE=api://3636e564-b7a6-405a-8a6f-4d5f15db49bb/user_impersonation
```

**⚠️ ADAPTEZ CES DEUX VARIABLES À VOTRE SERVEUR :**

```env
REACT_APP_BACKEND_URL=http://VOTRE_IP_OU_DOMAINE:8888
REACT_APP_AZURE_REDIRECT_URI=http://VOTRE_IP_OU_DOMAINE:3333/
```

**Exemples :**
- Si IP : `REACT_APP_BACKEND_URL=http://192.168.1.100:8888`
- Si domaine : `REACT_APP_BACKEND_URL=http://intranet.mairie.local:8888`

---

## 🚀 ÉTAPE 8 : Déployer le Stack

**En bas de la page :**

1. **Cochez** : "Pull latest image versions" (pour forcer le build)

2. **Cliquez** : "Deploy the stack"

3. **Attendez** : 3-5 minutes (le build peut prendre du temps)

**Vous verrez :**
```
Building backend...
Building frontend...
Creating network...
Creating volume...
Starting mongodb...
Starting backend...
Starting frontend...
```

---

## ✅ ÉTAPE 9 : Vérifier que Tout Fonctionne

**1. Vérifier les conteneurs :**

```
Dans Portainer :
Containers → Vous devriez voir :
  ✅ mail-manager-mongodb (running)
  ✅ mail-manager-backend (running)  
  ✅ mail-manager-frontend (running)
```

**2. Vérifier les logs :**

```
Stacks → mail-manager → Logs
Regardez s'il y a des erreurs en rouge
```

**3. Tester l'accès :**

```
Dans votre navigateur :
http://VOTRE_IP:3333

Vous devriez voir la page de login avec "Se connecter avec Microsoft"
```

---

## 💾 ÉTAPE 10 : Récupérer ou Initialiser les Données

### **Cas A : Le Volume MongoDB Existe Encore**

**Vérifier que les données sont là :**

```bash
docker exec mail-manager-mongodb mongosh \
  -u admin -p changeme123 --authenticationDatabase admin \
  --eval "
    use mail_management_db;
    print('Messages: ' + db.mails.countDocuments({}));
    print('Utilisateurs: ' + db.users.countDocuments({}));
    print('Services: ' + db.services.countDocuments({}));
  "
```

**Si vous voyez vos données :** ✅ Tout est récupéré ! Passez à l'étape 11.

### **Cas B : Nouvelle Base de Données Vide**

**Initialiser les données de base :**

```bash
# Créer les services et utilisateurs de base
docker exec mail-manager-backend python scripts/init_data.py

# Vérifier
docker exec mail-manager-mongodb mongosh \
  -u admin -p changeme123 --authenticationDatabase admin \
  --eval "use mail_management_db; db.services.countDocuments({})"
```

**OU restaurer un backup (si vous en aviez un) :**

```bash
# Lister les backups
ls -lh /opt/mail-manager/backups/

# Restaurer le dernier
docker cp /opt/mail-manager/backups/backup_XXXXX.archive mail-manager-mongodb:/tmp/
docker exec mail-manager-mongodb mongorestore \
  -u admin -p changeme123 --authenticationDatabase admin \
  --db mail_management_db \
  --drop \
  --archive=/tmp/backup_XXXXX.archive
```

---

## 🔐 ÉTAPE 11 : Première Connexion

**1. Ouvrez l'application :**
```
http://VOTRE_IP:3333
```

**2. Cliquez "Se connecter avec Microsoft"**

**3. Connectez-vous avec votre compte Microsoft**

**4. Vérifiez :**
```
✅ Vous êtes redirigé vers le dashboard
✅ Vous êtes admin (premier utilisateur Azure AD)
✅ Les menus admin sont visibles
```

**5. Vérifiez la section destinataire final :**
```
- Nouveau message entrant
- Section Destinataire(s)
- ✅ Section bleue "Destinataire final (optionnel)" visible
```

---

## 🐛 ÉTAPE 12 : En Cas de Problème

### **Problème : Build Failed**

```bash
# Voir les logs de build
docker logs mail-manager-backend
docker logs mail-manager-frontend
```

**Solution courante :** Vérifier que l'URL GitHub est correcte

### **Problème : Frontend ne Build Pas**

Si le build échoue avec des erreurs de dépendances :

**Modifiez le docker-compose et changez :**
```yaml
# AU LIEU DE
dockerfile: Dockerfile.simple

# UTILISEZ
dockerfile: Dockerfile
```

### **Problème : Connexion MongoDB Failed**

```bash
# Vérifier que MongoDB tourne
docker ps | grep mongodb

# Voir les logs
docker logs mail-manager-mongodb

# Tester la connexion
docker exec mail-manager-mongodb mongosh -u admin -p changeme123
```

### **Problème : 502 Bad Gateway**

```
Attendez 2-3 minutes que les services démarrent complètement
Le backend peut prendre du temps à charger la config Azure AD
```

---

## 📞 Support

**Logs utiles :**

```bash
# Tous les logs du stack
docker-compose -f /opt/mail-manager/docker-compose-portainer.yml logs

# Backend seulement
docker logs mail-manager-backend --tail 100

# Frontend seulement  
docker logs mail-manager-frontend --tail 50

# MongoDB seulement
docker logs mail-manager-mongodb --tail 30
```

---

## ✅ Checklist Finale

- [ ] Volume MongoDB vérifié
- [ ] Fichiers récupérés depuis GitHub
- [ ] docker-compose-portainer.yml copié dans Web editor
- [ ] URL GitHub remplacée (VOTRE-UTILISATEUR/VOTRE-REPO)
- [ ] Variables d'environnement configurées
- [ ] REACT_APP_BACKEND_URL et REACT_APP_AZURE_REDIRECT_URI adaptés à votre IP/domaine
- [ ] Stack déployé
- [ ] 3 conteneurs en "running"
- [ ] Application accessible (http://VOTRE_IP:3333)
- [ ] Connexion Microsoft testée
- [ ] Données vérifiées ou réinitialisées
- [ ] Section "Destinataire final" visible

---

## 🎯 Résumé en 3 Étapes

**1. Vérifier le volume :** `docker volume ls | grep mongodb`

**2. Dans Portainer :**
   - Stacks → Add stack
   - Nom : `mail-manager`
   - Web editor → Copier le docker-compose ci-dessus
   - Variables d'environnement → Copier les variables
   - Deploy

**3. Tester :**
   - http://VOTRE_IP:3333
   - Se connecter avec Microsoft
   - Vérifier les fonctionnalités

---

**Suivez cette procédure et tenez-moi informé à chaque étape ! Je suis là pour vous aider.** 🚀
