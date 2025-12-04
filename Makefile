.PHONY: help setup build up down restart logs clean init-db set-admin test backup

help: ## Afficher cette aide
	@echo "Mail Manager - Commandes disponibles:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

setup: ## Configuration initiale (créer les fichiers .env)
	@echo "🔧 Configuration de l'application..."
	@./setup.sh

build: ## Build les images Docker
	@echo "📦 Build des images Docker..."
	@docker-compose build

up: ## Démarrer l'application
	@echo "🚀 Démarrage de l'application..."
	@docker-compose up -d
	@echo "✅ Application démarrée!"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend:  http://localhost:8001"
	@echo "API Docs: http://localhost:8001/docs"

down: ## Arrêter l'application
	@echo "🛑 Arrêt de l'application..."
	@docker-compose down

restart: ## Redémarrer l'application
	@echo "🔄 Redémarrage de l'application..."
	@docker-compose restart

logs: ## Voir les logs
	@docker-compose logs -f

logs-backend: ## Logs du backend seulement
	@docker-compose logs -f backend

logs-frontend: ## Logs du frontend seulement
	@docker-compose logs -f frontend

logs-db: ## Logs de MongoDB seulement
	@docker-compose logs -f mongodb

ps: ## État des services
	@docker-compose ps

clean: ## Nettoyer les conteneurs et volumes
	@echo "🧹 Nettoyage..."
	@docker-compose down -v
	@echo "✅ Nettoyage terminé"

init-db: ## Initialiser la base de données avec des données de test
	@echo "📊 Initialisation de la base de données..."
	@docker-compose exec backend python scripts/init_data.py
	@echo "✅ Base de données initialisée"

set-admin: ## Définir JLeBervet comme admin (après première connexion)
	@echo "👤 Configuration du premier admin..."
	@docker-compose exec backend python scripts/set_first_admin.py

rebuild: ## Rebuild et redémarrer
	@echo "🔨 Rebuild complet..."
	@docker-compose up -d --build
	@echo "✅ Rebuild terminé"

backup: ## Backup de la base de données
	@echo "💾 Backup de MongoDB..."
	@mkdir -p backups
	@docker-compose exec mongodb mongodump --out=/data/backup
	@docker cp mail-manager-mongodb:/data/backup ./backups/mongodb_backup_$$(date +%Y%m%d_%H%M%S)
	@echo "✅ Backup créé dans ./backups/"

restore: ## Restaurer la dernière backup (ATTENTION: écrase les données!)
	@echo "⚠️  Restauration de la base de données..."
	@read -p "Êtes-vous sûr? Cette action écrasera les données actuelles. (y/N): " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		LATEST=$$(ls -t backups/ | head -1); \
		docker cp backups/$$LATEST mail-manager-mongodb:/data/restore; \
		docker-compose exec mongodb mongorestore /data/restore; \
		echo "✅ Base de données restaurée"; \
	else \
		echo "❌ Restauration annulée"; \
	fi

shell-backend: ## Accéder au shell du backend
	@docker-compose exec backend bash

shell-frontend: ## Accéder au shell du frontend
	@docker-compose exec frontend sh

shell-db: ## Accéder au shell MongoDB
	@docker-compose exec mongodb mongosh mail_management_db

test-backend: ## Tests backend
	@docker-compose exec backend pytest tests/ -v

install: setup build up init-db ## Installation complète (setup + build + up + init)
	@echo ""
	@echo "============================================"
	@echo "✅ Installation complète terminée!"
	@echo "============================================"
	@echo ""
	@echo "Prochaines étapes:"
	@echo "1. Connectez-vous avec Microsoft"
	@echo "2. Exécutez: make set-admin"
	@echo "3. Accédez à l'application: http://localhost:3000"
	@echo ""

prod: ## Lancer en mode production
	@echo "🚀 Lancement en mode production..."
	@docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

dev: ## Lancer en mode développement
	@echo "🔧 Lancement en mode développement..."
	@docker-compose up

health: ## Vérifier la santé de l'application
	@echo "🏥 Vérification de la santé..."
	@echo "Backend:  $$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8001/api/stats)"
	@echo "Frontend: $$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/)"
	@echo "MongoDB:  $$(docker-compose exec mongodb mongosh --quiet --eval 'db.runCommand({ping:1}).ok' 2>/dev/null || echo '❌')"
