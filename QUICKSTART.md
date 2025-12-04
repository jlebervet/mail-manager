# 🚀 Démarrage Rapide - 5 Minutes

Guide ultra-rapide pour lancer l'application en local ou on-premise.

## ⚡ Installation Express

### Option 1 : Avec Make (Recommandé)

```bash
git clone <votre-repo>
cd mail-manager
make install
```

**C'est tout ! L'application tourne sur http://localhost:3000** 🎉

### Option 2 : Commandes Manuelles

```bash
# 1. Cloner
git clone <votre-repo>
cd mail-manager

# 2. Configurer
./setup.sh

# 3. Lancer
docker-compose up -d

# 4. Initialiser
docker-compose exec backend python scripts/init_data.py
```

---

## 🔑 Azure AD - Configuration Minimale

### Dans Azure Portal

1. **App registrations** > **New registration**
2. Name: `Mail Manager`
3. Redirect URI (SPA): `http://localhost:3000`
4. **Expose an API** > Add scope: `user_impersonation`
5. **Manifest** > `"accessTokenAcceptedVersion": 2`

### Dans votre .env

```bash
AZURE_TENANT_ID=<votre-tenant-id>
AZURE_CLIENT_ID=<votre-client-id>
```

---

## 👤 Premier Admin

```bash
# 1. Connectez-vous avec Microsoft
# 2. Exécutez:
make set-admin
# ou
docker-compose exec backend python scripts/set_first_admin.py
```

---

## 📋 Commandes Essentielles

```bash
make up          # Démarrer
make down        # Arrêter
make logs        # Voir les logs
make restart     # Redémarrer
make backup      # Backup MongoDB
make health      # Vérifier la santé
```

---

## 🆘 Problèmes Courants

**"Connection refused"**
```bash
docker-compose ps  # Vérifier que tout tourne
```

**"Old page showing"**
```bash
Ctrl+Shift+R  # Hard refresh navigateur
```

**"Azure AD error"**
- Vérifiez Tenant ID et Client ID dans .env
- Vérifiez redirect URI dans Azure AD

---

## 📖 Plus d'Infos

- **Documentation complète** : [README_DEPLOYMENT.md](./README_DEPLOYMENT.md)
- **Variables** : [.env.example](./.env.example)

---

**🎯 En 5 minutes votre application est prête !**
