# Conventions de Code

## Philosophie générale

Ce projet suit les principes de **code propre** et de **cohérence** pour maintenir la lisibilité et la maintenabilité. Toutes les contributions doivent respecter ces conventions.

## Frontend (React/TypeScript)

### Nomenclature

#### Fichiers et dossiers
```typescript
// Composants React - PascalCase
UserProfile.tsx
ElevageForm.tsx
AdminPanel.tsx

// Utilitaires - camelCase
auth.ts
validators.ts
apiClient.ts

// Styles - kebab-case
user-profile.module.css
elevage-form.css
```

#### Variables et fonctions
```typescript
// Variables - camelCase
const userName = "John Doe";
const isAuthenticated = true;

// Fonctions - camelCase + verbe
const getUserData = () => { };
const validateEmail = (email: string) => { };

// Constantes - SCREAMING_SNAKE_CASE
const API_BASE_URL = "http://localhost:3001";
const MAX_FILE_SIZE = 1024 * 1024;

// Interfaces - PascalCase + "I" prefix optionnel
interface User {
  id: number;
  name: string;
}

interface IElevageData {
  nom: string;
  adresse: string;
}
```

### Structure des composants

```typescript
// Ordre des éléments dans un composant
import React, { useState, useEffect } from 'react';
import './ComponentName.css';

// Types/Interfaces
interface Props {
  title: string;
  onSubmit: (data: FormData) => void;
}

// Composant principal
const ComponentName: React.FC<Props> = ({ title, onSubmit }) => {
  // State hooks
  const [data, setData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(false);

  // Effect hooks
  useEffect(() => {
    // Side effects
  }, []);

  // Event handlers
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Logic
  };

  // Render helpers (si nécessaire)
  const renderHeader = () => (
    <h1>{title}</h1>
  );

  // JSX Return
  return (
    <div className="component-name">
      {renderHeader()}
      {/* Contenu */}
    </div>
  );
};

export default ComponentName;
```

### Gestion d'état

```typescript
// Context pattern
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginData) => Promise<void>;
  logout: () => void;
}

// State local - useState
const [formData, setFormData] = useState<FormData>({
  name: '',
  email: ''
});

// Mise à jour immutable
setFormData(prev => ({
  ...prev,
  name: newName
}));
```

### Appels API

```typescript
// Fonctions async/await
const fetchUserData = async (userId: number): Promise<User> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error);
    throw error;
  }
};
```

## Backend (PHP)

### Nomenclature

#### Fichiers et classes
```php
// Classes - PascalCase
class UserController { }
class ElevageModel { }
class AuthMiddleware { }

// Fichiers - PascalCase.php
UserController.php
ElevageModel.php
AuthMiddleware.php

// Méthodes - camelCase
public function getUserById($id) { }
public function createElevage($data) { }

// Variables - camelCase
$userName = "John";
$elevageData = [];

// Constantes - SCREAMING_SNAKE_CASE
const API_VERSION = '1.0';
const MAX_UPLOAD_SIZE = 5242880;
```

### Structure des classes

```php
<?php

/**
 * Contrôleur pour la gestion des utilisateurs
 *
 * @author Équipe de développement
 * @version 1.0
 */
class UserController
{
    // Propriétés privées
    private $userModel;
    private $validator;

    // Constructeur
    public function __construct()
    {
        $this->userModel = new User();
        $this->validator = new Validator();
    }

    // Méthodes publiques
    public function getAllUsers(): array
    {
        try {
            return $this->userModel->findAll();
        } catch (Exception $e) {
            error_log("Erreur getAllUsers: " . $e->getMessage());
            return [];
        }
    }

    // Méthodes privées
    private function validateUserData(array $data): array
    {
        return $this->validator->validate($data, $this->getUserRules());
    }

    private function getUserRules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users'
        ];
    }
}
```

### Gestion des erreurs

```php
// Try-catch avec logging
try {
    $result = $this->database->query($sql, $params);
    return $result;
} catch (PDOException $e) {
    error_log("Erreur base de données: " . $e->getMessage());
    throw new DatabaseException("Erreur lors de l'opération");
} catch (Exception $e) {
    error_log("Erreur générale: " . $e->getMessage());
    throw $e;
}

// Réponses API standardisées
private function sendResponse(int $statusCode, array $data = [], string $message = ''): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json');

    echo json_encode([
        'status' => $statusCode,
        'message' => $message,
        'data' => $data,
        'timestamp' => date('c')
    ]);
}
```

### Requêtes SQL

```php
// Requêtes préparées obligatoires
public function findUserById(int $id): ?array
{
    $sql = "SELECT id, name, email, created_at
            FROM users
            WHERE id = :id AND deleted_at IS NULL";

    $stmt = $this->pdo->prepare($sql);
    $stmt->bindParam(':id', $id, PDO::PARAM_INT);
    $stmt->execute();

    return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
}

// Gestion des transactions
public function createUserWithElevage(array $userData, array $elevageData): bool
{
    $this->pdo->beginTransaction();

    try {
        $userId = $this->createUser($userData);
        $this->createElevage($elevageData, $userId);

        $this->pdo->commit();
        return true;
    } catch (Exception $e) {
        $this->pdo->rollBack();
        throw $e;
    }
}
```

## Base de données

### Nomenclature
```sql
-- Tables - snake_case pluriel
users
elevages
type_animaux
elevage_animaux

-- Colonnes - snake_case
user_id
created_at
updated_at
is_active

-- Index - idx_table_column
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_elevages_user_id ON elevages(user_id);

-- Clés étrangères - fk_table_referenced_table
CONSTRAINT fk_elevages_users
FOREIGN KEY (user_id) REFERENCES users(id)
```

### Migrations
```php
// Structure des migrations
public function up(): void
{
    $sql = "CREATE TABLE IF NOT EXISTS animals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom VARCHAR(255) NOT NULL,
        elevage_id INTEGER NOT NULL,
        race_id INTEGER,
        date_naissance DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (elevage_id) REFERENCES elevages(id),
        FOREIGN KEY (race_id) REFERENCES races(id)
    )";

    $this->pdo->exec($sql);
}

public function down(): void
{
    $this->pdo->exec("DROP TABLE IF EXISTS animals");
}
```

## Sécurité

### Validation
```php
// Validation côté serveur obligatoire
public function validateElevageData(array $data): array
{
    $rules = [
        'nom' => 'required|string|max:255',
        'adresse' => 'required|string|max:500',
        'telephone' => 'nullable|regex:/^[0-9+\-\s]+$/',
        'email' => 'nullable|email'
    ];

    return $this->validator->validate($data, $rules);
}

// Échappement des données
$stmt = $this->pdo->prepare("SELECT * FROM users WHERE email = :email");
$stmt->bindParam(':email', $email, PDO::PARAM_STR);
```

### Authentification
```typescript
// Headers d'autorisation
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};

// Vérification côté client
if (!isAuthenticated) {
  navigate('/login');
  return;
}
```

## Tests

### Frontend (Jest/React Testing Library)
```typescript
describe('UserProfile Component', () => {
  test('devrait afficher le nom de l\'utilisateur', () => {
    const user = { id: 1, name: 'John Doe' };

    render(<UserProfile user={user} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  test('devrait appeler onEdit lors du clic sur modifier', () => {
    const mockOnEdit = jest.fn();
    const user = { id: 1, name: 'John Doe' };

    render(<UserProfile user={user} onEdit={mockOnEdit} />);

    fireEvent.click(screen.getByText('Modifier'));

    expect(mockOnEdit).toHaveBeenCalledWith(user.id);
  });
});
```

### Backend (PHPUnit - à implémenter)
```php
class UserControllerTest extends PHPUnit\Framework\TestCase
{
    public function testGetAllUsersReturnsArray(): void
    {
        $controller = new UserController();
        $result = $controller->getAllUsers();

        $this->assertIsArray($result);
    }

    public function testCreateUserWithValidData(): void
    {
        $userData = [
            'name' => 'Test User',
            'email' => 'test@example.com'
        ];

        $controller = new UserController();
        $result = $controller->createUser($userData);

        $this->assertTrue($result);
    }
}
```

## Performance

### Frontend
```typescript
// Memoization des composants
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* Rendu complexe */}</div>;
});

// useMemo pour les calculs coûteux
const expensiveValue = useMemo(() => {
  return complexCalculation(data);
}, [data]);

// useCallback pour les fonctions
const handleClick = useCallback((id: number) => {
  onItemClick(id);
}, [onItemClick]);
```

### Backend
```php
// Requêtes optimisées
public function getElevagesWithAnimalsCount(): array
{
    $sql = "SELECT e.*, COUNT(a.id) as animals_count
            FROM elevages e
            LEFT JOIN animals a ON e.id = a.elevage_id
            GROUP BY e.id
            ORDER BY e.nom";

    return $this->pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);
}
```

## Documentation

### Commentaires
```typescript
/**
 * Récupère les données d'un utilisateur par son ID
 * @param userId - L'identifiant unique de l'utilisateur
 * @returns Promise contenant les données utilisateur ou null
 * @throws Error si l'utilisateur n'existe pas
 */
const getUserById = async (userId: number): Promise<User | null> => {
  // Implémentation
};
```

```php
/**
 * Crée un nouvel élevage dans la base de données
 *
 * @param array $data Données de l'élevage (nom, adresse, etc.)
 * @param int $userId ID de l'utilisateur propriétaire
 * @return int ID de l'élevage créé
 * @throws ValidationException Si les données sont invalides
 * @throws DatabaseException Si l'insertion échoue
 */
public function createElevage(array $data, int $userId): int
{
    // Implémentation
}
```

## Commits Git

### Format des messages
```
type(scope): description courte

Description plus détaillée si nécessaire

- Changement 1
- Changement 2

Closes #123
```

### Types de commits
- `feat`: nouvelle fonctionnalité
- `fix`: correction de bug
- `docs`: documentation
- `style`: formatage, style
- `refactor`: refactoring sans changement fonctionnel
- `test`: ajout ou modification de tests
- `chore`: tâches de maintenance

### Exemples
```
feat(auth): ajouter authentification JWT

Implémentation de l'authentification basée sur JWT pour
sécuriser les endpoints de l'API.

- Middleware d'authentification
- Génération et validation des tokens
- Protection des routes sensibles

Closes #45

fix(elevage): corriger la validation du formulaire

Le champ téléphone acceptait des caractères invalides.
Ajout d'une regex pour valider le format.

style(frontend): formater les composants React

Application des règles ESLint et Prettier sur tous
les composants pour maintenir la cohérence du code.
```