# 🔧 Résolution : "path not found" dans Portainer

## ❌ Erreur Rencontrée

```
failed to deploy a stack: compose build operation failed: 
unable to prepare context: path "/data/compose/10/backend" not found
```

## 🔍 Cause du Problème

Portainer essaie de **builder les images Docker** mais ne trouve pas les fichiers source (`backend/Dockerfile`, `frontend/Dockerfile`) car ils n'existent pas sur le serveur.

Le docker-compose contient :
```yaml
backend:
  build:
    context: ./backend  # ← Portainer cherche ce dossier
```

Mais le dossier `./backend` n'existe pas dans `/data/compose/10/` de Portainer.

---

## ✅ Solutions

### **Solution 1 : Cloner le Repo sur le Serveur (RECOMMANDÉ)**

#### Étapes :

**1. Se connecter au serveur**
```bash
ssh user@votre-serveur
```

**2. Cloner le dépôt GitHub**
```bash
cd /opt
sudo git clone <votre-repo-github> mail-manager
cd mail-manager
```

**3. Vérifier que les fichiers sont là**
```bash
ls -la backend/
ls -la frontend/
# Vous devriez voir Dockerfile dans les deux dossiers
```

**4. Dans Portainer : Utiliser "Repository" au lieu de "Web editor"**

- **Stacks** > **+ Add stack**
- Nom : `mail-manager`
- **Build method** : Sélectionnez **"Repository"** (pas Web editor)
- **Repository URL** : Chemin local sur le serveur
  ```
  /opt/mail-manager
  ```
- **Compose path** : `docker-compose-portainer.yml`
- Ajoutez vos variables d'environnement
- **Deploy the stack**

---

### **Solution 2 : Utiliser la Version Sans Build**

Si vous préférez ne pas cloner le repo :

**1. Dans Portainer, utilisez le fichier `docker-compose-portainer-no-build.yml`**

Cette version :
- ✅ N'a PAS besoin de Dockerfile
- ✅ Utilise des images Python et Node de base
- ✅ Installe les dépendances au démarrage
- ⚠️ MAIS nécessite quand même le code source sur le serveur

**2. Clonez le repo sur le serveur**
```bash
ssh user@votre-serveur
cd /opt
sudo git clone <votre-repo-github> mail-manager
```

**3. Modifiez les volumes dans le docker-compose**

Dans Portainer Web Editor, modifiez les chemins des volumes :

```yaml
backend:
  volumes:
    - /opt/mail-manager/backend:/app  # ← Votre chemin réel

frontend:
  volumes:
    - /opt/mail-manager/frontend:/app  # ← Votre chemin réel
```

**4. Deploy la stack**

---

### **Solution 3 : Utiliser des Images Docker Pre-buildées (Production)**

Pour la production, buildez les images d'abord puis poussez-les sur un registry.

#### 3a. Sur votre Machine Locale

```bash
# Cloner le repo
git clone <votre-repo>
cd mail-manager

# Builder les images
docker build -t votre-registry/mail-manager-backend:latest ./backend
docker build -t votre-registry/mail-manager-frontend:latest ./frontend

# Pousser vers un registry (Docker Hub, Azure Container Registry, etc.)
docker push votre-registry/mail-manager-backend:latest
docker push votre-registry/mail-manager-frontend:latest
```

#### 3b. Modifier le docker-compose pour Portainer

```yaml
backend:
  image: votre-registry/mail-manager-backend:latest  # ← Image pré-buildée
  # Pas de "build:"
  
frontend:
  image: votre-registry/mail-manager-frontend:latest  # ← Image pré-buildée
  # Pas de "build:"
```

#### 3c. Déployer dans Portainer

Collez ce docker-compose modifié et déployez !

---

## 🎯 Méthode Recommandée pour Portainer

### **Approche Git Repository (La Plus Propre)**

Cette méthode évite de copier-coller et permet les mises à jour automatiques.

**Étapes :**

1. **Pushez votre code sur GitHub** (utilisez "Save to GitHub" sur Emergent)

2. **Dans Portainer :**
   - **Stacks** > **+ Add stack**
   - Nom : `mail-manager`
   - **Build method** : Sélectionnez **"Repository"** ⭐
   
3. **Configuration Git :**
   ```
   Repository URL: https://github.com/votre-compte/mail-manager
   Repository reference: refs/heads/main
   Compose path: docker-compose-portainer.yml
   ```

4. **Si repo privé :**
   - Cochez "Git credentials"
   - Username: votre-username-github
   - Password: votre-personal-access-token

5. **Variables d'environnement** : Ajoutez vos 7-10 variables

6. **Deploy the stack**

**Avantages :**
- ✅ Portainer clone automatiquement le repo
- ✅ Peut builder les images (Dockerfiles accessibles)
- ✅ Mise à jour facile (re-pull depuis GitHub)
- ✅ Support des webhooks

---

## 📝 Étapes Détaillées - Solution Git Repository

### Étape 1 : Save to GitHub (sur Emergent)

1. Dans Emergent, cliquez sur **"Save to GitHub"**
2. Créez un nouveau repo : `mail-manager`
3. Notez l'URL : `https://github.com/votre-compte/mail-manager`

### Étape 2 : Dans Portainer

```
┌─────────────────────────────────────────────────────────┐
│ Create stack                                            │
├─────────────────────────────────────────────────────────┤
│  Name: mail-manager                                     │
│                                                         │
│  Build method:                                          │
│  ◯ Web editor                                           │
│  ◯ Upload                                               │
│  ⚫ Repository        ← SÉLECTIONNEZ CECI               │
│                                                         │
│  Repository configuration:                              │
│  ┌───────────────────────────────────────────────┐     │
│  │ Repository URL *                              │     │
│  │ https://github.com/votre-compte/mail-manager  │     │
│  └───────────────────────────────────────────────┘     │
│                                                         │
│  ┌───────────────────────────────────────────────┐     │
│  │ Repository reference                          │     │
│  │ refs/heads/main                               │     │
│  └───────────────────────────────────────────────┘     │
│                                                         │
│  ┌───────────────────────────────────────────────┐     │
│  │ Compose path                                  │     │
│  │ docker-compose-portainer.yml                  │     │
│  └───────────────────────────────────────────────┘     │
│                                                         │
│  ☐ Use Git credentials                                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Étape 3 : Variables d'Environnement

Descendez et ajoutez vos variables (même processus qu'avant)

### Étape 4 : Deploy

Cliquez sur **"Deploy the stack"**

Portainer va :
1. ✅ Cloner le repo GitHub
2. ✅ Trouver les Dockerfiles
3. ✅ Builder les images
4. ✅ Démarrer les conteneurs

**Ça fonctionne ! 🎉**

---

## 🔄 Méthode Alternative : Cloner Manuellement

Si vous préférez avoir le contrôle complet :

### 1. Sur votre Serveur

```bash
# Se connecter
ssh user@votre-serveur

# Cloner
cd /opt
sudo git clone <votre-repo-github> mail-manager
cd mail-manager

# Vérifier
ls -la backend/Dockerfile
ls -la frontend/Dockerfile
```

### 2. Dans Portainer - Upload

- **Stacks** > **+ Add stack**
- Nom : `mail-manager`
- **Build method** : **Upload**
- Cliquez sur **"Upload"**
- Sélectionnez le fichier `docker-compose-portainer.yml` depuis votre ordinateur
- Ajoutez les variables d'environnement
- **Mais avant de déployer, modifiez les contextes de build :**

Dans l'éditeur qui s'affiche, changez :

```yaml
backend:
  build:
    context: /opt/mail-manager/backend  # ← Chemin absolu
    
frontend:
  build:
    context: /opt/mail-manager/frontend  # ← Chemin absolu
```

- **Deploy the stack**

---

## ⚡ Solution Express (Sans Cloner - Développement Seulement)

Si vous voulez juste tester rapidement :

### Utilisez `docker-compose-portainer-no-build.yml`

**Ce fichier :**
- Utilise des images Python/Node de base
- Installe les dépendances au démarrage
- MAIS nécessite toujours le code sur le serveur

**Étapes :**

1. **Clonez sur le serveur :**
   ```bash
   ssh user@serveur
   cd /opt
   sudo git clone <repo> mail-manager
   ```

2. **Dans Portainer, collez `docker-compose-portainer-no-build.yml`**

3. **Modifiez les chemins des volumes si nécessaire**

4. **Deploy**

---

## 🎯 Récapitulatif des 3 Méthodes

| Méthode | Complexité | Production | Avantages |
|---------|-----------|------------|-----------|
| **Git Repository** | ⭐ Facile | ✅ Oui | Auto-update, webhooks, propre |
| **Upload + Clone** | ⭐⭐ Moyen | ✅ Oui | Contrôle total |
| **No Build** | ⭐⭐⭐ Avancé | ❌ Dev only | Rapide pour tester |

---

## ✅ Recommandation

**Utilisez la méthode "Git Repository" :**

1. Faites "Save to GitHub" sur Emergent
2. Dans Portainer, utilisez Repository mode
3. Pointez vers votre repo GitHub
4. Compose path : `docker-compose-portainer.yml`
5. Deploy !

**C'est la méthode la plus propre et la plus simple ! 🎯**

---

## 🆘 Si Ça ne Fonctionne Toujours Pas

**Vérifiez :**

1. **Le repo est accessible**
   ```bash
   git clone <votre-repo>  # Doit fonctionner
   ```

2. **Les Dockerfiles existent**
   ```bash
   ls backend/Dockerfile
   ls frontend/Dockerfile
   ```

3. **Le chemin du compose est correct**
   ```
   Compose path: docker-compose-portainer.yml
   (PAS ./docker-compose-portainer.yml)
   ```

4. **Portainer a les droits Docker**
   ```bash
   docker ps  # Doit fonctionner
   ```

---

**Quelle méthode préférez-vous essayer ? 🚀**
