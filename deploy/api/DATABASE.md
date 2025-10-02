# Configuration et Gestion de Base de Données

L'application AnimaLineage supporte une architecture multi-SGBD avec configuration automatique selon l'environnement de déploiement.

## Architecture de Base de Données

### Modèle de Données
L'application utilise un schéma relationnel optimisé pour la gestion d'élevages :

```sql
-- Structure principale
users           (id, nom, email, password, status, role, created_at)
elevages        (id, nom, adresse, telephone, email, user_id, created_at)
animals         (id, nom, numero, elevage_id, race_id, type_animal_id, date_naissance)
races           (id, nom, type_animal_id, created_at)
types_animaux   (id, nom, description, created_at)
```

## Environnement de Développement

### Configuration SQLite (Par défaut)
L'application utilise **SQLite** automatiquement en mode développement :

```bash
# Configuration automatique
cp .env.dev.example .env
```

### Avantages SQLite
- ✅ **Aucune installation** de serveur de base de données
- ✅ **Configuration zéro** - fonctionne immédiatement
- ✅ **Fichier unique** dans `database/webapp.db`
- ✅ **Parfait** pour développement et tests
- ✅ **Performances suffisantes** pour développement local

### Localisation des Données
```
backend/
├── database/
│   ├── webapp.db           # Base SQLite créée automatiquement
│   └── .gitignore          # Base exclue du versioning
├── migrations/             # Scripts de migration
└── .env                    # Configuration (APP_ENV=development)
```

## Environnement de Production

### Choix du SGBD
Pour la production, deux options sont supportées avec performance optimale :

#### Option 1 : MySQL/MariaDB (Recommandé)
**Avantages** : Performance éprouvée, écosystème riche, support étendu

```sql
-- 1. Création de la base de données
CREATE DATABASE animalignage_prod
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 2. Création d'un utilisateur dédié
CREATE USER 'animalignage_user'@'localhost' IDENTIFIED BY 'mot_de_passe_securise';
GRANT ALL PRIVILEGES ON animalignage_prod.* TO 'animalignage_user'@'localhost';
FLUSH PRIVILEGES;
```

```bash
# 3. Configuration de l'application
cp .env.prod.example .env
```

```env
# Configuration MySQL/MariaDB
APP_ENV=production
DB_DRIVER=mysql
DB_HOST=localhost
DB_NAME=animalignage_prod
DB_USER=animalignage_user
DB_PASS=mot_de_passe_securise
DB_PORT=3306
DB_CHARSET=utf8mb4
```

#### Option 2 : PostgreSQL
**Avantages** : Fonctionnalités avancées, conformité SQL stricte, extensibilité

```sql
-- 1. Création de la base de données
CREATE DATABASE animalignage_prod;

-- 2. Création d'un utilisateur dédié
CREATE USER animalignage_user WITH PASSWORD 'mot_de_passe_securise';
GRANT ALL PRIVILEGES ON DATABASE animalignage_prod TO animalignage_user;
```

```env
# Configuration PostgreSQL
APP_ENV=production
DB_DRIVER=pgsql
DB_HOST=localhost
DB_NAME=animalignage_prod
DB_USER=animalignage_user
DB_PASS=mot_de_passe_securise
DB_PORT=5432
```

### Optimisations de Production

#### Index de Performance
```sql
-- Index essentiels (créés automatiquement par les migrations)
CREATE INDEX idx_animals_elevage_id ON animals(elevage_id);
CREATE INDEX idx_animals_race_id ON animals(race_id);
CREATE INDEX idx_elevages_user_id ON elevages(user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
```

#### Configuration MySQL Optimisée
```ini
# my.cnf - Section [mysqld]
innodb_buffer_pool_size = 128M
innodb_log_file_size = 64M
query_cache_size = 32M
query_cache_type = 1
max_connections = 100
```

#### Configuration PostgreSQL Optimisée
```ini
# postgresql.conf
shared_buffers = 128MB
effective_cache_size = 256MB
work_mem = 4MB
maintenance_work_mem = 64MB
```

## Migrations et Gestion du Schéma

### Système de Migrations Automatiques
L'application détecte et applique automatiquement les migrations au démarrage :

```php
// Migrations disponibles dans backend/migrations/
create_users_table.php              // Table utilisateurs
create_elevage_tables.php           // Tables élevages
create_animaux_tables.php           // Tables animaux
create_elevage_races_table.php      // Table races
add_user_status.php                 // Statuts utilisateurs
add_password_column.php             // Colonnes de sécurité
update_animaux_structure.php        // Mise à jour structure animaux
```

### Migration de Données

#### De SQLite vers MySQL/PostgreSQL
```bash
# 1. Sauvegarde des données SQLite
sqlite3 backend/database/webapp.db .dump > backup_sqlite.sql

# 2. Configuration de la nouvelle base
cp .env.prod.example .env
# Éditer .env avec les paramètres de production

# 3. Migration automatique
# Les tables sont créées automatiquement au premier démarrage
php -S localhost:3001  # Déclenche les migrations

# 4. Import des données (script personnalisé requis)
php scripts/import_from_sqlite.php backup_sqlite.sql
```

#### Script de Migration Personnalisé
```php
<?php
// scripts/migrate_data.php
require_once '../backend/config/database.php';

// Connexion source (SQLite)
$source = new PDO('sqlite:../backend/database/webapp.db');

// Connexion destination (MySQL/PostgreSQL)
$dest = (new Database())->getConnection();

// Migration table par table avec transformation si nécessaire
migrateTable($source, $dest, 'users');
migrateTable($source, $dest, 'elevages');
// ...
```

## Sécurité de la Base de Données

### Protection des Données Sensibles
```bash
# Le fichier .env ne doit JAMAIS être commité
echo '.env' >> .gitignore
chmod 600 .env  # Lecture seule pour le propriétaire
```

### Mots de Passe Sécurisés
```bash
# Génération de mots de passe forts
openssl rand -base64 32

# Exemple de mot de passe sécurisé
DB_PASS="Kj8#mP2$vL9@nX4&qR7*wE1!aS5^dF6%"
```

### Utilisateurs de Base de Données avec Privilèges Limités

#### MySQL
```sql
-- Création d'un utilisateur avec privilèges limités
CREATE USER 'animalignage_app'@'localhost' IDENTIFIED BY 'mot_de_passe_fort';

-- Privilèges minimums requis
GRANT SELECT, INSERT, UPDATE, DELETE ON animalignage_prod.* TO 'animalignage_app'@'localhost';
GRANT CREATE, ALTER, INDEX ON animalignage_prod.* TO 'animalignage_app'@'localhost';  -- Pour migrations

-- Pas de privilèges administrateur
-- REVOKE ALL PRIVILEGES ON *.* FROM 'animalignage_app'@'localhost';
```

#### PostgreSQL
```sql
-- Utilisateur avec privilèges limités
CREATE USER animalignage_app WITH PASSWORD 'mot_de_passe_fort';
GRANT CONNECT ON DATABASE animalignage_prod TO animalignage_app;
GRANT USAGE ON SCHEMA public TO animalignage_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO animalignage_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO animalignage_app;
```

### Chiffrement des Connexions

#### SSL/TLS Obligatoire en Production
```env
# Configuration SSL MySQL
DB_SSL=true
DB_SSL_CA=/path/to/ca-cert.pem
DB_SSL_CERT=/path/to/client-cert.pem
DB_SSL_KEY=/path/to/client-key.pem

# Configuration SSL PostgreSQL
DB_SSLMODE=require
DB_SSLCERT=/path/to/client-cert.pem
DB_SSLKEY=/path/to/client-key.pem
DB_SSLROOTCERT=/path/to/ca-cert.pem
```

### Protection contre les Injections SQL
```php
// ✅ TOUJOURS utiliser des requêtes préparées
$stmt = $pdo->prepare("SELECT * FROM users WHERE email = :email");
$stmt->bindParam(':email', $email, PDO::PARAM_STR);
$stmt->execute();

// ❌ JAMAIS de concaténation directe
// $query = "SELECT * FROM users WHERE email = '" . $email . "'";  // DANGEREUX!
```

## Dépannage et Maintenance

### Diagnostic des Problèmes de Connexion

#### SQLite
```bash
# Vérification des permissions
ls -la backend/database/
chmod 755 backend/database/     # Dossier accessible
chmod 644 backend/database/*.db # Fichiers lisibles

# Test de l'extension PHP
php -m | grep -i sqlite
php -r "echo class_exists('PDO') ? 'PDO OK' : 'PDO manquant';"

# Test de connexion manuelle
sqlite3 backend/database/webapp.db ".tables"
```

#### MySQL/MariaDB
```bash
# Test des extensions PHP
php -m | grep -i mysql
php -r "echo extension_loaded('pdo_mysql') ? 'PDO MySQL OK' : 'PDO MySQL manquant';"

# Test de connexion
mysql -h localhost -u animalignage_user -p animalignage_prod -e "SHOW TABLES;"

# Vérification des logs
tail -f /var/log/mysql/error.log

# Test des performances
mysqladmin -u animalignage_user -p status
```

#### PostgreSQL
```bash
# Test des extensions PHP
php -m | grep -i pgsql
php -r "echo extension_loaded('pdo_pgsql') ? 'PDO PostgreSQL OK' : 'PDO PostgreSQL manquant';"

# Test de connexion
psql -h localhost -U animalignage_user -d animalignage_prod -c "\\dt"

# Vérification des logs
tail -f /var/log/postgresql/postgresql-*.log

# Informations sur la base
psql -h localhost -U animalignage_user -d animalignage_prod -c "SELECT version();"
```

### Maintenance Préventive

#### Sauvegardes Automatisées
```bash
#!/bin/bash
# backup_database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/animalignage"

# MySQL
mysqldump -u animalignage_user -p animalignage_prod > "$BACKUP_DIR/mysql_backup_$DATE.sql"

# PostgreSQL
pg_dump -h localhost -U animalignage_user animalignage_prod > "$BACKUP_DIR/pgsql_backup_$DATE.sql"

# Compression
gzip "$BACKUP_DIR/*_backup_$DATE.sql"

# Nettoyage (garder 30 jours)
find $BACKUP_DIR -name "*_backup_*.sql.gz" -mtime +30 -delete
```

#### Optimisation des Performances
```sql
-- MySQL : Analyse et optimisation
ANALYZE TABLE users, elevages, animals, races;
OPTIMIZE TABLE users, elevages, animals, races;

-- PostgreSQL : Mise à jour des statistiques
ANALYZE;
VACUUM ANALYZE;

-- Vérification de l'utilisation des index
EXPLAIN SELECT * FROM animals WHERE elevage_id = 1;
```

### Monitoring en Production

#### Métriques à Surveiller
```sql
-- Taille de la base de données
SELECT
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'animalignage_prod';

-- Requêtes lentes (MySQL)
SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 10;

-- Connexions actives
SHOW PROCESSLIST;
```

#### Alertes Recommandées
- Espace disque < 20%
- Connexions actives > 80% du maximum
- Requêtes lentes > 2 secondes
- Temps de réponse moyen > 500ms
- Erreurs de connexion > 1%

### Tests de Charge et Performance

#### Outils de Benchmark
```bash
# Test de charge MySQL
mysqlslap --user=animalignage_user --password --host=localhost \
  --concurrency=10 --iterations=100 --create-schema=test_perf \
  --query="SELECT * FROM users LIMIT 100;"

# Test de charge PostgreSQL
pgbench -h localhost -U animalignage_user -d animalignage_prod -c 10 -t 100

# Monitoring en temps réel
mytop  # Pour MySQL
pg_top # Pour PostgreSQL
```

#### Optimisation des Requêtes
```php
// ✅ Requête optimisée avec jointure
$sql = "SELECT a.*, e.nom as elevage_nom, r.nom as race_nom
        FROM animals a
        LEFT JOIN elevages e ON a.elevage_id = e.id
        LEFT JOIN races r ON a.race_id = r.id
        WHERE a.elevage_id = :elevage_id
        LIMIT :limit";

// ✅ Utilisation d'index composite
// CREATE INDEX idx_animals_elevage_race ON animals(elevage_id, race_id);
```