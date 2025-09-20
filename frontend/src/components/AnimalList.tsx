import React, { useState, useEffect } from 'react';

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
    statut: 'vivant' | 'mort';
    notes?: string;
    created_at: string;
}

interface AnimalListProps {
    onEdit: (animal: Animal) => void;
    onDelete: (animalId: number) => void;
    onViewDescendants: (animalId: number) => void;
    onMarkDead: (animalId: number) => void;
    refreshTrigger?: number;
}

const AnimalList: React.FC<AnimalListProps> = ({
    onEdit,
    onDelete,
    onViewDescendants,
    onMarkDead,
    refreshTrigger
}) => {
    const [animaux, setAnimaux] = useState<Animal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState({
        statut: '',
        sexe: '',
        elevage: '',
        race: ''
    });
    const [sortBy, setSortBy] = useState<keyof Animal>('identifiant_officiel');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    useEffect(() => {
        loadAnimaux();
    }, [refreshTrigger]);

    const loadAnimaux = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            if (!token) {
                setError('Token d\'authentification manquant');
                return;
            }

            const response = await fetch('http://localhost:3001/api/animaux', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors du chargement des animaux');
            }

            const data = await response.json();
            setAnimaux(data);
            setError('');
        } catch (error: any) {
            console.error('Erreur:', error);
            setError(error.message || 'Erreur lors du chargement des animaux');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (animalId: number, animalIdentifiant: string) => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'animal ${animalIdentifiant} ?`)) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:3001/api/animaux/${animalId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Erreur lors de la suppression');
                }

                onDelete(animalId);
                loadAnimaux();
            } catch (error: any) {
                alert('Erreur lors de la suppression: ' + error.message);
            }
        }
    };

    const handleMarkDead = async (animalId: number, animalIdentifiant: string) => {
        const dateDeces = prompt('Date de décès (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);

        if (dateDeces && window.confirm(`Marquer ${animalIdentifiant} comme décédé le ${dateDeces} ?`)) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:3001/api/animaux/${animalId}/deces`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ date_deces: dateDeces })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Erreur lors de la mise à jour');
                }

                onMarkDead(animalId);
                loadAnimaux();
            } catch (error: any) {
                alert('Erreur lors de la mise à jour: ' + error.message);
            }
        }
    };

    const handleSort = (field: keyof Animal) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const filteredAndSortedAnimaux = animaux
        .filter(animal => {
            if (filter.statut && animal.statut !== filter.statut) return false;
            if (filter.sexe && animal.sexe !== filter.sexe) return false;
            if (filter.elevage && (!animal.elevage_nom || !animal.elevage_nom.toLowerCase().includes(filter.elevage.toLowerCase()))) return false;
            if (filter.race && !animal.race_nom.toLowerCase().includes(filter.race.toLowerCase())) return false;
            return true;
        })
        .sort((a, b) => {
            const aValue = a[sortBy] || '';
            const bValue = b[sortBy] || '';

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

    const getSortIcon = (field: keyof Animal) => {
        if (sortBy !== field) return ' ↕️';
        return sortOrder === 'asc' ? ' ↗️' : ' ↘️';
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('fr-FR');
    };

    if (loading) {
        return <div id="animallist-loading-1" className="loading">Chargement des animaux...</div>;
    }

    return (
        <div id="animallist-animal-list-2" className="animal-list">
            <div id="animallist-list-header-3" className="list-header">
                <h2>Liste des animaux ({filteredAndSortedAnimaux.length})</h2>
                <button onClick={loadAnimaux} className="refresh-btn">
                    Actualiser
                </button>
            </div>

            {error && <div id="animallist-error-message-4" className="error-message">{error}</div>}

            {/* Filtres */}
            <div id="animallist-filters-5" className="filters">
                <div id="animallist-filter-group-6" className="filter-group">
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

                <div id="animallist-filter-group-7" className="filter-group">
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

                <div id="animallist-filter-group-8" className="filter-group">
                    <label>Élevage:</label>
                    <input
                        type="text"
                        placeholder="Filtrer par élevage"
                        value={filter.elevage}
                        onChange={(e) => setFilter({...filter, elevage: e.target.value})}
                    />
                </div>

                <div id="animallist-filter-group-9" className="filter-group">
                    <label>Race:</label>
                    <input
                        type="text"
                        placeholder="Filtrer par race"
                        value={filter.race}
                        onChange={(e) => setFilter({...filter, race: e.target.value})}
                    />
                </div>
            </div>

            {filteredAndSortedAnimaux.length === 0 ? (
                <div id="animallist-no-data-10" className="no-data">Aucun animal trouvé.</div>
            ) : (
                <div id="animallist-table-container-11" className="table-container">
                    <table className="animal-table">
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('identifiant_officiel')}>
                                    Identifiant{getSortIcon('identifiant_officiel')}
                                </th>
                                <th onClick={() => handleSort('nom')}>
                                    Nom{getSortIcon('nom')}
                                </th>
                                <th onClick={() => handleSort('sexe')}>
                                    Sexe{getSortIcon('sexe')}
                                </th>
                                <th onClick={() => handleSort('race_nom')}>
                                    Race{getSortIcon('race_nom')}
                                </th>
                                <th>Parents</th>
                                <th onClick={() => handleSort('date_naissance')}>
                                    Naissance{getSortIcon('date_naissance')}
                                </th>
                                <th onClick={() => handleSort('elevage_nom')}>
                                    Élevage{getSortIcon('elevage_nom')}
                                </th>
                                <th onClick={() => handleSort('statut')}>
                                    Statut{getSortIcon('statut')}
                                </th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSortedAnimaux.map(animal => (
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
                                            <div id="animallist-parent-12" className="parent">
                                                ♂️ {animal.pere_identifiant} {animal.pere_nom && `(${animal.pere_nom})`}
                                            </div>
                                        )}
                                        {animal.mere_identifiant && (
                                            <div id="animallist-parent-13" className="parent">
                                                ♀️ {animal.mere_identifiant} {animal.mere_nom && `(${animal.mere_nom})`}
                                            </div>
                                        )}
                                        {!animal.pere_identifiant && !animal.mere_identifiant && '-'}
                                    </td>
                                    <td>{formatDate(animal.date_naissance)}</td>
                                    <td>{animal.elevage_nom || '-'}</td>
                                    <td>
                                        <span className={`status-badge ${animal.statut}`}>
                                            {animal.statut === 'vivant' ? '✅ Vivant' : `💀 Décédé ${formatDate(animal.date_deces)}`}
                                        </span>
                                    </td>
                                    <td className="actions">
                                        <button
                                            onClick={() => onEdit(animal)}
                                            className="btn-edit"
                                            title="Modifier"
                                        >
                                            ✏️
                                        </button>

                                        <button
                                            onClick={() => onViewDescendants(animal.id)}
                                            className="btn-descendants"
                                            title="Voir descendants"
                                        >
                                            🌳
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
                                            onClick={() => handleDelete(animal.id, animal.identifiant_officiel)}
                                            className="btn-delete"
                                            title="Supprimer"
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <style>{`
                .animal-list {
                    padding: 20px;
                }

                .list-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .filters {
                    display: flex;
                    gap: 15px;
                    margin-bottom: 20px;
                    padding: 15px;
                    background: #f5f5f5;
                    border-radius: 8px;
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
                    color: #666;
                }

                .filter-group input,
                .filter-group select {
                    padding: 5px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 14px;
                }

                .table-container {
                    overflow-x: auto;
                }

                .animal-table {
                    width: 100%;
                    border-collapse: collapse;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .animal-table th,
                .animal-table td {
                    padding: 12px;
                    text-align: left;
                    border-bottom: 1px solid #eee;
                }

                .animal-table th {
                    background: #f8f9fa;
                    font-weight: bold;
                    cursor: pointer;
                    user-select: none;
                }

                .animal-table th:hover {
                    background: #e9ecef;
                }

                .animal-table tr.deceased {
                    background: #fff3cd;
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

                .parent {
                    white-space: nowrap;
                }

                .status-badge {
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: bold;
                }

                .status-badge.vivant {
                    background: #d4edda;
                    color: #155724;
                }

                .status-badge.mort {
                    background: #f8d7da;
                    color: #721c24;
                }

                .actions {
                    white-space: nowrap;
                }

                .actions button {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 4px;
                    margin: 0 2px;
                    font-size: 16px;
                    border-radius: 4px;
                }

                .actions button:hover {
                    background: #f0f0f0;
                }

                .btn-delete:hover {
                    background: #ffebee;
                }

                .btn-mark-dead:hover {
                    background: #fff3e0;
                }

                .error-message {
                    background: #f8d7da;
                    color: #721c24;
                    padding: 12px;
                    border-radius: 4px;
                    margin-bottom: 20px;
                }

                .loading, .no-data {
                    text-align: center;
                    padding: 40px;
                    color: #666;
                }

                .refresh-btn {
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                }

                .refresh-btn:hover {
                    background: #0056b3;
                }
            `}</style>
        </div>
    );
};

export default AnimalList;