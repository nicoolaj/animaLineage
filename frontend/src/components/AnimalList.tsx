import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

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
    const { getAuthHeaders } = useAuth();
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
            const response = await fetch('http://localhost:3001/api/animaux', {
                headers: getAuthHeaders()
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
                const response = await fetch(`http://localhost:3001/api/animaux/${animalId}`, {
                    method: 'DELETE',
                    headers: getAuthHeaders()
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
                const response = await fetch(`http://localhost:3001/api/animaux/${animalId}/deces`, {
                    method: 'POST',
                    headers: {
                        ...getAuthHeaders(),
                        'Content-Type': 'application/json'
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
        return <div className="text-center py-10 text-gray-400 bg-gray-800 min-h-screen flex items-center justify-center">Chargement des animaux...</div>;
    }

    return (
        <div className="p-5 bg-gray-800 min-h-screen text-white">
            <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-semibold text-white">Liste des animaux 🦕 ({filteredAndSortedAnimaux.length})</h2>
                <button onClick={loadAnimaux} className="btn-primary text-sm py-2 px-4">
                    Actualiser
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {/* Filtres */}
            <div className="flex gap-4 mb-5 p-4 bg-gray-700 rounded-lg flex-wrap">
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-300">Statut:</label>
                    <select
                        value={filter.statut}
                        onChange={(e) => setFilter({...filter, statut: e.target.value})}
                        className="text-sm py-1 px-2 bg-gray-600 border border-gray-500 rounded text-white"
                    >
                        <option value="">Tous</option>
                        <option value="vivant">Vivant</option>
                        <option value="mort">Décédé</option>
                    </select>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-300">Sexe:</label>
                    <select
                        value={filter.sexe}
                        onChange={(e) => setFilter({...filter, sexe: e.target.value})}
                        className="text-sm py-1 px-2 bg-gray-600 border border-gray-500 rounded text-white"
                    >
                        <option value="">Tous</option>
                        <option value="M">Mâle</option>
                        <option value="F">Femelle</option>
                    </select>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-300">Élevage:</label>
                    <input
                        type="text"
                        placeholder="Filtrer par élevage"
                        value={filter.elevage}
                        onChange={(e) => setFilter({...filter, elevage: e.target.value})}
                        className="text-sm py-1 px-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-300">Race:</label>
                    <input
                        type="text"
                        placeholder="Filtrer par race"
                        value={filter.race}
                        onChange={(e) => setFilter({...filter, race: e.target.value})}
                        className="text-sm py-1 px-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400"
                    />
                </div>
            </div>

            {filteredAndSortedAnimaux.length === 0 ? (
                <div className="text-center py-10 text-gray-400">Aucun animal trouvé.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse bg-gray-700 rounded-lg shadow-card">
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('identifiant_officiel')} className="bg-gray-800 px-3 py-2.5 text-left text-gray-300 font-bold cursor-pointer select-none hover:bg-gray-600">
                                    Identifiant{getSortIcon('identifiant_officiel')}
                                </th>
                                <th onClick={() => handleSort('nom')} className="bg-gray-800 px-3 py-2.5 text-left text-gray-300 font-bold cursor-pointer select-none hover:bg-gray-600">
                                    Nom{getSortIcon('nom')}
                                </th>
                                <th onClick={() => handleSort('sexe')} className="bg-gray-800 px-3 py-2.5 text-left text-gray-300 font-bold cursor-pointer select-none hover:bg-gray-600">
                                    Sexe{getSortIcon('sexe')}
                                </th>
                                <th onClick={() => handleSort('race_nom')} className="bg-gray-800 px-3 py-2.5 text-left text-gray-300 font-bold cursor-pointer select-none hover:bg-gray-600">
                                    Race{getSortIcon('race_nom')}
                                </th>
                                <th className="bg-gray-800 px-3 py-2.5 text-left text-gray-300 font-bold cursor-default">Parents</th>
                                <th onClick={() => handleSort('date_naissance')} className="bg-gray-800 px-3 py-2.5 text-left text-gray-300 font-bold cursor-pointer select-none hover:bg-gray-600">
                                    Naissance{getSortIcon('date_naissance')}
                                </th>
                                <th onClick={() => handleSort('elevage_nom')} className="bg-gray-800 px-3 py-2.5 text-left text-gray-300 font-bold cursor-pointer select-none hover:bg-gray-600">
                                    Élevage{getSortIcon('elevage_nom')}
                                </th>
                                <th onClick={() => handleSort('statut')} className="bg-gray-800 px-3 py-2.5 text-left text-gray-300 font-bold cursor-pointer select-none hover:bg-gray-600">
                                    Statut{getSortIcon('statut')}
                                </th>
                                <th className="bg-gray-800 px-3 py-2.5 text-left text-gray-300 font-bold cursor-default">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSortedAnimaux.map(animal => (
                                <tr key={animal.id} className={`border-b border-gray-600 text-white ${animal.statut === 'mort' ? 'bg-red-900 bg-opacity-20' : ''}`}>
                                    <td className="px-3 py-2.5 font-mono font-bold">{animal.identifiant_officiel}</td>
                                    <td className="px-3 py-2.5">{animal.nom || '-'}</td>
                                    <td className="px-3 py-2.5">
                                        <span className="sexe-badge">
                                            {animal.sexe === 'M' ? '♂️' : '♀️'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2.5">{animal.race_nom}</td>
                                    <td className="px-3 py-2.5 text-xs leading-relaxed">
                                        {animal.pere_identifiant && (
                                            <div className="whitespace-nowrap">
                                                ♂️ {animal.pere_identifiant} {animal.pere_nom && `(${animal.pere_nom})`}
                                            </div>
                                        )}
                                        {animal.mere_identifiant && (
                                            <div className="whitespace-nowrap">
                                                ♀️ {animal.mere_identifiant} {animal.mere_nom && `(${animal.mere_nom})`}
                                            </div>
                                        )}
                                        {!animal.pere_identifiant && !animal.mere_identifiant && '-'}
                                    </td>
                                    <td className="px-3 py-2.5">{formatDate(animal.date_naissance)}</td>
                                    <td className="px-3 py-2.5">{animal.elevage_nom || '-'}</td>
                                    <td className="px-3 py-2.5">
                                        <span className={`status-badge px-2 py-1 rounded-full text-xs font-bold ${animal.statut === 'vivant' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                                            {animal.statut === 'vivant' ? '✅ Vivant' : `💀 Décédé ${formatDate(animal.date_deces)}`}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2.5 whitespace-nowrap">
                                        <button
                                            onClick={() => onEdit(animal)}
                                            className="bg-transparent border border-gray-500 cursor-pointer p-1 mx-0.5 text-base rounded hover:bg-gray-600 transition-colors duration-150 text-white"
                                            title="Modifier"
                                        >
                                            ✏️
                                        </button>

                                        <button
                                            onClick={() => onViewDescendants(animal.id)}
                                            className="bg-transparent border border-gray-500 cursor-pointer p-1 mx-0.5 text-base rounded hover:bg-gray-600 transition-colors duration-150 text-white"
                                            title="Voir descendants"
                                        >
                                            🌳
                                        </button>

                                        {animal.statut === 'vivant' && (
                                            <button
                                                onClick={() => handleMarkDead(animal.id, animal.identifiant_officiel)}
                                                className="bg-transparent border border-gray-500 cursor-pointer p-1 mx-0.5 text-base rounded hover:bg-yellow-600 transition-colors duration-150 text-white"
                                                title="Marquer comme décédé"
                                            >
                                                💀
                                            </button>
                                        )}

                                        <button
                                            onClick={() => handleDelete(animal.id, animal.identifiant_officiel)}
                                            className="bg-transparent border border-gray-500 cursor-pointer p-1 mx-0.5 text-base rounded hover:bg-red-600 transition-colors duration-150 text-white"
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

            {/* Styles now handled by Tailwind CSS classes */}
        </div>
    );
};

export default AnimalList;