import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, formatAgeDisplay, getAgeTooltip } from '../utils/dateUtils';
import { API_BASE_URL } from '../config/api';
import FamilyTree from './FamilyTree';

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
    onViewFamilyTree?: (animalId: number) => void;
    refreshTrigger?: number;
}

const AnimalList: React.FC<AnimalListProps> = ({
    onEdit,
    onDelete,
    onViewDescendants,
    onMarkDead,
    onViewFamilyTree,
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
    const [selectedAnimalForTree, setSelectedAnimalForTree] = useState<number | null>(null);

    const loadAnimaux = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}api/animaux`, {
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
    }, [getAuthHeaders]);

    useEffect(() => {
        loadAnimaux();
    }, [refreshTrigger, loadAnimaux]);

    const handleDelete = async (animalId: number, animalIdentifiant: string) => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'animal ${animalIdentifiant} ?`)) {
            try {
                const response = await fetch(`${API_BASE_URL}api/animaux/${animalId}`, {
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
                const response = await fetch(`${API_BASE_URL}api/animaux/${animalId}/deces`, {
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


    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-gray-900">Chargement des animaux...</div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Liste des animaux 🦕 ({filteredAndSortedAnimaux.length})</h3>
                <button
                    onClick={loadAnimaux}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm"
                >
                    Actualiser
                </button>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded-lg mb-6">
                    ⚠️ {error}
                </div>
            )}

            {/* Filtres */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-700 uppercase">Statut:</label>
                        <select
                            value={filter.statut}
                            onChange={(e) => setFilter({...filter, statut: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm text-gray-700 bg-white"
                        >
                            <option value="">Tous</option>
                            <option value="vivant">Vivant</option>
                            <option value="mort">Décédé</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-700 uppercase">Sexe:</label>
                        <select
                            value={filter.sexe}
                            onChange={(e) => setFilter({...filter, sexe: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm text-gray-700 bg-white"
                        >
                            <option value="">Tous</option>
                            <option value="M">Mâle</option>
                            <option value="F">Femelle</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-700 uppercase">Élevage:</label>
                        <input
                            type="text"
                            placeholder="Filtrer par élevage"
                            value={filter.elevage}
                            onChange={(e) => setFilter({...filter, elevage: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm text-gray-700 bg-white placeholder-gray-400"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-700 uppercase">Race:</label>
                        <input
                            type="text"
                            placeholder="Filtrer par race"
                            value={filter.race}
                            onChange={(e) => setFilter({...filter, race: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm text-gray-700 bg-white placeholder-gray-400"
                        />
                    </div>
                </div>
            </div>

            {filteredAndSortedAnimaux.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-gray-700">
                        <div className="text-4xl mb-4">🦕</div>
                        <p className="text-lg">Aucun animal trouvé.</p>
                    </div>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('identifiant_officiel')} className="bg-gray-50 px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 transition-colors">
                                    Identifiant{getSortIcon('identifiant_officiel')}
                                </th>
                                <th onClick={() => handleSort('nom')} className="bg-gray-50 px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 transition-colors">
                                    Nom{getSortIcon('nom')}
                                </th>
                                <th onClick={() => handleSort('sexe')} className="bg-gray-50 px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 transition-colors">
                                    Sexe{getSortIcon('sexe')}
                                </th>
                                <th onClick={() => handleSort('race_nom')} className="bg-gray-50 px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 transition-colors">
                                    Race{getSortIcon('race_nom')}
                                </th>
                                <th className="bg-gray-50 px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Parents</th>
                                <th onClick={() => handleSort('date_naissance')} className="bg-gray-50 px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 transition-colors">
                                    Naissance{getSortIcon('date_naissance')}
                                </th>
                                <th className="bg-gray-50 px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Âge</th>
                                <th onClick={() => handleSort('elevage_nom')} className="bg-gray-50 px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 transition-colors">
                                    Élevage{getSortIcon('elevage_nom')}
                                </th>
                                <th onClick={() => handleSort('statut')} className="bg-gray-50 px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 transition-colors">
                                    Statut{getSortIcon('statut')}
                                </th>
                                <th className="bg-gray-50 px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSortedAnimaux.map(animal => (
                                <tr key={animal.id} className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${animal.statut === 'mort' ? 'bg-red-50' : ''}`}>
                                    <td data-label="Identifiant" className="px-3 sm:px-4 py-4 text-sm text-gray-900 font-mono font-bold">{animal.identifiant_officiel}</td>
                                    <td data-label="Nom" className="px-3 sm:px-4 py-4 text-sm text-gray-900">{animal.nom || '-'}</td>
                                    <td data-label="Sexe" className="px-3 sm:px-4 py-4 text-sm text-gray-900">
                                        <span className="text-lg">
                                            {animal.sexe === 'M' ? '♂️' : '♀️'}
                                        </span>
                                    </td>
                                    <td data-label="Race" className="px-3 sm:px-4 py-4 text-sm text-gray-900">{animal.race_nom}</td>
                                    <td data-label="Parents" className="px-3 sm:px-4 py-4 text-xs text-gray-700 leading-relaxed">
                                        {animal.pere_identifiant && (
                                            <div className="whitespace-nowrap text-gray-900">
                                                ♂️ {animal.pere_identifiant} {animal.pere_nom && `(${animal.pere_nom})`}
                                            </div>
                                        )}
                                        {animal.mere_identifiant && (
                                            <div className="whitespace-nowrap text-gray-900">
                                                ♀️ {animal.mere_identifiant} {animal.mere_nom && `(${animal.mere_nom})`}
                                            </div>
                                        )}
                                        {!animal.pere_identifiant && !animal.mere_identifiant && '-'}
                                    </td>
                                    <td data-label="Naissance" className="px-3 sm:px-4 py-4 text-sm text-gray-900">{formatDate(animal.date_naissance)}</td>
                                    <td data-label="Âge" className="px-3 sm:px-4 py-4 text-sm text-gray-900" title={getAgeTooltip(animal)}>
                                        {formatAgeDisplay(animal)}
                                    </td>
                                    <td data-label="Élevage" className="px-3 sm:px-4 py-4 text-sm text-gray-900">{animal.elevage_nom || '-'}</td>
                                    <td data-label="Statut" className="px-3 sm:px-4 py-4 text-sm text-gray-900">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${animal.statut === 'vivant' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`} title={animal.statut === 'vivant' ? 'Vivant' : `Décédé ${formatDate(animal.date_deces)}`}>
                                            {animal.statut === 'vivant' ? '✅ Vivant' : '💀 Décédé'}
                                        </span>
                                    </td>
                                    <td className="px-3 sm:px-4 py-4 text-sm text-gray-900 whitespace-nowrap">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => onEdit(animal)}
                                                className="p-2 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                                title="Modifier"
                                            >
                                                ✏️
                                            </button>

                                            <button
                                                onClick={() => onViewDescendants(animal.id)}
                                                className="p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                                title="Voir descendants"
                                            >
                                                🌳
                                            </button>

                                            <button
                                                onClick={() => onViewFamilyTree ? onViewFamilyTree(animal.id) : setSelectedAnimalForTree(animal.id)}
                                                className="p-2 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                                                title="Arbre généalogique"
                                            >
                                                🧬
                                            </button>

                                            {animal.statut === 'vivant' && (
                                                <button
                                                    onClick={() => handleMarkDead(animal.id, animal.identifiant_officiel)}
                                                    className="p-2 text-gray-700 hover:text-yellow-600 hover:bg-yellow-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                                                    title="Marquer comme décédé"
                                                >
                                                    💀
                                                </button>
                                            )}

                                            <button
                                                onClick={() => handleDelete(animal.id, animal.identifiant_officiel)}
                                                className="p-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                                title="Supprimer"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Styles now handled by Tailwind CSS classes */}

            {/* Arbre généalogique modal - seulement si pas de handler externe */}
            {!onViewFamilyTree && selectedAnimalForTree && (
                <FamilyTree
                    animalId={selectedAnimalForTree}
                    onClose={() => setSelectedAnimalForTree(null)}
                />
            )}
        </div>
    );
};

export default AnimalList;