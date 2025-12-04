# 🚀 Guide de Déploiement avec Portainer.io

Guide complet pour déployer l'application Mail Manager sur votre serveur Docker local via Portainer Stacks.

---

## 📋 Prérequis

- ✅ Serveur avec Docker installé
- ✅ Portainer.io installé et accessible
- ✅ Accès au code source de l'application (GitHub)
- ✅ Informations Azure AD (Tenant ID, Client ID)

### Installation de Portainer (si pas déjà installé)

```bash
# Créer un volume pour Portainer
docker volume create portainer_data

# Installer Portainer
docker run -d -p 9000:9000 -p 9443:9443 \
  --name portainer \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

Accédez à Portainer : **http://votre-serveur:9000**

---

## 🎯 Étape par Étape - Déploiement via Stack

### **Étape 1 : Préparer les Fichiers sur votre Serveur**

```bash
# 1. Cloner le dépôt (ou copier les fichiers)
git clone <votre-repo-github>
cd mail-manager

# 2. Créer un dossier pour les volumes
sudo mkdir -p /opt/mail-manager/mongodb
sudo chmod -R 755 /opt/mail-manager
```

---

### **Étape 2 : Accéder à Portainer**

1. Ouvrez votre navigateur
2. Allez sur : **http://votre-serveur:9000** (ou https://votre-serveur:9443)
3. Connectez-vous avec vos identifiants Portainer
4. Sélectionnez votre **environnement local** (généralement "local")

---

### **Étape 3 : Créer une Nouvelle Stack**

1. Dans le menu de gauche, cliquez sur **"Stacks"**
2. Cliquez sur **"+ Add stack"** (bouton bleu en haut à droite)
3. Donnez un nom à votre stack : **`mail-manager`**

---

### **Étape 4 : Ajouter le docker-compose.yml**

#### **Option A : Web editor (Recommandé pour débuter)**

Copiez-collez le contenu du fichier `docker-compose-portainer.yml` (voir ci-dessous) dans l'éditeur web de Portainer.

#### **Option B : Upload depuis fichier**

1. Cliquez sur l'onglet **"Upload"**
2. Sélectionnez le fichier `docker-compose-portainer.yml`
3. Cliquez sur **"Upload file"**

#### **Option C : Git repository**

1. Cliquez sur l'onglet **"Git Repository"**
2. Entrez l'URL de votre repo : `https://github.com/votre-compte/mail-manager`
3. Compose path : `docker-compose-portainer.yml`
4. (Optionnel) Authentification si repo privé

---

### **Étape 5 : Configurer les Variables d'Environnement**

Descendez dans la section **"Environment variables"** et ajoutez :

#### **Variables Obligatoires :**

| Nom | Valeur | Description |
|-----|--------|-------------|
| `AZURE_TENANT_ID` | `dd1d7dff-fcc8-45f7-8966-fbdf17b2f70a` | Votre Tenant ID Azure |
| `AZURE_CLIENT_ID` | `3636e564-b7a6-405a-8a6f-4d5f15db49bb` | Votre Client ID Azure |
| `AZURE_SCOPE` | `api://3636e564-b7a6-405a-8a6f-4d5f15db49bb/user_impersonation` | Scope API |
| `REACT_APP_BACKEND_URL` | `http://votre-serveur:8888` | URL de votre API |
| `REACT_APP_AZURE_REDIRECT_URI` | `http://votre-serveur:3333` | URL de redirection |
| `MONGO_INITDB_ROOT_USERNAME` | `admin` | Utilisateur MongoDB |
| `MONGO_INITDB_ROOT_PASSWORD` | `VotreMotDePasse123!` | Mot de passe MongoDB |

#### **Variables Optionnelles (avec valeurs par défaut) :**

| Nom | Valeur par défaut |
|-----|-------------------|
| `BACKEND_PORT` | `8888` |
| `FRONTEND_PORT` | `3333` |
| `MONGODB_PORT` | `27017` |
| `DB_NAME` | `mail_management_db` |

**Cliquez sur "Add environment variable"** pour chaque variable.

---

### **Étape 6 : Options Avancées (Optionnel)**

Descendez dans **"Advanced settings"** :

- **Enable access control** : Activez si vous voulez restreindre l'accès
- **Do not create as a webhook** : Laissez décoché (pour activer les webhooks GitHub)
- **Enable relative path volumes** : Cochez si vos volumes utilisent des chemins relatifs

---

### **Étape 7 : Déployer la Stack**

1. Vérifiez que toutes vos variables sont correctes
2. Cliquez sur **"Deploy the stack"** (bouton bleu en bas)
3. Attendez quelques secondes...

Portainer va :
- ✅ Télécharger les images (MongoDB, Python, Node)
- ✅ Créer le réseau `mail-manager-network`
- ✅ Créer le volume `mail-manager_mongodb_data`
- ✅ Démarrer MongoDB
- ✅ Démarrer le Backend
- ✅ Démarrer le Frontend

**Temps estimé : 2-5 minutes**

---

### **Étape 8 : Vérifier le Déploiement**

1. Dans Portainer, allez dans **"Stacks"**
2. Cliquez sur votre stack **`mail-manager`**
3. Vérifiez l'état des conteneurs :

```
✅ mail-manager-mongodb   - running (healthy)
✅ mail-manager-backend   - running (healthy)
✅ mail-manager-frontend  - running (healthy)
```

**Si un conteneur est "unhealthy" ou "stopped" :**
- Cliquez sur le conteneur
- Allez dans l'onglet **"Logs"**
- Identifiez l'erreur

---

### **Étape 9 : Initialiser la Base de Données**

Dans Portainer :

1. Allez dans **"Containers"**
2. Trouvez **`mail-manager-backend`**
3. Cliquez dessus
4. Allez dans l'onglet **"Console"**
5. Cliquez sur **"Connect"** (sélectionnez `/bin/bash`)
6. Dans le terminal qui s'ouvre, exécutez :

```bash
python scripts/init_data.py
```

Vous verrez :
```
✅ Services créés
✅ Correspondants créés
✅ Messages créés
```

---

### **Étape 10 : Définir le Premier Administrateur**

**IMPORTANT : Faites cela APRÈS votre première connexion Microsoft**

Dans le même terminal (console du backend) :

```bash
python scripts/set_first_admin.py
```

Si vous n'êtes pas encore connecté, vous verrez :
```
⚠️  User 'JLeBervet' not found in database.
   Please log in once with Microsoft to create the user account,
   then run this script again.
```

Connectez-vous d'abord avec Microsoft, puis réexécutez le script.

---

### **Étape 11 : Accéder à l'Application**

Ouvrez votre navigateur et allez sur :

- **Frontend** : `http://votre-serveur:3333`
- **Backend API** : `http://votre-serveur:8888`
- **API Docs** : `http://votre-serveur:8888/docs`

**Cliquez sur "Se connecter avec Microsoft"** et authentifiez-vous !

---

## 🔧 Gestion de la Stack dans Portainer

### Voir les Logs

1. **Stacks** > `mail-manager`
2. Section **"Containers"**
3. Cliquez sur un conteneur
4. Onglet **"Logs"**
5. Activez **"Auto-refresh logs"** pour voir en temps réel

### Redémarrer un Service

1. **Containers** > Trouvez le conteneur
2. Cochez la case
3. Cliquez sur **"Restart"** en haut

### Arrêter/Démarrer la Stack

1. **Stacks** > `mail-manager`
2. **"Stop this stack"** (arrête tous les services)
3. **"Start this stack"** (redémarre tout)

### Mettre à Jour la Stack

Si vous modifiez le code :

1. **Stacks** > `mail-manager`
2. Cliquez sur **"Editor"**
3. Modifiez le docker-compose si nécessaire
4. Ajustez les variables d'environnement
5. Cliquez sur **"Update the stack"**
6. Cochez **"Re-pull image and redeploy"**
7. Cliquez sur **"Update"**

---

## 📊 Monitoring dans Portainer

### Voir les Statistiques

1. **Dashboard** : Vue d'ensemble des ressources
2. **Containers** > Sélectionnez un conteneur > **"Stats"** : CPU, RAM, Network

### Health Checks

Portainer affiche automatiquement l'état de santé :
- 🟢 **Healthy** : Le service répond correctement
- 🟡 **Starting** : En cours de démarrage
- 🔴 **Unhealthy** : Le service a un problème

---

## 🗄️ Backup de la Base de Données via Portainer

### Méthode 1 : Via Console

1. **Containers** > `mail-manager-mongodb`
2. **Console** > Connect (`/bin/bash`)
3. Exécutez :

```bash
mongodump --out=/data/backup
```

### Méthode 2 : Via Volume

1. **Volumes** > `mail-manager_mongodb_data`
2. **Export** le volume
3. Téléchargez le backup sur votre machine

### Méthode 3 : Script Automatique

Créez un conteneur de backup dans votre stack (voir docker-compose-portainer.yml).

---

## 🔐 Sécurité

### Recommandations Portainer

1. **Utilisez HTTPS** pour Portainer : 
   - Configurez un certificat SSL
   - Accédez via https://votre-serveur:9443

2. **Restreignez l'accès** :
   - Portainer > **Settings** > **Authentication**
   - Activez l'authentification obligatoire
   - Créez des utilisateurs avec rôles appropriés

3. **Secrets** :
   - Utilisez Portainer **Secrets** au lieu de variables d'env pour les mots de passe
   - **Secrets** > **Add secret** > Collez votre mot de passe MongoDB

---

## 🆘 Dépannage

### Le Backend ne Démarre Pas

**Vérifier les logs :**
1. **Containers** > `mail-manager-backend` > **Logs**
2. Cherchez les erreurs

**Problèmes courants :**
- MongoDB pas démarré → Attendez que MongoDB soit "healthy"
- Variables manquantes → Vérifiez les env variables de la stack
- Port déjà utilisé → Changez BACKEND_PORT dans les variables

### Le Frontend ne Charge Pas

**Vérifier :**
1. Logs du conteneur frontend
2. Vérifiez que REACT_APP_BACKEND_URL pointe vers le bon backend
3. Vérifiez les variables Azure AD

### MongoDB Connection Failed

**Vérifier :**
1. Que le conteneur MongoDB est "healthy"
2. Que MONGO_URL dans le backend utilise le bon nom de service : `mongodb://admin:password@mongodb:27017`
3. Que le username et password correspondent

---

## 📱 Accès depuis l'Extérieur

### Option 1 : Reverse Proxy (Nginx)

Créez un fichier nginx sur votre serveur :

```nginx
# /etc/nginx/sites-available/mail-manager
server {
    listen 80;
    server_name votre-domaine.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3333;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8888;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Activez :
```bash
sudo ln -s /etc/nginx/sites-available/mail-manager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Option 2 : Port Forwarding

Si vous êtes derrière un routeur, configurez le port forwarding :
- Port 3333 → Votre serveur:3333 (Frontend)
- Port 8888 → Votre serveur:8888 (Backend)

---

## 🔄 Mise à Jour de l'Application

### Via Portainer Interface

1. **Stacks** > `mail-manager`
2. Cliquez sur **"Editor"**
3. Vous pouvez modifier le docker-compose directement
4. Ou cliquez sur **"Git Repository"** pour pull les dernières modifications
5. Cochez **"Re-pull images and redeploy"**
6. Cliquez sur **"Update the stack"**

### Via Git Webhook (Automatique)

1. Lors de la création de la stack, cochez **"Enable webhook"**
2. Portainer génère une URL webhook
3. Ajoutez cette URL dans GitHub : **Settings** > **Webhooks**
4. À chaque push, Portainer redéploie automatiquement ! 🎉

---

## 📊 Monitoring Avancé dans Portainer

### Alertes

1. **Stacks** > `mail-manager` > **"Webhooks"**
2. Configurez des webhooks pour être notifié en cas de problème

### Logs Centralisés

1. **Stacks** > `mail-manager`
2. Cliquez sur **"Logs"** (en haut)
3. Sélectionnez tous les conteneurs
4. Activez **"Auto-refresh"**

### Statistiques en Temps Réel

1. **Dashboard** Portainer
2. Vous voyez CPU, RAM, Network de tous vos conteneurs
3. Configurez des limites de ressources si nécessaire

---

## 💾 Backup Automatique via Portainer

### Créer un Conteneur de Backup

Ajoutez ce service à votre stack (dans l'éditeur) :

```yaml
  # Service de backup MongoDB (optionnel)
  mongodb-backup:
    image: mongo:7.0
    container_name: mail-manager-backup
    restart: "no"
    environment:
      - MONGO_URL=mongodb://${MONGO_INITDB_ROOT_USERNAME:-admin}:${MONGO_INITDB_ROOT_PASSWORD:-changeme123}@mongodb:27017
    volumes:
      - ./backups:/backup
    networks:
      - mail-manager-network
    command: >
      sh -c "mongodump --uri=$$MONGO_URL --out=/backup/backup_$$(date +%Y%m%d_%H%M%S) && echo 'Backup completed'"
```

**Pour lancer un backup :**
1. **Containers** > `mail-manager-backup`
2. Cliquez sur **"Start"**
3. Le backup sera dans `./backups/`

---

## 🎨 Interface Portainer - Points Clés

### Section "Stacks"
- **Overview** : État général de la stack
- **Editor** : Modifier le docker-compose
- **Env variables** : Modifier les variables
- **Logs** : Logs agrégés de tous les services
- **Webhooks** : Auto-déploiement

### Section "Containers"
- **Quick actions** : Start, Stop, Restart, Kill
- **Stats** : Monitoring temps réel
- **Logs** : Logs individuels
- **Inspect** : Configuration détaillée
- **Console** : Accès shell interactif
- **Exec console** : Exécuter des commandes

### Section "Volumes"
- **Browse** : Voir le contenu des volumes
- **Export** : Télécharger un volume
- **Remove** : Supprimer (attention aux données !)

### Section "Networks"
- **mail-manager-network** : Réseau isolé de votre application

---

## 🚦 Workflow Complet de Déploiement

```
1. Portainer > Stacks > Add stack
2. Nom: mail-manager
3. Coller docker-compose-portainer.yml
4. Ajouter variables d'environnement Azure AD
5. Deploy the stack (2-5 min)
6. Containers > mail-manager-backend > Console
7. Exécuter: python scripts/init_data.py
8. Accéder: http://votre-serveur:3333
9. Se connecter avec Microsoft
10. Console backend > python scripts/set_first_admin.py
11. ✅ Application prête !
```

---

## 📱 Accès via Portainer Mobile

Portainer a une application mobile :
- **iOS** : App Store → "Portainer"
- **Android** : Google Play → "Portainer"

Gérez vos stacks depuis votre téléphone ! 📱

---

## 🔍 Troubleshooting Portainer

### Stack ne Se Déploie Pas

**Vérifiez :**
1. Syntaxe YAML du docker-compose (indentation correcte)
2. Variables d'environnement toutes renseignées
3. Logs dans **Stack editor** > **Output** (en bas)

### Conteneur "Exited"

1. Cliquez sur le conteneur
2. **Logs** → Lisez l'erreur
3. Causes fréquentes :
   - Variable manquante
   - MongoDB pas prêt (attendez le health check)
   - Port déjà utilisé

### Impossible d'Accéder via IP Publique

**Firewall :**
```bash
# Ouvrir les ports
sudo ufw allow 3333
sudo ufw allow 8888
sudo ufw reload
```

**Docker expose :**
Vérifiez dans Portainer > Container > **Published ports**

---

## 📝 Checklist Avant Déploiement

- [ ] Portainer installé et accessible
- [ ] Informations Azure AD disponibles (Tenant ID, Client ID)
- [ ] Scope créé dans Azure AD : `user_impersonation`
- [ ] Redirect URI configurée dans Azure AD : `http://votre-serveur:3333`
- [ ] Mot de passe MongoDB sécurisé choisi
- [ ] Ports 3333 et 8888 libres sur le serveur
- [ ] Fichier docker-compose-portainer.yml prêt

---

## 🎯 Après le Déploiement

### Configuration Réseau

Si votre serveur est accessible depuis Internet :

**1. Configurez un nom de domaine :**
- Pointez `votre-domaine.com` vers l'IP de votre serveur
- Configurez un reverse proxy (Nginx) avec HTTPS

**2. Mettez à jour Azure AD :**
- Redirect URI : `https://votre-domaine.com`
- Mettez à jour les variables dans Portainer

**3. Sécurisez :**
- Activez HTTPS (Let's Encrypt)
- Fermez les ports directs 3333/8888
- Passez par le reverse proxy uniquement

---

## 💡 Astuces Portainer

### Templates

Sauvegardez votre stack comme template :
1. **App Templates** > **Custom Templates**
2. **Add custom template**
3. Donnez un nom et collez votre docker-compose
4. Réutilisable en 1 clic ! 🎉

### Notifications

Configurez des notifications :
1. **Settings** > **Notifications**
2. Ajoutez Slack, Discord, Email, etc.
3. Recevez des alertes quand un conteneur crash

### Backup Complet

Portainer peut backuper :
1. **Settings** > **Backup Portainer**
2. Téléchargez un backup de toute la configuration
3. Restaurez en cas de problème

---

## 🆘 Support

**Problèmes avec Portainer :**
- Documentation : https://docs.portainer.io
- Community : https://community.portainer.io

**Problèmes avec l'Application :**
- Voir README_DEPLOYMENT.md
- Vérifiez les logs dans Portainer

---

**Bon Déploiement ! 🚀**
