# 👤 Guide : Définir le Premier Administrateur

## ⚠️ IMPORTANT

**Vous DEVEZ vous connecter au moins UNE FOIS avec Microsoft AVANT de définir l'admin.**

---

## 📋 Procédure en 3 Étapes

### Étape 1 : Première Connexion Microsoft

1. Accédez à : **https://courrier.enghien95.fr:8443**
2. Cliquez sur : **"Se connecter avec Microsoft"**
3. Authentifiez-vous avec votre compte (JLeBervet)
4. Vous êtes connecté avec le rôle "user"

---

### Étape 2 : Promotion en Admin

**Dans Portainer :**

1. **Containers** > **mail-manager-backend**
2. **Console** > `/bin/bash` > **Connect**
3. Exécutez :

```bash
python scripts/set_first_admin.py
```

**Résultat :**
```
✅ User 'JLeBervet' (email@domain.com) is now an admin!
```

---

### Étape 3 : Reconnexion

1. Déconnectez-vous
2. Reconnectez-vous avec Microsoft
3. **Vous voyez maintenant** :
   - 👥 Utilisateurs
   - 🛡️ Gestion des Rôles
   - 📥 Import CSV

**✅ Vous êtes admin ! 🎉**

---

## 🛡️ Gérer les Autres Utilisateurs

**Menu "Gestion des Rôles"** :
- Liste de tous les utilisateurs
- Changez les rôles en 1 clic
- Confirmation obligatoire

---

## 🔧 Alternative : MongoDB Direct

**Console MongoDB :**

```bash
mongosh -u admin -p VotreMotDePasse
use mail_management_db
db.users.updateOne(
  {email: "votre@email.com"},
  {$set: {role: "admin"}}
)
```

---

**Connectez-vous d'abord, puis exécutez le script ! 🚀**
