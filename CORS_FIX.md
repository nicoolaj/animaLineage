# 🔧 Correction CORS - Guide Rapide

## ❌ Problème identifié :
L'erreur CORS montre que le backend n'accepte que `http://localhost:3002` mais votre site en production utilise `https://animalineage.ovh`.

## ✅ Correction appliquée :

### 1. **Backend CORS dynamique :**
Le fichier `backend/index.php` utilise maintenant la variable d'environnement :
```php
// CORS configuration from environment
$allowedOrigins = $_ENV['CORS_ALLOWED_ORIGINS'] ?? 'http://localhost:3002';
header('Access-Control-Allow-Origin: ' . $allowedOrigins);
```

### 2. **Configuration de production :**
Dans `backend/.env.prod` :
```bash
CORS_ALLOWED_ORIGINS=https://animalineage.ovh
```

## 🚀 Pour appliquer la correction :

### Option A - Redéploiement complet :
```bash
# 1. Régénérer les fichiers de déploiement
./deploy.sh

# 2. Uploader le nouveau dossier deploy/ vers votre FTP OVH
```

### Option B - Correction rapide (FTP seulement) :
```bash
# 1. Uploadez seulement le fichier corrigé :
#    backend/index.php → www/api/index.php

# 2. Vérifiez que le fichier www/api/.env contient :
#    CORS_ALLOWED_ORIGINS=https://animalineage.ovh
```

## 🧪 Test de la correction :

1. **Videz le cache du navigateur** (Ctrl+F5)
2. **Testez la connexion** sur https://animalineage.ovh
3. **Vérifiez dans la console** qu'il n'y a plus d'erreur CORS

## 🔍 Vérification des headers :

Vous pouvez tester l'API directement :
```bash
curl -H "Origin: https://animalineage.ovh" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://animalineage.ovh/api/auth/login
```

Réponse attendue :
```
Access-Control-Allow-Origin: https://animalineage.ovh
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-User-Data
```

---

🎉 **Après cette correction, votre application devrait fonctionner sans erreur CORS !**