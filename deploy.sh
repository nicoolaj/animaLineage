#!/bin/bash

# Script de déploiement pour AnimaLineage sur hébergement OVH

echo "🚀 Début du déploiement AnimaLineage"

# Configuration
FRONTEND_DIR="frontend"
BACKEND_DIR="backend"
DEPLOY_DIR="deploy"

# Nettoyage
echo "🧹 Nettoyage des fichiers de déploiement précédents..."
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# Build du frontend
echo "📦 Build du frontend React..."
cd $FRONTEND_DIR
npm run build
cd ..

# Préparation de la structure de déploiement
echo "📂 Préparation de la structure de déploiement..."

# Copie du frontend build vers le dossier racine
cp -r $FRONTEND_DIR/build/* $DEPLOY_DIR/

# Copie du backend vers le sous-dossier api
mkdir -p $DEPLOY_DIR/api
cp -r $BACKEND_DIR/* $DEPLOY_DIR/api/

# Copie des fichiers de configuration de production
cp $BACKEND_DIR/.env.prod $DEPLOY_DIR/api/.env

# Suppression des fichiers de développement
#rm -rf $DEPLOY_DIR/api/tests
#rm -rf $DEPLOY_DIR/api/vendor
#rm -rf $DEPLOY_DIR/api/reports
#rm -f $DEPLOY_DIR/api/.env.dev.example
#rm -f $DEPLOY_DIR/api/server.log

# Installation des dépendances de production
echo "📥 Installation des dépendances PHP..."
cd $DEPLOY_DIR/api
composer install --no-dev --optimize-autoloader
cd ../..

# Permissions
echo "🔒 Configuration des permissions..."
chmod -R 755 $DEPLOY_DIR
chmod -R 644 $DEPLOY_DIR/api/.env*
chmod 755 $DEPLOY_DIR/api/database
chmod 644 $DEPLOY_DIR/api/database/*.db 2>/dev/null || true

echo "✅ Déploiement préparé dans le dossier '$DEPLOY_DIR/'"
echo ""
echo "📋 Instructions pour OVH :"
echo "1. Connectez-vous à votre FTP OVH"
echo "2. Supprimez tout le contenu du dossier 'www' ou 'public_html'"
echo "3. Uploadez tout le contenu du dossier '$DEPLOY_DIR/' vers 'www/'"
echo "4. Modifiez le fichier 'api/.env' avec vos paramètres de production"
echo "4.1 - JWT_SECRET (changez la clé secrète)"
echo "4.2 - CORS_ALLOWED_ORIGINS (votre vrai domaine)"
echo "5. Testez votre site : https://votre-domaine.com"
echo ""
echo "🔧 Configuration requise sur OVH :"
echo "- PHP 8.4+"
echo "- Modules : mod_rewrite, mod_headers"

echo "- Extensions PHP : sqlite3, json, openssl"
