import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AnimalForm from './AnimalForm';
import ElevageUsersManagement from './ElevageUsersManagement';
import { formatDate, formatAgeDisplay, getAgeTooltip, calculateAge } from '../utils/dateUtils';
import { API_BASE_URL } from '../config/api';

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
    const [currentView, setCurrentView] = useState<'list' | 'form' | 'descendants' | 'users' | 'statistics'>('list');
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
            const response = await fetch(`${API_BASE_URL}api/elevages/${elevageId}`, {
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

    // Fonction pour corriger le statut basé sur la date de décès (sécurité côté frontend)
    const fixAnimalStatus = (animal: Animal): Animal => {
        if (animal.date_deces && animal.statut !== 'mort') {
            return { ...animal, statut: 'mort' };
        }
        if (!animal.date_deces && animal.statut === 'mort') {
            return { ...animal, statut: 'vivant' };
        }
        return animal;
    };

    const loadAnimaux = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}api/animaux?elevage_id=${elevageId}`, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                // Corriger le statut de chaque animal
                const animauxCorrigés = data.map(fixAnimalStatus);
                setAnimaux(animauxCorrigés);
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
        const loadData = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}api/elevages/${elevageId}`, {
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
        };
        loadData();
    }, [elevageId, refreshTrigger, getAuthHeaders]);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_BASE_URL}api/animaux?elevage_id=${elevageId}`, {
                    headers: getAuthHeaders()
                });

                if (response.ok) {
                    const data = await response.json();
                    const animauxCorrigés = data.map((animal: Animal) => {
                        if (animal.date_deces && animal.statut !== 'mort') {
                            return { ...animal, statut: 'mort' };
                        }
                        if (!animal.date_deces && animal.statut === 'mort') {
                            return { ...animal, statut: 'vivant' };
                        }
                        return animal;
                    });
                    setAnimaux(animauxCorrigés);
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
        };
        loadData();
    }, [elevageId, refreshTrigger, getAuthHeaders]);

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
                ? `${API_BASE_URL}api/animaux/${editingAnimal.id}`
                : `${API_BASE_URL}api/animaux`;

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
                if (response.status === 409 && errorData.field === 'identifiant_officiel') {
                    if (errorData.existing_animal) {
                        throw new Error(`Cet identifiant officiel existe déjà pour l'animal "${errorData.existing_animal.nom || 'Sans nom'}" dans l'élevage "${errorData.existing_animal.elevage_nom || 'Non spécifié'}"`);
                    } else {
                        throw new Error('Cet identifiant officiel existe déjà. Veuillez en choisir un autre.');
                    }
                } else {
                    throw new Error(errorData.message || 'Erreur lors de l\'enregistrement');
                }
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
                const response = await fetch(`${API_BASE_URL}api/animaux/${animalId}`, {
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
                const response = await fetch(`${API_BASE_URL}api/animaux/${animalId}/deces`, {
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
            const response = await fetch(`${API_BASE_URL}api/animaux/${animalId}/descendants`, {
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
            case 'age':
                // Utiliser la même logique que dans calculateStatistics pour une cohérence parfaite
                const { age: ageString } = calculateAge(animal);
                let ageNumber: number | null = null;
                if (ageString && ageString !== 'Inconnu') {
                    if (ageString === 'Nouveau-né') {
                        ageNumber = 0;
                    } else {
                        ageNumber = 0;
                        // Chercher les années (format: "5a", "5 ans", "5.2a")
                        const yearsMatch = ageString.match(/(\d+\.?\d*)\s*a(?:ns?)?/);
                        if (yearsMatch) {
                            ageNumber += parseFloat(yearsMatch[1]);
                        }
                        // Chercher les mois (format: "3m", "3 mois")
                        const monthsMatch = ageString.match(/(\d+)\s*m(?:ois)?(?!\w)/);
                        if (monthsMatch) {
                            ageNumber += parseFloat(monthsMatch[1]) / 12;
                        }
                        // Chercher les jours (format: "15j", "15 jours")
                        const daysMatch = ageString.match(/(\d+)\s*j(?:ours?)?(?!\w)/);
                        if (daysMatch) {
                            ageNumber += parseFloat(daysMatch[1]) / 365;
                        }
                        // Si aucun format reconnu, essayer d'extraire un nombre simple
                        if (!yearsMatch && !monthsMatch && !daysMatch) {
                            const match = ageString.match(/^(\d+\.?\d*)/);
                            if (match) {
                                ageNumber = parseFloat(match[1]);
                            } else {
                                ageNumber = null;
                            }
                        }
                    }
                }
                return ageNumber || 0;
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

    // Fonction locale pour compatibilité avec l'ancien code (tri uniquement)
    const calculateAgeForSort = (dateNaissance?: string, dateDeces?: string): number | null => {
        if (!dateNaissance) return null;

        const birthDate = new Date(dateNaissance);
        const endDate = dateDeces ? new Date(dateDeces) : new Date();

        if (isNaN(birthDate.getTime()) || isNaN(endDate.getTime())) {
            return null;
        }

        const ageInMs = endDate.getTime() - birthDate.getTime();
        const ageInYears = ageInMs / (1000 * 60 * 60 * 24 * 365.25);

        if (ageInYears < 0) {
            return null;
        }

        return Math.floor(ageInYears * 10) / 10;
    };

    const getAgeGroup = (age: number | null): string => {
        if (age === null) return 'Inconnu';
        if (age < 1) return '0-1 an';
        if (age < 2) return '1-2 ans';
        if (age < 5) return '2-5 ans';
        if (age < 8) return '5-8 ans';
        if (age < 10) return '8-10 ans';
        return '10+ ans';
    };

    const calculateStatistics = () => {
        const animauxAvecAge = animaux.map(animal => {
            const { age } = calculateAge(animal);
            // Convertir l'âge en nombre si c'est une chaîne
            let ageNumber: number | null = null;
            if (age && age !== 'Inconnu') {
                if (age === 'Nouveau-né') {
                    ageNumber = 0;
                } else {
                    // Traiter différents formats d'âge avec parsing complet
                    ageNumber = 0;

                    // Chercher les années (format: "5a", "5 ans", "5.2a")
                    const yearsMatch = age.match(/(\d+\.?\d*)\s*a(?:ns?)?/);
                    if (yearsMatch) {
                        ageNumber += parseFloat(yearsMatch[1]);
                    }

                    // Chercher les mois (format: "3m", "3 mois")
                    const monthsMatch = age.match(/(\d+)\s*m(?:ois)?(?!\w)/); // (?!\w) pour éviter "mois" dans "6 mois"
                    if (monthsMatch) {
                        ageNumber += parseFloat(monthsMatch[1]) / 12;
                    }

                    // Chercher les jours (format: "15j", "15 jours")
                    const daysMatch = age.match(/(\d+)\s*j(?:ours?)?(?!\w)/);
                    if (daysMatch) {
                        ageNumber += parseFloat(daysMatch[1]) / 365;
                    }

                    // Si aucun format reconnu, essayer d'extraire un nombre simple
                    if (!yearsMatch && !monthsMatch && !daysMatch) {
                        const match = age.match(/^(\d+\.?\d*)/);
                        if (match) {
                            ageNumber = parseFloat(match[1]);
                        } else {
                            ageNumber = null; // Âge non parsable
                        }
                    }
                }
            }
            return {
                ...animal,
                age: ageNumber
            };
        });

        const vivants = animauxAvecAge.filter(a => a.statut === 'vivant');
        const morts = animauxAvecAge.filter(a => a.statut === 'mort');

        // Calcul de l'âge moyen des vivants
        const agesVivants = vivants.map(a => a.age).filter(age => age !== null) as number[];
        const ageMoyenVivants = agesVivants.length > 0
            ? agesVivants.reduce((sum, age) => sum + age, 0) / agesVivants.length
            : null;

        // Calcul de la longévité moyenne (animaux décédés)
        const longevites = morts.map(a => a.age).filter(age => age !== null) as number[];
        const longeviteMoyenne = longevites.length > 0
            ? longevites.reduce((sum, age) => sum + age, 0) / longevites.length
            : null;

        // Longévité par sexe
        const mortsMales = morts.filter(a => a.sexe === 'M');
        const mortsFemelles = morts.filter(a => a.sexe === 'F');

        const longevitesMales = mortsMales.map(a => a.age).filter(age => age !== null) as number[];
        const longevitesFemelles = mortsFemelles.map(a => a.age).filter(age => age !== null) as number[];

        const longeviteMoyenneMales = longevitesMales.length > 0
            ? longevitesMales.reduce((sum, age) => sum + age, 0) / longevitesMales.length
            : null;

        const longeviteMoyenneFemelles = longevitesFemelles.length > 0
            ? longevitesFemelles.reduce((sum, age) => sum + age, 0) / longevitesFemelles.length
            : null;

        // Espérance de vie = âge moyen des animaux décédés uniquement
        const esperanceVieMixte = longeviteMoyenne; // Réutiliser le calcul déjà correct

        // Espérance de vie par sexe = âge moyen des décédés par sexe
        const esperanceVieMales = longeviteMoyenneMales; // Réutiliser le calcul déjà correct
        const esperanceVieFemelles = longeviteMoyenneFemelles; // Réutiliser le calcul déjà correct

        // Âge moyen par sexe (vivants uniquement)
        const vivantsMales = vivants.filter(a => a.sexe === 'M');
        const vivantsFemelles = vivants.filter(a => a.sexe === 'F');

        const agesVivantsMales = vivantsMales.map(a => a.age).filter(age => age !== null) as number[];
        const agesVivantsFemelles = vivantsFemelles.map(a => a.age).filter(age => age !== null) as number[];

        const ageMoyenVivantsMales = agesVivantsMales.length > 0
            ? agesVivantsMales.reduce((sum, age) => sum + age, 0) / agesVivantsMales.length
            : null;

        const ageMoyenVivantsFemelles = agesVivantsFemelles.length > 0
            ? agesVivantsFemelles.reduce((sum, age) => sum + age, 0) / agesVivantsFemelles.length
            : null;

        // Données pour la pyramide des âges
        const pyramideData = {
            males: {} as Record<string, number>,
            femelles: {} as Record<string, number>
        };



        animauxAvecAge.forEach(animal => {
            const ageGroup = getAgeGroup(animal.age);
            // Ne traiter que les animaux avec un sexe défini et un âge connu
            if ((animal.sexe === 'M' || animal.sexe === 'F') && ageGroup !== 'Inconnu') {
                const sexe = animal.sexe === 'M' ? 'males' : 'femelles';
                pyramideData[sexe][ageGroup] = (pyramideData[sexe][ageGroup] || 0) + 1;
            }
        });

        return {
            total: animauxAvecAge.length,
            vivants: vivants.length,
            morts: morts.length,
            ageMoyenVivants: ageMoyenVivants ? Math.round(ageMoyenVivants * 10) / 10 : null,
            ageMoyenVivantsMales: ageMoyenVivantsMales ? Math.round(ageMoyenVivantsMales * 10) / 10 : null,
            ageMoyenVivantsFemelles: ageMoyenVivantsFemelles ? Math.round(ageMoyenVivantsFemelles * 10) / 10 : null,
            longeviteMoyenne: longeviteMoyenne ? Math.round(longeviteMoyenne * 10) / 10 : null,
            longeviteMoyenneMales: longeviteMoyenneMales ? Math.round(longeviteMoyenneMales * 10) / 10 : null,
            longeviteMoyenneFemelles: longeviteMoyenneFemelles ? Math.round(longeviteMoyenneFemelles * 10) / 10 : null,
            esperanceVieMixte: esperanceVieMixte ? Math.round(esperanceVieMixte * 10) / 10 : null,
            esperanceVieMales: esperanceVieMales ? Math.round(esperanceVieMales * 10) / 10 : null,
            esperanceVieFemelles: esperanceVieFemelles ? Math.round(esperanceVieFemelles * 10) / 10 : null,
            pyramideData,
            animauxAvecAge
        };
    };

    const filteredAnimaux = sortAnimaux(animaux.filter(animal => {
        if (filter.statut && animal.statut !== filter.statut) return false;
        if (filter.sexe && animal.sexe !== filter.sexe) return false;
        if (filter.race && !animal.race_nom.toLowerCase().includes(filter.race.toLowerCase())) return false;
        return true;
    }));


    if (loading && !elevage) {
        return <div id="elevagedetail-loading-1" className="loading">Chargement...</div>;
    }

    return (
        <div id="elevage-detail-container" className="elevage-detail p-4 sm:p-8">
            {/* En-tête */}
            <div id="elevage-detail-header" className="detail-header mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                    <button id="elevage-detail-back-btn" onClick={onBack} className="back-btn order-2 sm:order-1">
                        ← Retour aux élevages
                    </button>
                    <h1 id="elevage-detail-title" className="text-lg sm:text-2xl font-bold text-white order-1 sm:order-2">{elevage?.nom}</h1>
                </div>
            </div>

            {/* Informations de l'élevage */}
            <div id="elevage-info-card" className="elevage-info-card p-4 sm:p-6 mb-4 sm:mb-6">
                <div id="elevage-info-grid" className="info-grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="text-sm sm:text-base"><strong>Propriétaire:</strong> {elevage?.proprietaire_nom}</div>
                    <div className="text-sm sm:text-base"><strong>Adresse:</strong> {elevage?.adresse}</div>
                    {elevage?.description && (
                        <div className="col-span-1 sm:col-span-2 text-sm sm:text-base"><strong>Description:</strong> {elevage.description}</div>
                    )}
                    <div className="races-section col-span-1 sm:col-span-2">
                        <div className="races-header">
                            <strong className="text-sm sm:text-base">Races d'animaux 🦕</strong>
                            <span className="races-count text-xs">
                                {elevage?.races?.length || 0} race{(elevage?.races?.length || 0) > 1 ? 's' : ''}
                            </span>
                        </div>
                        {elevage?.races && elevage.races.length > 0 ? (
                            <div className="races-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
                <div id="elevage-animals-header" className="animals-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <h2 id="elevage-animals-title" className="text-lg sm:text-xl font-semibold text-white">
                        Animaux de l'élevage ({filteredAnimaux.length})
                    </h2>
                    <div id="elevage-animals-nav" className="animals-nav w-full sm:w-auto">
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <button
                                id="elevage-list-view-btn"
                                onClick={() => setCurrentView('list')}
                                className={`${currentView === 'list' ? 'btn-primary' : 'btn-secondary'} text-sm px-3 py-2 w-full sm:w-auto`}
                            >
                                📋 Liste
                            </button>
                            <button
                                id="elevage-statistics-view-btn"
                                onClick={() => setCurrentView('statistics')}
                                className={`${currentView === 'statistics' ? 'btn-primary' : 'btn-secondary'} text-sm px-3 py-2 w-full sm:w-auto`}
                            >
                                📊 Statistiques
                            </button>
                            {canEditElevage() && (
                                <>
                                    <button
                                        id="elevage-add-animal-btn"
                                        onClick={handleCreateAnimal}
                                        className={`${currentView === 'form' && !editingAnimal ? 'btn-primary' : 'btn-secondary'} text-sm px-3 py-2 w-full sm:w-auto`}
                                    >
                                        🦕 Nouvel animal
                                    </button>
                                    <button
                                        id="elevage-manage-users-btn"
                                        onClick={() => setCurrentView('users')}
                                        className={`${currentView === 'users' ? 'btn-primary' : 'btn-secondary'} text-sm px-3 py-2 w-full sm:w-auto`}
                                    >
                                        👥 Utilisateurs
                                    </button>
                                </>
                            )}
                        </div>
                        {isReader() && !canEditElevage() && (
                            <div id="elevagedetail-read-only-notice-4" className="read-only-notice mt-2 text-center text-xs">
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
                        <div id="elevage-filters" className="filters flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6 p-3 sm:p-4">
                            <div id="elevage-filter-statut" className="filter-group flex-1">
                                <label className="form-label text-xs">Statut:</label>
                                <select
                                    value={filter.statut}
                                    onChange={(e) => setFilter({...filter, statut: e.target.value})}
                                    className="form-select text-sm"
                                >
                                    <option value="">Tous</option>
                                    <option value="vivant">Vivant</option>
                                    <option value="mort">Décédé</option>
                                </select>
                            </div>

                            <div id="elevage-filter-sexe" className="filter-group flex-1">
                                <label className="form-label text-xs">Sexe:</label>
                                <select
                                    value={filter.sexe}
                                    onChange={(e) => setFilter({...filter, sexe: e.target.value})}
                                    className="form-select text-sm"
                                >
                                    <option value="">Tous</option>
                                    <option value="M">Mâle</option>
                                    <option value="F">Femelle</option>
                                </select>
                            </div>

                            <div id="elevage-filter-race" className="filter-group flex-1">
                                <label className="form-label text-xs">Race:</label>
                                <input
                                    type="text"
                                    placeholder="Filtrer par race"
                                    value={filter.race}
                                    onChange={(e) => setFilter({...filter, race: e.target.value})}
                                    className="form-input text-sm"
                                />
                            </div>
                        </div>

                        {/* Liste des animaux */}
                        {filteredAnimaux.length === 0 ? (
                            <div id="elevagedetail-no-animals-5" className="no-animals text-center py-8">
                                <p className="text-gray-400 mb-4">Aucun animal dans cet élevage.</p>
                                {canEditElevage() && (
                                    <button onClick={handleCreateAnimal} className="btn-primary">
                                        Ajouter le premier animal
                                    </button>
                                )}
                                {isReader() && !canEditElevage() && (
                                    <p className="read-only-text text-gray-500 italic">Mode consultation uniquement</p>
                                )}
                            </div>
                        ) : (
                            <div id="elevage-animals-table-container" className="table-responsive">
                                <table id="elevage-animals-table" className="table-mobile w-full border-collapse bg-gray-700 rounded-lg shadow-card">
                                    <thead className="hidden sm:table-header-group">
                                        <tr>
                                            {renderSortableHeader('Identifiant', 'identifiant_officiel')}
                                            {renderSortableHeader('Nom', 'nom')}
                                            {renderSortableHeader('Sexe', 'sexe')}
                                            {renderSortableHeader('Race', 'race_nom')}
                                            {renderSortableHeader('Parents', 'parents')}
                                            {renderSortableHeader('Naissance', 'date_naissance')}
                                            {renderSortableHeader('Âge', 'age')}
                                            {renderSortableHeader('Statut', 'statut')}
                                            <th style={{ cursor: 'default' }} className="bg-gray-700 px-3 py-2.5 text-left text-gray-300 font-bold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="block sm:table-row-group">
                                        {filteredAnimaux.map(animal => (
                                            <tr key={animal.id} className={`block sm:table-row border-b border-gray-600 mb-4 sm:mb-0 bg-gray-800 sm:bg-transparent rounded-lg sm:rounded-none p-4 sm:p-0 text-white ${animal.statut === 'mort' ? 'opacity-75' : ''}`}>
                                                <td data-label="Identifiant" className="block sm:table-cell text-left sm:text-center px-0 sm:px-3 py-1 sm:py-2.5 border-0 sm:border-gray-600 font-mono font-bold">{animal.identifiant_officiel}</td>
                                                <td data-label="Nom" className="block sm:table-cell text-left sm:text-center px-0 sm:px-3 py-1 sm:py-2.5 border-0 sm:border-gray-600">{animal.nom || '-'}</td>
                                                <td data-label="Sexe" className="block sm:table-cell text-left sm:text-center px-0 sm:px-3 py-1 sm:py-2.5 border-0 sm:border-gray-600">
                                                    <span className="sexe-badge text-lg">
                                                        {animal.sexe === 'M' ? '♂️' : '♀️'}
                                                    </span>
                                                </td>
                                                <td data-label="Race" className="block sm:table-cell text-left sm:text-center px-0 sm:px-3 py-1 sm:py-2.5 border-0 sm:border-gray-600">{animal.race_nom}</td>
                                                <td data-label="Parents" className="block sm:table-cell text-left sm:text-center px-0 sm:px-3 py-1 sm:py-2.5 border-0 sm:border-gray-600 text-xs leading-relaxed">
                                                    {animal.pere_identifiant && (
                                                        <div className="whitespace-nowrap">♂️ {animal.pere_identifiant}</div>
                                                    )}
                                                    {animal.mere_identifiant && (
                                                        <div className="whitespace-nowrap">♀️ {animal.mere_identifiant}</div>
                                                    )}
                                                    {!animal.pere_identifiant && !animal.mere_identifiant && '-'}
                                                </td>
                                                <td data-label="Naissance" className="block sm:table-cell text-left sm:text-center px-0 sm:px-3 py-1 sm:py-2.5 border-0 sm:border-gray-600">{formatDate(animal.date_naissance)}</td>
                                                <td data-label="Âge" className="block sm:table-cell text-left sm:text-center px-0 sm:px-3 py-1 sm:py-2.5 border-0 sm:border-gray-600" title={getAgeTooltip(animal)}>
                                                    {formatAgeDisplay(animal)}
                                                </td>
                                                <td data-label="Statut" className="block sm:table-cell text-left sm:text-center px-0 sm:px-3 py-1 sm:py-2.5 border-0 sm:border-gray-600">
                                                    <span className={`status-badge px-2 py-1 rounded-full text-xs font-bold ${animal.statut === 'vivant' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`} title={animal.statut === 'vivant' ? 'Vivant' : `Décédé ${formatDate(animal.date_deces)}`}>
                                                        {animal.statut === 'vivant' ? '✅' : '💀'}
                                                    </span>
                                                </td>
                                                <td className="block sm:table-cell text-left px-0 sm:px-3 py-1 sm:py-2.5 border-0 sm:border-gray-600 no-label">
                                                    <div className="flex flex-wrap gap-1 sm:gap-0.5">
                                                        <button
                                                            onClick={() => handleViewDescendants(animal.id)}
                                                            className="bg-transparent border border-gray-500 cursor-pointer p-1.5 sm:p-1 mx-0.5 text-base rounded hover:bg-gray-600 transition-colors duration-150 text-white"
                                                            title="Voir descendants"
                                                        >
                                                            🌳
                                                        </button>

                                                        {canEditElevage() && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleEditAnimal(animal)}
                                                                    className="bg-transparent border border-gray-500 cursor-pointer p-1.5 sm:p-1 mx-0.5 text-base rounded hover:bg-gray-600 transition-colors duration-150 text-white"
                                                                    title="Modifier"
                                                                >
                                                                    ✏️
                                                                </button>

                                                                {animal.statut === 'vivant' && (
                                                                    <button
                                                                        onClick={() => handleMarkDead(animal.id, animal.identifiant_officiel)}
                                                                        className="bg-transparent border border-gray-500 cursor-pointer p-1.5 sm:p-1 mx-0.5 text-base rounded hover:bg-yellow-600 transition-colors duration-150 text-white"
                                                                        title="Marquer comme décédé"
                                                                    >
                                                                        💀
                                                                    </button>
                                                                )}

                                                                <button
                                                                    onClick={() => handleDeleteAnimal(animal.id, animal.identifiant_officiel)}
                                                                    className="bg-transparent border border-gray-500 cursor-pointer p-1.5 sm:p-1 mx-0.5 text-base rounded hover:bg-red-600 transition-colors duration-150 text-white"
                                                                    title="Supprimer"
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
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
                        <div id="elevage-descendants-header" className="descendants-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                            <h3 id="elevage-descendants-title" className="text-lg sm:text-xl font-semibold text-white">
                                Descendants de {selectedAnimalForDescendants}
                            </h3>
                            <button id="elevage-descendants-back-btn" onClick={() => setCurrentView('list')} className="back-btn">
                                ← Retour à la liste
                            </button>
                        </div>

                        {descendants.length === 0 ? (
                            <div id="elevagedetail-no-descendants-6" className="no-descendants text-center py-8 text-gray-400">
                                Cet animal n'a pas de descendants connus.
                            </div>
                        ) : (
                            <div id="elevagedetail-descendants-table-container-7" className="table-responsive">
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

                {currentView === 'statistics' && (
                    <div id="elevage-statistics-view" className="statistics-view">
                        <div id="elevage-statistics-header" className="statistics-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                            <h3 id="elevage-statistics-title" className="text-lg sm:text-xl font-semibold text-white">📊 Statistiques du troupeau</h3>
                            <button id="elevage-statistics-back-btn" onClick={() => setCurrentView('list')} className="back-btn">
                                ← Retour à la liste
                            </button>
                        </div>

                        {(() => {
                            const stats = calculateStatistics();
                            const ageGroups = ['0-1 an', '1-2 ans', '2-5 ans', '5-8 ans', '8-10 ans', '10+ ans'];

                            return (
                                <div className="statistics-content space-y-6">
                                    {/* Résumé général */}
                                    <div className="stats-summary">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="bg-gray-700 rounded-lg p-4 text-center">
                                                <div className="text-2xl sm:text-3xl font-bold text-blue-400 mb-2">{stats.total}</div>
                                                <div className="text-sm text-gray-300">Total animaux</div>
                                            </div>
                                            <div className="bg-gray-700 rounded-lg p-4 text-center">
                                                <div className="text-2xl sm:text-3xl font-bold text-green-400 mb-2">{stats.vivants}</div>
                                                <div className="text-sm text-gray-300">Vivants</div>
                                            </div>
                                            <div className="bg-gray-700 rounded-lg p-4 text-center">
                                                <div className="text-2xl sm:text-3xl font-bold text-red-400 mb-2">{stats.morts}</div>
                                                <div className="text-sm text-gray-300">Décédés</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Âge moyen et longévité */}
                                    <div className="longevity-stats bg-gray-700 rounded-lg p-4 sm:p-6">
                                        <h4 className="text-base sm:text-lg font-semibold text-white mb-4">📈 Longévité et âges</h4>
                                        <div className="space-y-4">
                                            {/* Âge moyen des vivants */}
                                            <h5 className="text-sm font-semibold text-gray-300 mb-2">📊 Âge moyen des animaux vivants</h5>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <div className="bg-gray-600 rounded-lg p-3 text-center">
                                                    <div className="text-lg sm:text-xl font-bold text-blue-300 mb-1">
                                                        {stats.ageMoyenVivants !== null ? `${stats.ageMoyenVivants} ans` : 'N/A'}
                                                    </div>
                                                    <div className="text-xs sm:text-sm text-gray-400">Âge moyen mixte</div>
                                                </div>
                                                <div className="bg-gray-600 rounded-lg p-3 text-center">
                                                    <div className="text-lg sm:text-xl font-bold text-blue-400 mb-1">
                                                        {stats.ageMoyenVivantsMales !== null ? `${stats.ageMoyenVivantsMales} ans` : 'N/A'}
                                                    </div>
                                                    <div className="text-xs sm:text-sm text-gray-400">♂️ Mâles vivants</div>
                                                </div>
                                                <div className="bg-gray-600 rounded-lg p-3 text-center">
                                                    <div className="text-lg sm:text-xl font-bold text-pink-400 mb-1">
                                                        {stats.ageMoyenVivantsFemelles !== null ? `${stats.ageMoyenVivantsFemelles} ans` : 'N/A'}
                                                    </div>
                                                    <div className="text-xs sm:text-sm text-gray-400">♀️ Femelles vivantes</div>
                                                </div>
                                            </div>

                                            {/* Longévité moyenne (décédés) */}
                                            <h5 className="text-sm font-semibold text-gray-300 mb-2 mt-6">⚰️ Longévité moyenne des animaux décédés</h5>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <div className="bg-gray-600 rounded-lg p-3 text-center">
                                                    <div className="text-lg sm:text-xl font-bold text-orange-300 mb-1">
                                                        {stats.longeviteMoyenne !== null ? `${stats.longeviteMoyenne} ans` : 'N/A'}
                                                    </div>
                                                    <div className="text-xs sm:text-sm text-gray-400">Longévité mixte</div>
                                                </div>
                                                <div className="bg-gray-600 rounded-lg p-3 text-center">
                                                    <div className="text-lg sm:text-xl font-bold text-blue-400 mb-1">
                                                        {stats.longeviteMoyenneMales !== null ? `${stats.longeviteMoyenneMales} ans` : 'N/A'}
                                                    </div>
                                                    <div className="text-xs sm:text-sm text-gray-400">♂️ Mâles décédés</div>
                                                </div>
                                                <div className="bg-gray-600 rounded-lg p-3 text-center">
                                                    <div className="text-lg sm:text-xl font-bold text-pink-400 mb-1">
                                                        {stats.longeviteMoyenneFemelles !== null ? `${stats.longeviteMoyenneFemelles} ans` : 'N/A'}
                                                    </div>
                                                    <div className="text-xs sm:text-sm text-gray-400">♀️ Femelles décédées</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Espérance de vie (identique à la longévité) */}
                                    <div className="life-expectancy-stats bg-gray-700 rounded-lg p-4 sm:p-6">
                                        <h4 className="text-base sm:text-lg font-semibold text-white mb-4">🎯 Espérance de vie</h4>
                                        <p className="text-xs text-gray-400 mb-4">
                                            💡 L'espérance de vie est calculée sur les animaux décédés uniquement (= longévité moyenne)
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="bg-gray-600 rounded-lg p-3 text-center">
                                                <div className="text-lg sm:text-xl font-bold text-purple-300 mb-1">
                                                    {stats.esperanceVieMixte !== null ? `${stats.esperanceVieMixte} ans` : 'N/A'}
                                                </div>
                                                <div className="text-xs sm:text-sm text-gray-400">Espérance de vie mixte</div>
                                            </div>
                                            <div className="bg-gray-600 rounded-lg p-3 text-center">
                                                <div className="text-lg sm:text-xl font-bold text-blue-400 mb-1">
                                                    {stats.esperanceVieMales !== null ? `${stats.esperanceVieMales} ans` : 'N/A'}
                                                </div>
                                                <div className="text-xs sm:text-sm text-gray-400">♂️ Mâles</div>
                                            </div>
                                            <div className="bg-gray-600 rounded-lg p-3 text-center">
                                                <div className="text-lg sm:text-xl font-bold text-pink-400 mb-1">
                                                    {stats.esperanceVieFemelles !== null ? `${stats.esperanceVieFemelles} ans` : 'N/A'}
                                                </div>
                                                <div className="text-xs sm:text-sm text-gray-400">♀️ Femelles</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pyramide des âges */}
                                    <div className="age-pyramid bg-gray-700 rounded-lg p-4 sm:p-6">
                                        <h4 className="text-base sm:text-lg font-semibold text-white mb-4">🔺 Pyramide des âges</h4>
                                        <div className="space-y-3">
                                            {ageGroups.map(ageGroup => {
                                                const malesCount = stats.pyramideData.males[ageGroup] || 0;
                                                const femellesCount = stats.pyramideData.femelles[ageGroup] || 0;
                                                const totalInGroup = malesCount + femellesCount;
                                                const maxCount = Math.max(...ageGroups.map(ag =>
                                                    (stats.pyramideData.males[ag] || 0) + (stats.pyramideData.femelles[ag] || 0)
                                                ));

                                                return (
                                                    <div key={ageGroup} className="flex items-center gap-2 sm:gap-4">
                                                        <div className="w-16 sm:w-20 text-xs sm:text-sm text-gray-300 text-right">{ageGroup}</div>
                                                        <div className="flex-1 flex items-center h-8 sm:h-10">
                                                            {/* Barres mâles (à gauche) */}
                                                            <div className="flex-1 flex justify-end pr-1">
                                                                <div
                                                                    className="bg-blue-500 h-full rounded-l flex items-center justify-center text-xs text-white font-medium"
                                                                    style={{
                                                                        width: maxCount > 0 ? `${Math.max((malesCount / maxCount) * 100, malesCount > 0 ? 15 : 0)}%` : '0%'
                                                                    }}
                                                                    title={`♂️ ${malesCount} mâles`}
                                                                >
                                                                    {malesCount > 0 && <span>♂️{malesCount}</span>}
                                                                </div>
                                                            </div>
                                                            {/* Séparateur central */}
                                                            <div className="w-px bg-gray-500"></div>
                                                            {/* Barres femelles (à droite) */}
                                                            <div className="flex-1 flex justify-start pl-1">
                                                                <div
                                                                    className="bg-pink-500 h-full rounded-r flex items-center justify-center text-xs text-white font-medium"
                                                                    style={{
                                                                        width: maxCount > 0 ? `${Math.max((femellesCount / maxCount) * 100, femellesCount > 0 ? 15 : 0)}%` : '0%'
                                                                    }}
                                                                    title={`♀️ ${femellesCount} femelles`}
                                                                >
                                                                    {femellesCount > 0 && <span>♀️{femellesCount}</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="w-8 sm:w-12 text-xs sm:text-sm text-gray-300 text-center font-medium">{totalInGroup}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Légende */}
                                        <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-gray-600">
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                                                <span className="text-xs sm:text-sm text-gray-300">♂️ Mâles</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 bg-pink-500 rounded"></div>
                                                <span className="text-xs sm:text-sm text-gray-300">♀️ Femelles</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
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