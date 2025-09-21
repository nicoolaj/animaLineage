import React, { useState, useEffect, useCallback } from 'react';
import TransferRequestDialog from './TransferRequestDialog';

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
}

const AnimalForm: React.FC<AnimalFormProps> = ({ animal, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState<Animal>({
        identifiant_officiel: '',
        sexe: 'M',
        race_id: 0,
        ...animal
    });

    const [races, setRaces] = useState<Race[]>([]);
    const [elevages, setElevages] = useState<Elevage[]>([]);
    const [parentsMales, setParentsMales] = useState<Animal[]>([]);
    const [parentsFemelles, setParentsFemelles] = useState<Animal[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [animalExistsWarning, setAnimalExistsWarning] = useState<string>('');
    const [checkingAnimal, setCheckingAnimal] = useState(false);
    const [existingAnimal, setExistingAnimal] = useState<any>(null);
    const [showTransferDialog, setShowTransferDialog] = useState(false);

    const loadRaces = useCallback(async () => {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) return;

            const response = await fetch('http://localhost:3001/api/races', {
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
                ? 'http://localhost:3001/api/elevages'
                : 'http://localhost:3001/api/elevages?my=true';

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
        }
    }, []);

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

            console.log(`Filtrage des parents pour le type d'animal: ${selectedRace.type_animal_nom}`);

            // Charger tous les animaux accessibles pour la généalogie
            const response = await fetch('http://localhost:3001/api/animaux', {
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
    }, [animal?.id, formData.race_id, races.length]);

    useEffect(() => {
        loadRaces();
        loadElevages();
        loadPotentialParents();
    }, [loadRaces, loadElevages, loadPotentialParents]);

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

            const response = await fetch(`http://localhost:3001/api/animaux?check=1&identifiant=${encodeURIComponent(identifiant)}`, {
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
    }, [checkingAnimal, animal?.id]);

    const handleTransferRequest = async (toElevageId: number, message: string) => {
        try {
            const token = sessionStorage.getItem('token');
            if (!token || !existingAnimal) return;

            const response = await fetch('http://localhost:3001/api/transfer-requests', {
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
                throw new Error('Un animal vivant doit être associé à un élevage');
            }

            onSubmit(formData);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-700 rounded-xl p-6 text-white max-w-4xl mx-auto border border-gray-600">
            <h3 className="m-0 mb-6 text-white text-2xl font-semibold">{animal ? 'Modifier l\'animal' : 'Nouvel animal'}</h3>

            {error && <div className="bg-red-600 text-white px-3 py-2.5 rounded-md mb-5">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="identifiant_officiel" className="text-gray-100 font-medium text-sm">
                            Identifiant officiel *
                            <span className="block text-xs text-gray-400 font-normal mt-1 leading-relaxed">Numéro unique d'identification de l'animal (ex: numéro de boucle)</span>
                        </label>
                        <input
                            type="text"
                            id="identifiant_officiel"
                            name="identifiant_officiel"
                            value={formData.identifiant_officiel}
                            onChange={handleChange}
                            required
                            placeholder="Ex: FR123456789 ou 001234"
                            className="w-full px-3 py-2.5 border border-gray-600 rounded-md bg-gray-800 text-gray-100 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400"
                        />
                        {checkingAnimal && (
                            <div className="mt-2 px-3 py-2 border border-primary-300 bg-primary-50 text-primary-700 rounded-md text-sm">
                                🔍 Vérification en cours...
                            </div>
                        )}
                        {animalExistsWarning && (
                            <div className="text-yellow-700 bg-yellow-100 border border-yellow-300 px-3 py-2.5 rounded-md mt-2 text-sm">
                                {animalExistsWarning}
                                {existingAnimal && existingAnimal.can_transfer && (
                                    <button
                                        type="button"
                                        onClick={() => setShowTransferDialog(true)}
                                        className="inline-block mt-2.5 px-3 py-1.5 bg-blue-600 text-white border-0 rounded-md cursor-pointer text-xs hover:bg-blue-700 transition-colors duration-200"
                                    >
                                        🔄 Demander un transfert
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="nom" className="text-gray-100 font-medium text-sm">
                            Nom de l'animal
                            <span className="block text-xs text-gray-400 font-normal mt-1 leading-relaxed">Nom donné à l'animal (facultatif)</span>
                        </label>
                        <input
                            type="text"
                            id="nom"
                            name="nom"
                            value={formData.nom || ''}
                            onChange={handleChange}
                            placeholder="Ex: Bella, Rex, Mouton123..."
                            className="w-full px-3 py-2.5 border border-gray-600 rounded-md bg-gray-800 text-gray-100 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="sexe" className="text-gray-100 font-medium text-sm">
                            Sexe de l'animal *
                            <span className="block text-xs text-gray-400 font-normal mt-1 leading-relaxed">Sexe biologique de l'animal</span>
                        </label>
                        <select
                            id="sexe"
                            name="sexe"
                            value={formData.sexe}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2.5 border border-gray-600 rounded-md bg-gray-800 text-gray-100 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="M">♂️ Mâle</option>
                            <option value="F">♀️ Femelle</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="race_id" className="text-gray-100 font-medium text-sm">
                            Race *
                            <span className="block text-xs text-gray-400 font-normal mt-1 leading-relaxed">Race et type d'animal (mouton, chèvre, etc.)</span>
                        </label>
                        <select
                            id="race_id"
                            name="race_id"
                            value={formData.race_id}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2.5 border border-gray-600 rounded-md bg-gray-800 text-gray-100 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="">-- Choisir une race --</option>
                            {races.map(race => (
                                <option key={race.id} value={race.id}>
                                    {race.nom} ({race.type_animal_nom})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="pere_id" className="text-gray-100 font-medium text-sm">
                            Père géniteur
                            <span className="block text-xs text-gray-400 font-normal mt-1 leading-relaxed">Animal mâle ayant engendré cet animal (généalogie)</span>
                        </label>
                        <select
                            id="pere_id"
                            name="pere_id"
                            value={formData.pere_id || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2.5 border border-gray-600 rounded-md bg-gray-800 text-gray-100 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="">-- Père non renseigné --</option>
                            {parentsMales.map(parent => (
                                <option key={parent.id} value={parent.id}>
                                    ♂️ {parent.identifiant_officiel} {parent.nom ? `(${parent.nom})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="mere_id" className="text-gray-100 font-medium text-sm">
                            Mère génitrice
                            <span className="block text-xs text-gray-400 font-normal mt-1 leading-relaxed">Animal femelle ayant donné naissance à cet animal</span>
                        </label>
                        <select
                            id="mere_id"
                            name="mere_id"
                            value={formData.mere_id || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2.5 border border-gray-600 rounded-md bg-gray-800 text-gray-100 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="date_naissance" className="text-gray-100 font-medium text-sm">
                            Date de naissance
                            <span className="block text-xs text-gray-400 font-normal mt-1 leading-relaxed">Date de mise bas de l'animal</span>
                        </label>
                        <input
                            type="date"
                            id="date_naissance"
                            name="date_naissance"
                            value={formData.date_naissance || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2.5 border border-gray-600 rounded-md bg-gray-800 text-gray-100 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="date_bouclage" className="text-gray-100 font-medium text-sm">
                            Date de bouclage
                            <span className="block text-xs text-gray-400 font-normal mt-1 leading-relaxed">Date de pose de la boucle d'identification officielle</span>
                        </label>
                        <input
                            type="date"
                            id="date_bouclage"
                            name="date_bouclage"
                            value={formData.date_bouclage || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2.5 border border-gray-600 rounded-md bg-gray-800 text-gray-100 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="date_deces" className="text-gray-100 font-medium text-sm">
                            Date de décès
                            <span className="block text-xs text-gray-400 font-normal mt-1 leading-relaxed">Date de mort de l'animal (retire automatiquement de l'élevage)</span>
                        </label>
                        <input
                            type="date"
                            id="date_deces"
                            name="date_deces"
                            value={formData.date_deces || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2.5 border border-gray-600 rounded-md bg-gray-800 text-gray-100 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                        <div className="text-xs text-yellow-400 mt-1.5 px-2 py-2 bg-yellow-900 bg-opacity-20 rounded-md border-l-3 border-yellow-400">
                            ⚠️ Renseigner cette date retire automatiquement l'animal de son élevage
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="elevage_id" className="text-gray-100 font-medium text-sm">
                            Élevage d'appartenance {!formData.date_deces && '*'}
                            <span className="block text-xs text-gray-400 font-normal mt-1 leading-relaxed">Élevage où se trouve actuellement l'animal vivant</span>
                        </label>
                        <select
                            id="elevage_id"
                            name="elevage_id"
                            value={formData.elevage_id || ''}
                            onChange={handleChange}
                            disabled={!!formData.date_deces}
                            required={!formData.date_deces}
                            className="w-full px-3 py-2.5 border border-gray-600 rounded-md bg-gray-800 text-gray-100 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                            <option value="">
                                {formData.date_deces ? '-- Animal décédé (hors élevage) --' : '-- Choisir un élevage --'}
                            </option>
                            {elevages.map(elevage => (
                                <option key={elevage.id} value={elevage.id}>
                                    {elevage.nom}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex flex-col gap-2 mb-5">
                    <label htmlFor="notes" className="text-gray-100 font-medium text-sm">
                        Notes et observations
                        <span className="block text-xs text-gray-400 font-normal mt-1 leading-relaxed">Informations complémentaires sur l'animal (santé, comportement, etc.)</span>
                    </label>
                    <textarea
                        id="notes"
                        name="notes"
                        value={formData.notes || ''}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Ex: Santé fragile, très docile, problème de patte droite..."
                        className="w-full px-3 py-2.5 border border-gray-600 rounded-md bg-gray-800 text-gray-100 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-vertical placeholder-gray-400"
                    />
                </div>

                <div className="flex gap-4 justify-end mt-8 pt-5 border-t border-gray-600">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="btn-secondary min-w-[120px] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary min-w-[120px] disabled:opacity-60 disabled:cursor-not-allowed"
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