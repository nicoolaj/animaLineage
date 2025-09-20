# Guide de Déploiement - AnimaLineage

## Vue d'ensemble

Ce guide couvre le déploiement complet de l'application AnimaLineage en environnement de production, incluant la configuration serveur, la sécurisation et la maintenance.

## Prérequis de Production

### Infrastructure
- **Serveur web** : Apache 2.4+ ou Nginx 1.18+
- **PHP** : Version 7.4+ avec extensions requises
- **Base de données** : MySQL 8.0+ ou PostgreSQL 12+
- **Node.js** : Version 18+ pour le build frontend
- **SSL/TLS** : Certificat valide obligatoire

### Extensions PHP requises
```bash
# Vérification des extensions
php -m | grep -E "(pdo|mysql|pgsql|json|openssl|mbstring)"

# Installation sur Ubuntu/Debian
sudo apt install php-pdo php-mysql php-pgsql php-json php-openssl php-mbstring

# Installation sur CentOS/RHEL
sudo yum install php-pdo php-mysqlnd php-pgsql php-json php-openssl php-mbstring
```

## Préparation du Déploiement

### 1. Build de l'Application

#### Frontend
```bash
cd frontend

# Installation des dépendances
npm ci --production

# Build de production
npm run build

# Vérification du build
ls -la build/
```

#### Backend
```bash
cd backend

# Installation des dépendances PHP
composer install --no-dev --optimize-autoloader

# Vérification de la configuration
php -l index.php
```

### 2. Configuration de l'Environnement

#### Variables d'environnement
```bash
# Copie du fichier de configuration
cp .env.prod.example .env

# Édition sécurisée
chmod 600 .env
```

```env
# Configuration de production
APP_ENV=production
APP_DEBUG=false
APP_URL=https://votre-domaine.com

# Base de données
DB_DRIVER=mysql
DB_HOST=localhost
DB_NAME=animalignage_prod
DB_USER=animalignage_user
DB_PASS=mot_de_passe_tres_securise
DB_PORT=3306

# JWT
JWT_SECRET=clé_jwt_très_longue_et_sécurisée_de_256_bits_minimum

# Sécurité
CORS_ORIGIN=https://votre-domaine.com
TRUSTED_PROXIES=10.0.0.0/8,172.16.0.0/12,192.168.0.0/16
```

## Configuration Apache

### Structure des fichiers
```
/var/www/html/animalignage/
├── frontend/               # Frontend React buildé
│   ├── build/
│   │   ├── index.html
│   │   ├── static/
│   │   └── ...
│   └── .htaccess           # Règles de réécriture SPA
├── backend/                # API PHP
│   ├── index.php
│   ├── controllers/
│   ├── models/
│   ├── .htaccess           # Protection et réécriture API
│   └── .env                # Configuration (protégée)
└── .htaccess               # Configuration racine
```

### Configuration VirtualHost
```apache
<VirtualHost *:443>
    ServerName votre-domaine.com
    DocumentRoot /var/www/html/animalignage

    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /path/to/your/certificate.crt
    SSLCertificateKeyFile /path/to/your/private.key
    SSLCertificateChainFile /path/to/your/ca-bundle.crt

    # Security Headers
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"

    # Frontend (React SPA)
    <Directory "/var/www/html/animalignage/frontend/build">
        AllowOverride All
        Require all granted

        # Gestion SPA - toutes les routes vers index.html
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    # API Backend
    Alias /api /var/www/html/animalignage/backend
    <Directory "/var/www/html/animalignage/backend">
        AllowOverride All
        Require all granted

        # Protection des fichiers sensibles
        <Files ".env">
            Require all denied
        </Files>

        <Files "*.log">
            Require all denied
        </Files>

        # Réécriture des routes API
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule ^(.*)$ index.php [QSA,L]
    </Directory>

    # Logs
    ErrorLog ${APACHE_LOG_DIR}/animalignage_error.log
    CustomLog ${APACHE_LOG_DIR}/animalignage_access.log combined
    LogLevel warn
</VirtualHost>

# Redirection HTTP vers HTTPS
<VirtualHost *:80>
    ServerName votre-domaine.com
    Redirect permanent / https://votre-domaine.com/
</VirtualHost>
```

### Fichiers .htaccess

#### Racine du projet
```apache
# /var/www/html/animalignage/.htaccess
DirectoryIndex frontend/build/index.html

# Redirection des routes API
RewriteEngine On
RewriteRule ^api/(.*)$ backend/index.php [QSA,L]

# Toutes les autres routes vers le frontend
RewriteCond %{REQUEST_URI} !^/api/
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ frontend/build/index.html [L]
```

#### Frontend
```apache
# /var/www/html/animalignage/frontend/build/.htaccess
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]

# Cache des ressources statiques
<FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
    ExpiresActive On
    ExpiresDefault "access plus 1 year"
    Header set Cache-Control "public, immutable"
</FilesMatch>

# Pas de cache pour index.html
<Files "index.html">
    ExpiresActive On
    ExpiresDefault "access plus 0 seconds"
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
</Files>
```

#### Backend
```apache
# /var/www/html/animalignage/backend/.htaccess
RewriteEngine On

# Protection des fichiers sensibles
<Files ".env">
    Require all denied
</Files>

<Files "*.log">
    Require all denied
</Files>

<FilesMatch "\.(md|json|lock|yml|yaml)$">
    Require all denied
</FilesMatch>

# Réécriture des routes API
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]

# Headers CORS et sécurité pour l'API
Header set Access-Control-Allow-Origin "https://votre-domaine.com"
Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header set Access-Control-Allow-Headers "Content-Type, Authorization, X-User-Data"
Header set Content-Type "application/json"
```

## Configuration Nginx

### Configuration principale
```nginx
server {
    listen 443 ssl http2;
    server_name votre-domaine.com;
    root /var/www/html/animalignage;
    index index.html;

    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # API Backend
    location /api/ {
        alias /var/www/html/animalignage/backend/;
        try_files $uri $uri/ @php;

        location ~ \.php$ {
            fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
            fastcgi_param SCRIPT_FILENAME $request_filename;
            include fastcgi_params;
        }
    }

    location @php {
        rewrite ^/api/(.*)$ /api/index.php last;
    }

    # Frontend SPA
    location / {
        try_files /frontend/build$uri /frontend/build$uri/ /frontend/build/index.html;
    }

    # Cache des ressources statiques
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /var/www/html/animalignage/frontend/build;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Pas de cache pour index.html
    location = /index.html {
        root /var/www/html/animalignage/frontend/build;
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
    }

    # Protection des fichiers sensibles
    location ~ /\. {
        deny all;
    }

    location ~ \.(md|json|lock|yml|yaml|log)$ {
        deny all;
    }

    # Logs
    access_log /var/log/nginx/animalignage_access.log;
    error_log /var/log/nginx/animalignage_error.log warn;
}

# Redirection HTTP vers HTTPS
server {
    listen 80;
    server_name votre-domaine.com;
    return 301 https://$server_name$request_uri;
}
```

## Base de Données de Production

### Configuration MySQL
```sql
-- Création de la base de données
CREATE DATABASE animalignage_prod
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Utilisateur applicatif avec privilèges limités
CREATE USER 'animalignage_app'@'localhost' IDENTIFIED BY 'mot_de_passe_tres_securise';
GRANT SELECT, INSERT, UPDATE, DELETE ON animalignage_prod.* TO 'animalignage_app'@'localhost';
GRANT CREATE, ALTER, INDEX ON animalignage_prod.* TO 'animalignage_app'@'localhost';
FLUSH PRIVILEGES;
```

### Configuration PostgreSQL
```sql
-- Création de la base de données
CREATE DATABASE animalignage_prod;

-- Utilisateur applicatif
CREATE USER animalignage_app WITH PASSWORD 'mot_de_passe_tres_securise';
GRANT CONNECT ON DATABASE animalignage_prod TO animalignage_app;
GRANT USAGE ON SCHEMA public TO animalignage_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO animalignage_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO animalignage_app;
```

### Initialisation automatique
```bash
# Les migrations se lancent automatiquement au premier démarrage
# Vous pouvez forcer l'exécution avec :
curl -X GET https://votre-domaine.com/api/users
```

## Sécurisation

### Permissions des fichiers
```bash
# Propriétaire et permissions
sudo chown -R www-data:www-data /var/www/html/animalignage
sudo find /var/www/html/animalignage -type d -exec chmod 755 {} \;
sudo find /var/www/html/animalignage -type f -exec chmod 644 {} \;

# Protection spéciale pour .env
sudo chmod 600 /var/www/html/animalignage/backend/.env
sudo chown www-data:www-data /var/www/html/animalignage/backend/.env

# Dossier de logs accessible en écriture
sudo chmod 755 /var/www/html/animalignage/backend/logs
```

### Firewall (UFW)
```bash
# Autoriser SSH, HTTP et HTTPS
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Activer le firewall
sudo ufw enable

# Vérifier le statut
sudo ufw status
```

### Fail2Ban
```bash
# Installation
sudo apt install fail2ban

# Configuration personnalisée
sudo tee /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[apache-auth]
enabled = true

[apache-badbots]
enabled = true

[apache-noscript]
enabled = true

[apache-overflows]
enabled = true
EOF

# Redémarrage
sudo systemctl restart fail2ban
```

## Monitoring et Logs

### Configuration des logs
```php
// backend/config/logging.php
<?php
$logLevel = $_ENV['APP_ENV'] === 'production' ? 'ERROR' : 'DEBUG';
$logFile = __DIR__ . '/../logs/app.log';

// Rotation automatique des logs
ini_set('log_errors', 1);
ini_set('error_log', $logFile);
```

### Script de monitoring
```bash
#!/bin/bash
# /usr/local/bin/animalignage-monitor.sh

LOG_FILE="/var/log/animalignage-monitor.log"
APP_URL="https://votre-domaine.com"

# Test de l'API
response=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/users")
if [ $response -ne 200 ]; then
    echo "$(date): API indisponible (code: $response)" >> $LOG_FILE
    # Envoyer une alerte (email, Slack, etc.)
fi

# Vérification de l'espace disque
disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $disk_usage -gt 80 ]; then
    echo "$(date): Espace disque critique: ${disk_usage}%" >> $LOG_FILE
fi

# Vérification des logs d'erreur
error_count=$(tail -100 /var/log/apache2/animalignage_error.log | grep -c "$(date +%Y-%m-%d)")
if [ $error_count -gt 10 ]; then
    echo "$(date): Trop d'erreurs détectées: $error_count" >> $LOG_FILE
fi
```

```bash
# Ajouter au crontab
crontab -e
# */5 * * * * /usr/local/bin/animalignage-monitor.sh
```

## Sauvegarde

### Script de sauvegarde automatique
```bash
#!/bin/bash
# /usr/local/bin/animalignage-backup.sh

BACKUP_DIR="/backup/animalignage"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="animalignage_prod"
DB_USER="animalignage_app"
APP_DIR="/var/www/html/animalignage"

# Créer le dossier de sauvegarde
mkdir -p $BACKUP_DIR

# Sauvegarde de la base de données
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > "$BACKUP_DIR/db_backup_$DATE.sql.gz"

# Sauvegarde des fichiers uploadés (si applicable)
tar -czf "$BACKUP_DIR/files_backup_$DATE.tar.gz" -C $APP_DIR backend/uploads 2>/dev/null || true

# Sauvegarde de la configuration
cp $APP_DIR/backend/.env "$BACKUP_DIR/env_backup_$DATE"

# Nettoyage des anciennes sauvegardes (garder 30 jours)
find $BACKUP_DIR -name "*backup_*" -mtime +30 -delete

# Log de la sauvegarde
echo "$(date): Sauvegarde terminée - $DATE" >> /var/log/animalignage-backup.log
```

```bash
# Ajouter au crontab pour sauvegarde quotidienne à 2h
crontab -e
# 0 2 * * * /usr/local/bin/animalignage-backup.sh
```

## Mise à Jour

### Procédure de mise à jour
```bash
#!/bin/bash
# /usr/local/bin/animalignage-update.sh

APP_DIR="/var/www/html/animalignage"
BACKUP_DIR="/backup/animalignage/updates"

# Sauvegarde avant mise à jour
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
tar -czf "$BACKUP_DIR/pre_update_$DATE.tar.gz" -C $APP_DIR .

# Télécharger la nouvelle version
cd /tmp
git clone https://github.com/votre-repo/animalignage.git animalignage-new

# Build de la nouvelle version
cd animalignage-new/frontend
npm ci && npm run build

cd ../backend
composer install --no-dev --optimize-autoloader

# Copie de la configuration existante
cp $APP_DIR/backend/.env animalignage-new/backend/.env

# Arrêt temporaire du service (optionnel)
sudo systemctl stop apache2

# Remplacement des fichiers
rsync -av animalignage-new/ $APP_DIR/
sudo chown -R www-data:www-data $APP_DIR

# Redémarrage
sudo systemctl start apache2

# Vérification
curl -s https://votre-domaine.com/api/users > /dev/null
if [ $? -eq 0 ]; then
    echo "Mise à jour réussie"
else
    echo "Erreur de mise à jour, restauration..."
    tar -xzf "$BACKUP_DIR/pre_update_$DATE.tar.gz" -C $APP_DIR
    sudo systemctl restart apache2
fi
```

## Troubleshooting

### Problèmes courants

#### API inaccessible
```bash
# Vérifier les logs Apache/Nginx
sudo tail -f /var/log/apache2/animalignage_error.log

# Vérifier les permissions
ls -la /var/www/html/animalignage/backend/

# Tester PHP
php /var/www/html/animalignage/backend/index.php
```

#### Erreurs de base de données
```bash
# Tester la connexion
mysql -u animalignage_app -p animalignage_prod -e "SHOW TABLES;"

# Vérifier les logs MySQL
sudo tail -f /var/log/mysql/error.log
```

#### Problèmes de certificat SSL
```bash
# Vérifier le certificat
openssl x509 -in /path/to/certificate.crt -text -noout

# Tester SSL
curl -I https://votre-domaine.com
```

### Performance

#### Optimisation Apache
```apache
# Activation de la compression
LoadModule deflate_module modules/mod_deflate.so
<Location />
    SetOutputFilter DEFLATE
    SetEnvIfNoCase Request_URI \
        \.(?:gif|jpe?g|png)$ no-gzip dont-vary
    SetEnvIfNoCase Request_URI \
        \.(?:exe|t?gz|zip|bz2|sit|rar)$ no-gzip dont-vary
</Location>

# Cache des ressources statiques
LoadModule expires_module modules/mod_expires.so
ExpiresActive On
ExpiresByType text/css "access plus 1 year"
ExpiresByType text/javascript "access plus 1 year"
ExpiresByType image/png "access plus 1 year"
ExpiresByType image/jpg "access plus 1 year"
ExpiresByType image/jpeg "access plus 1 year"
ExpiresByType image/gif "access plus 1 year"
```

#### Optimisation PHP
```ini
# /etc/php/7.4/apache2/php.ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=4000
opcache.revalidate_freq=60
opcache.fast_shutdown=1

memory_limit=256M
max_execution_time=30
max_input_time=60
post_max_size=20M
upload_max_filesize=20M
```

Cette documentation couvre tous les aspects essentiels du déploiement en production. Adaptez les configurations selon votre infrastructure spécifique.