import React, { useState, useEffect } from 'react';

interface Elevage {
    id: number;
    nom: string;
}

interface Animal {
    id: number;
    identifiant_officiel: string;
    nom?: string;
    elevage_id?: number;
    elevage_nom?: string;
}

interface TransferRequestDialogProps {
    animal: Animal;
    onClose: () => void;
    onSubmit: (toElevageId: number, message: string) => void;
}

const TransferRequestDialog: React.FC<TransferRequestDialogProps> = ({
    animal,
    onClose,
    onSubmit
}) => {
    const [elevages, setElevages] = useState<Elevage[]>([]);
    const [selectedElevageId, setSelectedElevageId] = useState<number>(0);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadElevages();
    }, []);

    const loadElevages = async () => {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) return;

            const response = await fetch('http://localhost:3001/api/elevages', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                // Filtrer l'élevage actuel de l'animal
                const filteredElevages = data.filter((e: Elevage) => e.id !== animal.elevage_id);
                setElevages(filteredElevages);
            } else {
                setError('Erreur lors du chargement des élevages');
            }
        } catch (error) {
            setError('Erreur de connexion');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedElevageId) {
            setError('Veuillez sélectionner un élevage de destination');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await onSubmit(selectedElevageId, message);
        } catch (error) {
            setError('Erreur lors de la création de la demande');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <div className="management-header">
                    <h3>🔄 Demande de transfert</h3>
                    <button onClick={onClose} className="close-btn">✕</button>
                </div>

                <div className="p-6">
                    <div className="bg-gray-700 border border-gray-600 rounded-lg p-4 mb-6">
                        <h4 className="text-gray-300 font-medium mb-3">Animal à transférer</h4>
                        <p className="text-white font-semibold mb-2">
                            <strong>{animal.identifiant_officiel}</strong>
                            {animal.nom && <span className="text-gray-300"> ({animal.nom})</span>}
                        </p>
                        <p className="text-sm text-gray-400">
                            Élevage actuel: {animal.elevage_nom || 'Aucun'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label htmlFor="elevage-destination" className="form-label">
                                Élevage de destination *
                            </label>
                            <select
                                id="elevage-destination"
                                value={selectedElevageId}
                                onChange={(e) => setSelectedElevageId(Number(e.target.value))}
                                required
                                className="form-select"
                            >
                                <option value={0}>-- Choisir un élevage --</option>
                                {elevages.map(elevage => (
                                    <option key={elevage.id} value={elevage.id}>
                                        {elevage.nom}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="transfer-message" className="form-label">
                                Message (optionnel)
                            </label>
                            <textarea
                                id="transfer-message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Expliquez pourquoi vous souhaitez transférer cet animal 🦕..."
                                rows={4}
                                className="form-textarea"
                            />
                        </div>

                        {error && (
                            <div className="error-message">
                                {error}
                            </div>
                        )}

                        <div className="form-actions">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="cancel-btn"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !selectedElevageId}
                                className="btn-primary"
                            >
                                {loading ? 'Envoi...' : 'Demander le transfert'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

        </div>
    );
};

export default TransferRequestDialog;