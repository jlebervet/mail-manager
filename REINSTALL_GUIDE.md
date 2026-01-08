# ============================================
# GUIDE DE RÉINSTALLATION APRÈS SUPPRESSION DU STACK
# ============================================

## 🔍 ÉTAPE 1 : Vérifier si les Données MongoDB Existent Encore

Sur votre serveur, exécutez :

```bash
# Lister tous les volumes Docker
docker volume ls | grep mongodb

# Si vous voyez "mail-manager_mongodb_data" ou un nom similaire :
# ✅ VOS DONNÉES SONT ENCORE LÀ !

# Pour voir le contenu du volume :
docker volume inspect mail-manager_mongodb_data
```

**Si le volume existe :** Vos données peuvent être récupérées ! 🎉
**Si le volume n'existe pas :** Vous devrez repartir de zéro (mais je vais vous guider)

---

## 🚀 ÉTAPE 2 : Préparer les Fichiers pour le Redéploiement

### A. Récupérer les Fichiers depuis Git (SI vous avez poussé vers GitHub)

```bash
# Cloner votre repo
cd /opt/mail-manager
git clone https://github.com/VOTRE-REPO/votre-app.git .

# OU si déjà cloné
git pull
```

### B. OU Télécharger depuis Emergent

Si vous n'avez pas Git, téléchargez les fichiers depuis l'interface Emergent et transférez-les sur votre serveur :

```bash
# Sur votre serveur, créer le dossier
mkdir -p /opt/mail-manager
cd /opt/mail-manager

# Transférer les fichiers depuis votre machine locale
scp -r /chemin/local/votre-app/* user@votre-serveur:/opt/mail-manager/
```

---

## 📝 ÉTAPE 3 : Vérifier/Créer le Fichier .env

Créez un fichier `.env` à la racine :

```bash
nano /opt/mail-manager/.env
```

**Contenu du fichier .env :**

```env
# MongoDB Configuration
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=changeme123
MONGO_INITDB_DATABASE=mail_management_db
MONGODB_PORT=27017

# Backend Configuration
BACKEND_PORT=8888

# Frontend Configuration  
FRONTEND_PORT=3333

# Azure AD Configuration
AZURE_TENANT_ID=dd1d7dff-fcc8-45f7-8966-fbdf17b2f70a
AZURE_CLIENT_ID=3636e564-b7a6-405a-8a6f-4d5f15db49bb
AZURE_SCOPE=api://3636e564-b7a6-405a-8a6f-4d5f15db49bb/user_impersonation

# Frontend URLs (ADAPTEZ À VOTRE ENVIRONNEMENT)
REACT_APP_AZURE_CLIENT_ID=3636e564-b7a6-405a-8a6f-4d5f15db49bb
REACT_APP_AZURE_TENANT_ID=dd1d7dff-fcc8-45f7-8966-fbdf17b2f70a
REACT_APP_AZURE_REDIRECT_URI=http://VOTRE_IP_OU_DOMAINE:3333/
REACT_APP_BACKEND_URL=http://VOTRE_IP_OU_DOMAINE:8888

# CORS
CORS_ORIGINS=*
```

**Remplacez `VOTRE_IP_OU_DOMAINE` par :**
- Votre IP : `192.168.1.100` (exemple)
- OU votre domaine : `intranet.mairie.local`

**Sauvegardez :** `Ctrl+O`, `Entrée`, `Ctrl+X`

---

## 🐳 ÉTAPE 4 : Déployer le Stack dans Portainer

### Via l'Interface Portainer (RECOMMANDÉ)

**1. Ouvrir Portainer :**
```
http://votre-serveur:9000
```

**2. Aller dans Stacks :**
```
Menu → Stacks → Add stack
```

**3. Configurer le Stack :**
```
Name: mail-manager

Build method: Repository (si Git) OU Web editor

Si Web editor :
  - Copiez le contenu de docker-compose-portainer.yml
  - Collez dans l'éditeur
```

**4. Variables d'environnement :**
```
Cliquez sur "Advanced mode"

Ajoutez chaque variable du .env :
  MONGO_INITDB_ROOT_USERNAME = admin
  MONGO_INITDB_ROOT_PASSWORD = changeme123
  MONGO_INITDB_DATABASE = mail_management_db
  AZURE_TENANT_ID = dd1d7dff-fcc8-45f7-8966-fbdf17b2f70a
  AZURE_CLIENT_ID = 3636e564-b7a6-405a-8a6f-4d5f15db49bb
  ... (toutes les autres)
```

**5. Déployer :**
```
Cliquez "Deploy the stack"
Attendez 3-5 minutes
```

### Via Ligne de Commande

```bash
cd /opt/mail-manager

# Déployer avec docker-compose
docker-compose -f docker-compose-portainer.yml up -d

# Vérifier que tout tourne
docker ps
```

---

## 🔄 ÉTAPE 5 : Restaurer les Données (Si Volume Existe Encore)

**Si le volume mongodb_data existe encore :**

```bash
# Vérifier
docker volume ls | grep mongodb

# Le nouveau stack devrait automatiquement utiliser le volume existant
# Vérifiez les données :
docker exec mail-manager-mongodb mongosh \
  -u admin -p changeme123 --authenticationDatabase admin \
  --eval "
    use mail_management_db;
    print('Messages: ' + db.mails.countDocuments({}));
    print('Utilisateurs: ' + db.users.countDocuments({}));
  "
```

**Si données présentes :** ✅ Récupération réussie !

---

## 🆕 ÉTAPE 6 : Initialiser une Nouvelle Base (Si Volume Perdu)

**Si le volume n'existe plus, réinitialisez :**

```bash
# Créer les données initiales
docker exec mail-manager-backend python scripts/init_data.py

# Vérifier
docker exec mail-manager-mongodb mongosh \
  -u admin -p changeme123 --authenticationDatabase admin \
  --eval "use mail_management_db; db.users.countDocuments({})"
```

---

## ✅ ÉTAPE 7 : Vérification Finale

**1. Backend accessible :**
```bash
curl http://localhost:8888/health
# Devrait retourner quelque chose (même 401 est OK)
```

**2. Frontend accessible :**
```
Ouvrez http://VOTRE_IP:3333 dans le navigateur
```

**3. Connexion Microsoft :**
```
- Page de login avec bouton "Se connecter avec Microsoft"
- Cliquez dessus
- Connectez-vous
- Vous devenez admin (premier utilisateur)
```

**4. Testez les fonctionnalités :**
```
- Créer un message
- Section "Destinataire final" visible
- Tout fonctionne
```

---

## 📋 Checklist Complète

- [ ] Volume MongoDB vérifié
- [ ] Fichiers de l'app récupérés (Git ou téléchargement)
- [ ] Fichier .env créé avec vos valeurs
- [ ] Stack déployé dans Portainer
- [ ] Services démarrés (docker ps)
- [ ] Données vérifiées OU réinitialisées
- [ ] Backend accessible (curl)
- [ ] Frontend accessible (navigateur)
- [ ] Connexion Microsoft testée
- [ ] Premier utilisateur = admin

---

## 🆘 En Cas de Problème

**Logs Backend :**
```bash
docker logs mail-manager-backend
```

**Logs Frontend :**
```bash
docker logs mail-manager-frontend
```

**Logs MongoDB :**
```bash
docker logs mail-manager-mongodb
```

**Tous les logs :**
```bash
docker-compose -f docker-compose-portainer.yml logs
```

---

## 📞 Prêt à Commencer ?

**Dites-moi :**
1. Le volume mongodb_data existe-t-il encore ? (commande du début)
2. Avez-vous accès aux fichiers de l'application ?
3. Préférez-vous Portainer (interface) ou ligne de commande ?

**Je vous guiderai pas à pas ! 🚀**
