import { http, HttpResponse } from 'msw';

// Types pour les réponses API
interface User {
  id: number;
  nom: string;
  email: string;
  status: number;
  role: string;
}

interface Elevage {
  id: number;
  nom: string;
  adresse: string;
  telephone?: string;
  email?: string;
  user_id: number;
  created_at: string;
}

interface Animal {
  id: number;
  nom: string;
  numero?: string;
  elevage_id: number;
  race_id?: number;
  type_animal_id?: number;
  date_naissance?: string;
  sexe?: string;
}

// Données de test
const mockUsers: User[] = [
  {
    id: 1,
    nom: 'Test User',
    email: 'test@example.com',
    status: 1,
    role: 'eleveur'
  },
  {
    id: 2,
    nom: 'Admin User',
    email: 'admin@example.com',
    status: 1,
    role: 'admin'
  }
];

const mockElevages: Elevage[] = [
  {
    id: 1,
    nom: 'Élevage Test 1',
    adresse: '123 Test Street',
    telephone: '01 23 45 67 89',
    email: 'elevage1@test.com',
    user_id: 1,
    created_at: '2025-01-01T10:00:00Z'
  },
  {
    id: 2,
    nom: 'Élevage Test 2',
    adresse: '456 Test Avenue',
    telephone: '01 98 76 54 32',
    email: 'elevage2@test.com',
    user_id: 1,
    created_at: '2025-01-02T10:00:00Z'
  }
];

const mockAnimals: Animal[] = [
  {
    id: 1,
    nom: 'Bella',
    numero: 'FR001234567890',
    elevage_id: 1,
    race_id: 1,
    type_animal_id: 1,
    date_naissance: '2023-05-15',
    sexe: 'F'
  },
  {
    id: 2,
    nom: 'Rex',
    numero: 'FR001234567891',
    elevage_id: 1,
    race_id: 1,
    type_animal_id: 1,
    date_naissance: '2023-06-20',
    sexe: 'M'
  }
];

export const handlers = [
  // Authentification
  http.post('http://localhost:3001/api/auth/login', async ({ request }) => {
    const { email, password } = await request.json() as { email: string; password: string };

    if (email === 'test@example.com' && password === 'password123') {
      return HttpResponse.json({
        status: 200,
        data: {
          token: 'mock-jwt-token-valid',
          user: mockUsers[0]
        }
      });
    }

    if (email === 'admin@example.com' && password === 'admin123') {
      return HttpResponse.json({
        status: 200,
        data: {
          token: 'mock-jwt-token-admin',
          user: mockUsers[1]
        }
      });
    }

    return HttpResponse.json({
      status: 401,
      message: 'Identifiants incorrects'
    }, { status: 401 });
  }),

  http.post('http://localhost:3001/api/auth/register', async ({ request }) => {
    const userData = await request.json() as any;

    if (!userData.nom || !userData.email || !userData.password) {
      return HttpResponse.json({
        status: 422,
        errors: {
          nom: userData.nom ? [] : ['Le nom est requis'],
          email: userData.email ? [] : ['L\'email est requis'],
          password: userData.password ? [] : ['Le mot de passe est requis']
        }
      }, { status: 422 });
    }

    const newUser = {
      id: mockUsers.length + 1,
      nom: userData.nom,
      email: userData.email,
      status: 0, // En attente
      role: 'eleveur'
    };

    return HttpResponse.json({
      status: 201,
      data: {
        user: newUser
      }
    }, { status: 201 });
  }),

  http.post('http://localhost:3001/api/auth/logout', () => {
    return HttpResponse.json({
      status: 200,
      message: 'Déconnexion réussie'
    });
  }),

  // Utilisateurs
  http.get('http://localhost:3001/api/users', ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.includes('mock-jwt-token')) {
      return HttpResponse.json({
        status: 401,
        message: 'Token d\'authentification requis'
      }, { status: 401 });
    }

    return HttpResponse.json({
      status: 200,
      data: mockUsers
    });
  }),

  http.post('http://localhost:3001/api/users', async ({ request }) => {
    const userData = await request.json() as any;
    const newUser = {
      id: mockUsers.length + 1,
      ...userData,
      status: 0
    };

    return HttpResponse.json({
      status: 201,
      data: newUser
    }, { status: 201 });
  }),

  // Élevages
  http.get('http://localhost:3001/api/elevages', ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.includes('mock-jwt-token')) {
      return HttpResponse.json({
        status: 401,
        message: 'Token d\'authentification requis'
      }, { status: 401 });
    }

    const url = new URL(request.url);
    const search = url.searchParams.get('search');
    let filteredElevages = mockElevages;

    if (search) {
      filteredElevages = mockElevages.filter(elevage =>
        elevage.nom.toLowerCase().includes(search.toLowerCase()) ||
        elevage.adresse.toLowerCase().includes(search.toLowerCase())
      );
    }

    return HttpResponse.json({
      status: 200,
      data: filteredElevages
    });
  }),

  http.get('http://localhost:3001/api/elevages/:id', ({ params }) => {
    const { id } = params;
    const elevage = mockElevages.find(e => e.id === parseInt(id as string));

    if (!elevage) {
      return HttpResponse.json({
        status: 404,
        message: 'Élevage non trouvé'
      }, { status: 404 });
    }

    return HttpResponse.json({
      status: 200,
      data: elevage
    });
  }),

  http.post('http://localhost:3001/api/elevages', async ({ request }) => {
    const elevageData = await request.json() as any;

    if (!elevageData.nom || !elevageData.adresse) {
      return HttpResponse.json({
        status: 422,
        errors: {
          nom: elevageData.nom ? [] : ['Le nom est requis'],
          adresse: elevageData.adresse ? [] : ['L\'adresse est requise']
        }
      }, { status: 422 });
    }

    const newElevage = {
      id: mockElevages.length + 1,
      ...elevageData,
      user_id: 1,
      created_at: new Date().toISOString()
    };

    return HttpResponse.json({
      status: 201,
      data: newElevage
    }, { status: 201 });
  }),

  http.put('http://localhost:3001/api/elevages/:id', async ({ params, request }) => {
    const { id } = params;
    const updateData = await request.json() as any;
    const elevage = mockElevages.find(e => e.id === parseInt(id as string));

    if (!elevage) {
      return HttpResponse.json({
        status: 404,
        message: 'Élevage non trouvé'
      }, { status: 404 });
    }

    const updatedElevage = { ...elevage, ...updateData };

    return HttpResponse.json({
      status: 200,
      data: updatedElevage
    });
  }),

  http.delete('http://localhost:3001/api/elevages/:id', ({ params }) => {
    const { id } = params;
    const elevageIndex = mockElevages.findIndex(e => e.id === parseInt(id as string));

    if (elevageIndex === -1) {
      return HttpResponse.json({
        status: 404,
        message: 'Élevage non trouvé'
      }, { status: 404 });
    }

    return HttpResponse.json({
      status: 200,
      message: 'Élevage supprimé avec succès'
    });
  }),

  // Animaux
  http.get('http://localhost:3001/api/animals', ({ request }) => {
    const url = new URL(request.url);
    const elevageId = url.searchParams.get('elevage_id');
    let filteredAnimals = mockAnimals;

    if (elevageId) {
      filteredAnimals = mockAnimals.filter(animal =>
        animal.elevage_id === parseInt(elevageId)
      );
    }

    return HttpResponse.json({
      status: 200,
      data: filteredAnimals
    });
  }),

  http.post('http://localhost:3001/api/animals', async ({ request }) => {
    const animalData = await request.json() as any;

    if (!animalData.nom || !animalData.elevage_id) {
      return HttpResponse.json({
        status: 422,
        errors: {
          nom: animalData.nom ? [] : ['Le nom est requis'],
          elevage_id: animalData.elevage_id ? [] : ['L\'élevage est requis']
        }
      }, { status: 422 });
    }

    const newAnimal = {
      id: mockAnimals.length + 1,
      ...animalData
    };

    return HttpResponse.json({
      status: 201,
      data: newAnimal
    }, { status: 201 });
  }),

  // Races
  http.get('http://localhost:3001/api/races', () => {
    const mockRaces = [
      { id: 1, nom: 'Holstein', type_animal_id: 1, description: 'Race laitière' },
      { id: 2, nom: 'Charolaise', type_animal_id: 1, description: 'Race à viande' },
      { id: 3, nom: 'Lacaune', type_animal_id: 2, description: 'Race ovine laitière' }
    ];

    return HttpResponse.json({
      status: 200,
      data: mockRaces
    });
  }),

  // Types d'animaux
  http.get('http://localhost:3001/api/types-animaux', () => {
    const mockTypes = [
      { id: 1, nom: 'Bovin', description: 'Bovins domestiques' },
      { id: 2, nom: 'Ovin', description: 'Ovins domestiques' },
      { id: 3, nom: 'Caprin', description: 'Caprins domestiques' }
    ];

    return HttpResponse.json({
      status: 200,
      data: mockTypes
    });
  }),

  // Gestion des erreurs 500
  http.get('http://localhost:3001/api/error-test', () => {
    return HttpResponse.json({
      status: 500,
      message: 'Erreur serveur de test'
    }, { status: 500 });
  })
];