# Configuration des Secrets Portainer
# Pour une meilleure sécurité, utilisez les Secrets Portainer au lieu des variables d'environnement

## Créer les Secrets dans Portainer

1. **Portainer** > **Secrets** > **Add secret**
2. Créez les secrets suivants :

### Secret 1 : mongo_root_password
```
Name: mongo_root_password
Secret: VotreMotDePasseTresSécurisé123!
```

### Secret 2 : azure_tenant_id
```
Name: azure_tenant_id
Secret: dd1d7dff-fcc8-45f7-8966-fbdf17b2f70a
```

### Secret 3 : azure_client_id
```
Name: azure_client_id
Secret: 3636e564-b7a6-405a-8a6f-4d5f15db49bb
```

## Utilisation dans docker-compose

Modifiez votre docker-compose pour utiliser les secrets :

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    secrets:
      - mongo_root_password
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD_FILE: /run/secrets/mongo_root_password
    ...

  backend:
    build: ./backend
    secrets:
      - mongo_root_password
      - azure_tenant_id
      - azure_client_id
    environment:
      MONGO_PASSWORD_FILE: /run/secrets/mongo_root_password
      AZURE_TENANT_ID_FILE: /run/secrets/azure_tenant_id
      AZURE_CLIENT_ID_FILE: /run/secrets/azure_client_id
    ...

secrets:
  mongo_root_password:
    external: true
  azure_tenant_id:
    external: true
  azure_client_id:
    external: true
```

## Avantages des Secrets

- ✅ Plus sécurisé (chiffré par Docker)
- ✅ Non visible dans les variables d'environnement
- ✅ Gestion centralisée dans Portainer
- ✅ Rotation facilitée
- ✅ Audit trail

## Note

La version actuelle de docker-compose-portainer.yml utilise des variables d'environnement pour simplifier le déploiement initial. Pour la production, migrez vers les secrets.
