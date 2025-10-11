import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import BackupManager from '../BackupManager';

// Mock the API
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(() => 'mock-token'),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
});

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-blob-url');
global.URL.revokeObjectURL = vi.fn();

// Mock the download functionality
const mockClick = vi.fn();
const mockAnchor = {
  click: mockClick,
  href: '',
  download: '',
  style: { display: '' }
};
vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
  if (tagName === 'a') {
    return mockAnchor as any;
  }
  return document.createElement(tagName);
});

const mockBackups = [
  {
    id: 1,
    filename: 'backup_2023_01_15.sql',
    created_at: '2023-01-15T10:30:00Z',
    size: 1024000,
    type: 'manual'
  },
  {
    id: 2,
    filename: 'backup_2023_01_14.sql',
    created_at: '2023-01-14T10:30:00Z',
    size: 950000,
    type: 'automatic'
  }
];

describe('BackupManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockBackups)
    });
  });

  it('renders the component title', async () => {
    render(<BackupManager />);

    expect(screen.getByText('Gestionnaire de Sauvegardes')).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    render(<BackupManager />);

    expect(screen.getByText('Chargement des sauvegardes...')).toBeInTheDocument();
  });

  it('displays backup list after loading', async () => {
    render(<BackupManager />);

    await waitFor(() => {
      expect(screen.getByText('backup_2023_01_15.sql')).toBeInTheDocument();
      expect(screen.getByText('backup_2023_01_14.sql')).toBeInTheDocument();
    });
  });

  it('shows create backup button', async () => {
    render(<BackupManager />);

    await waitFor(() => {
      expect(screen.getByText('Créer une sauvegarde')).toBeInTheDocument();
    });
  });

  it('displays backup information correctly', async () => {
    render(<BackupManager />);

    await waitFor(() => {
      expect(screen.getByText('1.00 MB')).toBeInTheDocument(); // Size formatting
      expect(screen.getByText('0.93 MB')).toBeInTheDocument();
      expect(screen.getByText('Manuel')).toBeInTheDocument();
      expect(screen.getByText('Automatique')).toBeInTheDocument();
    });
  });

  it('shows download buttons for each backup', async () => {
    render(<BackupManager />);

    await waitFor(() => {
      const downloadButtons = screen.getAllByText('Télécharger');
      expect(downloadButtons).toHaveLength(2);
    });
  });

  it('shows delete buttons for each backup', async () => {
    render(<BackupManager />);

    await waitFor(() => {
      const deleteButtons = screen.getAllByText('Supprimer');
      expect(deleteButtons).toHaveLength(2);
    });
  });

  it('handles creating a new backup', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Backup created', filename: 'new_backup.sql' })
    });

    render(<BackupManager />);

    await waitFor(() => {
      const createButton = screen.getByText('Créer une sauvegarde');
      fireEvent.click(createButton);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/backup'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer mock-token'
        })
      })
    );
  });

  it('shows loading state during backup creation', async () => {
    mockFetch.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<BackupManager />);

    await waitFor(() => {
      const createButton = screen.getByText('Créer une sauvegarde');
      fireEvent.click(createButton);
    });

    expect(screen.getByText('Création en cours...')).toBeInTheDocument();
  });

  it('handles downloading a backup', async () => {
    const mockBlob = new Blob(['backup content'], { type: 'application/sql' });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockBlob)
    });

    render(<BackupManager />);

    await waitFor(() => {
      const downloadButtons = screen.getAllByText('Télécharger');
      fireEvent.click(downloadButtons[0]);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/backup/1/download'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Authorization': 'Bearer mock-token'
        })
      })
    );

    expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
    expect(mockClick).toHaveBeenCalled();
  });

  it('handles deleting a backup with confirmation', async () => {
    window.confirm = vi.fn(() => true);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Backup deleted' })
    });

    render(<BackupManager />);

    await waitFor(() => {
      const deleteButtons = screen.getAllByText('Supprimer');
      fireEvent.click(deleteButtons[0]);
    });

    expect(window.confirm).toHaveBeenCalledWith(
      'Êtes-vous sûr de vouloir supprimer cette sauvegarde ?'
    );

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/backup/1'),
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          'Authorization': 'Bearer mock-token'
        })
      })
    );
  });

  it('does not delete when confirmation is cancelled', async () => {
    window.confirm = vi.fn(() => false);

    render(<BackupManager />);

    await waitFor(() => {
      const deleteButtons = screen.getAllByText('Supprimer');
      fireEvent.click(deleteButtons[0]);
    });

    expect(window.confirm).toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalledWith(
      expect.stringContaining('/delete'),
      expect.any(Object)
    );
  });

  it('displays formatted dates', async () => {
    render(<BackupManager />);

    await waitFor(() => {
      // Should display formatted dates
      expect(screen.getByText(/15\/01\/2023/)).toBeInTheDocument();
      expect(screen.getByText(/14\/01\/2023/)).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('API Error'));

    render(<BackupManager />);

    await waitFor(() => {
      expect(screen.getByText('Erreur lors du chargement des sauvegardes')).toBeInTheDocument();
    });
  });

  it('shows empty state when no backups exist', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([])
    });

    render(<BackupManager />);

    await waitFor(() => {
      expect(screen.getByText('Aucune sauvegarde disponible')).toBeInTheDocument();
    });
  });

  it('refreshes backup list after creating new backup', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Backup created' })
    });

    render(<BackupManager />);

    await waitFor(() => {
      const createButton = screen.getByText('Créer une sauvegarde');
      fireEvent.click(createButton);
    });

    await waitFor(() => {
      // Should make a second API call to refresh the list
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/backups'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  it('refreshes backup list after deleting backup', async () => {
    window.confirm = vi.fn(() => true);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Deleted' })
    });

    render(<BackupManager />);

    await waitFor(() => {
      const deleteButtons = screen.getAllByText('Supprimer');
      fireEvent.click(deleteButtons[0]);
    });

    await waitFor(() => {
      // Should refresh the list after deletion
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/backups'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  it('displays backup types with different styling', async () => {
    render(<BackupManager />);

    await waitFor(() => {
      const manualBadge = screen.getByText('Manuel');
      const autoBadge = screen.getByText('Automatique');

      expect(manualBadge).toHaveClass('bg-blue-100', 'text-blue-800');
      expect(autoBadge).toHaveClass('bg-green-100', 'text-green-800');
    });
  });
});