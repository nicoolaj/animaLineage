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

    const filteredAnimaux = animaux.filter(animal => {
        if (filter.statut && animal.statut !== filter.statut) return false;
        if (filter.sexe && animal.sexe !== filter.sexe) return false;
        if (filter.race && !animal.race_nom.toLowerCase().includes(filter.race.toLowerCase())) return false;
        return true;
    });

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
                    <div>
                        <strong>Races:</strong>
                        {elevage?.races && elevage.races.length > 0 ? (
                            <div id="elevagedetail-races-list-2" className="races-list">
                                {elevage.races.map(race => (
                                    <span key={race.id} className="race-badge">
                                        {race.nom} ({race.type_animal_nom})
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <span> Aucune race spécifiée</span>
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
                                    ➕ Ajouter un animal
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
                                            <th>Identifiant</th>
                                            <th>Nom</th>
                                            <th>Sexe</th>
                                            <th>Race</th>
                                            <th>Parents</th>
                                            <th>Naissance</th>
                                            <th>Statut</th>
                                            <th>Actions</th>
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

            <style>{`
                .elevage-detail {
                    padding: 20px;
                    max-width: 1200px;
                    margin: 0 auto;
                    background-color: #282c34;
                    min-height: 100vh;
                    color: white;
                }

                .detail-header {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #eee;
                }

                .detail-header h1 {
                    margin: 0;
                    color: white;
                }

                .back-btn {
                    background: #3b82f6;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    text-decoration: none;
                    font-weight: 500;
                    transition: background-color 0.2s;
                }

                .back-btn:hover {
                    background: #2563eb;
                }

                .elevage-info-card {
                    background: #374151;
                    border-radius: 12px;
                    padding: 25px;
                    margin-bottom: 30px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                    color: white;
                }

                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 15px;
                }

                .races-list {
                    margin-top: 5px;
                    background: transparent;
                    padding: 0;
                    min-height: auto;
                }

                .race-badge {
                    display: inline-block;
                    background: #1f2937;
                    color: #d1d5db;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    margin: 2px;
                    border: 1px solid #4b5563;
                }

                .animals-section {
                    background: #374151;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                    overflow: hidden;
                    color: white;
                }

                .animals-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px;
                    background: #1f2937;
                    border-bottom: 1px solid #4b5563;
                }

                .animals-header h2 {
                    margin: 0;
                    color: white;
                }

                .animals-nav {
                    display: flex;
                    gap: 10px;
                }

                .animals-nav button {
                    padding: 10px 20px;
                    border: 2px solid #3b82f6;
                    background: transparent;
                    color: #3b82f6;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.2s;
                }

                .animals-nav button:hover {
                    background: #3b82f6;
                    color: white;
                }

                .animals-nav button.active {
                    background: #3b82f6;
                    color: white;
                }

                .form-container {
                    padding: 25px;
                    background: #1f2937;
                }

                .filters {
                    display: flex;
                    gap: 15px;
                    padding: 20px;
                    background: #1f2937;
                    border-bottom: 1px solid #4b5563;
                    flex-wrap: wrap;
                }

                .filter-group {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }

                .filter-group label {
                    font-size: 12px;
                    font-weight: bold;
                    color: #d1d5db;
                    margin-bottom: 5px;
                }

                .filter-group input,
                .filter-group select {
                    padding: 8px 12px;
                    border: 1px solid #4b5563;
                    border-radius: 6px;
                    font-size: 14px;
                    background-color: #374151;
                    color: white;
                    transition: border-color 0.2s;
                }

                .filter-group input:focus,
                .filter-group select:focus {
                    outline: none;
                    border-color: #3b82f6;
                }

                .no-animals {
                    text-align: center;
                    padding: 40px;
                    color: #d1d5db;
                }

                .animals-table-container {
                    overflow-x: auto;
                }

                .animals-table {
                    width: 100%;
                    border-collapse: collapse;
                    background: #374151;
                }

                .animals-table th,
                .animals-table td {
                    padding: 12px;
                    text-align: left;
                    border-bottom: 1px solid #4b5563;
                    color: white;
                }

                .animals-table th {
                    background: #1f2937;
                    font-weight: bold;
                    color: #d1d5db;
                }

                .animals-table tr.deceased {
                    background: rgba(245, 101, 101, 0.1);
                }

                .font-mono {
                    font-family: 'Courier New', monospace;
                    font-weight: bold;
                }

                .sexe-badge {
                    font-size: 18px;
                }

                .parents {
                    font-size: 12px;
                    line-height: 1.4;
                }

                .status-badge {
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: bold;
                }

                .status-badge.vivant {
                    background: #10b981;
                    color: white;
                }

                .status-badge.mort {
                    background: #dc2626;
                    color: white;
                }

                .actions {
                    white-space: nowrap;
                }

                .actions button {
                    background: none;
                    border: 1px solid #4b5563;
                    cursor: pointer;
                    padding: 6px 8px;
                    margin: 0 2px;
                    font-size: 14px;
                    border-radius: 4px;
                    color: white;
                    transition: all 0.2s;
                }

                .actions button:hover {
                    background: #4b5563;
                }

                .btn-delete:hover {
                    background: #dc2626;
                    border-color: #dc2626;
                }

                .btn-mark-dead:hover {
                    background: #f59e0b;
                    border-color: #f59e0b;
                }

                .descendants-view {
                    padding: 20px;
                }

                .descendants-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .descendants-header h3 {
                    margin: 0;
                    color: #495057;
                }

                .no-descendants {
                    text-align: center;
                    padding: 40px;
                    color: #6c757d;
                    font-style: italic;
                }

                .descendants-table-container {
                    overflow-x: auto;
                }

                .descendants-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .descendants-table th,
                .descendants-table td {
                    padding: 12px;
                    text-align: left;
                    border-bottom: 1px solid #dee2e6;
                }

                .descendants-table th {
                    background: #f8f9fa;
                    font-weight: bold;
                    color: #495057;
                }

                .descendants-table tr.deceased {
                    background: #fff3cd;
                }

                .error-message {
                    background: #dc2626;
                    color: white;
                    padding: 12px;
                    border-radius: 6px;
                    margin-bottom: 20px;
                    font-size: 0.9rem;
                }

                .loading {
                    text-align: center;
                    padding: 40px;
                    color: #d1d5db;
                }

                .btn-primary {
                    background: #3b82f6;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: background-color 0.2s;
                }

                .btn-primary:hover {
                    background: #2563eb;
                }

                @media (max-width: 768px) {
                    .detail-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 10px;
                    }

                    .animals-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 15px;
                    }

                    .animals-nav {
                        width: 100%;
                        justify-content: center;
                    }

                    .filters {
                        flex-direction: column;
                        gap: 10px;
                    }

                    .filter-group {
                        width: 100%;
                    }

                    .info-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
};

export default ElevageDetail;