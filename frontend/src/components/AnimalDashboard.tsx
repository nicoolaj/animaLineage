import React, { useState } from 'react';
import AnimalForm from './AnimalForm';
import AnimalList from './AnimalList';
import { API_BASE_URL } from '../config/api';

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

interface Descendant {
    id: number;
    identifiant_officiel: string;
    nom?: string;
    sexe: 'M' | 'F';
    race_nom: string;
    date_naissance?: string;
    statut: 'vivant' | 'mort';
}

const AnimalDashboard: React.FC = () => {
    const [currentView, setCurrentView] = useState<'list' | 'form' | 'descendants'>('list');
    const [editingAnimal, setEditingAnimal] = useState<Animal | undefined>();
    const [descendants, setDescendants] = useState<Descendant[]>([]);
    const [selectedAnimalForDescendants, setSelectedAnimalForDescendants] = useState<string>('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [, setLoading] = useState(false);
    const [error, setError] = useState('');

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
            const token = sessionStorage.getItem('token');

            if (!token) {
                throw new Error('Token d\'authentification manquant');
            }

            const url = editingAnimal
                ? `${API_BASE_URL}api/animaux/${editingAnimal.id}`
                : `${API_BASE_URL}api/animaux`;

            const method = editingAnimal ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(animalData)
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

    const handleDeleteAnimal = (animalId: number) => {
        // La suppression est gérée directement dans AnimalList
        setRefreshTrigger(prev => prev + 1);
    };

    const handleMarkDead = (animalId: number) => {
        // Le marquage comme décédé est géré directement dans AnimalList
        setRefreshTrigger(prev => prev + 1);
    };

    const handleViewDescendants = async (animalId: number) => {
        try {
            setLoading(true);
            const token = sessionStorage.getItem('token');

            if (!token) {
                throw new Error('Token d\'authentification manquant');
            }

            const response = await fetch(`${API_BASE_URL}api/animaux/${animalId}/descendants`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors du chargement des descendants');
            }

            const data = await response.json();
            setDescendants(data);

            // Récupérer l'identifiant de l'animal parent pour l'affichage
            const animalResponse = await fetch(`${API_BASE_URL}api/animaux/${animalId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (animalResponse.ok) {
                const animalData = await animalResponse.json();
                setSelectedAnimalForDescendants(animalData.identifiant_officiel + (animalData.nom ? ` (${animalData.nom})` : ''));
            }

            setCurrentView('descendants');
            setError('');

        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('fr-FR');
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* En-tête */}
            <div className="mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
                    🦕 Gestion des Animaux
                </h2>
                <p className="text-gray-700 mt-2 text-base sm:text-lg">Suivi détaillé des animaux, généalogie et reproduction.</p>
                <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <button
                        onClick={() => setCurrentView('list')}
                        className={`${
                            currentView === 'list'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50'
                        } px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                    >
                        📋 Liste des animaux
                    </button>
                    <button
                        onClick={handleCreateAnimal}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        🦕 Nouvel animal
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded-lg mb-6">
                    ⚠️ {error}
                </div>
            )}

            {currentView === 'list' && (
                <AnimalList
                    onEdit={handleEditAnimal}
                    onDelete={handleDeleteAnimal}
                    onViewDescendants={handleViewDescendants}
                    onMarkDead={handleMarkDead}
                    refreshTrigger={refreshTrigger}
                />
            )}

            {currentView === 'form' && (
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
                    <AnimalForm
                        animal={editingAnimal}
                        onSubmit={handleSubmitAnimal}
                        onCancel={handleCancelForm}
                    />
                </div>
            )}

            {currentView === 'descendants' && (
                <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 sm:p-6 border-b border-gray-100 gap-3 sm:gap-4">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Descendants de {selectedAnimalForDescendants}</h2>
                        <button
                            onClick={() => setCurrentView('list')}
                            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 w-full sm:w-auto"
                        >
                            ← Retour à la liste
                        </button>
                    </div>

                    {descendants.length === 0 ? (
                        <div className="py-8 sm:py-10 px-4 sm:px-6 text-center text-gray-700">
                            <div className="text-4xl mb-4">🦕</div>
                            <p className="text-lg">Cet animal n'a pas de descendants connus.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                <thead className="hidden sm:table-header-group">
                                    <tr>
                                        <th className="bg-gray-50 px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Identifiant</th>
                                        <th className="bg-gray-50 px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Nom</th>
                                        <th className="bg-gray-50 px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Sexe</th>
                                        <th className="bg-gray-50 px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Race</th>
                                        <th className="bg-gray-50 px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Naissance</th>
                                        <th className="bg-gray-50 px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Statut</th>
                                    </tr>
                                </thead>
                                <tbody className="block sm:table-row-group">
                                    {descendants.map(descendant => (
                                        <tr key={descendant.id} className={`block sm:table-row border-b border-gray-200 mb-4 sm:mb-0 bg-gray-50 sm:bg-transparent rounded-lg sm:rounded-none p-4 sm:p-0 hover:bg-gray-50 transition-colors ${descendant.statut === 'mort' ? 'opacity-75' : ''}`}>
                                            <td data-label="Identifiant" className="block sm:table-cell text-left px-0 sm:px-4 py-1 sm:py-4 text-sm text-gray-900 font-mono font-bold">{descendant.identifiant_officiel}</td>
                                            <td data-label="Nom" className="block sm:table-cell text-left px-0 sm:px-4 py-1 sm:py-4 text-sm text-gray-900">{descendant.nom || '-'}</td>
                                            <td data-label="Sexe" className="block sm:table-cell text-left px-0 sm:px-4 py-1 sm:py-4 text-sm text-gray-900">
                                                <span className="text-lg">
                                                    {descendant.sexe === 'M' ? '♂️' : '♀️'}
                                                </span>
                                            </td>
                                            <td data-label="Race" className="block sm:table-cell text-left px-0 sm:px-4 py-1 sm:py-4 text-sm text-gray-900">{descendant.race_nom}</td>
                                            <td data-label="Naissance" className="block sm:table-cell text-left px-0 sm:px-4 py-1 sm:py-4 text-sm text-gray-900">{formatDate(descendant.date_naissance)}</td>
                                            <td data-label="Statut" className="block sm:table-cell text-left px-0 sm:px-4 py-1 sm:py-4 text-sm text-gray-900">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${descendant.statut === 'vivant' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
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

        </div>
    );
};

export default AnimalDashboard;