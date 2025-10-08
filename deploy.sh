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
if ! command -v npm &> /dev/null
then
    if ! command -v nvm &> /dev/null
    then
        echo "Erreur : la commande 'npm' n'a pas été trouvée. Avez-vous pensez à "nvm i" ?" >&2
    else
        echo "Erreur : la commande 'npm' n'a pas été trouvée. Veuillez l'installer et/ou vous assurer qu'elle est dans votre PATH." >&2
    fi
    exit 1
fi
cd $FRONTEND_DIR
npm run build
cd ..

# Préparation de la structure de déploiement
echo "📂 Préparation de la structure de déploiement..."

# Copie du frontend build vers le dossier racine (Vite utilise 'dist' au lieu de 'build')
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

# Génération JWT_SECRET si n'existe pas déjà
echo "🔑 Génération d'une nouvelle clé JWT..."
NEW_SECRET=$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 45)
sed -i.bak "s/^JWT_SECRET=.*/JWT_SECRET=$NEW_SECRET/" $DEPLOY_DIR/api/.env

# Génération www/.htaccess

echo "RewriteEngine On" >> deploy/.htaccess
echo "" >> deploy/.htaccess
echo "# Redirection des requêtes /api/* vers le sous-dossier api/" >> deploy/.htaccess
echo "RewriteCond %{REQUEST_URI} ^/api/" >> deploy/.htaccess
echo "RewriteRule ^api/(.*)$ api/index.php [L,QSA]" >> deploy/.htaccess
echo "" >> deploy/.htaccess
echo "# Pour le frontend React (SPA)" >> deploy/.htaccess
echo "RewriteCond %{REQUEST_FILENAME} !-f" >> deploy/.htaccess
echo "RewriteCond %{REQUEST_FILENAME} !-d" >> deploy/.htaccess
echo "RewriteCond %{REQUEST_URI} !^/api/" >> deploy/.htaccess
echo "RewriteRule . /index.html [L]" >> deploy/.htaccess
echo "" >> deploy/.htaccess

# Génération www/api/.htaccess

echo "RewriteEngine On" >> deploy/api/.htaccess
echo "" >> deploy/api/.htaccess
echo "# Ensure Authorization header is passed through" >> deploy/api/.htaccess
echo "RewriteCond %{HTTP:Authorization} ^(.*)" >> deploy/api/.htaccess
echo "RewriteRule .* - [e=HTTP_AUTHORIZATION:%1]" >> deploy/api/.htaccess
echo "" >> deploy/api/.htaccess
echo "RewriteCond %{REQUEST_FILENAME} !-f" >> deploy/api/.htaccess
echo "RewriteCond %{REQUEST_FILENAME} !-d" >> deploy/api/.htaccess
echo "RewriteRule . index.php [L]" >> deploy/api/.htaccess


if [ -f ads.txt ] ; then
  echo "📢 Copie de ads.txt"
  cp ads.txt $DEPLOY_DIR/
fi

# Permissions
echo "🔒 Configuration des permissions..."
chmod -R 755 $DEPLOY_DIR
chmod -R 644 $DEPLOY_DIR/api/.env*
chmod 755 $DEPLOY_DIR/api/database
chmod 644 $DEPLOY_DIR/api/database/*.db 2>/dev/null || true

echo "📋 Audit des modules externes"
echo "1. Backend "
cd backend ; composer audit ; cd ..
echo "2. Frontend "
cd frontend ; npm audit ; cd ..

echo "✅ Déploiement préparé dans le dossier '$DEPLOY_DIR/'"
echo ""
echo "📋 Instructions pour OVH :"
echo "1. Connectez-vous à votre FTP OVH"
echo "2. Supprimez tout le contenu du dossier 'www' ou 'public_html'"
echo "3. Uploadez tout le contenu du dossier '$DEPLOY_DIR/' vers 'www/'"
echo "4. Modifiez le fichier 'api/.env' avec vos paramètres de production"
echo "5. Testez votre site : https://votre-domaine.com"
echo ""
echo "🔧 Configuration requise sur OVH :"
echo "- PHP 8.4+"
echo "- Modules : mod_rewrite, mod_headers"

echo "- Extensions PHP : sqlite3, json, openssl"
