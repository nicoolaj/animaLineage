// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { server } from './mocks/server';
import { vi } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

// Configuration MSW pour les tests
beforeAll(() => {
  // Démarrer le serveur MSW avant tous les tests
  server.listen({
    onUnhandledRequest: 'warn'
  });
});

afterEach(() => {
  // Réinitialiser les handlers après chaque test
  server.resetHandlers();
});

afterAll(() => {
  // Arrêter le serveur MSW après tous les tests
  server.close();
});

// Configurer l'environnement de test
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Déprécié
    removeListener: vi.fn(), // Déprécié
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock HTMLCanvasElement
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({
    data: new Array(4)
  })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => []),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
  strokeRect: vi.fn(),
  strokeText: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock pour localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock pour sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Réinitialiser les mocks avant chaque test
beforeEach(() => {
  vi.clearAllMocks();

  // Create a valid JWT token for testing
  const createMockJWT = (payload: any) => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify(payload));
    const signature = 'mock-signature';
    return `${header}.${body}.${signature}`;
  };

  const mockToken = createMockJWT({ id: 1, nom: 'Test User', role: 2, elevages: [1] });

  // Default sessionStorage behavior
  sessionStorageMock.getItem = vi.fn((key: string) => {
    if (key === 'token') return mockToken;
    if (key === 'user') return JSON.stringify({ id: 1, nom: 'Test User', role: 2 });
    return null;
  });

  // Default localStorage behavior
  localStorageMock.getItem = vi.fn((key: string) => {
    if (key === 'language') return 'fr';
    return null;
  });

  // Default fetch behavior
  global.fetch = vi.fn((url: string) => {
    if (url.includes('/auth/me')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ user: { id: 1, nom: 'Test User', role: 2 } })
      });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([])
    });
  });
});
