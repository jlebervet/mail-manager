# 🚀 Guide de Déploiement - Application de Gestion de Messages

Application full-stack de gestion de messages avec authentification Microsoft Azure AD, développée avec React, FastAPI et MongoDB.

## 📋 Table des Matières

- [Prérequis](#prérequis)
- [Déploiement avec Docker](#déploiement-avec-docker)
- [Déploiement Manuel](#déploiement-manuel)
- [Configuration Azure AD](#configuration-azure-ad)
- [Variables d'Environnement](#variables-denvironnement)
- [Premier Démarrage](#premier-démarrage)
- [Maintenance](#maintenance)

---

## 🔧 Prérequis

### Pour Déploiement Docker
- Docker Engine 20.10+ ([Installation](https://docs.docker.com/engine/install/))
- Docker Compose 2.0+ ([Installation](https://docs.docker.com/compose/install/))
- 4 GB RAM minimum
- 10 GB espace disque

### Pour Déploiement Manuel
- Python 3.11+
- Node.js 18+ et Yarn
- MongoDB 7.0+
- Nginx (pour production frontend)

### Configuration Azure AD
- Tenant Azure Active Directory
- Application enregistrée dans Azure AD
- Droits d'administration sur le tenant (pour créer des scopes)

---

## 🐳 Déploiement avec Docker (RECOMMANDÉ)

### Étape 1 : Cloner le Dépôt

```bash
git clone <votre-repo-github>
cd mail-manager
```

### Étape 2 : Configuration des Variables d'Environnement

```bash
# Copier le fichier exemple
cp .env.example .env

# Éditer le fichier .env avec vos valeurs
nano .env
```

**Variables critiques à configurer :**

```bash
# Azure AD
AZURE_TENANT_ID=correspondnow
AZURE_CLIENT_ID=correspondnow
AZURE_SCOPE=api://3636e564-b7a6-405a-8a6f-4d5f15db49bb/user_impersonation

# URLs (ajustez selon votre domaine)
REACT_APP_BACKEND_URL=https://api.votre-domaine.com
REACT_APP_AZURE_REDIRECT_URI=https://votre-domaine.com

# MongoDB (changez les mots de passe !)
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=VotreMotDePasseSecurise123!
```

### Étape 3 : Lancer l'Application

```bash
# Lancer tous les services
docker-compose up -d

# Vérifier que tout fonctionne
docker-compose ps
```

Vous devriez voir :
```
NAME                      STATUS              PORTS
mail-manager-backend      Up 30 seconds       0.0.0.0:8888->8888/tcp
mail-manager-frontend     Up 30 seconds       0.0.0.0:3333->80/tcp
mail-manager-mongodb      Up 30 seconds       0.0.0.0:27017->27017/tcp
```

### Étape 4 : Initialiser les Données

```bash
# Créer les services et utilisateurs initiaux
docker-compose exec backend python scripts/init_data.py

# Définir le premier administrateur (remplacez par votre nom)
docker-compose exec backend python scripts/set_first_admin.py
```

### Étape 5 : Accéder à l'Application

- **Frontend** : http://localhost:3333
- **Backend API** : http://localhost:8888
- **API Docs** : http://localhost:8888/docs

---

## 🔨 Déploiement Manuel (Sans Docker)

### Backend

```bash
cd backend

# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate

# Installer les dépendances
pip install -r requirements.txt

# Configurer les variables d'environnement
cp .env.example .env
nano .env

# Démarrer le serveur
uvicorn server:app --host 0.0.0.0 --port 8888
```

### Frontend

```bash
cd frontend

# Installer les dépendances
yarn install

# Configurer les variables d'environnement
cp .env.example .env
nano .env

# Développement
yarn start

# Production
yarn build
# Les fichiers compilés seront dans ./build/
```

### MongoDB

```bash
# Démarrer MongoDB
mongod --dbpath /var/lib/mongodb --port 27017

# Ou avec systemctl
sudo systemctl start mongod
```

---

## 🔐 Configuration Azure AD

### Étape 1 : Créer une App Registration

1. Allez sur [Azure Portal](https://portal.azure.com)
2. **Azure Active Directory** > **App registrations** > **New registration**
3. Nom : `Mail Manager App`
4. Supported account types : **Accounts in this organizational directory only**
5. Redirect URI :
   - Type : **Single-page application (SPA)**
   - URI : `https://votre-domaine.com`
6. Cliquez sur **Register**

### Étape 2 : Configurer l'Application

**Authentication :**
- Ajoutez les URIs de redirection :
  - `https://votre-domaine.com` (production)
  - `http://localhost:3333` (développement)
- Cochez : **Access tokens** et **ID tokens**

**Expose an API :**
1. Cliquez sur **Add** pour l'Application ID URI
2. Acceptez : `api://<votre-client-id>`
3. Ajoutez un scope :
   - Name : `user_impersonation`
   - Who can consent : **Admins and users**
   - Display names et descriptions appropriés
   - State : **Enabled**

**Manifest :**
- Changez `"accessTokenAcceptedVersion": null` en `"accessTokenAcceptedVersion": 2`

### Étape 3 : Noter les IDs

- **Tenant ID** : Azure AD > Overview
- **Client ID** : App registration > Overview
- **Scope** : `api://<client-id>/user_impersonation`

---

## 🌍 Variables d'Environnement Complètes

### Backend (.env)

| Variable | Description | Exemple |
|----------|-------------|---------|
| `MONGO_URL` | URL de connexion MongoDB | `mongodb://admin:pass@localhost:27017` |
| `DB_NAME` | Nom de la base de données | `mail_management_db` |
| `CORS_ORIGINS` | Origines autorisées (CORS) | `https://votre-domaine.com,http://localhost:3333` |
| `AZURE_TENANT_ID` | ID du tenant Azure AD | `dd1d7dff-fcc8-45f7-...` |
| `AZURE_CLIENT_ID` | ID de l'application Azure AD | `3636e564-b7a6-405a-...` |
| `AZURE_SCOPE` | Scope API Azure AD | `api://3636e564.../user_impersonation` |

### Frontend (.env)

| Variable | Description | Exemple |
|----------|-------------|---------|
| `REACT_APP_BACKEND_URL` | URL de l'API backend | `https://api.votre-domaine.com` |
| `REACT_APP_AZURE_CLIENT_ID` | ID de l'application Azure AD | `3636e564-b7a6-405a-...` |
| `REACT_APP_AZURE_TENANT_ID` | ID du tenant Azure AD | `dd1d7dff-fcc8-45f7-...` |
| `REACT_APP_AZURE_REDIRECT_URI` | URI de redirection | `https://votre-domaine.com` |
| `REACT_APP_AZURE_SCOPE` | Scope pour les tokens | `api://3636e564.../user_impersonation` |

---

## 🎬 Premier Démarrage

### 1. Initialiser la Base de Données

```bash
# Avec Docker
docker-compose exec backend python scripts/init_data.py

# Sans Docker
cd backend
python scripts/init_data.py
```

Cela créera :
- Services par défaut (Services Techniques, Urbanisme, État Civil, etc.)
- Correspondants de test
- Messages de test

### 2. Se Connecter avec Microsoft

1. Accédez à votre application
2. Cliquez sur **"Se connecter avec Microsoft"**
3. Authentifiez-vous avec votre compte Microsoft

### 3. Définir le Premier Administrateur

```bash
# Avec Docker
docker-compose exec backend python scripts/set_first_admin.py

# Sans Docker
cd backend
python scripts/set_first_admin.py
```

Le script cherchera l'utilisateur "JLeBervet" et lui donnera les droits admin.

### 4. Gérer les Rôles des Autres Utilisateurs

Une fois connecté en tant qu'admin :
1. Allez dans **"Gestion des Rôles"** 🛡️ (sidebar)
2. Changez les rôles des utilisateurs selon vos besoins

---

## 🔄 Commandes Docker Utiles

```bash
# Démarrer tous les services
docker-compose up -d

# Arrêter tous les services
docker-compose down

# Voir les logs
docker-compose logs -f
docker-compose logs -f backend  # Seulement le backend
docker-compose logs -f frontend # Seulement le frontend

# Redémarrer un service
docker-compose restart backend
docker-compose restart frontend

# Rebuild après changement de code
docker-compose up -d --build

# Accéder au shell d'un conteneur
docker-compose exec backend bash
docker-compose exec mongodb mongosh

# Voir l'état des services
docker-compose ps
```

---

## 🛠️ Maintenance

### Backup de la Base de Données

```bash
# Avec Docker
docker-compose exec mongodb mongodump --out=/data/backup

# Copier le backup sur l'hôte
docker cp mail-manager-mongodb:/data/backup ./mongodb_backup_$(date +%Y%m%d)
```

### Restauration de la Base de Données

```bash
# Copier le backup dans le conteneur
docker cp ./mongodb_backup_20251204 mail-manager-mongodb:/data/restore

# Restaurer
docker-compose exec mongodb mongorestore /data/restore
```

### Mise à Jour de l'Application

```bash
# Pull les dernières modifications
git pull origin main

# Rebuild et redémarrer
docker-compose up -d --build

# Vérifier que tout fonctionne
docker-compose ps
docker-compose logs -f
```

### Monitoring des Logs

```bash
# Logs en temps réel
docker-compose logs -f

# Dernières 100 lignes
docker-compose logs --tail=100

# Logs d'un service spécifique
docker-compose logs -f backend
```

---

## 🔒 Sécurité en Production

### 1. Changez TOUS les Mots de Passe

```bash
# MongoDB
MONGO_INITDB_ROOT_PASSWORD=<mot-de-passe-très-sécurisé>

# Générez des secrets forts
openssl rand -base64 32
```

### 2. Configurez CORS Strictement

```bash
# N'utilisez PAS '*' en production
CORS_ORIGINS=https://votre-domaine.com,https://www.votre-domaine.com
```

### 3. Utilisez HTTPS

- Configurez un reverse proxy (Nginx, Traefik) avec certificats SSL
- Utilisez Let's Encrypt pour des certificats gratuits
- Exemple de configuration Nginx fourni dans `frontend/nginx.conf`

### 4. Sauvegardez Régulièrement

```bash
# Script de backup automatique (cron)
0 2 * * * docker-compose exec mongodb mongodump --out=/data/backup_$(date +\%Y\%m\%d)
```

---

## 📊 Architecture de l'Application

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Browser                       │
│                  (Microsoft Azure AD Login)                  │
└────────────────────────────┬────────────────────────────────┘
                             │
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Nginx)                  │
│                      Port 3333 (ou 80)                       │
└────────────────────────────┬────────────────────────────────┘
                             │
                             │ HTTP/HTTPS + Bearer Token
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI)                         │
│                         Port 8888                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Azure AD Token Validation                            │   │
│  │ User Sync & Role Management                          │   │
│  │ Business Logic (Messages, Services, etc.)            │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────┘
                             │
                             │ MongoDB Protocol
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB Database                          │
│                         Port 27017                           │
│  Collections: users, mails, services, correspondents         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🌐 Déploiement On-Premise

### Option 1 : Serveur Linux avec Docker

```bash
# 1. Cloner le dépôt
git clone <votre-repo>
cd mail-manager

# 2. Configurer .env
cp .env.example .env
nano .env

# 3. Lancer avec Docker Compose
docker-compose up -d

# 4. Initialiser
docker-compose exec backend python scripts/init_data.py
docker-compose exec backend python scripts/set_first_admin.py
```

### Option 2 : Serveur Windows

```powershell
# 1. Installer Docker Desktop pour Windows
# 2. Cloner le dépôt
git clone <votre-repo>
cd mail-manager

# 3. Configurer .env
copy .env.example .env
notepad .env

# 4. Lancer
docker-compose up -d

# 5. Initialiser
docker-compose exec backend python scripts/init_data.py
docker-compose exec backend python scripts/set_first_admin.py
```

### Option 3 : Kubernetes (Production)

Un fichier `kubernetes.yml` peut être créé si nécessaire pour déploiement sur cluster K8s.

---

## 🔑 Configuration Complète Azure AD

### Checklist de Configuration

- [ ] Application enregistrée dans Azure AD
- [ ] Type : Single-page application (SPA)
- [ ] Redirect URIs configurées (production + dev)
- [ ] Application ID URI : `api://<client-id>`
- [ ] Scope `user_impersonation` créé et activé
- [ ] `accessTokenAcceptedVersion: 2` dans le manifest
- [ ] Permissions API configurées
- [ ] Utilisateurs ajoutés au tenant

### URLs Azure AD à Configurer

**Redirect URIs (Authentication > Platform configurations > SPA) :**
```
https://votre-domaine.com
http://localhost:3333
```

**Scopes (Expose an API) :**
```
api://<your-client-id>/user_impersonation
```

---

## 👤 Gestion des Utilisateurs

### Workflow d'Ajout d'Utilisateur

1. L'utilisateur se connecte avec Microsoft (première fois)
2. Un compte est automatiquement créé dans MongoDB avec le rôle "user"
3. Un admin assigne le rôle approprié via l'interface "Gestion des Rôles"

### Rôles Disponibles

**Admin :**
- Gestion complète des utilisateurs et rôles
- Import CSV de données
- Création et archivage de services
- Toutes les fonctionnalités utilisateur

**User :**
- Création et gestion des messages
- Gestion des correspondants
- Consultation des services
- Scan de code-barres

### Commandes Utiles

```bash
# Lister tous les utilisateurs
docker-compose exec mongodb mongosh mail_management_db --eval "db.users.find().pretty()"

# Changer le rôle d'un utilisateur manuellement
docker-compose exec mongodb mongosh mail_management_db --eval "db.users.updateOne({email: 'user@domain.com'}, {\$set: {role: 'admin'}})"

# Supprimer un utilisateur
docker-compose exec mongodb mongosh mail_management_db --eval "db.users.deleteOne({email: 'user@domain.com'})"
```

---

## 🚨 Dépannage

### Le Frontend ne Se Charge Pas

```bash
# Vérifier les logs
docker-compose logs frontend

# Rebuild le frontend
docker-compose up -d --build frontend
```

### Erreur de Connexion MongoDB

```bash
# Vérifier que MongoDB est démarré
docker-compose ps mongodb

# Vérifier les logs
docker-compose logs mongodb

# Tester la connexion
docker-compose exec backend python -c "from motor.motor_asyncio import AsyncIOMotorClient; import asyncio; asyncio.run(AsyncIOMotorClient('mongodb://admin:changeme123@mongodb:27017').admin.command('ping'))"
```

### Erreur d'Authentification Azure AD

**Vérifications :**
1. Tenant ID et Client ID corrects dans .env
2. Redirect URI configurée dans Azure AD
3. Scope créé et activé
4. `accessTokenAcceptedVersion: 2` dans le manifest

**Logs utiles :**
```bash
docker-compose logs backend | grep -i "azure\|auth"
```

### Problème de Cache CDN

```bash
# Modifier le nom des fichiers pour forcer le rechargement
# Les hash de contenu sont déjà configurés dans craco.config.js

# Vérifier que le build utilise bien les hash
ls frontend/build/static/js/
# Vous devriez voir : main.a3f4b2c8.js (avec hash)
```

---

## 📱 Fonctionnalités de l'Application

### Gestion des Messages
- Messages entrants et sortants
- Workflow : Reçu → Traitement → Traité → Archivé
- Types : Message, Email, Dépôt main propre, Colis
- Recommandés avec numéro de suivi
- Scan de code-barres (mobile/tablette)
- Pièces jointes (drag & drop)
- Système de réponse avec suivi des échanges

### Gestion des Services
- Services et sous-services
- Archivage (soft delete)
- Restauration possible

### Import CSV
- Import massif de messages et contacts
- Modèle CSV téléchargeable
- Rapport détaillé d'import
- Réservé aux administrateurs

### Authentification
- Microsoft Azure AD (OAuth 2.0)
- Synchronisation automatique des utilisateurs
- Gestion des rôles via interface
- Tokens sécurisés avec expiration automatique

---

## 📞 Support

### Problèmes Courants

**"Cannot connect to MongoDB"**
- Vérifiez que MongoDB est démarré : `docker-compose ps`
- Vérifiez l'URL dans .env : `MONGO_URL`

**"Azure AD authentication failed"**
- Vérifiez les IDs dans .env
- Vérifiez que les redirect URIs sont configurées
- Vérifiez les logs : `docker-compose logs backend`

**"Old version still showing"**
- Faites un hard refresh : Ctrl+Shift+R
- Videz le cache du navigateur
- Attendez l'expiration du cache CDN (15 min - 2h)

### Ressources

- [Documentation FastAPI](https://fastapi.tiangolo.com/)
- [Documentation React](https://react.dev/)
- [Documentation MSAL React](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-react)
- [Documentation MongoDB](https://www.mongodb.com/docs/)

---

## 📄 Licence

Votre licence ici

---

## 👨‍💻 Développement

### Structure du Projet

```
mail-manager/
├── backend/
│   ├── server.py              # Application FastAPI principale
│   ├── azure_config.py        # Configuration Azure AD
│   ├── auth_dependencies.py   # Dépendances d'authentification
│   ├── requirements.txt       # Dépendances Python
│   ├── Dockerfile            # Image Docker backend
│   ├── .env.example          # Variables d'environnement exemple
│   └── scripts/
│       ├── init_data.py      # Initialisation des données
│       └── set_first_admin.py # Définir le premier admin
├── frontend/
│   ├── src/
│   │   ├── components/       # Composants React (Shadcn UI)
│   │   ├── pages/           # Pages de l'application
│   │   ├── authConfig.js    # Configuration MSAL
│   │   └── App.js           # Application principale
│   ├── package.json         # Dépendances Node.js
│   ├── Dockerfile          # Image Docker frontend
│   ├── nginx.conf          # Configuration Nginx
│   └── .env.example        # Variables d'environnement exemple
├── docker-compose.yml      # Orchestration Docker
├── .env.example           # Variables globales exemple
└── README_DEPLOYMENT.md   # Ce fichier
```

### Lancer en Mode Développement

```bash
# Backend
cd backend
source venv/bin/activate
uvicorn server:app --reload --port 8888

# Frontend (nouveau terminal)
cd frontend
yarn start
```

---

## ✅ Checklist de Déploiement Production

Avant de déployer en production, vérifiez :

- [ ] Tous les mots de passe changés (MongoDB, etc.)
- [ ] CORS configuré avec les URLs exactes (pas de '*')
- [ ] HTTPS configuré avec certificats SSL valides
- [ ] Azure AD redirect URIs configurées avec les URLs de production
- [ ] Backup automatique configuré
- [ ] Monitoring et logs configurés
- [ ] Firewall configuré (ports 80, 443 ouverts, 27017 fermé)
- [ ] Variables d'environnement en production != développement
- [ ] Tests effectués (authentification, CRUD, import, etc.)
- [ ] Premier admin défini
- [ ] Documentation à jour

---

**Bonne Chance avec Votre Déploiement ! 🚀**
