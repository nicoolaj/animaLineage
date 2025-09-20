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
    const [loading, setLoading] = useState(false);
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
            const token = localStorage.getItem('token');

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
            const token = localStorage.getItem('token');

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
        <div id="animaldashboard-animal-dashboard-1" className="animal-dashboard">
            <div id="animaldashboard-dashboard-header-2" className="dashboard-header">
                <h1>Gestion des Animaux</h1>

                <div id="animaldashboard-dashboard-nav-3" className="dashboard-nav">
                    <button
                        onClick={() => setCurrentView('list')}
                        className={currentView === 'list' ? 'active' : ''}
                    >
                        📋 Liste des animaux
                    </button>
                    <button
                        onClick={handleCreateAnimal}
                        className={currentView === 'form' && !editingAnimal ? 'active' : ''}
                    >
                        ➕ Nouvel animal
                    </button>
                </div>
            </div>

            {error && <div id="animaldashboard-error-message-4" className="error-message">{error}</div>}

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
                <div id="animaldashboard-form-container-5" className="form-container">
                    <AnimalForm
                        animal={editingAnimal}
                        onSubmit={handleSubmitAnimal}
                        onCancel={handleCancelForm}
                    />
                </div>
            )}

            {currentView === 'descendants' && (
                <div id="animaldashboard-descendants-view-6" className="descendants-view">
                    <div id="animaldashboard-descendants-header-7" className="descendants-header">
                        <h2>Descendants de {selectedAnimalForDescendants}</h2>
                        <button onClick={() => setCurrentView('list')} className="back-btn">
                            ← Retour à la liste
                        </button>
                    </div>

                    {descendants.length === 0 ? (
                        <div id="animaldashboard-no-descendants-8" className="no-descendants">
                            Cet animal n'a pas de descendants connus.
                        </div>
                    ) : (
                        <div id="animaldashboard-descendants-table-container-9" className="descendants-table-container">
                            <table className="descendants-table">
                                <thead>
                                    <tr>
                                        <th>Identifiant</th>
                                        <th>Nom</th>
                                        <th>Sexe</th>
                                        <th>Race</th>
                                        <th>Date de naissance</th>
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

            <style>{`
                .animal-dashboard {
                    padding: 20px;
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .dashboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #eee;
                }

                .dashboard-header h1 {
                    margin: 0;
                    color: #333;
                }

                .dashboard-nav {
                    display: flex;
                    gap: 10px;
                }

                .dashboard-nav button {
                    padding: 10px 20px;
                    border: 2px solid #007bff;
                    background: white;
                    color: #007bff;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.3s ease;
                }

                .dashboard-nav button:hover {
                    background: #007bff;
                    color: white;
                }

                .dashboard-nav button.active {
                    background: #007bff;
                    color: white;
                }

                .form-container {
                    max-width: 800px;
                    margin: 0 auto;
                    background: white;
                    padding: 30px;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }

                .descendants-view {
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    overflow: hidden;
                }

                .descendants-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px;
                    background: #f8f9fa;
                    border-bottom: 1px solid #dee2e6;
                }

                .descendants-header h2 {
                    margin: 0;
                    color: #495057;
                }

                .back-btn {
                    background: #6c757d;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                }

                .back-btn:hover {
                    background: #5a6268;
                }

                .no-descendants {
                    padding: 40px;
                    text-align: center;
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
                    padding: 12px 16px;
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

                .font-mono {
                    font-family: 'Courier New', monospace;
                    font-weight: bold;
                }

                .sexe-badge {
                    font-size: 18px;
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

                .error-message {
                    background: #f8d7da;
                    color: #721c24;
                    padding: 12px;
                    border-radius: 4px;
                    margin-bottom: 20px;
                    border: 1px solid #f5c6cb;
                }

                @media (max-width: 768px) {
                    .dashboard-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 15px;
                    }

                    .dashboard-nav {
                        width: 100%;
                        justify-content: center;
                    }

                    .dashboard-nav button {
                        flex: 1;
                        text-align: center;
                    }

                    .descendants-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 15px;
                    }

                    .form-container {
                        margin: 0 -10px;
                        border-radius: 0;
                    }
                }
            `}</style>
        </div>
    );
};

export default AnimalDashboard;