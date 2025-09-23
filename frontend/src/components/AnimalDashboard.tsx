import React, { useState } from 'react';
import AnimalForm from './AnimalForm';
import AnimalList from './AnimalList';

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
                ? `http://localhost:3001/api/animaux/${editingAnimal.id}`
                : 'http://localhost:3001/api/animaux';

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

            const response = await fetch(`http://localhost:3001/api/animaux/${animalId}/descendants`, {
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
            const animalResponse = await fetch(`http://localhost:3001/api/animaux/${animalId}`, {
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
        <div className="p-5 max-w-6xl mx-auto bg-gray-700 min-h-screen text-white">
            <div className="flex justify-between items-center mb-8 pb-5 border-b-2 border-gray-600">
                <h2 className="section-title">🦕 Gestion des Animaux</h2>
                <div className="flex gap-3 items-center">
                    <button
                        onClick={() => setCurrentView('list')}
                        className={`btn-outline ${currentView === 'list' ? 'bg-primary-500 text-white' : ''}`}
                    >
                        📋 Liste des animaux 🦕
                    </button>
                    <button
                        onClick={handleCreateAnimal}
                        className={`btn-primary ${currentView === 'form' && !editingAnimal ? 'ring-2 ring-primary-300' : ''}`}
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
                <div className="max-w-4xl mx-auto bg-gray-700 p-8 rounded-lg shadow-card">
                    <AnimalForm
                        animal={editingAnimal}
                        onSubmit={handleSubmitAnimal}
                        onCancel={handleCancelForm}
                    />
                </div>
            )}

            {currentView === 'descendants' && (
                <div className="bg-gray-700 rounded-lg shadow-card overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-5 bg-gray-700 border-b border-gray-600 gap-4">
                        <h2 className="section-title">Descendants de {selectedAnimalForDescendants}</h2>
                        <button
                            onClick={() => setCurrentView('list')}
                            className="btn-secondary text-sm py-2 px-4 self-start sm:self-auto"
                        >
                            ← Retour à la liste
                        </button>
                    </div>

                    {descendants.length === 0 ? (
                        <div className="py-10 px-5 text-center text-gray-400 italic">
                            Cet animal n'a pas de descendants connus.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse bg-gray-700">
                                <thead>
                                    <tr>
                                        <th className="table-header px-4 py-3 text-left">Identifiant</th>
                                        <th className="table-header px-4 py-3 text-left">Nom</th>
                                        <th className="table-header px-4 py-3 text-left">Sexe</th>
                                        <th className="table-header px-4 py-3 text-left">Race</th>
                                        <th className="table-header px-4 py-3 text-left">Date de naissance</th>
                                        <th className="table-header px-4 py-3 text-left">Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {descendants.map(descendant => (
                                        <tr key={descendant.id} className={`border-b border-gray-600 text-white hover:bg-gray-600 transition-colors duration-200 ${descendant.statut === 'mort' ? 'bg-red-900 bg-opacity-20' : ''}`}>
                                            <td className="px-4 py-3 font-mono font-bold">{descendant.identifiant_officiel}</td>
                                            <td className="px-4 py-3">{descendant.nom || '-'}</td>
                                            <td className="px-4 py-3">
                                                <span className="sexe-badge">
                                                    {descendant.sexe === 'M' ? '♂️' : '♀️'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">{descendant.race_nom}</td>
                                            <td className="px-4 py-3">{formatDate(descendant.date_naissance)}</td>
                                            <td className="px-4 py-3">
                                                <span className={`status-badge ${descendant.statut === 'vivant' ? 'status-badge-alive' : 'status-badge-dead'}`}>
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