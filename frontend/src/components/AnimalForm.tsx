import React, { useState, useEffect, useCallback } from 'react';
import TransferRequestDialog from './TransferRequestDialog';
import PhotoUpload from './PhotoUpload';
import { API_BASE_URL } from '../config/api';

interface Race {
    id: number;
    nom: string;
    type_animal_nom: string;
}

interface Elevage {
    id: number;
    nom: string;
}

interface Animal {
    id?: number;
    identifiant_officiel: string;
    nom?: string;
    sexe: 'M' | 'F';
    pere_id?: number;
    mere_id?: number;
    race_id: number;
    date_naissance?: string;
    date_bouclage?: string;
    date_deces?: string;
    elevage_id?: number;
    notes?: string;
}

interface AnimalFormProps {
    animal?: Animal;
    onSubmit: (animal: Animal) => void;
    onCancel: () => void;
    elevageContext?: {
        id: number;
        nom: string;
        races: Race[];
    };
}

const AnimalForm: React.FC<AnimalFormProps> = ({ animal, onSubmit, onCancel, elevageContext }) => {
    const [formData, setFormData] = useState<Animal>({
        identifiant_officiel: '',
        sexe: 'M',
        race_id: 0,
        ...animal,
        // Si on a un contexte d'élevage et qu'on crée un nouvel animal, forcer l'elevage_id
        ...(elevageContext && !animal?.id ? { elevage_id: elevageContext.id } : {})
    });

    const [races, setRaces] = useState<Race[]>([]);
    const [elevages, setElevages] = useState<Elevage[]>([]);
    const [racesLoaded, setRacesLoaded] = useState(false);
    const [elevagesLoaded, setElevagesLoaded] = useState(false);
    const [parentsMales, setParentsMales] = useState<Animal[]>([]);
    const [parentsFemelles, setParentsFemelles] = useState<Animal[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [animalExistsWarning, setAnimalExistsWarning] = useState<string>('');
    const [checkingAnimal, setCheckingAnimal] = useState(false);
    const [existingAnimal, setExistingAnimal] = useState<any>(null);
    const [showTransferDialog, setShowTransferDialog] = useState(false);
    const [existingPhotos, setExistingPhotos] = useState<any[]>([]);
    const [newPhotos, setNewPhotos] = useState<any[]>([]);

    const loadRaces = useCallback(async () => {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}api/races`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setRaces(data);
            } else {
                console.error('Erreur lors du chargement des races:', response.status, await response.text());
            }
        } catch (error) {
            console.error('Erreur lors du chargement des races:', error);
        } finally {
            setRacesLoaded(true);
        }
    }, []);

    const loadElevages = useCallback(async () => {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) return;

            // Admin : tous les élevages, Modérateur/Lecteur : seulement les siens
            const userData = JSON.parse(atob(token.split('.')[1]));
            const isAdmin = userData.user?.role === 1;

            const url = isAdmin
                ? `${API_BASE_URL}api/elevages`
                : `${API_BASE_URL}api/elevages?my=true`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setElevages(data);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des élevages:', error);
        } finally {
            setElevagesLoaded(true);
        }
    }, []);

    const loadExistingPhotos = useCallback(async () => {
        if (!animal?.id) return;

        try {
            const token = sessionStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}api/animaux/${animal.id}/photos`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const photos = await response.json();
                setExistingPhotos(photos);
            } else {
                console.error('Erreur lors du chargement des photos:', response.status);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des photos:', error);
        }
    }, [animal?.id]);

    const loadPotentialParents = useCallback(async () => {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) return;

            // Si aucune race sélectionnée, vider les listes de parents
            if (!formData.race_id) {
                setParentsMales([]);
                setParentsFemelles([]);
                return;
            }

            // Trouver le type d'animal de la race sélectionnée
            const selectedRace = races.find(r => r.id === Number(formData.race_id));
            if (!selectedRace) {
                setParentsMales([]);
                setParentsFemelles([]);
                return;
            }

            // Charger tous les animaux accessibles pour la généalogie
            const response = await fetch(`${API_BASE_URL}api/animaux`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();

                // Filtrer les animaux vivants, exclure l'animal actuel, et filtrer par type d'animal
                const animauxVivants = data.filter((a: Animal) => {
                    // Exclure les animaux morts et l'animal actuel
                    if (a.date_deces || a.id === animal?.id) return false;

                    // Trouver la race de cet animal pour vérifier le type
                    const animalRace = races.find(r => r.id === a.race_id);
                    if (!animalRace) return false;

                    // Ne garder que les animaux du même type (espèce)
                    return animalRace.type_animal_nom === selectedRace.type_animal_nom;
                });

                const malesFiltered = animauxVivants.filter((a: Animal) => a.sexe === 'M');
                const femellesFiltered = animauxVivants.filter((a: Animal) => a.sexe === 'F');

                console.log(`Parents potentiels trouvés: ${malesFiltered.length} mâles, ${femellesFiltered.length} femelles (même espèce: ${selectedRace.type_animal_nom})`);

                setParentsMales(malesFiltered);
                setParentsFemelles(femellesFiltered);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des animaux:', error);
        }
    }, [animal?.id, formData.race_id, races]);

    // Charger les données une seule fois au montage du composant
    useEffect(() => {
        if (!racesLoaded) {
            loadRaces();
        }
    }, [racesLoaded]);

    useEffect(() => {
        if (!elevagesLoaded) {
            loadElevages();
        }
    }, [elevagesLoaded]);

    // Recharger les parents potentiels quand la race change
    useEffect(() => {
        if (races.length > 0 && formData.race_id) {
            loadPotentialParents();
        }
    }, [formData.race_id, races.length]);

    // Charger les photos existantes si on édite un animal
    useEffect(() => {
        loadExistingPhotos();
    }, [loadExistingPhotos]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value === '' ? (name.includes('_id') ? undefined : '') : value
        }));

        // Vérifier l'existence de l'animal si l'identifiant change
        if (name === 'identifiant_officiel' && value.trim() && !animal?.id) {
            checkAnimalExists(value.trim());
        }
    };

    const checkAnimalExists = useCallback(async (identifiant: string) => {
        if (!identifiant || checkingAnimal) return;

        setCheckingAnimal(true);
        setAnimalExistsWarning('');

        try {
            const token = sessionStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}api/animaux?check=1&identifiant=${encodeURIComponent(identifiant)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.exists && data.animal.elevage_id) {
                    setExistingAnimal(data.animal);
                    setAnimalExistsWarning(
                        `⚠️ Cet animal existe déjà dans l'élevage "${data.animal.elevage_nom}". ` +
                        (data.animal.can_transfer
                            ? 'Vous pouvez demander un transfert.'
                            : 'Contactez un administrateur pour un transfert.')
                    );
                } else {
                    setExistingAnimal(null);
                }
            }
        } catch (error) {
            console.error('Erreur lors de la vérification de l\'animal:', error);
        } finally {
            setCheckingAnimal(false);
        }
    }, [animal?.identifiant_officiel]);

    const handleTransferRequest = async (toElevageId: number, message: string) => {
        try {
            const token = sessionStorage.getItem('token');
            if (!token || !existingAnimal) return;

            const response = await fetch(`${API_BASE_URL}api/transfer-requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    animal_id: existingAnimal.id,
                    to_elevage_id: toElevageId,
                    message
                })
            });

            if (response.ok) {
                setShowTransferDialog(false);
                setAnimalExistsWarning('✅ Demande de transfert envoyée avec succès !');
                // Optionally clear the form or notify parent
                setTimeout(() => {
                    setAnimalExistsWarning('');
                    setExistingAnimal(null);
                }, 3000);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la création de la demande');
            }
        } catch (error) {
            console.error('Erreur:', error);
            throw error;
        }
    };

    const handlePhotosChange = (photos: any[]) => {
        setNewPhotos(photos);
    };

    const uploadPhotos = async (animalId: number) => {
        if (newPhotos.length === 0) return;

        const formData = new FormData();
        newPhotos.forEach((photo, index) => {
            formData.append(`photos[${index}]`, photo.file);
        });

        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}api/animaux/${animalId}/photos`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de l\'upload des photos');
            }

            const result = await response.json();
            console.log('Photos uploadées:', result);
        } catch (error) {
            console.error('Erreur lors de l\'upload des photos:', error);
            throw error;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Validation
            if (!formData.identifiant_officiel.trim()) {
                throw new Error('L\'identifiant officiel est requis');
            }

            if (!formData.race_id) {
                throw new Error('La race est requise');
            }

            // Si un animal vivant doit avoir un élevage
            if (!formData.date_deces && !formData.elevage_id) {
                if (!elevageContext && elevages.length === 0) {
                    throw new Error('Aucun élevage disponible. Vous devez d\'abord créer un élevage ou avoir les permissions pour en gérer un.');
                }
                throw new Error('Un animal vivant doit être associé à un élevage');
            }

            // Sauvegarder les photos pour après la soumission
            const photosToUpload = [...newPhotos];

            // Appeler la fonction de soumission du parent
            onSubmit(formData);

            // Si on édite un animal existant et qu'il y a des nouvelles photos à uploader
            if (animal?.id && photosToUpload.length > 0) {
                try {
                    const formData = new FormData();
                    photosToUpload.forEach((photo, index) => {
                        formData.append(`photos[${index}]`, photo.file);
                    });

                    const token = sessionStorage.getItem('token');
                    const uploadResponse = await fetch(`${API_BASE_URL}api/animaux/${animal.id}/photos`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        body: formData
                    });

                    if (uploadResponse.ok) {
                        // Vider les nouvelles photos après upload réussi
                        setNewPhotos([]);

                        // Recharger les photos existantes
                        await loadExistingPhotos();

                        console.log('Photos uploadées avec succès');
                    } else {
                        const errorData = await uploadResponse.json();
                        throw new Error(errorData.message || 'Erreur lors de l\'upload');
                    }
                } catch (photoError: any) {
                    console.error('Erreur lors de l\'upload des photos:', photoError);
                    setError('Animal sauvegardé, mais erreur lors de l\'upload des photos: ' + photoError.message);
                }
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl p-4 sm:p-6 text-gray-900 max-w-4xl mx-auto border border-gray-200">
            <h3 className="section-title mb-4 sm:mb-6 text-lg sm:text-2xl">{animal ? '🦕 Modifier l\'animal' : '🦕 Nouvel animal'}</h3>

            {error && <div className="bg-red-600 text-white px-3 py-2.5 rounded-md mb-4 sm:mb-5 text-sm">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mb-4 sm:mb-5">
                    <div className="flex flex-col gap-1.5 sm:gap-2">
                        <label htmlFor="identifiant_officiel" className="text-gray-900 font-medium text-xs sm:text-sm">
                            Identifiant officiel *
                            <span className="block text-xs text-gray-600 font-normal mt-0.5 sm:mt-1 leading-relaxed">Numéro unique d'identification de l'animal (ex: numéro de boucle)</span>
                        </label>
                        <input
                            type="text"
                            id="identifiant_officiel"
                            name="identifiant_officiel"
                            value={formData.identifiant_officiel}
                            onChange={handleChange}
                            required
                            placeholder="Ex: FR123456789 ou 001234"
                            className="w-full px-3 py-2 sm:py-2.5 border border-gray-200 rounded-md bg-white text-gray-900 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-500"
                        />
                        {checkingAnimal && (
                            <div className="mt-1.5 sm:mt-2 px-2 sm:px-3 py-1.5 sm:py-2 border border-primary-300 bg-primary-50 text-primary-700 rounded-md text-xs sm:text-sm">
                                🔍 Vérification en cours...
                            </div>
                        )}
                        {animalExistsWarning && (
                            <div className="text-yellow-700 bg-yellow-100 border border-yellow-300 px-2 sm:px-3 py-2 sm:py-2.5 rounded-md mt-1.5 sm:mt-2 text-xs sm:text-sm">
                                {animalExistsWarning}
                                {existingAnimal && existingAnimal.can_transfer && (
                                    <button
                                        type="button"
                                        onClick={() => setShowTransferDialog(true)}
                                        className="inline-block mt-2 sm:mt-2.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-600 text-white border-0 rounded-md cursor-pointer text-xs hover:bg-blue-700 transition-colors duration-200 w-full sm:w-auto"
                                    >
                                        🔄 Demander un transfert
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-1.5 sm:gap-2">
                        <label htmlFor="nom" className="text-gray-900 font-medium text-xs sm:text-sm">
                            Nom de l'animal 🦕
                            <span className="block text-xs text-gray-600 font-normal mt-0.5 sm:mt-1 leading-relaxed">Nom donné à l'animal 🦕 (facultatif)</span>
                        </label>
                        <input
                            type="text"
                            id="nom"
                            name="nom"
                            value={formData.nom || ''}
                            onChange={handleChange}
                            placeholder="Ex: Bella, Rex, Mouton123..."
                            className="w-full px-3 py-2 sm:py-2.5 border border-gray-200 rounded-md bg-white text-gray-900 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-500"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mb-4 sm:mb-5">
                    <div className="flex flex-col gap-1.5 sm:gap-2">
                        <label htmlFor="sexe" className="text-gray-900 font-medium text-xs sm:text-sm">
                            Sexe de l'animal *
                            <span className="block text-xs text-gray-600 font-normal mt-0.5 sm:mt-1 leading-relaxed">Sexe biologique de l'animal</span>
                        </label>
                        <select
                            id="sexe"
                            name="sexe"
                            value={formData.sexe}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 sm:py-2.5 border border-gray-200 rounded-md bg-white text-gray-900 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="M">♂️ Mâle</option>
                            <option value="F">♀️ Femelle</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5 sm:gap-2">
                        <label htmlFor="race_id" className="text-gray-900 font-medium text-xs sm:text-sm">
                            Race *
                            <span className="block text-xs text-gray-600 font-normal mt-0.5 sm:mt-1 leading-relaxed">Race et type d'animal (mouton, chèvre, etc.)</span>
                        </label>
                        <select
                            id="race_id"
                            name="race_id"
                            value={formData.race_id}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 sm:py-2.5 border border-gray-200 rounded-md bg-white text-gray-900 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="">-- Choisir une race --</option>
                            {(elevageContext?.races || races).map(race => (
                                <option key={race.id} value={race.id}>
                                    {race.nom} ({race.type_animal_nom})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mb-4 sm:mb-5">
                    <div className="flex flex-col gap-1.5 sm:gap-2">
                        <label htmlFor="pere_id" className="text-gray-900 font-medium text-xs sm:text-sm">
                            Père géniteur
                            <span className="block text-xs text-gray-600 font-normal mt-0.5 sm:mt-1 leading-relaxed">Animal mâle ayant engendré cet animal (généalogie)</span>
                        </label>
                        <select
                            id="pere_id"
                            name="pere_id"
                            value={formData.pere_id || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 sm:py-2.5 border border-gray-200 rounded-md bg-white text-gray-900 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="">-- Père non renseigné --</option>
                            {parentsMales.map(parent => (
                                <option key={parent.id} value={parent.id}>
                                    ♂️ {parent.identifiant_officiel} {parent.nom ? `(${parent.nom})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5 sm:gap-2">
                        <label htmlFor="mere_id" className="text-gray-900 font-medium text-xs sm:text-sm">
                            Mère génitrice
                            <span className="block text-xs text-gray-600 font-normal mt-0.5 sm:mt-1 leading-relaxed">Animal femelle ayant donné naissance à cet animal</span>
                        </label>
                        <select
                            id="mere_id"
                            name="mere_id"
                            value={formData.mere_id || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 sm:py-2.5 border border-gray-200 rounded-md bg-white text-gray-900 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="">-- Mère non renseignée --</option>
                            {parentsFemelles.map(parent => (
                                <option key={parent.id} value={parent.id}>
                                    ♀️ {parent.identifiant_officiel} {parent.nom ? `(${parent.nom})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mb-4 sm:mb-5">
                    <div className="flex flex-col gap-1.5 sm:gap-2">
                        <label htmlFor="date_naissance" className="text-gray-900 font-medium text-xs sm:text-sm">
                            Date de naissance
                            <span className="block text-xs text-gray-600 font-normal mt-0.5 sm:mt-1 leading-relaxed">Date de mise bas de l'animal</span>
                        </label>
                        <input
                            type="date"
                            id="date_naissance"
                            name="date_naissance"
                            value={formData.date_naissance || ''}
                            onChange={handleChange}
                            min="1980-01-01"
                            max={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 sm:py-2.5 border border-gray-200 rounded-md bg-white text-gray-900 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5 sm:gap-2">
                        <label htmlFor="date_bouclage" className="text-gray-900 font-medium text-xs sm:text-sm">
                            Date de bouclage
                            <span className="block text-xs text-gray-600 font-normal mt-0.5 sm:mt-1 leading-relaxed">Date de pose de la boucle d'identification officielle</span>
                        </label>
                        <input
                            type="date"
                            id="date_bouclage"
                            name="date_bouclage"
                            value={formData.date_bouclage || ''}
                            onChange={handleChange}
                            min="1980-01-01"
                            max={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 sm:py-2.5 border border-gray-200 rounded-md bg-white text-gray-900 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mb-4 sm:mb-5">
                    <div className="flex flex-col gap-1.5 sm:gap-2">
                        <label htmlFor="date_deces" className="text-gray-900 font-medium text-xs sm:text-sm">
                            Date de décès
                            <span className="block text-xs text-gray-600 font-normal mt-0.5 sm:mt-1 leading-relaxed">Date de mort de l'animal (retire automatiquement de l'élevage)</span>
                        </label>
                        <input
                            type="date"
                            id="date_deces"
                            name="date_deces"
                            value={formData.date_deces || ''}
                            onChange={handleChange}
                            min="1980-01-01"
                            max={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 sm:py-2.5 border border-gray-200 rounded-md bg-white text-gray-900 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                        <div className="text-xs text-yellow-800 mt-1.5 px-2 py-1.5 sm:py-2 bg-yellow-50 rounded-md border-l-4 border-yellow-400">
                            ⚠️ Renseigner cette date retire automatiquement l'animal de son élevage
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5 sm:gap-2">
                        <label htmlFor="elevage_id" className="text-gray-900 font-medium text-xs sm:text-sm">
                            Élevage d'appartenance {!formData.date_deces && '*'}
                            <span className="block text-xs text-gray-600 font-normal mt-0.5 sm:mt-1 leading-relaxed">
                                {elevageContext && !animal?.id ?
                                    'Élevage automatiquement défini lors de l\'ajout depuis l\'onglet élevage' :
                                    'Élevage où se trouve actuellement l\'animal vivant'}
                            </span>
                        </label>
                        <select
                            id="elevage_id"
                            name="elevage_id"
                            value={formData.elevage_id || ''}
                            onChange={handleChange}
                            disabled={!!formData.date_deces || (!!elevageContext && !animal?.id)}
                            required={!formData.date_deces}
                            className="w-full px-3 py-2 sm:py-2.5 border border-gray-200 rounded-md bg-white text-gray-900 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-white disabled:text-gray-600 disabled:cursor-not-allowed"
                        >
                            <option value="">
                                {formData.date_deces ? '-- Animal décédé (hors élevage) --' : '-- Choisir un élevage --'}
                            </option>
                            {elevageContext && !animal?.id ? (
                                <option key={elevageContext.id} value={elevageContext.id}>
                                    {elevageContext.nom} (élevage actuel)
                                </option>
                            ) : (
                                elevages.map(elevage => (
                                    <option key={elevage.id} value={elevage.id}>
                                        {elevage.nom}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>
                </div>

                <div className="flex flex-col gap-1.5 sm:gap-2 mb-4 sm:mb-5">
                    <label htmlFor="notes" className="text-gray-900 font-medium text-xs sm:text-sm">
                        Notes et observations
                        <span className="block text-xs text-gray-600 font-normal mt-0.5 sm:mt-1 leading-relaxed">Informations complémentaires sur l'animal (santé, comportement, etc.)</span>
                    </label>
                    <textarea
                        id="notes"
                        name="notes"
                        value={formData.notes || ''}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Ex: Santé fragile, très docile, problème de patte droite..."
                        className="w-full px-3 py-2 sm:py-2.5 border border-gray-200 rounded-md bg-white text-gray-900 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-vertical placeholder-gray-500"
                    />
                </div>

                {/* Section photos */}
                <PhotoUpload
                    animalId={animal?.id}
                    existingPhotos={existingPhotos}
                    onPhotosChange={handlePhotosChange}
                    maxPhotos={10}
                    maxSizePerPhoto={5}
                    className="mb-5"
                />

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end mt-6 sm:mt-8 pt-4 sm:pt-5 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="btn-secondary w-full sm:w-auto sm:min-w-[120px] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full sm:w-auto sm:min-w-[120px] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Enregistrement...' : (animal ? 'Modifier' : 'Créer')}
                    </button>
                </div>
            </form>

            {/* CSS is now handled by Tailwind CSS classes */}

            {/* Dialogue de demande de transfert */}
            {showTransferDialog && existingAnimal && (
                <TransferRequestDialog
                    animal={existingAnimal}
                    onClose={() => setShowTransferDialog(false)}
                    onSubmit={handleTransferRequest}
                />
            )}
        </div>
    );
};

export default AnimalForm;