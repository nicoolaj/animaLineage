import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../test-utils/test-helpers';
import userEvent from '@testing-library/user-event';
import MainDashboard from '../MainDashboard';

// Mock des composants enfants
jest.mock('../AdminPanel', () => {
  return function AdminPanel() {
    return <div data-testid="admin-panel">AdminPanel Component</div>;
  };
});

jest.mock('../PendingUsers', () => {
  return function PendingUsers() {
    return <div data-testid="pending-users">PendingUsers Component</div>;
  };
});

jest.mock('../ElevageList', () => {
  return function ElevageList({ onNewElevage, onEditElevage, onViewAnimaux }: any) {
    return (
      <div data-testid="elevage-list">
        ElevageList Component
        <button onClick={() => onNewElevage?.()}>New Elevage</button>
        <button onClick={() => onEditElevage?.('1')}>Edit Elevage</button>
        <button onClick={() => onViewAnimaux?.(1)}>View Animals</button>
      </div>
    );
  };
});

jest.mock('../ElevageForm', () => {
  return function ElevageForm({ elevageId, onSave, onCancel }: any) {
    return (
      <div data-testid="elevage-form">
        ElevageForm Component - Mode: {elevageId ? 'edit' : 'create'}
        <button onClick={() => onSave?.()}>Save</button>
        <button onClick={() => onCancel?.()}>Cancel</button>
      </div>
    );
  };
});

jest.mock('../ElevageDetail', () => {
  return function ElevageDetail({ elevageId, onBack }: any) {
    return (
      <div data-testid="elevage-detail">
        ElevageDetail Component - ID: {elevageId}
        <button onClick={() => onBack?.()}>Back</button>
      </div>
    );
  };
});

jest.mock('../TypesAnimauxList', () => {
  return function TypesAnimauxList({ onNewType, onEditType }: any) {
    return (
      <div data-testid="types-animaux-list">
        TypesAnimauxList Component
        <button onClick={() => onNewType?.()}>New Type</button>
        <button onClick={() => onEditType?.('1')}>Edit Type</button>
      </div>
    );
  };
});

jest.mock('../TypeAnimalForm', () => {
  return function TypeAnimalForm({ typeId, onSave, onCancel }: any) {
    return (
      <div data-testid="type-animal-form">
        TypeAnimalForm Component - Mode: {typeId ? 'edit' : 'create'}
        <button onClick={() => onSave?.()}>Save</button>
        <button onClick={() => onCancel?.()}>Cancel</button>
      </div>
    );
  };
});

jest.mock('../RacesList', () => {
  return function RacesList({ onNewRace, onEditRace }: any) {
    return (
      <div data-testid="races-list">
        RacesList Component
        <button onClick={() => onNewRace?.()}>New Race</button>
        <button onClick={() => onEditRace?.('1')}>Edit Race</button>
      </div>
    );
  };
});

jest.mock('../RaceForm', () => {
  return function RaceForm({ raceId, onSave, onCancel }: any) {
    return (
      <div data-testid="race-form">
        RaceForm Component - Mode: {raceId ? 'edit' : 'create'}
        <button onClick={() => onSave?.()}>Save</button>
        <button onClick={() => onCancel?.()}>Cancel</button>
      </div>
    );
  };
});

jest.mock('../CompatibilityTester', () => {
  return function CompatibilityTester() {
    return <div data-testid="compatibility-tester">CompatibilityTester Component</div>;
  };
});

jest.mock('../LanguageSelector', () => {
  return function LanguageSelector() {
    return <div data-testid="language-selector">Language Selector</div>;
  };
});

describe('MainDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendu du composant', () => {
    test('affiche le logo du projet', () => {
      render(<MainDashboard />);

      expect(screen.getByRole('img', { name: /animalineage/i })).toBeInTheDocument();
    });

    test('affiche les informations utilisateur', () => {
      render(<MainDashboard />);

      expect(screen.getByText(/bienvenue, test user!/i)).toBeInTheDocument();
      expect(screen.getByText(/\(admin\)/i)).toBeInTheDocument();
    });

    test('affiche le bouton de déconnexion', () => {
      render(<MainDashboard />);

      expect(screen.getByRole('button', { name: /déconnexion/i })).toBeInTheDocument();
    });
  });

  describe('Navigation par onglets', () => {
    test('affiche les onglets de base pour tous les utilisateurs', () => {
      render(<MainDashboard />);

      expect(screen.getByRole('button', { name: /🚜 élevages/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /🏷️ types & races/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /🧬 compatibilité reproduction/i })).toBeInTheDocument();
    });

    test('affiche l\'onglet utilisateurs pour les administrateurs', () => {
      render(<MainDashboard />);

      expect(screen.getByRole('button', { name: /👥 utilisateurs/i })).toBeInTheDocument();
    });

    test('cache l\'onglet utilisateurs pour les modérateurs', () => {
      // Mock un utilisateur modérateur - utilise le système de mock du composant
      const { mockAuthContext } = require('../../test-utils/test-helpers');

      // Temporairement override le mock pour être un modérateur
      const originalUser = mockAuthContext.user;
      const originalCanAdministrate = mockAuthContext.canAdministrate;

      mockAuthContext.user = {
        ...originalUser,
        role: 2,
        role_name: 'Moderator'
      };
      mockAuthContext.canAdministrate = () => false;

      render(<MainDashboard />);

      expect(screen.queryByRole('button', { name: /👥 utilisateurs/i })).not.toBeInTheDocument();

      // Restaurer les valeurs originales
      mockAuthContext.user = originalUser;
      mockAuthContext.canAdministrate = originalCanAdministrate;
    });

    test('change d\'onglet lors du clic', async () => {
      render(<MainDashboard />);

      const typesRacesTab = screen.getByRole('button', { name: /🏷️ types & races/i });
      await userEvent.click(typesRacesTab);

      expect(typesRacesTab).toHaveClass('active');
    });
  });

  describe('Contenu des onglets', () => {
    test('affiche ElevageList par défaut', () => {
      render(<MainDashboard />);

      expect(screen.getByTestId('elevage-list')).toBeInTheDocument();
    });

    test('navigue vers le formulaire d\'élevage en mode création', async () => {
      render(<MainDashboard />);

      const newElevageButton = screen.getByText('New Elevage');
      await userEvent.click(newElevageButton);

      expect(screen.getByTestId('elevage-form')).toBeInTheDocument();
      expect(screen.getByText(/mode: create/i)).toBeInTheDocument();
    });

    test('navigue vers le formulaire d\'élevage en mode édition', async () => {
      render(<MainDashboard />);

      const editElevageButton = screen.getByText('Edit Elevage');
      await userEvent.click(editElevageButton);

      expect(screen.getByTestId('elevage-form')).toBeInTheDocument();
      expect(screen.getByText(/mode: edit/i)).toBeInTheDocument();
    });

    test('navigue vers le détail d\'élevage', async () => {
      render(<MainDashboard />);

      const viewAnimalsButton = screen.getByText('View Animals');
      await userEvent.click(viewAnimalsButton);

      expect(screen.getByTestId('elevage-detail')).toBeInTheDocument();
      expect(screen.getByText(/id: 1/i)).toBeInTheDocument();
    });
  });

  describe('Gestion des types et races', () => {
    test('affiche TypesAnimauxList dans l\'onglet types & races', async () => {
      render(<MainDashboard />);

      const typesRacesTab = screen.getByRole('button', { name: /🏷️ types & races/i });
      await userEvent.click(typesRacesTab);

      expect(screen.getByTestId('types-animaux-list')).toBeInTheDocument();
    });
  });

  describe('Test de compatibilité', () => {
    test('affiche CompatibilityTester dans l\'onglet compatibilité reproduction', async () => {
      render(<MainDashboard />);

      const compatibilityTab = screen.getByRole('button', { name: /🧬 compatibilité reproduction/i });
      await userEvent.click(compatibilityTab);

      expect(screen.getByTestId('compatibility-tester')).toBeInTheDocument();
    });
  });

  describe('Structure et accessibilité', () => {
    test('utilise les éléments sémantiques appropriés', () => {
      render(<MainDashboard />);

      expect(screen.getByRole('banner')).toBeInTheDocument(); // header
      expect(screen.getByRole('navigation')).toBeInTheDocument(); // nav
      expect(screen.getByRole('main')).toBeInTheDocument(); // main
    });
  });
});