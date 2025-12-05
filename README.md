# 📬 Mail Manager - Gestion de Messages

Application full-stack de gestion de courriers, emails, colis et dépôts avec authentification Microsoft Azure AD.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?logo=mongodb)
![Azure AD](https://img.shields.io/badge/Azure%20AD-OAuth-0078D4?logo=microsoft)

---

## 🚀 Déploiement Rapide

### Avec Portainer (Recommandé)

```bash
# 1. Sur serveur
git clone <votre-repo> mail-manager

# 2. Portainer
Stacks > Add stack > Collez portainer-production.yml

# 3. Init
Console backend > python scripts/init_data.py

# 4. Connexion Microsoft + Set admin
python scripts/set_first_admin.py
```

**Temps total : 10 minutes** ⏱️

[Guide Complet →](./DEPLOIEMENT_FINAL.md)

---

## ✨ Fonctionnalités

- 🔐 Authentification Microsoft Azure AD
- 📧 Gestion messages (entrants/sortants)
- 📦 Types : Message, Email, Colis, Dépôt
- 📱 Scan code-barres (recommandés)
- 👥 Gestion correspondants
- 🏢 Services et sous-services
- 📥 Import CSV massif
- 🛡️ Gestion des rôles utilisateurs
- 📊 Dashboard et statistiques

---

## 🏗️ Stack Technique

- **Frontend** : React 18 + Shadcn UI + Tailwind + MSAL
- **Backend** : FastAPI + Azure Auth + Motor
- **Database** : MongoDB 7.0
- **Infrastructure** : Docker + Traefik + Let's Encrypt

---

## 📖 Documentation

- **[Déploiement Final](./DEPLOIEMENT_FINAL.md)** - Guide complet
- **[Premier Admin](./PREMIER_ADMIN.md)** - Définir l'administrateur
- **[Portainer](./PORTAINER_GUIDE.md)** - Guide visuel Portainer
- **[Variables](/.env.example)** - Configuration complète

---

## 🔧 Configuration

### Ports

- HTTP : 8080
- HTTPS : 8443
- Traefik Dashboard : 8081

### Réseau Docker

- Subnet : 172.21.0.0/16
- Gateway : 172.21.0.1

### Fichiers Stack

- `portainer-production.yml` - Stack complète avec Traefik
- `PORTAINER.yml` - Version simplifiée
- `docker-compose.yml` - Pour CLI locale

---

## 👤 Premier Admin

**Après déploiement :**

1. Connectez-vous avec Microsoft (JLeBervet)
2. Console backend : `python scripts/set_first_admin.py`
3. Reconnectez-vous
4. ✅ Accès admin !

[Guide Détaillé →](./PREMIER_ADMIN.md)

---

## 📦 Structure

```
mail-manager/
├── backend/              # FastAPI
├── frontend/             # React
├── portainer-production.yml   # Stack Portainer
├── DEPLOIEMENT_FINAL.md       # Guide déploiement
└── PREMIER_ADMIN.md           # Guide admin
```

---

## 🔐 Sécurité

- HTTPS automatique (Let's Encrypt)
- Authentification Azure AD OAuth 2.0
- Tokens JWT sécurisés
- RBAC (Admin/User)
- CORS configuré

---

## 📞 Support

Consultez la documentation complète dans les fichiers .md

---

**Prêt pour Production ! 🚀**
