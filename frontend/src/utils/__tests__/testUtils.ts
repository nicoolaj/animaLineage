import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import userEvent from '@testing-library/user-event';

// Extended render function with common providers
export const renderWithProviders = (
  ui: ReactElement,
  options?: RenderOptions
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
  };

  return rtlRender(ui, { wrapper: Wrapper, ...options });
};

// Mock API responses
export const mockApiResponse = (data: any, ok = true, status = 200) => {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    blob: () => Promise.resolve(new Blob([JSON.stringify(data)]))
  });
};

// Mock error response
export const mockApiError = (message = 'API Error', status = 500) => {
  return Promise.reject({
    ok: false,
    status,
    message,
    json: () => Promise.resolve({ error: message })
  });
};

// Common test data factories
export const createMockAnimal = (overrides: Partial<any> = {}) => ({
  id: 1,
  identifiant_officiel: 'TEST001',
  nom: 'Test Animal',
  sexe: 'M',
  race_nom: 'Holstein',
  date_naissance: '2020-01-01',
  statut: 'vivant',
  elevage_id: 1,
  ...overrides
});

export const createMockElevage = (overrides: Partial<any> = {}) => ({
  id: 1,
  nom: 'Test Elevage',
  description: 'Test Description',
  user_id: 1,
  users: [],
  animaux_count: 0,
  ...overrides
});

export const createMockUser = (overrides: Partial<any> = {}) => ({
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  role: 1,
  role_name: 'Admin',
  status: 1,
  ...overrides
});

// Setup user event
export const setupUser = () => userEvent.setup();

// Mock session storage
export const mockSessionStorage = () => {
  const storage: { [key: string]: string } = {};

  return {
    getItem: jest.fn((key: string) => storage[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete storage[key];
    }),
    clear: jest.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key]);
    })
  };
};

// Mock local storage
export const mockLocalStorage = () => {
  const storage: { [key: string]: string } = {};

  return {
    getItem: jest.fn((key: string) => storage[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete storage[key];
    }),
    clear: jest.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key]);
    })
  };
};

// Mock fetch with custom responses
export const mockFetch = (responses: any[] | any) => {
  const responsesArray = Array.isArray(responses) ? responses : [responses];
  let callCount = 0;

  return jest.fn(() => {
    const response = responsesArray[callCount] || responsesArray[responsesArray.length - 1];
    callCount++;
    return mockApiResponse(response);
  });
};

// Wait for element helpers
export const waitForLoadingToFinish = async () => {
  const { waitForElementToBeRemoved, screen } = await import('@testing-library/react');

  // Wait for common loading indicators to disappear
  const loadingTexts = [
    /chargement/i,
    /loading/i,
    /veuillez patienter/i
  ];

  for (const loadingText of loadingTexts) {
    try {
      const loadingElement = screen.queryByText(loadingText);
      if (loadingElement) {
        await waitForElementToBeRemoved(loadingElement);
      }
    } catch (error) {
      // Element might not exist, continue
    }
  }
};

// Form testing helpers
export const fillForm = async (formData: { [key: string]: string }) => {
  const { screen } = await import('@testing-library/react');
  const user = setupUser();

  for (const [fieldName, value] of Object.entries(formData)) {
    const field = screen.getByLabelText(new RegExp(fieldName, 'i'));
    await user.clear(field);
    await user.type(field, value);
  }
};

// Error boundary for testing
export const TestErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

// Validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateFormStructure = (container: HTMLElement): boolean => {
  const form = container.querySelector('form');
  const labels = container.querySelectorAll('label');
  const inputs = container.querySelectorAll('input, select, textarea');
  const hasSubmitButton = container.querySelector('button[type="submit"]') ||
                         container.querySelector('input[type="submit"]');

  return !!(form && labels.length > 0 && inputs.length > 0 && hasSubmitButton);
};

// Performance testing helpers
export const measureRenderTime = async (renderFn: () => void) => {
  const start = performance.now();
  renderFn();
  const end = performance.now();
  return end - start;
};

// Accessibility testing helpers
export const checkKeyboardNavigation = async (container: HTMLElement) => {
  const focusableElements = container.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  return Array.from(focusableElements).every(element => {
    const htmlElement = element as HTMLElement;
    return htmlElement.tabIndex >= 0;
  });
};

// Network error simulation
export const simulateNetworkError = () => {
  return Promise.reject(new Error('Network Error'));
};

// Timeout simulation
export const simulateTimeout = (delay = 5000) => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), delay);
  });
};

export default {
  renderWithProviders,
  mockApiResponse,
  mockApiError,
  createMockAnimal,
  createMockElevage,
  createMockUser,
  setupUser,
  mockSessionStorage,
  mockLocalStorage,
  mockFetch,
  waitForLoadingToFinish,
  fillForm,
  TestErrorBoundary,
  validateEmail,
  validateFormStructure,
  measureRenderTime,
  checkKeyboardNavigation,
  simulateNetworkError,
  simulateTimeout
};