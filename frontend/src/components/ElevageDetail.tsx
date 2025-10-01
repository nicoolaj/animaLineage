import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AnimalForm from './AnimalForm';
import ElevageUsersManagement from './ElevageUsersManagement';

interface Race {
    id: number;
    nom: string;
    type_animal_nom: string;
}

interface Elevage {
    id: number;
    nom: string;
    adresse: string;
    user_id: number;
    proprietaire_nom: string;
    description: string;
    races: Race[];
}

interface Animal {
    id: number;
    identifiant_officiel: string;
    nom?: string;
    sexe: 'M' | 'F';
    pere_id?: number;
    mere_id?: number;
    race_id: number;
    pere_identifiant?: string;
    pere_nom?: string;
    mere_identifiant?: string;
    mere_nom?: string;
    race_nom: string;
    date_naissance?: string;
    date_bouclage?: string;
    date_deces?: string;
    elevage_id?: number;
    elevage_nom?: string;
    notes?: string;
    statut: 'vivant' | 'mort';
    created_at: string;
}

interface ElevageDetailProps {
    elevageId: number;
    onBack: () => void;
}

const ElevageDetail: React.FC<ElevageDetailProps> = ({ elevageId, onBack }) => {
    const [elevage, setElevage] = useState<Elevage | null>(null);
    const [animaux, setAnimaux] = useState<Animal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentView, setCurrentView] = useState<'list' | 'form' | 'descendants' | 'users'>('list');
    const [editingAnimal, setEditingAnimal] = useState<Animal | undefined>();
    const [descendants, setDescendants] = useState<Animal[]>([]);
    const [selectedAnimalForDescendants, setSelectedAnimalForDescendants] = useState<string>('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [filter, setFilter] = useState({
        statut: '',
        sexe: '',
        race: ''
    });
    const [sortConfig, setSortConfig] = useState<{
        key: string | null;
        direction: 'asc' | 'desc' | null;
    }>({
        key: null,
        direction: null
    });

    const { getAuthHeaders, user, isAdmin, isModerator, isReader } = useAuth();
    const API_BASE_URL = 'http://localhost:3001/api';

    // Vérifier si l'utilisateur peut éditer cet élevage
    const canEditElevage = () => {
        if (!user || !elevage) return false;

        // Admin peut tout éditer
        if (isAdmin()) return true;

        // Modérateur peut éditer ses élevages
        if (isModerator()) return elevage.user_id === user.id;

        // Lecteur ne peut rien éditer
        return false;
    };

    const loadElevageData = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/elevages/${elevageId}`, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                setElevage(data);
            } else {
                setError('Erreur lors du chargement de l\'élevage');
            }
        } catch (error) {
            console.error('Erreur:', error);
            setError('Erreur lors du chargement de l\'élevage');
        }
    }, [elevageId, getAuthHeaders]);

    const loadAnimaux = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/animaux?elevage_id=${elevageId}`, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                setAnimaux(data);
                setError('');
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Erreur lors du chargement des animaux');
            }
        } catch (error: any) {
            console.error('Erreur:', error);
            setError(error.message || 'Erreur lors du chargement des animaux');
        } finally {
            setLoading(false);
        }
    }, [elevageId, getAuthHeaders]);

    useEffect(() => {
        loadElevageData();
        loadAnimaux();
    }, [elevageId, refreshTrigger, loadElevageData, loadAnimaux]);

    const handleCreateAnimal = () => {
        setEditingAnimal(undefined);
        setCurrentView('form');
    };

    const handleEditAnimal = (animal: Animal) => {
        setEditingAnimal(animal);
        setCurrentView('form');
    };

    const handleSubmitAnimal = async (animalData: any) => {
        try {
            setLoading(true);

            // Forcer l'élevage_id à celui de l'élevage actuel
            const dataWithElevage = {
                ...animalData,
                elevage_id: elevageId
            };

            const url = editingAnimal
                ? `${API_BASE_URL}/animaux/${editingAnimal.id}`
                : `${API_BASE_URL}/animaux`;

            const method = editingAnimal ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify(dataWithElevage)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de l\'enregistrement');
            }

            setCurrentView('list');
            setEditingAnimal(undefined);
            setRefreshTrigger(prev => prev + 1);
            setError('');

        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelForm = () => {
        setCurrentView('list');
        setEditingAnimal(undefined);
        setError('');
    };

    const handleDeleteAnimal = async (animalId: number, animalIdentifiant: string) => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'animal ${animalIdentifiant} ?`)) {
            try {
                const response = await fetch(`${API_BASE_URL}/animaux/${animalId}`, {
                    method: 'DELETE',
                    headers: getAuthHeaders()
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Erreur lors de la suppression');
                }

                setRefreshTrigger(prev => prev + 1);
            } catch (error: any) {
                alert('Erreur lors de la suppression: ' + error.message);
            }
        }
    };

    const handleMarkDead = async (animalId: number, animalIdentifiant: string) => {
        const dateDeces = prompt('Date de décès (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);

        if (dateDeces && window.confirm(`Marquer ${animalIdentifiant} comme décédé le ${dateDeces} ?`)) {
            try {
                const response = await fetch(`${API_BASE_URL}/animaux/${animalId}/deces`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...getAuthHeaders()
                    },
                    body: JSON.stringify({ date_deces: dateDeces })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Erreur lors de la mise à jour');
                }

                setRefreshTrigger(prev => prev + 1);
            } catch (error: any) {
                alert('Erreur lors de la mise à jour: ' + error.message);
            }
        }
    };

    const handleViewDescendants = async (animalId: number) => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/animaux/${animalId}/descendants`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors du chargement des descendants');
            }

            const data = await response.json();
            setDescendants(data);

            // Récupérer l'identifiant de l'animal parent
            const animal = animaux.find(a => a.id === animalId);
            if (animal) {
                setSelectedAnimalForDescendants(animal.identifiant_officiel + (animal.nom ? ` (${animal.nom})` : ''));
            }

            setCurrentView('descendants');
            setError('');

        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' | null = 'asc';

        if (sortConfig.key === key) {
            if (sortConfig.direction === 'asc') {
                direction = 'desc';
            } else if (sortConfig.direction === 'desc') {
                direction = null; // Reset tri
            } else {
                direction = 'asc';
            }
        }

        setSortConfig({ key: direction ? key : null, direction });
    };

    const getSortValue = (animal: Animal, key: string): any => {
        switch (key) {
            case 'identifiant_officiel':
                return animal.identifiant_officiel;
            case 'nom':
                return animal.nom || '';
            case 'sexe':
                return animal.sexe;
            case 'race_nom':
                return animal.race_nom;
            case 'date_naissance':
                return animal.date_naissance ? new Date(animal.date_naissance).getTime() : 0;
            case 'statut':
                return animal.statut;
            case 'parents':
                // Tri par père puis mère
                return (animal.pere_identifiant || '') + (animal.mere_identifiant || '');
            default:
                return '';
        }
    };

    const sortAnimaux = (animaux: Animal[]) => {
        if (!sortConfig.key || !sortConfig.direction) {
            return animaux;
        }

        return [...animaux].sort((a, b) => {
            const aValue = getSortValue(a, sortConfig.key!);
            const bValue = getSortValue(b, sortConfig.key!);

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    };

    const getSortIcon = (columnKey: string) => {
        if (sortConfig.key !== columnKey) {
            return '↕️'; // Icône neutre
        }

        if (sortConfig.direction === 'asc') {
            return '↑'; // Tri croissant
        } else if (sortConfig.direction === 'desc') {
            return '↓'; // Tri décroissant
        }

        return '↕️'; // Neutre
    };

    const renderSortableHeader = (label: string, key: string) => (
        <th
            onClick={() => handleSort(key)}
            style={{ cursor: 'pointer', userSelect: 'none' }}
            title={`Cliquer pour trier par ${label.toLowerCase()}`}
        >
            {label} {getSortIcon(key)}
        </th>
    );

    const filteredAnimaux = sortAnimaux(animaux.filter(animal => {
        if (filter.statut && animal.statut !== filter.statut) return false;
        if (filter.sexe && animal.sexe !== filter.sexe) return false;
        if (filter.race && !animal.race_nom.toLowerCase().includes(filter.race.toLowerCase())) return false;
        return true;
    }));

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('fr-FR');
    };

    if (loading && !elevage) {
        return <div id="elevagedetail-loading-1" className="loading">Chargement...</div>;
    }

    return (
        <div id="elevage-detail-container" className="elevage-detail">
            {/* En-tête */}
            <div id="elevage-detail-header" className="detail-header">
                <button id="elevage-detail-back-btn" onClick={onBack} className="back-btn">
                    ← Retour aux élevages
                </button>
                <h1 id="elevage-detail-title">{elevage?.nom}</h1>
            </div>

            {/* Informations de l'élevage */}
            <div id="elevage-info-card" className="elevage-info-card">
                <div id="elevage-info-grid" className="info-grid">
                    <div><strong>Propriétaire:</strong> {elevage?.proprietaire_nom}</div>
                    <div><strong>Adresse:</strong> {elevage?.adresse}</div>
                    {elevage?.description && (
                        <div><strong>Description:</strong> {elevage.description}</div>
                    )}
                    <div className="races-section">
                        <div className="races-header">
                            <strong>Races d'animaux 🦕</strong>
                            <span className="races-count">
                                {elevage?.races?.length || 0} race{(elevage?.races?.length || 0) > 1 ? 's' : ''}
                            </span>
                        </div>
                        {elevage?.races && elevage.races.length > 0 ? (
                            <div className="races-grid">
                                {elevage.races.map(race => (
                                    <div key={race.id} className="race-card">
                                        <div className="race-name">{race.nom}</div>
                                        <div className="race-type">{race.type_animal_nom}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-races">
                                <span className="no-races-icon">🚫</span>
                                <span>Aucune race spécifiée</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {error && <div id="elevagedetail-error-message-3" className="error-message">{error}</div>}

            {/* Navigation des animaux */}
            <div id="elevage-animals-section" className="animals-section">
                <div id="elevage-animals-header" className="animals-header">
                    <h2 id="elevage-animals-title">Animaux de l'élevage ({filteredAnimaux.length})</h2>
                    <div id="elevage-animals-nav" className="animals-nav">
                        <button
                            id="elevage-list-view-btn"
                            onClick={() => setCurrentView('list')}
                            className={currentView === 'list' ? 'active' : ''}
                        >
                            📋 Liste
                        </button>
                        {canEditElevage() && (
                            <>
                                <button
                                    id="elevage-add-animal-btn"
                                    onClick={handleCreateAnimal}
                                    className={currentView === 'form' && !editingAnimal ? 'active' : ''}
                                >
                                    🦕 Nouvel animal
                                </button>
                                <button
                                    id="elevage-manage-users-btn"
                                    onClick={() => setCurrentView('users')}
                                    className={currentView === 'users' ? 'active' : ''}
                                >
                                    👥 Gérer les utilisateurs
                                </button>
                            </>
                        )}
                        {isReader() && !canEditElevage() && (
                            <div id="elevagedetail-read-only-notice-4" className="read-only-notice">
                                👁️ Mode consultation uniquement
                            </div>
                        )}
                    </div>
                </div>

                {currentView === 'form' && (
                    <div id="elevage-form-container" className="form-container">
                        <AnimalForm
                            animal={editingAnimal}
                            onSubmit={handleSubmitAnimal}
                            onCancel={handleCancelForm}
                            elevageContext={elevage ? {
                                id: elevage.id,
                                nom: elevage.nom,
                                races: elevage.races
                            } : undefined}
                        />
                    </div>
                )}

                {currentView === 'list' && (
                    <>
                        {/* Filtres */}
                        <div id="elevage-filters" className="filters">
                            <div id="elevage-filter-statut" className="filter-group">
                                <label>Statut:</label>
                                <select
                                    value={filter.statut}
                                    onChange={(e) => setFilter({...filter, statut: e.target.value})}
                                >
                                    <option value="">Tous</option>
                                    <option value="vivant">Vivant</option>
                                    <option value="mort">Décédé</option>
                                </select>
                            </div>

                            <div id="elevage-filter-sexe" className="filter-group">
                                <label>Sexe:</label>
                                <select
                                    value={filter.sexe}
                                    onChange={(e) => setFilter({...filter, sexe: e.target.value})}
                                >
                                    <option value="">Tous</option>
                                    <option value="M">Mâle</option>
                                    <option value="F">Femelle</option>
                                </select>
                            </div>

                            <div id="elevage-filter-race" className="filter-group">
                                <label>Race:</label>
                                <input
                                    type="text"
                                    placeholder="Filtrer par race"
                                    value={filter.race}
                                    onChange={(e) => setFilter({...filter, race: e.target.value})}
                                />
                            </div>
                        </div>

                        {/* Liste des animaux */}
                        {filteredAnimaux.length === 0 ? (
                            <div id="elevagedetail-no-animals-5" className="no-animals">
                                <p>Aucun animal dans cet élevage.</p>
                                {canEditElevage() && (
                                    <button onClick={handleCreateAnimal} className="btn-primary">
                                        Ajouter le premier animal
                                    </button>
                                )}
                                {isReader() && !canEditElevage() && (
                                    <p className="read-only-text">Mode consultation uniquement</p>
                                )}
                            </div>
                        ) : (
                            <div id="elevage-animals-table-container" className="animals-table-container">
                                <table id="elevage-animals-table" className="animals-table">
                                    <thead>
                                        <tr>
                                            {renderSortableHeader('Identifiant', 'identifiant_officiel')}
                                            {renderSortableHeader('Nom', 'nom')}
                                            {renderSortableHeader('Sexe', 'sexe')}
                                            {renderSortableHeader('Race', 'race_nom')}
                                            {renderSortableHeader('Parents', 'parents')}
                                            {renderSortableHeader('Naissance', 'date_naissance')}
                                            {renderSortableHeader('Statut', 'statut')}
                                            <th style={{ cursor: 'default' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAnimaux.map(animal => (
                                            <tr key={animal.id} className={animal.statut === 'mort' ? 'deceased' : ''}>
                                                <td className="font-mono">{animal.identifiant_officiel}</td>
                                                <td>{animal.nom || '-'}</td>
                                                <td>
                                                    <span className={`sexe-badge ${animal.sexe.toLowerCase()}`}>
                                                        {animal.sexe === 'M' ? '♂️' : '♀️'}
                                                    </span>
                                                </td>
                                                <td>{animal.race_nom}</td>
                                                <td className="parents">
                                                    {animal.pere_identifiant && (
                                                        <div>♂️ {animal.pere_identifiant}</div>
                                                    )}
                                                    {animal.mere_identifiant && (
                                                        <div>♀️ {animal.mere_identifiant}</div>
                                                    )}
                                                    {!animal.pere_identifiant && !animal.mere_identifiant && '-'}
                                                </td>
                                                <td>{formatDate(animal.date_naissance)}</td>
                                                <td>
                                                    <span className={`status-badge ${animal.statut}`}>
                                                        {animal.statut === 'vivant' ? '✅' : '💀'}
                                                    </span>
                                                </td>
                                                <td className="actions">
                                                    <button
                                                        onClick={() => handleViewDescendants(animal.id)}
                                                        className="btn-descendants"
                                                        title="Voir descendants"
                                                    >
                                                        🌳
                                                    </button>

                                                    {canEditElevage() && (
                                                        <>
                                                            <button
                                                                onClick={() => handleEditAnimal(animal)}
                                                                className="btn-edit"
                                                                title="Modifier"
                                                            >
                                                                ✏️
                                                            </button>

                                                            {animal.statut === 'vivant' && (
                                                                <button
                                                                    onClick={() => handleMarkDead(animal.id, animal.identifiant_officiel)}
                                                                    className="btn-mark-dead"
                                                                    title="Marquer comme décédé"
                                                                >
                                                                    💀
                                                                </button>
                                                            )}

                                                            <button
                                                                onClick={() => handleDeleteAnimal(animal.id, animal.identifiant_officiel)}
                                                                className="btn-delete"
                                                                title="Supprimer"
                                                            >
                                                                🗑️
                                                            </button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}

                {currentView === 'descendants' && (
                    <div id="elevage-descendants-view" className="descendants-view">
                        <div id="elevage-descendants-header" className="descendants-header">
                            <h3 id="elevage-descendants-title">Descendants de {selectedAnimalForDescendants}</h3>
                            <button id="elevage-descendants-back-btn" onClick={() => setCurrentView('list')} className="back-btn">
                                ← Retour à la liste
                            </button>
                        </div>

                        {descendants.length === 0 ? (
                            <div id="elevagedetail-no-descendants-6" className="no-descendants">
                                Cet animal n'a pas de descendants connus.
                            </div>
                        ) : (
                            <div id="elevagedetail-descendants-table-container-7" className="descendants-table-container">
                                <table className="descendants-table">
                                    <thead>
                                        <tr>
                                            <th>Identifiant</th>
                                            <th>Nom</th>
                                            <th>Sexe</th>
                                            <th>Race</th>
                                            <th>Naissance</th>
                                            <th>Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {descendants.map(descendant => (
                                            <tr key={descendant.id} className={descendant.statut === 'mort' ? 'deceased' : ''}>
                                                <td className="font-mono">{descendant.identifiant_officiel}</td>
                                                <td>{descendant.nom || '-'}</td>
                                                <td>
                                                    <span className={`sexe-badge ${descendant.sexe.toLowerCase()}`}>
                                                        {descendant.sexe === 'M' ? '♂️' : '♀️'}
                                                    </span>
                                                </td>
                                                <td>{descendant.race_nom}</td>
                                                <td>{formatDate(descendant.date_naissance)}</td>
                                                <td>
                                                    <span className={`status-badge ${descendant.statut}`}>
                                                        {descendant.statut === 'vivant' ? '✅ Vivant' : '💀 Décédé'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {currentView === 'users' && elevage && (
                    <ElevageUsersManagement
                        elevageId={elevage.id}
                        elevageName={elevage.nom}
                        onClose={() => setCurrentView('list')}
                    />
                )}
            </div>

        </div>
    );
};

export default ElevageDetail;