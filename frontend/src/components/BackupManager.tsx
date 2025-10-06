import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

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
      const response = await fetch('/api/backup', {
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
      const response = await fetch('/api/backup', {
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
    <div className="backup-manager mt-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center">
            💾 Gestion des sauvegardes
          </h3>
          <button
            onClick={createBackup}
            disabled={creating}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              creating
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {creating ? '⏳ Création...' : '📁 Créer une sauvegarde'}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            ❌ {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            ✅ {success}
          </div>
        )}

        <div className="mb-4">
          <button
            onClick={fetchBackups}
            disabled={loading}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            {loading ? '⏳ Actualisation...' : '🔄 Actualiser'}
          </button>
        </div>

        {loading && backups.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            ⏳ Chargement des sauvegardes...
          </div>
        ) : backups.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            📂 Aucune sauvegarde trouvée
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    Nom du fichier
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    Taille
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    Date de création
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {backups.map((backup, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {backup.filename}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        backup.extension === 'db'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {backup.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {backup.size}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(backup.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-600">
          <p>
            ℹ️ Les sauvegardes sont stockées dans le répertoire ../sqlsave/ par rapport à la racine du site.
            Les fichiers SQLite sont copiés directement (.db), tandis que les bases MySQL/PostgreSQL
            sont exportées au format SQL (.sql).
          </p>
        </div>
      </div>
    </div>
  );
};

export default BackupManager;