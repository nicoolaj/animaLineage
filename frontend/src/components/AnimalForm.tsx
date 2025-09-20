import React, { useState, useEffect, useCallback } from 'react';

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

            // Charger tous les animaux accessibles pour la généalogie
            const response = await fetch('http://localhost:3001/api/animaux', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                // Filtrer seulement les animaux vivants pour les parents
                const animauxVivants = data.filter((a: Animal) => !a.date_deces && a.id !== animal?.id);
                setParentsMales(animauxVivants.filter((a: Animal) => a.sexe === 'M'));
                setParentsFemelles(animauxVivants.filter((a: Animal) => a.sexe === 'F'));
            }
        } catch (error) {
            console.error('Erreur lors du chargement des animaux:', error);
        }
    }, [animal?.id]);

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
        <div id="animal-form-container" className="animal-form">
            <h3 id="animal-form-title">{animal ? 'Modifier l\'animal' : 'Nouvel animal'}</h3>

            {error && <div id="animal-form-error" className="error-message">{error}</div>}

            <form id="animal-form" onSubmit={handleSubmit}>
                <div id="animal-form-row-1" className="form-row">
                    <div id="animal-form-group-identifiant" className="form-group">
                        <label htmlFor="identifiant_officiel">
                            Identifiant officiel *
                            <span className="field-description">Numéro unique d'identification de l'animal (ex: numéro de boucle)</span>
                        </label>
                        <input
                            type="text"
                            id="identifiant_officiel"
                            name="identifiant_officiel"
                            value={formData.identifiant_officiel}
                            onChange={handleChange}
                            required
                            placeholder="Ex: FR123456789 ou 001234"
                        />
                    </div>

                    <div id="animal-form-group-nom" className="form-group">
                        <label htmlFor="nom">
                            Nom de l'animal
                            <span className="field-description">Nom donné à l'animal (facultatif)</span>
                        </label>
                        <input
                            type="text"
                            id="nom"
                            name="nom"
                            value={formData.nom || ''}
                            onChange={handleChange}
                            placeholder="Ex: Bella, Rex, Mouton123..."
                        />
                    </div>
                </div>

                <div id="animal-form-row-2" className="form-row">
                    <div id="animal-form-group-sexe" className="form-group">
                        <label htmlFor="sexe">
                            Sexe de l'animal *
                            <span className="field-description">Sexe biologique de l'animal</span>
                        </label>
                        <select
                            id="sexe"
                            name="sexe"
                            value={formData.sexe}
                            onChange={handleChange}
                            required
                        >
                            <option value="M">♂️ Mâle</option>
                            <option value="F">♀️ Femelle</option>
                        </select>
                    </div>

                    <div id="animal-form-group-race" className="form-group">
                        <label htmlFor="race_id">
                            Race *
                            <span className="field-description">Race et type d'animal (mouton, chèvre, etc.)</span>
                        </label>
                        <select
                            id="race_id"
                            name="race_id"
                            value={formData.race_id}
                            onChange={handleChange}
                            required
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

                <div id="animal-form-row-3" className="form-row">
                    <div id="animal-form-group-pere" className="form-group">
                        <label htmlFor="pere_id">
                            Père géniteur
                            <span className="field-description">Animal mâle ayant engendré cet animal (généalogie)</span>
                        </label>
                        <select
                            id="pere_id"
                            name="pere_id"
                            value={formData.pere_id || ''}
                            onChange={handleChange}
                        >
                            <option value="">-- Père non renseigné --</option>
                            {parentsMales.map(parent => (
                                <option key={parent.id} value={parent.id}>
                                    ♂️ {parent.identifiant_officiel} {parent.nom ? `(${parent.nom})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div id="animal-form-group-mere" className="form-group">
                        <label htmlFor="mere_id">
                            Mère génitrice
                            <span className="field-description">Animal femelle ayant donné naissance à cet animal</span>
                        </label>
                        <select
                            id="mere_id"
                            name="mere_id"
                            value={formData.mere_id || ''}
                            onChange={handleChange}
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

                <div id="animal-form-row-4" className="form-row">
                    <div id="animal-form-group-date-naissance" className="form-group">
                        <label htmlFor="date_naissance">
                            Date de naissance
                            <span className="field-description">Date de mise bas de l'animal</span>
                        </label>
                        <input
                            type="date"
                            id="date_naissance"
                            name="date_naissance"
                            value={formData.date_naissance || ''}
                            onChange={handleChange}
                        />
                    </div>

                    <div id="animal-form-group-date-bouclage" className="form-group">
                        <label htmlFor="date_bouclage">
                            Date de bouclage
                            <span className="field-description">Date de pose de la boucle d'identification officielle</span>
                        </label>
                        <input
                            type="date"
                            id="date_bouclage"
                            name="date_bouclage"
                            value={formData.date_bouclage || ''}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div id="animal-form-row-5" className="form-row">
                    <div id="animal-form-group-date-deces" className="form-group">
                        <label htmlFor="date_deces">
                            Date de décès
                            <span className="field-description">Date de mort de l'animal (retire automatiquement de l'élevage)</span>
                        </label>
                        <input
                            type="date"
                            id="date_deces"
                            name="date_deces"
                            value={formData.date_deces || ''}
                            onChange={handleChange}
                        />
                        <div id="animalform-field-note-1" className="field-note">
                            ⚠️ Renseigner cette date retire automatiquement l'animal de son élevage
                        </div>
                    </div>

                    <div id="animal-form-group-elevage" className="form-group">
                        <label htmlFor="elevage_id">
                            Élevage d'appartenance {!formData.date_deces && '*'}
                            <span className="field-description">Élevage où se trouve actuellement l'animal vivant</span>
                        </label>
                        <select
                            id="elevage_id"
                            name="elevage_id"
                            value={formData.elevage_id || ''}
                            onChange={handleChange}
                            disabled={!!formData.date_deces}
                            required={!formData.date_deces}
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

                <div id="animal-form-group-notes" className="form-group">
                    <label htmlFor="notes">
                        Notes et observations
                        <span className="field-description">Informations complémentaires sur l'animal (santé, comportement, etc.)</span>
                    </label>
                    <textarea
                        id="notes"
                        name="notes"
                        value={formData.notes || ''}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Ex: Santé fragile, très docile, problème de patte droite..."
                    />
                </div>

                <div id="animal-form-actions" className="form-actions">
                    <button id="animal-form-cancel-btn" type="button" onClick={onCancel} disabled={loading}>
                        Annuler
                    </button>
                    <button id="animal-form-submit-btn" type="submit" disabled={loading}>
                        {loading ? 'Enregistrement...' : (animal ? 'Modifier' : 'Créer')}
                    </button>
                </div>
            </form>

            <style>{`
                .animal-form {
                    background-color: #374151;
                    border-radius: 12px;
                    padding: 25px;
                    color: white;
                    max-width: 800px;
                    margin: 0 auto;
                }

                .animal-form h3 {
                    margin: 0 0 25px 0;
                    color: white;
                    font-size: 1.5rem;
                }

                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 20px;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .form-group label {
                    color: #f3f4f6;
                    font-weight: 500;
                    font-size: 14px;
                }

                .form-group input,
                .form-group select,
                .form-group textarea {
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #4b5563;
                    border-radius: 6px;
                    background-color: #1f2937;
                    color: #f3f4f6;
                    font-size: 14px;
                    transition: border-color 0.2s;
                    box-sizing: border-box;
                }

                .form-group input:focus,
                .form-group select:focus,
                .form-group textarea:focus {
                    outline: none;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                .form-group input:disabled,
                .form-group select:disabled {
                    background-color: #374151;
                    color: #9ca3af;
                    cursor: not-allowed;
                }

                .form-group input::placeholder,
                .form-group textarea::placeholder {
                    color: #9ca3af;
                }

                .field-description {
                    font-size: 12px;
                    color: #9ca3af;
                    font-weight: normal;
                    margin-top: 4px;
                    line-height: 1.4;
                }

                .field-note {
                    font-size: 12px;
                    color: #f59e0b;
                    margin-top: 6px;
                    padding: 8px;
                    background-color: rgba(245, 158, 11, 0.1);
                    border-radius: 4px;
                    border-left: 3px solid #f59e0b;
                }

                .form-actions {
                    display: flex;
                    gap: 15px;
                    justify-content: flex-end;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #4b5563;
                }

                .form-actions button {
                    padding: 12px 24px;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    min-width: 120px;
                }

                .form-actions button[type="button"] {
                    background: #6b7280;
                    color: white;
                    border: 1px solid #6b7280;
                }

                .form-actions button[type="button"]:hover:not(:disabled) {
                    background: #4b5563;
                    border-color: #4b5563;
                }

                .form-actions button[type="submit"] {
                    background: #3b82f6;
                    color: white;
                    border: 1px solid #3b82f6;
                }

                .form-actions button[type="submit"]:hover:not(:disabled) {
                    background: #2563eb;
                    border-color: #2563eb;
                }

                .form-actions button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .error-message {
                    background: #dc2626;
                    color: white;
                    padding: 12px;
                    border-radius: 6px;
                    margin-bottom: 20px;
                    font-size: 0.9rem;
                }

                @media (max-width: 768px) {
                    .form-row {
                        grid-template-columns: 1fr;
                        gap: 15px;
                    }

                    .animal-form {
                        padding: 20px;
                        margin: 0 10px;
                    }

                    .form-actions {
                        flex-direction: column;
                    }

                    .form-actions button {
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
};

export default AnimalForm;