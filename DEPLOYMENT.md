# 🚀 Guide de Déploiement AnimaLineage sur OVH

## 📋 Prérequis OVH

### Hébergement requis :
- **PHP 8.4+** (vérifié dans le panel OVH)
- **Modules Apache :** mod_rewrite, mod_headers, mod_expires, mod_deflate
- **Extensions PHP :** sqlite3, json, openssl, curl

### Domaine et SSL :
- Nom de domaine configuré
- Certificat SSL activé (Let's Encrypt disponible gratuitement)

## 🛠️ Étapes de Déploiement

### 1. Préparation locale

```bash
# Depuis le dossier racine du projet
./deploy.sh
```

Ce script va :
- ✅ Builder le frontend React
- ✅ Créer la structure de déploiement
- ✅ Installer les dépendances PHP de production
- ✅ Configurer les permissions

### 2. Configuration de production

Modifiez les fichiers suivants :

#### **`deploy/api/.env`** - Configuration backend
```bash
# Remplacez ces valeurs par vos paramètres de production
JWT_SECRET=VOTRE-NOUVELLE-CLE-SECRETE-TRES-LONGUE-ET-ALEATOIRE-32-CHARS-MIN
CORS_ALLOWED_ORIGINS=https://votre-domaine.com
```

#### **`frontend/.env.production`** - Configuration frontend
```bash
# Remplacez par votre vrai domaine
REACT_APP_API_URL=https://votre-domaine.com/api
```

### 3. Upload FTP vers OVH

#### Structure sur le serveur OVH :
```
www/ (ou public_html/)
├── index.html              # Frontend React
├── static/                 # Assets React (CSS, JS, images)
├── manifest.json
├── favicon.ico
├── .htaccess               # Routage frontend
└── api/                    # Backend PHP
    ├── index.php           # Point d'entrée API
    ├── .htaccess           # Routage API
    ├── .env                # Configuration production
    ├── composer.json
    ├── vendor/             # Dépendances PHP
    ├── controllers/
    ├── models/
    ├── config/
    ├── middleware/
    ├── migrations/
    └── database/
        └── animalignage_prod.db
```

#### Étapes FTP :

1. **Connexion FTP** (via FileZilla, WinSCP, ou client FTP)
   - Serveur : `ftp.votre-domaine.com` ou `ftp.cluster0XX.hosting.ovh.net`
   - Utilisateur : votre identifiant OVH
   - Mot de passe : votre mot de passe FTP

2. **Suppression de l'ancien contenu**
   ```bash
   # Supprimez tout dans www/ sauf les dossiers système (.well-known, etc.)
   ```

3. **Upload du nouveau contenu**
   ```bash
   # Uploadez TOUT le contenu du dossier deploy/ vers www/
   ```

### 4. Configuration base de données

La première visite du site va automatiquement :
- ✅ Créer la base SQLite
- ✅ Exécuter les migrations
- ✅ Initialiser les données de base

### 5. Vérification du déploiement

Testez ces URLs :

1. **Frontend :** `https://votre-domaine.com`
   - ✅ Page d'accueil s'affiche
   - ✅ Pas d'erreurs dans la console

2. **API :** `https://votre-domaine.com/api/test`
   - ✅ Retourne une réponse JSON

3. **Authentification :** Testez la création de compte
   - ✅ Formulaires fonctionnent
   - ✅ Pas d'erreurs CORS

## 🔧 Configuration OVH Spécifique

### Dans l'espace client OVH :

1. **Version PHP :**
   - Allez dans `Hébergements` → `Votre hébergement` → `PHP`
   - Sélectionnez `PHP 8.4` (ou la dernière version disponible)

2. **Variables d'environnement :**
   - Si disponible, ajoutez les variables d'environnement depuis le panel

3. **SSL/HTTPS :**
   - Activez `Let's Encrypt SSL` (gratuit)
   - Forcez la redirection HTTPS

## 🚨 Sécurité Production

### Variables sensibles à modifier ABSOLUMENT :

```bash
# Dans deploy/api/.env
JWT_SECRET=CHANGEZ-CETTE-CLE-SECRETE-MAINTENANT
CORS_ALLOWED_ORIGINS=https://VOTRE-VRAI-DOMAINE.com
```

### Fichiers protégés automatiquement :
- ✅ `.env*` (non accessible via web)
- ✅ `composer.json|lock` (non accessible)
- ✅ Dossiers système protégés

## 🐛 Dépannage

### Erreur 500 - Vérifiez :
- Version PHP correcte (8.4+)
- Extensions PHP installées
- Permissions fichiers (755/644)
- Logs d'erreur dans le panel OVH

### Erreur CORS - Vérifiez :
- `CORS_ALLOWED_ORIGINS` dans `.env`
- Certificat SSL actif
- Headers CORS dans `.htaccess`

### Base de données - Vérifiez :
- Permissions dossier `database/` (755)
- Extension `sqlite3` activée
- Espace disque disponible

## 📞 Support

En cas de problème :
1. Consultez les logs d'erreur OVH
2. Vérifiez la configuration PHP
3. Testez l'API séparément
4. Vérifiez les permissions fichiers

---

🎉 **Votre application AnimaLineage est maintenant en ligne !**