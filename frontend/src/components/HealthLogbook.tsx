import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

interface HealthEvent {
  id: number;
  event_type: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  event_date: string;
  created_at: string;
  updated_at: string;
  author: {
    id: number;
    username: string;
    nom: string;
    prenom: string;
  };
}

interface HealthEventForm {
  event_type: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  event_date: string;
}

interface UserPermissions {
  user_id: number;
  role: number;
  role_name: string;
  can_read_health_log: boolean;
  can_write_health_log: boolean;
  can_edit_health_log: boolean;
  can_delete_health_log: boolean;
}

interface HealthLogbookProps {
  animalId: number;
  className?: string;
}

const HealthLogbook: React.FC<HealthLogbookProps> = ({
  animalId,
  className = ''
}) => {
  const [events, setEvents] = useState<HealthEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<HealthEvent | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  const [formData, setFormData] = useState<HealthEventForm>({
    event_type: '',
    title: '',
    description: '',
    severity: 'info',
    event_date: new Date().toISOString().split('T')[0]
  });

  const canWrite = permissions?.can_write_health_log || false;
  const canEdit = permissions?.can_edit_health_log || false;
  const canDelete = permissions?.can_delete_health_log || false;

  const severityColors = {
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    critical: 'bg-red-100 text-red-800 border-red-200'
  };

  const severityIcons = {
    info: 'ℹ️',
    warning: '⚠️',
    critical: '🚨'
  };

  const commonEventTypes = [
    'Vaccination', 'Vermifugation', 'Consultation vétérinaire',
    'Blessure', 'Maladie', 'Traitement médical', 'Examen médical',
    'Chirurgie', 'Soins préventifs', 'Comportement anormal'
  ];

  useEffect(() => {
    console.log('🔥 HealthLogbook V2 chargé ! Fix preventDefault complet');
    loadUserPermissions();
    loadHealthLog();
  }, [animalId]);

  const loadUserPermissions = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}api/permissions/user`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissions);
      } else {
        setError('Erreur lors du chargement des permissions');
      }
    } catch (error) {
      console.error('Erreur permissions:', error);
      setError('Erreur de connexion pour les permissions');
    } finally {
      setPermissionsLoading(false);
    }
  };

  const loadHealthLog = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}api/animaux/${animalId}/health-log`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      } else {
        setError('Erreur lors du chargement du logbook');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('🚀 handleSubmit appelé !');
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const token = sessionStorage.getItem('token');
      const url = editingEvent
        ? `${API_BASE_URL}api/animaux/${animalId}/health-log/${editingEvent.id}`
        : `${API_BASE_URL}api/animaux/${animalId}/health-log`;

      const method = editingEvent ? 'PUT' : 'POST';

      console.log('HealthLogbook - Soumission:', { url, method, formData, token: token ? 'présent' : 'absent' });

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      console.log('HealthLogbook - Réponse serveur:', response.status, response.statusText);

      if (response.ok) {
        console.log('HealthLogbook - Sauvegarde réussie');
        await loadHealthLog();
        resetForm();
        setShowForm(false);
      } else {
        const errorData = await response.json();
        console.log('HealthLogbook - Erreur serveur:', errorData);
        setError(errorData.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur de connexion');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (event: HealthEvent) => {
    if (!canEdit) {
      setError('Vous n\'avez pas les permissions pour modifier les événements de santé');
      return;
    }

    setEditingEvent(event);
    setFormData({
      event_type: event.event_type,
      title: event.title,
      description: event.description,
      severity: event.severity,
      event_date: event.event_date
    });
    setShowForm(true);
  };

  const handleDelete = async (eventId: number) => {
    if (!canDelete) {
      setError('Vous n\'avez pas les permissions pour supprimer les événements de santé');
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}api/animaux/${animalId}/health-log/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await loadHealthLog();
      } else {
        setError('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur de connexion');
    }
  };

  const resetForm = () => {
    setFormData({
      event_type: '',
      title: '',
      description: '',
      severity: 'info',
      event_date: new Date().toISOString().split('T')[0]
    });
    setEditingEvent(null);
    setError('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading || permissionsLoading) {
    return (
      <div className={`health-logbook ${className}`}>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">
            {permissionsLoading ? 'Chargement des permissions...' : 'Chargement du logbook...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`health-logbook ${className}`}>

      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">📋 Logbook de santé</h3>
            <p className="text-sm text-gray-600">
              Suivi médical et événements de santé de l'animal
            </p>
            {!canWrite && (
              <p className="text-xs text-amber-600 mt-1">
                ℹ️ Vous n'avez pas les permissions pour ajouter des événements de santé
              </p>
            )}
          </div>
          {canWrite && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                resetForm();
                setShowForm(true);
              }}
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700"
              type="button"
            >
              ➕ Ajouter un événement
            </button>
          )}
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>

      {/* Formulaire d'ajout/édition */}
      {showForm && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            {editingEvent ? 'Modifier l\'événement' : 'Nouvel événement de santé'}
          </h4>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type d'événement *
                </label>
                <input
                  type="text"
                  value={formData.event_type}
                  onChange={(e) => setFormData({...formData, event_type: e.target.value})}
                  list="event-types"
                  className="input-field"
                  required
                />
                <datalist id="event-types">
                  {commonEventTypes.map(type => (
                    <option key={type} value={type} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sévérité
                </label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData({...formData, severity: e.target.value as any})}
                  className="input-field"
                >
                  <option value="info">ℹ️ Information</option>
                  <option value="warning">⚠️ Attention</option>
                  <option value="critical">🚨 Critique</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de l'événement *
              </label>
              <input
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                className="input-field"
                placeholder="Détails sur l'événement, symptômes, traitement, etc."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={submitting}
                onClick={(e) => {
                  console.log('🔴 Bouton cliqué !');
                  e.preventDefault();
                  e.stopPropagation();
                  handleSubmit(e as any);
                }}
                className="btn-primary px-4 py-2 disabled:opacity-50"
              >
                {submitting ? 'Enregistrement...' : (editingEvent ? 'Modifier' : 'Ajouter')}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowForm(false);
                  resetForm();
                }}
                className="btn-secondary px-4 py-2"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des événements */}
      <div className="space-y-4">
        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>📋 Aucun événement de santé enregistré</p>
            {canWrite && (
              <p className="text-sm mt-2">Cliquez sur "Ajouter un événement" pour commencer le suivi</p>
            )}
          </div>
        ) : (
          events.map(event => (
            <div key={event.id} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium border ${severityColors[event.severity]}`}>
                      {severityIcons[event.severity]} {event.severity.charAt(0).toUpperCase() + event.severity.slice(1)}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {event.event_type}
                    </span>
                  </div>

                  <h4 className="font-medium text-gray-900 mb-1">{event.title}</h4>

                  {event.description && (
                    <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-gray-500">
                    <span>📅 {formatDate(event.event_date)}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>👤 {event.author.prenom} {event.author.nom}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>🕒 {formatDateTime(event.created_at)}</span>
                    {event.updated_at !== event.created_at && (
                      <>
                        <span className="hidden sm:inline">•</span>
                        <span>✏️ Modifié le {formatDateTime(event.updated_at)}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {canEdit && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleEdit(event);
                      }}
                      className="text-blue-600 hover:text-blue-800 p-1 rounded"
                      title="Modifier l'événement"
                      type="button"
                    >
                      ✏️
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDelete(event.id);
                      }}
                      className="text-red-600 hover:text-red-800 p-1 rounded"
                      title="Supprimer l'événement"
                      type="button"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HealthLogbook;