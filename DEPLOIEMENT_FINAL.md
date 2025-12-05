# 🚀 Guide de Déploiement Final - Mail Manager

Application de gestion de messages avec authentification Microsoft Azure AD.

---

## 📋 Configuration Finale

### Ports Utilisés
- **HTTP** : 8080
- **HTTPS** : 8443
- **Dashboard Traefik** : 8081
- **MongoDB** : 27017 (interne)

### Réseau Docker
- **Subnet** : 172.21.0.0/16
- **Gateway** : 172.21.0.1

### Utilisateur Serveur
- **Utilisateur** : administrateur
- **Home** : /home/administrateur

---

## 🐳 Déploiement avec Portainer

### Prérequis

1. **Nom de domaine** pointant vers votre serveur
   - Exemple : courrier.enghien95.fr
   - Enregistrement DNS A : IP de votre serveur

2. **Portainer installé** sur votre serveur
   - http://votre-serveur:9000

3. **Informations Azure AD** :
   - Tenant ID : dd1d7dff-fcc8-45f7-8966-fbdf17b2f70a
   - Client ID : 3636e564-b7a6-405a-8a6f-4d5f15db49bb

---

### Étape 1 : Cloner le Repo sur le Serveur

```bash
# Se connecter en SSH
ssh administrateur@votre-serveur

# Cloner le repo
cd ~
git clone <votre-repo-github> mail-manager

# Vérifier
ls ~/mail-manager/backend
ls ~/mail-manager/frontend
```

---

### Étape 2 : Créer la Stack dans Portainer

1. Accédez à Portainer : **http://votre-serveur:9000**
2. **Stacks** > **+ Add stack**
3. **Name** : `mail-manager`
4. **Build method** : **Web editor**
5. Collez le contenu du fichier **`portainer-production.yml`**

---

### Étape 3 : Configurer les Variables d'Environnement

Cliquez sur **"+ add environment variable"** pour chaque variable :

```
DOMAIN_NAME=courrier.enghien95.fr
ACME_EMAIL=votre@email.com

AZURE_TENANT_ID=dd1d7dff-fcc8-45f7-8966-fbdf17b2f70a
AZURE_CLIENT_ID=3636e564-b7a6-405a-8a6f-4d5f15db49bb
AZURE_SCOPE=api://3636e564-b7a6-405a-8a6f-4d5f15db49bb/user_impersonation

REACT_APP_BACKEND_URL=https://courrier.enghien95.fr:8443
REACT_APP_AZURE_CLIENT_ID=3636e564-b7a6-405a-8a6f-4d5f15db49bb
REACT_APP_AZURE_TENANT_ID=dd1d7dff-fcc8-45f7-8966-fbdf17b2f70a
REACT_APP_AZURE_REDIRECT_URI=https://courrier.enghien95.fr:8443
REACT_APP_AZURE_SCOPE=api://3636e564-b7a6-405a-8a6f-4d5f15db49bb/user_impersonation

MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=VotreMotDePasseSecurise123!
```

**⚠️ Remplacez :**
- `courrier.enghien95.fr` par VOTRE domaine
- `votre@email.com` par votre email
- Le mot de passe MongoDB par un mot de passe sécurisé

---

### Étape 4 : Déployer la Stack

1. Cliquez sur **"Deploy the stack"**
2. Attendez 2-3 minutes
3. Vérifiez dans **Containers** que les 4 services sont "running" :
   - ✅ traefik
   - ✅ mail-manager-mongodb
   - ✅ mail-manager-backend
   - ✅ mail-manager-frontend

---

### Étape 5 : Configurer Azure AD

Dans le portail Azure AD :

1. **Azure Active Directory** > **App registrations** > Votre application
2. **Authentication** > **Platform configurations** > **Single-page application**
3. **Add URI** :
   ```
   https://courrier.enghien95.fr:8443
   ```
4. **Save**

---

### Étape 6 : Initialiser la Base de Données

Dans Portainer :

1. **Containers** > **mail-manager-backend**
2. Cliquez sur le conteneur
3. Onglet **"Console"**
4. Sélectionnez `/bin/bash` et cliquez **"Connect"**
5. Dans le terminal, exécutez :

```bash
python scripts/init_data.py
```

Vous verrez :
```
✅ Services créés : 5
✅ Correspondants créés : 10  
✅ Messages créés : 8
Initialisation terminée !
```

---

### Étape 7 : Définir le Premier Administrateur

**⚠️ IMPORTANT : Faites cela APRÈS votre première connexion Microsoft**

#### A. Première Connexion

1. Accédez à : **https://courrier.enghien95.fr:8443**
2. Cliquez sur **"Se connecter avec Microsoft"**
3. Authentifiez-vous avec votre compte Microsoft (JLeBervet)
4. Vous serez redirigé vers l'application

**Votre compte est créé automatiquement avec le rôle "user"**

#### B. Promotion en Administrateur

Dans Portainer :

1. **Containers** > **mail-manager-backend** > **Console**
2. Connectez-vous (`/bin/bash`)
3. Exécutez :

```bash
python scripts/set_first_admin.py
```

Vous verrez :
```
✅ User 'JLeBervet' (votre.email@domain.com) is now an admin!
   Updated: 1 document(s)
```

#### C. Vérification

1. Déconnectez-vous de l'application
2. Reconnectez-vous avec Microsoft
3. Vous devriez maintenant voir les menus admin :
   - 👥 Utilisateurs
   - 🛡️ Gestion des Rôles
   - 📥 Import CSV

---

### Étape 8 : Gérer les Rôles des Autres Utilisateurs

Une fois admin :

1. Menu **"Gestion des Rôles"** 🛡️
2. Liste de tous les utilisateurs connectés
3. Changez les rôles selon vos besoins
4. Confirmation obligatoire avant changement

---

## 🔐 Sécurité

### Certificat SSL

Traefik génère automatiquement un certificat Let's Encrypt gratuit pour votre domaine.

**Première connexion :**
- Traefik demande le certificat à Let's Encrypt (~30 secondes)
- Le certificat est valide 90 jours
- Renouvellement automatique par Traefik

### Firewall

Ouvrez les ports sur votre serveur :

```bash
sudo ufw allow 8080/tcp
sudo ufw allow 8443/tcp
sudo ufw allow 8081/tcp
sudo ufw reload
```

---

## 📊 Accès aux Services

### URLs Publiques

- **Application** : https://courrier.enghien95.fr:8443
- **API Backend** : https://courrier.enghien95.fr:8443/api
- **Dashboard Traefik** : http://votre-ip:8081

### Portainer

- **Interface** : http://votre-serveur:9000
- **Gestion des stacks, conteneurs, volumes, logs**

---

## 🔄 Mises à Jour

### Mettre à Jour le Code

```bash
# Sur le serveur
cd /home/administrateur/mail-manager
git pull origin main
```

**Dans Portainer :**
- **Containers** > Sélectionnez les conteneurs
- **Restart** (le code est monté en volume, les changements sont pris en compte)

### Backup MongoDB

**Via Portainer Console :**

```bash
# Containers > mail-manager-mongodb > Console
mongodump --out=/data/backup
```

**Télécharger le backup :**
- **Volumes** > `mail-manager_mongodb_data` > **Export volume**

---

## 🆘 Dépannage

### Vérifier les Logs

**Portainer > Stacks > mail-manager > Logs**

Ou par conteneur :
- **Containers** > Sélectionnez > **Logs**

### Redémarrer un Service

**Portainer > Containers** > Cochez le conteneur > **Restart**

### Certificat SSL Non Généré

**Vérifiez :**
1. Le domaine pointe bien vers votre serveur : `ping courrier.enghien95.fr`
2. Le port 8080 est accessible depuis Internet (Let's Encrypt utilise le port HTTP)
3. Logs Traefik : **Containers** > traefik > **Logs**

---

## 📱 Fonctionnalités de l'Application

### Pour Tous les Utilisateurs
- Gestion des messages (entrants/sortants)
- Gestion des correspondants
- Consultation des services
- Scan de code-barres (recommandés)
- Pièces jointes
- Workflow des messages

### Pour les Administrateurs
- 👥 Gestion des utilisateurs
- 🛡️ Attribution des rôles
- 📥 Import CSV massif
- Création/archivage de services

---

## ✅ Checklist Complète

```
□ DNS configuré (domaine → IP serveur)
□ Portainer installé et accessible
□ Repo cloné dans /home/administrateur/mail-manager
□ Stack créée dans Portainer (portainer-production.yml)
□ 12 variables d'environnement ajoutées
□ Stack déployée (4 conteneurs running)
□ Azure AD : Redirect URI = https://votredomaine:8443
□ Base de données initialisée (init_data.py)
□ Première connexion Microsoft effectuée
□ Premier admin défini (set_first_admin.py)
□ Application accessible : https://votredomaine:8443
□ ✅ Prêt pour production !
```

---

**Support : Consultez PORTAINER_GUIDE.md pour aide visuelle**
