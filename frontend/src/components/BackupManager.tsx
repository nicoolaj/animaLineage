import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';

interface Backup {
  filename: string;
  date: string;
  timestamp: string;
  extension: string;
  type: string;
  size: string;
  created_at: string;
}

const BackupManager: React.FC = () => {
  const { token } = useAuth();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [creating, setCreating] = useState(false);

  const fetchBackups = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}api/backup`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setBackups(data.backups || []);
      } else {
        setError(data.message || 'Erreur lors de la récupération des sauvegardes');
      }
    } catch (err) {
      setError('Erreur de connexion lors de la récupération des sauvegardes');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    setCreating(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}api/backup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Sauvegarde créée avec succès: ${data.filename} (${data.size})`);
        // Actualiser la liste des sauvegardes
        fetchBackups();
      } else {
        setError(data.message || 'Erreur lors de la création de la sauvegarde');
      }
    } catch (err) {
      setError('Erreur de connexion lors de la création de la sauvegarde');
      console.error('Erreur:', err);
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="backup-manager">
      <div className="backup-actions mb-6">
        <button
          onClick={createBackup}
          disabled={creating}
          className={`w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            creating ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {creating ? '⏳ Création...' : '📁 Créer une sauvegarde'}
        </button>
      </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            ❌ {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            ✅ {success}
          </div>
        )}

        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <button
            onClick={fetchBackups}
            disabled={loading}
            className="bg-gray-200 text-gray-700 px-3 py-1 text-sm rounded-lg font-medium hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 w-full sm:w-auto"
          >
            {loading ? '⏳ Actualisation...' : '🔄 Actualiser'}
          </button>
        </div>

        {loading && backups.length === 0 ? (
          <div className="text-center py-8 text-gray-700">
            ⏳ Chargement des sauvegardes...
          </div>
        ) : backups.length === 0 ? (
          <div className="text-center py-8 text-gray-700">
            📂 Aucune sauvegarde trouvée
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Nom du fichier
                  </th>
                  <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Taille
                  </th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Date de création
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {backups.map((backup, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 sm:px-4 py-4 text-sm text-gray-900">
                      <div className="font-mono text-xs sm:text-sm break-all">
                        {backup.filename}
                      </div>
                      <div className="sm:hidden mt-1 flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          backup.extension === 'db'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {backup.type}
                        </span>
                        <span className="text-xs text-gray-700 md:hidden">
                          {formatDateTime(backup.created_at)}
                        </span>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        backup.extension === 'db'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {backup.type}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {backup.size}
                    </td>
                    <td className="hidden md:table-cell px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatDateTime(backup.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-700 bg-gray-50 p-3 rounded">
          <p>
            ℹ️ Les sauvegardes sont stockées dans le répertoire ../../sqlsave/ par rapport à la racine du site.
            Les fichiers SQLite sont copiés directement (.db), tandis que les bases MySQL/PostgreSQL
            sont exportées au format SQL (.sql).
          </p>
        </div>
    </div>
  );
};

export default BackupManager;