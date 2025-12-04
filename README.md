# 📬 Mail Manager - Application de Gestion de Messages

Application full-stack professionnelle pour la gestion de courriers, emails, colis et dépôts avec authentification Microsoft Azure AD.

![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?logo=mongodb)
![Azure AD](https://img.shields.io/badge/Azure%20AD-OAuth%202.0-0078D4?logo=microsoft)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)

---

## ✨ Fonctionnalités

### 🔐 Authentification & Sécurité
- ✅ Authentification Microsoft Azure AD (OAuth 2.0)
- ✅ Synchronisation automatique des utilisateurs
- ✅ Gestion des rôles (Admin / Utilisateur)
- ✅ Tokens JWT sécurisés avec rafraîchissement automatique

### 📧 Gestion des Messages
- ✅ Messages entrants et sortants
- ✅ Types multiples : Message, Email, Dépôt main propre, Colis
- ✅ Workflow complet : Reçu → Traitement → Traité → Archivé
- ✅ Système de réponse avec suivi des échanges
- ✅ Recommandés avec numéro de suivi
- ✅ Scan de code-barres via smartphone/tablette
- ✅ Pièces jointes (drag & drop)

### 🏢 Gestion Organisationnelle
- ✅ Services et sous-services
- ✅ Gestion des correspondants avec autocomplétion
- ✅ Archivage (soft delete) des services
- ✅ Import CSV massif (admin)

### 📊 Dashboard & Statistiques
- ✅ Tableau de bord avec statistiques en temps réel
- ✅ Filtres avancés (statut, service, type)
- ✅ Recherche multicritères
- ✅ Navigation intuitive

### 👥 Administration
- ✅ Gestion des utilisateurs
- ✅ Attribution des rôles via interface
- ✅ Import CSV pour migration de données
- ✅ Logs et historique complets

---

## 🚀 Déploiement Rapide avec Docker

### Prérequis
- Docker 20.10+
- Docker Compose 2.0+

### Installation en 3 Minutes

```bash
# 1. Cloner le dépôt
git clone <votre-repo>
cd mail-manager

# 2. Configuration automatique
./setup.sh

# 3. Lancer l'application
docker-compose up -d

# 4. Initialiser les données
docker-compose exec backend python scripts/init_data.py
docker-compose exec backend python scripts/set_first_admin.py
```

**C'est tout ! 🎉**

Accédez à :
- **Frontend** : http://localhost:3000
- **API** : http://localhost:8001
- **API Docs** : http://localhost:8001/docs

---

## 📖 Documentation Complète

- **[Guide de Déploiement](./README_DEPLOYMENT.md)** - Instructions détaillées
- **[Configuration Azure AD](./README_DEPLOYMENT.md#configuration-azure-ad)** - Setup Azure AD
- **[Variables d'Environnement](./.env.example)** - Toutes les variables
- **[Déploiement Kubernetes](./kubernetes.yml)** - Pour clusters K8s

---

## 🏗️ Architecture

```
Client (Navigateur) → Frontend (React + MSAL) → Backend (FastAPI + Azure Auth) → MongoDB
```

Stack : React 18 + FastAPI + MongoDB + Azure AD

---

## 📞 Support

- **Documentation** : [README_DEPLOYMENT.md](./README_DEPLOYMENT.md)
- **Issues** : GitHub Issues

---

**🚀 Prêt pour la Production !**
