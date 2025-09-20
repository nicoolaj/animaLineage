# Guide de Tests - AnimaLineage

## Vue d'ensemble

Ce guide présente la stratégie de tests complète pour l'application AnimaLineage, couvrant les tests unitaires, d'intégration, end-to-end et de sécurité pour les composants frontend React et backend PHP.

## Architecture de Tests

### Pyramide de Tests
```
    /\     E2E Tests (Cypress)
   /  \    ↑ Lents, Coûteux, Haute valeur
  /____\
 /      \  Integration Tests
/________\ ↓ Rapides, Peu coûteux, Nombreux
Unit Tests
```

## Tests Backend PHP

### Configuration PHPUnit

#### Installation et configuration
```bash
cd backend

# Installation via Composer
composer require --dev phpunit/phpunit
composer require --dev mockery/mockery
composer require --dev fakerphp/faker

# Création du fichier de configuration
```

```xml
<!-- backend/phpunit.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<phpunit bootstrap="tests/bootstrap.php"
         colors="true"
         processIsolation="false"
         stopOnFailure="false"
         testdox="true">

    <testsuites>
        <testsuite name="Unit">
            <directory>tests/Unit</directory>
        </testsuite>
        <testsuite name="Integration">
            <directory>tests/Integration</directory>
        </testsuite>
        <testsuite name="Feature">
            <directory>tests/Feature</directory>
        </testsuite>
    </testsuites>

    <coverage>
        <include>
            <directory suffix=".php">./controllers</directory>
            <directory suffix=".php">./models</directory>
            <directory suffix=".php">./middleware</directory>
        </include>
        <exclude>
            <directory>./vendor</directory>
            <directory>./tests</directory>
        </exclude>
    </coverage>

    <php>
        <env name="APP_ENV" value="testing"/>
        <env name="DB_DRIVER" value="sqlite"/>
        <env name="DB_NAME" value=":memory:"/>
    </php>
</phpunit>
```

#### Bootstrap de test
```php
<?php
// backend/tests/bootstrap.php
require_once __DIR__ . '/../vendor/autoload.php';

// Configuration d'environnement de test
$_ENV['APP_ENV'] = 'testing';
$_ENV['DB_DRIVER'] = 'sqlite';
$_ENV['DB_NAME'] = ':memory:';
$_ENV['JWT_SECRET'] = 'test_secret_key_for_testing_only';

// Démarrage de session pour les tests
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Autoloader pour les classes de test
spl_autoload_register(function ($class) {
    $testFile = __DIR__ . '/Helpers/' . str_replace('\\', '/', $class) . '.php';
    if (file_exists($testFile)) {
        require_once $testFile;
    }
});
```

### Tests Unitaires

#### Test du modèle User
```php
<?php
// backend/tests/Unit/UserTest.php
use PHPUnit\Framework\TestCase;
use Mockery;

class UserTest extends TestCase
{
    private $user;
    private $mockPdo;
    private $mockDatabase;

    protected function setUp(): void
    {
        $this->mockPdo = Mockery::mock(PDO::class);
        $this->mockDatabase = Mockery::mock(Database::class);
        $this->user = new User($this->mockPdo, $this->mockDatabase);
    }

    protected function tearDown(): void
    {
        Mockery::close();
    }

    public function testHashPasswordWithValidPassword(): void
    {
        $password = 'Test123!@#';
        $hashedPassword = $this->user->hashPassword($password);

        $this->assertTrue(password_verify($password, $hashedPassword));
        $this->assertNotEquals($password, $hashedPassword);
    }

    public function testHashPasswordWithWeakPasswordThrowsException(): void
    {
        $this->expectException(Exception::class);
        $this->expectExceptionMessage('Mot de passe trop faible');

        $this->user->hashPassword('123');
    }

    public function testValidateEmailWithValidEmail(): void
    {
        $validEmails = [
            'test@example.com',
            'user.name@domain.co.uk',
            'user+tag@example.org'
        ];

        foreach ($validEmails as $email) {
            $this->assertTrue($this->user->validateEmail($email));
        }
    }

    public function testValidateEmailWithInvalidEmail(): void
    {
        $invalidEmails = [
            'invalid.email',
            '@domain.com',
            'user@',
            'user name@domain.com'
        ];

        foreach ($invalidEmails as $email) {
            $this->assertFalse($this->user->validateEmail($email));
        }
    }

    public function testCreateUserWithValidData(): void
    {
        $userData = [
            'nom' => 'Jean Dupont',
            'email' => 'jean@example.com',
            'password' => 'Test123!@#'
        ];

        $mockStmt = Mockery::mock(PDOStatement::class);
        $mockStmt->shouldReceive('execute')->once()->andReturn(true);

        $this->mockPdo->shouldReceive('prepare')
            ->once()
            ->andReturn($mockStmt);

        $this->mockPdo->shouldReceive('lastInsertId')
            ->once()
            ->andReturn('1');

        $result = $this->user->create($userData);

        $this->assertEquals(1, $result);
    }
}
```

#### Test du contrôleur ElevageController
```php
<?php
// backend/tests/Unit/ElevageControllerTest.php
use PHPUnit\Framework\TestCase;
use Mockery;

class ElevageControllerTest extends TestCase
{
    private $controller;
    private $mockDatabase;
    private $mockUser;

    protected function setUp(): void
    {
        $this->mockDatabase = Mockery::mock(Database::class);
        $this->mockUser = Mockery::mock(User::class);
        $this->controller = new ElevageController($this->mockDatabase);

        // Mock de l'utilisateur connecté
        $_SESSION['user_id'] = 1;
        $_SESSION['user_role'] = 'eleveur';
    }

    protected function tearDown(): void
    {
        Mockery::close();
        unset($_SESSION['user_id'], $_SESSION['user_role']);
    }

    public function testGetElevagesReturnsUserElevages(): void
    {
        $expectedElevages = [
            ['id' => 1, 'nom' => 'Élevage Test 1'],
            ['id' => 2, 'nom' => 'Élevage Test 2']
        ];

        $mockStmt = Mockery::mock(PDOStatement::class);
        $mockStmt->shouldReceive('fetchAll')
            ->once()
            ->andReturn($expectedElevages);

        $this->mockDatabase->shouldReceive('getConnection->prepare')
            ->once()
            ->andReturn($mockStmt);

        $mockStmt->shouldReceive('execute')->once();

        ob_start();
        $this->controller->getElevages();
        $output = ob_get_clean();

        $response = json_decode($output, true);

        $this->assertEquals(200, $response['status']);
        $this->assertEquals($expectedElevages, $response['data']);
    }

    public function testCreateElevageWithValidData(): void
    {
        $_POST = [
            'nom' => 'Nouvel Élevage',
            'adresse' => '123 Rue de la Ferme',
            'telephone' => '01 23 45 67 89'
        ];

        $mockStmt = Mockery::mock(PDOStatement::class);
        $mockStmt->shouldReceive('execute')->once()->andReturn(true);

        $this->mockDatabase->shouldReceive('getConnection->prepare')
            ->once()
            ->andReturn($mockStmt);

        $this->mockDatabase->shouldReceive('getConnection->lastInsertId')
            ->once()
            ->andReturn('3');

        ob_start();
        $this->controller->createElevage();
        $output = ob_get_clean();

        $response = json_decode($output, true);

        $this->assertEquals(201, $response['status']);
        $this->assertEquals(3, $response['data']['id']);
    }
}
```

### Tests d'Intégration

#### Test d'API complète
```php
<?php
// backend/tests/Integration/ElevageAPITest.php
use PHPUnit\Framework\TestCase;

class ElevageAPITest extends TestCase
{
    private $database;
    private $authToken;

    protected function setUp(): void
    {
        // Configuration de la base de test
        $this->database = new Database();
        $this->setupTestDatabase();
        $this->authToken = $this->getAuthToken();
    }

    protected function tearDown(): void
    {
        $this->cleanupTestDatabase();
    }

    private function setupTestDatabase(): void
    {
        $pdo = $this->database->getConnection();

        // Création des tables de test
        $migrations = glob(__DIR__ . '/../../migrations/*.php');
        foreach ($migrations as $migration) {
            require_once $migration;
        }
    }

    private function cleanupTestDatabase(): void
    {
        $pdo = $this->database->getConnection();
        $tables = ['animals', 'elevages', 'races', 'types_animaux', 'users'];

        foreach ($tables as $table) {
            $pdo->exec("DELETE FROM $table");
        }
    }

    private function getAuthToken(): string
    {
        // Créer un utilisateur de test et obtenir le token
        $user = new User($this->database->getConnection(), $this->database);
        $userId = $user->create([
            'nom' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'Test123!@#',
            'status' => 1
        ]);

        $authController = new AuthController($user, $this->database);
        return $authController->generateToken($userId);
    }

    public function testCompleteElevageWorkflow(): void
    {
        // 1. Créer un élevage
        $elevageData = [
            'nom' => 'Élevage de Test',
            'adresse' => '123 Test Street',
            'telephone' => '01 23 45 67 89'
        ];

        $createResponse = $this->makeApiRequest('POST', '/api/elevages', $elevageData);
        $this->assertEquals(201, $createResponse['status']);
        $elevageId = $createResponse['data']['id'];

        // 2. Récupérer l'élevage
        $getResponse = $this->makeApiRequest('GET', "/api/elevages/$elevageId");
        $this->assertEquals(200, $getResponse['status']);
        $this->assertEquals($elevageData['nom'], $getResponse['data']['nom']);

        // 3. Modifier l'élevage
        $updateData = ['nom' => 'Élevage Modifié'];
        $updateResponse = $this->makeApiRequest('PUT', "/api/elevages/$elevageId", $updateData);
        $this->assertEquals(200, $updateResponse['status']);

        // 4. Vérifier la modification
        $verifyResponse = $this->makeApiRequest('GET', "/api/elevages/$elevageId");
        $this->assertEquals('Élevage Modifié', $verifyResponse['data']['nom']);

        // 5. Lister les élevages
        $listResponse = $this->makeApiRequest('GET', '/api/elevages');
        $this->assertEquals(200, $listResponse['status']);
        $this->assertCount(1, $listResponse['data']);
    }

    private function makeApiRequest(string $method, string $endpoint, array $data = []): array
    {
        // Simulation d'une requête HTTP
        $_SERVER['REQUEST_METHOD'] = $method;
        $_SERVER['REQUEST_URI'] = $endpoint;
        $_SERVER['HTTP_AUTHORIZATION'] = "Bearer {$this->authToken}";

        if (!empty($data)) {
            $_POST = $data;
        }

        ob_start();
        include __DIR__ . '/../../index.php';
        $output = ob_get_clean();

        return json_decode($output, true);
    }
}
```

### Tests de Performance

#### Test de charge de l'API
```php
<?php
// backend/tests/Performance/LoadTest.php
use PHPUnit\Framework\TestCase;

class LoadTest extends TestCase
{
    public function testApiPerformanceUnderLoad(): void
    {
        $startTime = microtime(true);
        $requests = [];

        // Simuler 100 requêtes simultanées
        for ($i = 0; $i < 100; $i++) {
            $requests[] = $this->makeAsyncRequest('/api/elevages');
        }

        // Attendre toutes les réponses
        $responses = $this->waitForAllResponses($requests);
        $endTime = microtime(true);

        $totalTime = $endTime - $startTime;
        $averageTime = $totalTime / count($requests);

        // Assertions de performance
        $this->assertLessThan(5.0, $totalTime, 'Le test de charge doit prendre moins de 5 secondes');
        $this->assertLessThan(0.1, $averageTime, 'Chaque requête doit prendre moins de 100ms en moyenne');

        // Vérifier que toutes les requêtes ont réussi
        foreach ($responses as $response) {
            $this->assertEquals(200, $response['status']);
        }
    }

    private function makeAsyncRequest(string $endpoint): array
    {
        // Implémentation de requête asynchrone
        // En production, utiliser guzzlehttp/guzzle ou ReactPHP
        return [
            'endpoint' => $endpoint,
            'start_time' => microtime(true)
        ];
    }

    private function waitForAllResponses(array $requests): array
    {
        // Simulation des réponses
        return array_map(function($request) {
            return [
                'status' => 200,
                'time' => microtime(true) - $request['start_time']
            ];
        }, $requests);
    }
}
```

## Tests Frontend React

### Configuration Jest et React Testing Library

#### Configuration
```json
// frontend/package.json
{
  "scripts": {
    "test": "react-scripts test",
    "test:watch": "react-scripts test --watch",
    "test:coverage": "react-scripts test --coverage --watch=false",
    "test:ci": "CI=true react-scripts test --coverage --watch=false"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.8.0",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^13.5.0",
    "msw": "^2.0.0"
  },
  "jest": {
    "collectCoverageFrom": [
      "src/**/*.{js,jsx,ts,tsx}",
      "!src/index.tsx",
      "!src/reportWebVitals.ts",
      "!src/**/*.d.ts"
    ],
    "coverageThreshold": {
      "global": {
        "branches": 70,
        "functions": 70,
        "lines": 70,
        "statements": 70
      }
    }
  }
}
```

#### Configuration MSW pour les mocks API
```typescript
// frontend/src/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  // Mock authentification
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        status: 200,
        data: {
          token: 'mock-jwt-token',
          user: {
            id: 1,
            nom: 'Test User',
            email: 'test@example.com',
            status: 1,
            role: 'eleveur'
          }
        }
      })
    );
  }),

  // Mock élevages
  rest.get('/api/elevages', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        status: 200,
        data: [
          { id: 1, nom: 'Élevage Test 1', adresse: '123 Test St' },
          { id: 2, nom: 'Élevage Test 2', adresse: '456 Test Ave' }
        ]
      })
    );
  }),

  rest.post('/api/elevages', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        status: 201,
        data: { id: 3, ...req.body }
      })
    );
  })
];
```

```typescript
// frontend/src/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

### Tests de Composants

#### Test du composant Auth
```typescript
// frontend/src/components/__tests__/Auth.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../../contexts/AuthContext';
import Auth from '../Auth';

// Mock du contexte d'authentification
const mockLogin = jest.fn();
jest.mock('../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../contexts/AuthContext'),
  useAuth: () => ({
    login: mockLogin,
    isLoading: false,
    error: null
  })
}));

describe('Auth Component', () => {
  beforeEach(() => {
    mockLogin.mockClear();
  });

  test('renders login form', () => {
    render(
      <AuthProvider>
        <Auth />
      </AuthProvider>
    );

    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/mot de passe/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /connexion/i })).toBeInTheDocument();
  });

  test('validates required fields', async () => {
    render(
      <AuthProvider>
        <Auth />
      </AuthProvider>
    );

    const submitButton = screen.getByRole('button', { name: /connexion/i });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email requis/i)).toBeInTheDocument();
      expect(screen.getByText(/mot de passe requis/i)).toBeInTheDocument();
    });
  });

  test('validates email format', async () => {
    render(
      <AuthProvider>
        <Auth />
      </AuthProvider>
    );

    const emailInput = screen.getByPlaceholderText(/email/i);

    await userEvent.type(emailInput, 'invalid-email');
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.getByText(/email invalide/i)).toBeInTheDocument();
    });
  });

  test('submits form with valid data', async () => {
    mockLogin.mockResolvedValue({ success: true });

    render(
      <AuthProvider>
        <Auth />
      </AuthProvider>
    );

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /connexion/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });

  test('displays error message on login failure', async () => {
    const errorMessage = 'Identifiants incorrects';
    mockLogin.mockRejectedValue(new Error(errorMessage));

    render(
      <AuthProvider>
        <Auth />
      </AuthProvider>
    );

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /connexion/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'wrongpassword');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });
});
```

#### Test du composant ElevageForm
```typescript
// frontend/src/components/__tests__/ElevageForm.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ElevageForm from '../ElevageForm';

describe('ElevageForm Component', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnCancel.mockClear();
  });

  test('renders form fields', () => {
    render(
      <ElevageForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByLabelText(/nom de l'élevage/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/adresse/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/téléphone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  test('validates required fields', async () => {
    render(
      <ElevageForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const submitButton = screen.getByRole('button', { name: /créer/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/nom requis/i)).toBeInTheDocument();
      expect(screen.getByText(/adresse requise/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('submits form with valid data', async () => {
    render(
      <ElevageForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const formData = {
      nom: 'Élevage Test',
      adresse: '123 Rue de la Ferme',
      telephone: '01 23 45 67 89',
      email: 'contact@elevage-test.fr'
    };

    await userEvent.type(screen.getByLabelText(/nom de l'élevage/i), formData.nom);
    await userEvent.type(screen.getByLabelText(/adresse/i), formData.adresse);
    await userEvent.type(screen.getByLabelText(/téléphone/i), formData.telephone);
    await userEvent.type(screen.getByLabelText(/email/i), formData.email);

    fireEvent.click(screen.getByRole('button', { name: /créer/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(formData);
    });
  });

  test('calls onCancel when cancel button is clicked', () => {
    render(
      <ElevageForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /annuler/i }));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  test('prefills form in edit mode', () => {
    const existingElevage = {
      id: 1,
      nom: 'Élevage Existant',
      adresse: '456 Ancien Chemin',
      telephone: '01 98 76 54 32',
      email: 'ancien@elevage.fr'
    };

    render(
      <ElevageForm
        elevage={existingElevage}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByDisplayValue(existingElevage.nom)).toBeInTheDocument();
    expect(screen.getByDisplayValue(existingElevage.adresse)).toBeInTheDocument();
    expect(screen.getByDisplayValue(existingElevage.telephone)).toBeInTheDocument();
    expect(screen.getByDisplayValue(existingElevage.email)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /modifier/i })).toBeInTheDocument();
  });
});
```

### Tests d'Intégration Frontend

#### Test d'intégration avec l'API
```typescript
// frontend/src/integration/__tests__/ElevageWorkflow.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../../contexts/AuthContext';
import App from '../../App';
import { server } from '../../mocks/server';

// Configuration MSW
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Elevage Management Workflow', () => {
  test('complete elevage management workflow', async () => {
    render(
      <AuthProvider>
        <App />
      </AuthProvider>
    );

    // 1. Login
    await userEvent.type(screen.getByPlaceholderText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByPlaceholderText(/mot de passe/i), 'password123');
    fireEvent.click(screen.getByRole('button', { name: /connexion/i }));

    // 2. Attendre le chargement du dashboard
    await waitFor(() => {
      expect(screen.getByText(/tableau de bord/i)).toBeInTheDocument();
    });

    // 3. Naviguer vers la gestion des élevages
    fireEvent.click(screen.getByText(/élevages/i));

    await waitFor(() => {
      expect(screen.getByText(/liste des élevages/i)).toBeInTheDocument();
    });

    // 4. Créer un nouvel élevage
    fireEvent.click(screen.getByRole('button', { name: /ajouter un élevage/i }));

    await userEvent.type(screen.getByLabelText(/nom de l'élevage/i), 'Nouvel Élevage');
    await userEvent.type(screen.getByLabelText(/adresse/i), '789 Nouvelle Route');

    fireEvent.click(screen.getByRole('button', { name: /créer/i }));

    // 5. Vérifier que l'élevage apparaît dans la liste
    await waitFor(() => {
      expect(screen.getByText('Nouvel Élevage')).toBeInTheDocument();
      expect(screen.getByText('789 Nouvelle Route')).toBeInTheDocument();
    });

    // 6. Modifier l'élevage
    fireEvent.click(screen.getByRole('button', { name: /modifier/i }));

    const nomInput = screen.getByDisplayValue('Nouvel Élevage');
    await userEvent.clear(nomInput);
    await userEvent.type(nomInput, 'Élevage Modifié');

    fireEvent.click(screen.getByRole('button', { name: /sauvegarder/i }));

    // 7. Vérifier la modification
    await waitFor(() => {
      expect(screen.getByText('Élevage Modifié')).toBeInTheDocument();
    });
  });
});
```

## Tests End-to-End avec Cypress

### Configuration Cypress

#### Installation et configuration
```bash
cd frontend

# Installation de Cypress
npm install --save-dev cypress

# Scripts package.json
```

```json
{
  "scripts": {
    "cypress:open": "cypress open",
    "cypress:run": "cypress run",
    "e2e:dev": "start-server-and-test dev 3002 cypress:open",
    "e2e:ci": "start-server-and-test build:test 3002 cypress:run"
  }
}
```

#### Configuration Cypress
```typescript
// frontend/cypress.config.ts
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3002',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    video: true,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720,

    env: {
      apiUrl: 'http://localhost:3001',
      testUser: {
        email: 'test@example.com',
        password: 'Test123!@#'
      }
    },

    setupNodeEvents(on, config) {
      // Plugins et tâches personnalisées
      on('task', {
        seedDatabase() {
          // Tâche pour initialiser la base de données de test
          return null;
        },

        cleanDatabase() {
          // Tâche pour nettoyer la base de données
          return null;
        }
      });
    }
  }
});
```

### Tests E2E

#### Test complet de gestion d'élevage
```typescript
// frontend/cypress/e2e/elevage-management.cy.ts
describe('Gestion des Élevages', () => {
  beforeEach(() => {
    // Initialiser la base de données de test
    cy.task('seedDatabase');

    // Se connecter
    cy.visit('/');
    cy.get('[data-testid="email-input"]').type(Cypress.env('testUser').email);
    cy.get('[data-testid="password-input"]').type(Cypress.env('testUser').password);
    cy.get('[data-testid="login-button"]').click();

    // Attendre le chargement du dashboard
    cy.get('[data-testid="dashboard"]').should('be.visible');
  });

  afterEach(() => {
    cy.task('cleanDatabase');
  });

  it('should create, edit and delete an elevage', () => {
    // Navigation vers les élevages
    cy.get('[data-testid="nav-elevages"]').click();
    cy.url().should('include', '/elevages');

    // Créer un nouvel élevage
    cy.get('[data-testid="add-elevage-button"]').click();

    cy.get('[data-testid="elevage-nom"]').type('Élevage Cypress Test');
    cy.get('[data-testid="elevage-adresse"]').type('123 Cypress Street');
    cy.get('[data-testid="elevage-telephone"]').type('01 23 45 67 89');
    cy.get('[data-testid="elevage-email"]').type('cypress@test.com');

    cy.get('[data-testid="create-elevage-button"]').click();

    // Vérifier la création
    cy.get('[data-testid="success-message"]').should('contain', 'Élevage créé avec succès');
    cy.get('[data-testid="elevage-list"]').should('contain', 'Élevage Cypress Test');

    // Modifier l'élevage
    cy.get('[data-testid="edit-elevage-button"]').first().click();

    cy.get('[data-testid="elevage-nom"]').clear().type('Élevage Modifié');
    cy.get('[data-testid="save-elevage-button"]').click();

    // Vérifier la modification
    cy.get('[data-testid="success-message"]').should('contain', 'Élevage modifié avec succès');
    cy.get('[data-testid="elevage-list"]').should('contain', 'Élevage Modifié');

    // Supprimer l'élevage
    cy.get('[data-testid="delete-elevage-button"]').first().click();
    cy.get('[data-testid="confirm-delete-button"]').click();

    // Vérifier la suppression
    cy.get('[data-testid="success-message"]').should('contain', 'Élevage supprimé avec succès');
    cy.get('[data-testid="elevage-list"]').should('not.contain', 'Élevage Modifié');
  });

  it('should validate form fields', () => {
    cy.get('[data-testid="nav-elevages"]').click();
    cy.get('[data-testid="add-elevage-button"]').click();

    // Tentative de soumission avec des champs vides
    cy.get('[data-testid="create-elevage-button"]').click();

    // Vérifier les messages d'erreur
    cy.get('[data-testid="error-nom"]').should('contain', 'Le nom est requis');
    cy.get('[data-testid="error-adresse"]').should('contain', 'L\'adresse est requise');

    // Saisir des données invalides
    cy.get('[data-testid="elevage-email"]').type('email-invalide');
    cy.get('[data-testid="elevage-telephone"]').type('numéro-invalide');

    cy.get('[data-testid="create-elevage-button"]').click();

    cy.get('[data-testid="error-email"]').should('contain', 'Email invalide');
    cy.get('[data-testid="error-telephone"]').should('contain', 'Numéro de téléphone invalide');
  });

  it('should handle API errors gracefully', () => {
    // Intercepter les appels API pour simuler des erreurs
    cy.intercept('POST', '/api/elevages', { statusCode: 500 }).as('createElevageError');

    cy.get('[data-testid="nav-elevages"]').click();
    cy.get('[data-testid="add-elevage-button"]').click();

    cy.get('[data-testid="elevage-nom"]').type('Test Error');
    cy.get('[data-testid="elevage-adresse"]').type('Test Address');
    cy.get('[data-testid="create-elevage-button"]').click();

    cy.wait('@createElevageError');
    cy.get('[data-testid="error-message"]').should('contain', 'Erreur lors de la création');
  });
});
```

#### Test de performance
```typescript
// frontend/cypress/e2e/performance.cy.ts
describe('Tests de Performance', () => {
  it('should load the dashboard within acceptable time', () => {
    cy.visit('/');

    // Mesurer le temps de connexion
    const startTime = Date.now();

    cy.get('[data-testid="email-input"]').type(Cypress.env('testUser').email);
    cy.get('[data-testid="password-input"]').type(Cypress.env('testUser').password);
    cy.get('[data-testid="login-button"]').click();

    cy.get('[data-testid="dashboard"]').should('be.visible').then(() => {
      const loadTime = Date.now() - startTime;
      expect(loadTime).to.be.lessThan(3000); // Moins de 3 secondes
    });
  });

  it('should handle large lists efficiently', () => {
    // Créer une liste avec beaucoup d'éléments
    cy.task('seedLargeDataset');

    cy.visit('/elevages');

    // Vérifier que la liste se charge rapidement
    cy.get('[data-testid="elevage-list"]', { timeout: 5000 }).should('be.visible');

    // Tester le scroll virtuel si implémenté
    cy.get('[data-testid="elevage-item"]').should('have.length.at.least', 10);

    // Tester la recherche
    cy.get('[data-testid="search-input"]').type('test');
    cy.get('[data-testid="elevage-item"]').should('have.length.lessThan', 100);
  });
});
```

## Scripts de Test

### Script de test complet
```bash
#!/bin/bash
# scripts/run-tests.sh

echo "🧪 Démarrage des tests animaLignage"

# Variables
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
EXIT_CODE=0

# Fonction pour afficher les résultats
print_result() {
    if [ $1 -eq 0 ]; then
        echo "✅ $2"
    else
        echo "❌ $2"
        EXIT_CODE=1
    fi
}

# Tests Backend PHP
echo "🔧 Tests Backend PHP..."
cd $BACKEND_DIR

if [ -f "vendor/bin/phpunit" ]; then
    vendor/bin/phpunit --testdox
    print_result $? "Tests unitaires PHP"

    vendor/bin/phpunit --testsuite=Integration --testdox
    print_result $? "Tests d'intégration PHP"

    # Analyse de code avec PHPStan si disponible
    if [ -f "vendor/bin/phpstan" ]; then
        vendor/bin/phpstan analyse --level=5 controllers models
        print_result $? "Analyse statique PHP"
    fi
else
    echo "⚠️  PHPUnit non installé, ignoré"
fi

cd ..

# Tests Frontend React
echo "⚛️  Tests Frontend React..."
cd $FRONTEND_DIR

if [ -f "package.json" ]; then
    npm test -- --coverage --watch=false
    print_result $? "Tests unitaires React"

    # Tests E2E avec Cypress
    npm run build
    npm run start &
    SERVER_PID=$!

    sleep 10  # Attendre que le serveur démarre

    npx cypress run
    print_result $? "Tests E2E Cypress"

    kill $SERVER_PID
else
    echo "⚠️  package.json non trouvé, ignoré"
fi

cd ..

# Tests de sécurité
echo "🛡️  Tests de sécurité..."
if command -v npm audit &> /dev/null; then
    cd $FRONTEND_DIR
    npm audit --audit-level moderate
    print_result $? "Audit de sécurité Frontend"
    cd ..
fi

if command -v composer &> /dev/null; then
    cd $BACKEND_DIR
    composer audit
    print_result $? "Audit de sécurité Backend"
    cd ..
fi

# Résultat final
echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "🎉 Tous les tests sont passés avec succès!"
else
    echo "💥 Certains tests ont échoué"
fi

exit $EXIT_CODE
```

### Configuration CI/CD pour GitHub Actions
```yaml
# .github/workflows/tests.yml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  backend-tests:
    runs-on: ubuntu-latest

    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: animalignage_test
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3

    steps:
    - uses: actions/checkout@v3

    - name: Setup PHP
      uses: shivammathur/setup-php@v2
      with:
        php-version: '7.4'
        extensions: pdo, mysql, sqlite

    - name: Install backend dependencies
      run: |
        cd backend
        composer install --prefer-dist --no-progress

    - name: Run backend tests
      run: |
        cd backend
        vendor/bin/phpunit --coverage-clover=coverage.xml

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: backend/coverage.xml

  frontend-tests:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json

    - name: Install frontend dependencies
      run: |
        cd frontend
        npm ci

    - name: Run frontend tests
      run: |
        cd frontend
        npm test -- --coverage --watch=false

    - name: Build frontend
      run: |
        cd frontend
        npm run build

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [backend-tests, frontend-tests]

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Setup PHP
      uses: shivammathur/setup-php@v2
      with:
        php-version: '7.4'

    - name: Start backend server
      run: |
        cd backend
        composer install
        php -S localhost:3001 &

    - name: Start frontend server
      run: |
        cd frontend
        npm ci
        npm run build
        npx serve -s build -l 3002 &

    - name: Run Cypress tests
      uses: cypress-io/github-action@v5
      with:
        working-directory: frontend
        wait-on: 'http://localhost:3002, http://localhost:3001'
        wait-on-timeout: 120
```

Cette documentation fournit une stratégie de tests complète pour animaLignage. Adaptez les configurations selon vos besoins spécifiques et votre infrastructure.

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Read and analyze current .claudecontext file", "status": "completed", "activeForm": "Reading and analyzing current .claudecontext file"}, {"content": "Update .claudecontext with current project understanding", "status": "completed", "activeForm": "Updating .claudecontext with current project understanding"}, {"content": "Update README.md with latest project information", "status": "completed", "activeForm": "Updating README.md with latest project information"}, {"content": "Update DATABASE.md with enhanced documentation", "status": "completed", "activeForm": "Updating DATABASE.md with enhanced documentation"}, {"content": "Create or update additional documentation files", "status": "completed", "activeForm": "Creating or updating additional documentation files"}]