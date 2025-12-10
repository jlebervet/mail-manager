#!/bin/bash
# ============================================
# Script de Vérification MongoDB - Version Simplifiée
# ============================================

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo "========================================"
echo "  🔍 VÉRIFICATION MONGODB"
echo "========================================"
echo ""

# 1. Vérifier si MongoDB tourne
echo -e "${BLUE}1. État du service${NC}"
if ps aux | grep -i mongod | grep -v grep > /dev/null; then
    echo -e "   ${GREEN}✅ MongoDB est en cours d'exécution${NC}"
    MONGO_PID=$(ps aux | grep -i mongod | grep -v grep | awk '{print $2}' | head -1)
    echo -e "   ${GREEN}   PID: $MONGO_PID${NC}"
else
    echo -e "   ${YELLOW}⚠️  MongoDB n'est pas en cours d'exécution${NC}"
    exit 1
fi
echo ""

# 2. Vérifier le port
echo -e "${BLUE}2. Port d'écoute${NC}"
if netstat -tuln 2>/dev/null | grep 27017 > /dev/null || ss -tuln 2>/dev/null | grep 27017 > /dev/null; then
    echo -e "   ${GREEN}✅ MongoDB écoute sur le port 27017${NC}"
else
    echo -e "   ${YELLOW}⚠️  Port 27017 non détecté${NC}"
fi
echo ""

# 3. Test de connexion
echo -e "${BLUE}3. Test de connexion${NC}"
if mongosh --quiet --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Connexion MongoDB réussie${NC}"
else
    echo -e "   ${YELLOW}⚠️  Impossible de se connecter${NC}"
    exit 1
fi
echo ""

# 4. Collections et données
echo -e "${BLUE}4. Base de données: test_database${NC}"
echo ""

mongosh test_database --quiet --eval "
var collections = db.getCollectionNames();
var totalDocs = 0;

if (collections.length === 0) {
    print('   ⚠️  Aucune collection - Base vide');
} else {
    collections.forEach(function(name) {
        var count = db[name].countDocuments();
        totalDocs += count;
        var icon = count > 0 ? '✅' : '⚠️';
        var spaces = '                    '.substring(0, 20 - name.length);
        print('   ' + icon + ' ' + name + spaces + ': ' + count + ' documents');
    });
    print('');
    print('   📊 TOTAL: ' + totalDocs + ' documents dans ' + collections.length + ' collections');
}
"
echo ""

# 5. Derniers messages
echo -e "${BLUE}5. Activité récente${NC}"
mongosh test_database --quiet --eval "
if (db.mails) {
    var lastMail = db.mails.find().sort({created_at: -1}).limit(1).toArray()[0];
    if (lastMail) {
        print('   📬 Dernier message: ' + lastMail.reference);
        print('      Sujet: ' + lastMail.subject);
        print('      Date: ' + lastMail.created_at);
    } else {
        print('   ℹ️  Aucun message dans la base');
    }
} else {
    print('   ℹ️  Collection mails non trouvée');
}
"
echo ""

# 6. Utilisation du disque
echo -e "${BLUE}6. Utilisation du stockage${NC}"
mongosh test_database --quiet --eval "
var stats = db.stats();
print('   💾 Taille des données : ' + (stats.dataSize / 1024 / 1024).toFixed(2) + ' MB');
print('   💾 Taille du stockage : ' + (stats.storageSize / 1024 / 1024).toFixed(2) + ' MB');
print('   📑 Nombre d\\'index    : ' + stats.indexes);
"
echo ""

echo "========================================"
echo -e "${GREEN}✅ MONGODB EST ACTIF ET UTILISÉ${NC}"
echo "========================================"
echo ""
echo "Commandes utiles:"
echo "  • Voir les logs     : tail -f /var/log/mongodb/mongod.log"
echo "  • Console MongoDB   : mongosh test_database"
echo "  • Stats en direct   : mongosh --eval 'db.serverStatus()'"
echo ""
