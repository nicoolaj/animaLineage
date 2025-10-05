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
        <div className="p-4 sm:p-5 max-w-6xl mx-auto bg-gray-700 min-h-screen text-white">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 pb-4 sm:pb-5 border-b-2 border-gray-600 gap-4">
                <h2 className="text-lg sm:text-2xl font-semibold text-white">🦕 Gestion des Animaux</h2>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => setCurrentView('list')}
                        className={`${currentView === 'list' ? 'btn-primary' : 'btn-outline'} w-full sm:w-auto text-sm px-3 py-2`}
                    >
                        📋 Liste des animaux
                    </button>
                    <button
                        onClick={handleCreateAnimal}
                        className={`${currentView === 'form' && !editingAnimal ? 'btn-primary ring-2 ring-blue-300' : 'btn-primary'} w-full sm:w-auto text-sm px-3 py-2`}
                    >
                        🦕 Nouvel animal
                    </button>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

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
                <div className="max-w-4xl mx-auto">
                    <AnimalForm
                        animal={editingAnimal}
                        onSubmit={handleSubmitAnimal}
                        onCancel={handleCancelForm}
                    />
                </div>
            )}

            {currentView === 'descendants' && (
                <div className="bg-gray-700 rounded-lg shadow-card overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 sm:p-5 bg-gray-700 border-b border-gray-600 gap-3 sm:gap-4">
                        <h2 className="text-lg sm:text-xl font-semibold text-white">Descendants de {selectedAnimalForDescendants}</h2>
                        <button
                            onClick={() => setCurrentView('list')}
                            className="btn-secondary text-sm py-2 px-4 w-full sm:w-auto"
                        >
                            ← Retour à la liste
                        </button>
                    </div>

                    {descendants.length === 0 ? (
                        <div className="py-8 sm:py-10 px-4 sm:px-5 text-center text-gray-400 italic">
                            Cet animal n'a pas de descendants connus.
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table-mobile w-full border-collapse bg-gray-700 rounded-lg shadow-card">
                                <thead className="hidden sm:table-header-group">
                                    <tr>
                                        <th className="bg-gray-700 px-3 py-2.5 text-left text-gray-300 font-bold">Identifiant</th>
                                        <th className="bg-gray-700 px-3 py-2.5 text-left text-gray-300 font-bold">Nom</th>
                                        <th className="bg-gray-700 px-3 py-2.5 text-left text-gray-300 font-bold">Sexe</th>
                                        <th className="bg-gray-700 px-3 py-2.5 text-left text-gray-300 font-bold">Race</th>
                                        <th className="bg-gray-700 px-3 py-2.5 text-left text-gray-300 font-bold">Naissance</th>
                                        <th className="bg-gray-700 px-3 py-2.5 text-left text-gray-300 font-bold">Statut</th>
                                    </tr>
                                </thead>
                                <tbody className="block sm:table-row-group">
                                    {descendants.map(descendant => (
                                        <tr key={descendant.id} className={`block sm:table-row border-b border-gray-600 mb-4 sm:mb-0 bg-gray-800 sm:bg-transparent rounded-lg sm:rounded-none p-4 sm:p-0 text-white ${descendant.statut === 'mort' ? 'opacity-75' : ''}`}>
                                            <td data-label="Identifiant" className="block sm:table-cell text-left sm:text-center px-0 sm:px-3 py-1 sm:py-2.5 border-0 sm:border-gray-600 font-mono font-bold">{descendant.identifiant_officiel}</td>
                                            <td data-label="Nom" className="block sm:table-cell text-left sm:text-center px-0 sm:px-3 py-1 sm:py-2.5 border-0 sm:border-gray-600">{descendant.nom || '-'}</td>
                                            <td data-label="Sexe" className="block sm:table-cell text-left sm:text-center px-0 sm:px-3 py-1 sm:py-2.5 border-0 sm:border-gray-600">
                                                <span className="sexe-badge text-lg">
                                                    {descendant.sexe === 'M' ? '♂️' : '♀️'}
                                                </span>
                                            </td>
                                            <td data-label="Race" className="block sm:table-cell text-left sm:text-center px-0 sm:px-3 py-1 sm:py-2.5 border-0 sm:border-gray-600">{descendant.race_nom}</td>
                                            <td data-label="Naissance" className="block sm:table-cell text-left sm:text-center px-0 sm:px-3 py-1 sm:py-2.5 border-0 sm:border-gray-600">{formatDate(descendant.date_naissance)}</td>
                                            <td data-label="Statut" className="block sm:table-cell text-left sm:text-center px-0 sm:px-3 py-1 sm:py-2.5 border-0 sm:border-gray-600">
                                                <span className={`status-badge px-2 py-1 rounded-full text-xs font-bold ${descendant.statut === 'vivant' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                                                    {descendant.statut === 'vivant' ? '✅' : '💀'}
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