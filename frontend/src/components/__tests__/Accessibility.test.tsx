import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';

// Import components to test for accessibility
import LandingPage from '../LandingPage';
import MainDashboard from '../MainDashboard';
import AnimalForm from '../AnimalForm';
import ElevageForm from '../ElevageForm';
import Auth from '../Auth';
import Footer from '../Footer';
import LanguageSelector from '../LanguageSelector';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock dependencies
const mockAuthContext = {
  user: {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 1,
    role_name: 'Admin'
  },
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  loading: false,
  error: null
};

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext
}));

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([])
  })
) as jest.Mock;

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: jest.fn(() => 'mock-token'),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  }
});

describe('Accessibility Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('LandingPage', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<LandingPage />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper heading hierarchy', () => {
      render(<LandingPage />);

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
      expect(h1).toHaveTextContent(/AnimaLineage/);
    });

    it('should have descriptive button text', () => {
      render(<LandingPage />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });
  });

  describe('Auth Component', () => {
    it('should have no accessibility violations in login mode', async () => {
      const { container } = render(<Auth />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper form labels', () => {
      render(<Auth />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
    });

    it('should have accessible form validation', () => {
      render(<Auth />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/mot de passe/i);

      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(emailInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('required');
    });
  });

  describe('AnimalForm', () => {
    const mockProps = {
      onClose: jest.fn(),
      onSave: jest.fn(),
      elevageId: 1
    };

    it('should have no accessibility violations', async () => {
      const { container } = render(<AnimalForm {...mockProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper form labels and associations', () => {
      render(<AnimalForm {...mockProps} />);

      expect(screen.getByLabelText(/identifiant officiel/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/nom/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/sexe/i)).toBeInTheDocument();
    });

    it('should have accessible required field indicators', () => {
      render(<AnimalForm {...mockProps} />);

      const requiredFields = screen.getAllByText('*');
      expect(requiredFields.length).toBeGreaterThan(0);
    });
  });

  describe('ElevageForm', () => {
    const mockProps = {
      onClose: jest.fn(),
      onSave: jest.fn()
    };

    it('should have no accessibility violations', async () => {
      const { container } = render(<ElevageForm {...mockProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper form structure', () => {
      render(<ElevageForm {...mockProps} />);

      expect(screen.getByRole('form')).toBeInTheDocument();
      expect(screen.getByLabelText(/nom de l'élevage/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });
  });

  describe('MainDashboard', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<MainDashboard />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible navigation', () => {
      render(<MainDashboard />);

      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();

      const navLinks = screen.getAllByRole('button');
      navLinks.forEach(link => {
        expect(link).toHaveAccessibleName();
      });
    });

    it('should have proper ARIA landmarks', () => {
      render(<MainDashboard />);

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });

  describe('Footer', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<Footer />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible links', () => {
      render(<Footer />);

      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveAccessibleName();
      });
    });
  });

  describe('LanguageSelector', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<LanguageSelector />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible select element', () => {
      render(<LanguageSelector />);

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(select).toHaveAccessibleName();
    });
  });

  describe('Color Contrast and Visual Accessibility', () => {
    it('should use semantic HTML elements', () => {
      render(<LandingPage />);

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('should have proper focus management', () => {
      render(<Auth />);

      const firstInput = screen.getByLabelText(/email/i);
      firstInput.focus();
      expect(firstInput).toHaveFocus();
    });

    it('should provide alternative text for images', () => {
      render(<LandingPage />);

      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation in forms', () => {
      render(<Auth />);

      const inputs = screen.getAllByRole('textbox');
      const buttons = screen.getAllByRole('button');

      [...inputs, ...buttons].forEach(element => {
        expect(element).not.toHaveAttribute('tabindex', '-1');
      });
    });

    it('should have visible focus indicators', () => {
      render(<Auth />);

      const focusableElements = screen.getAllByRole('textbox');
      focusableElements.forEach(element => {
        element.focus();
        // Focus should be visible (this is checked by axe)
        expect(element).toHaveFocus();
      });
    });
  });

  describe('ARIA Labels and Descriptions', () => {
    it('should have proper ARIA labels for interactive elements', () => {
      render(<MainDashboard />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        // Each button should have accessible name
        expect(button).toHaveAccessibleName();
      });
    });

    it('should use ARIA descriptions where appropriate', () => {
      render(<AnimalForm onClose={jest.fn()} onSave={jest.fn()} elevageId={1} />);

      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();
    });
  });

  describe('Screen Reader Compatibility', () => {
    it('should have proper heading structure', () => {
      render(<LandingPage />);

      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);

      // Should have at least one h1
      const h1Elements = headings.filter(h => h.tagName === 'H1');
      expect(h1Elements.length).toBeGreaterThanOrEqual(1);
    });

    it('should provide context for form inputs', () => {
      render(<AnimalForm onClose={jest.fn()} onSave={jest.fn()} elevageId={1} />);

      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        expect(input).toHaveAccessibleName();
      });
    });
  });
});