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
        <div className="transfer-dialog-overlay">
            <div className="transfer-dialog">
                <div className="transfer-dialog-header">
                    <h3>🔄 Demande de transfert</h3>
                    <button onClick={onClose} className="close-button">✕</button>
                </div>

                <div className="transfer-dialog-content">
                    <div className="animal-info">
                        <h4>Animal à transférer</h4>
                        <p>
                            <strong>{animal.identifiant_officiel}</strong>
                            {animal.nom && ` (${animal.nom})`}
                        </p>
                        <p>
                            <small>Élevage actuel: {animal.elevage_nom || 'Aucun'}</small>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="elevage-destination">
                                Élevage de destination *
                            </label>
                            <select
                                id="elevage-destination"
                                value={selectedElevageId}
                                onChange={(e) => setSelectedElevageId(Number(e.target.value))}
                                required
                            >
                                <option value={0}>-- Choisir un élevage --</option>
                                {elevages.map(elevage => (
                                    <option key={elevage.id} value={elevage.id}>
                                        {elevage.nom}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="transfer-message">
                                Message (optionnel)
                            </label>
                            <textarea
                                id="transfer-message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Expliquez pourquoi vous souhaitez transférer cet animal..."
                                rows={4}
                            />
                        </div>

                        {error && (
                            <div className="error-message">
                                {error}
                            </div>
                        )}

                        <div className="transfer-dialog-actions">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
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

            <style>{`
                .transfer-dialog-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }

                .transfer-dialog {
                    background: white;
                    border-radius: 8px;
                    width: 90%;
                    max-width: 500px;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                }

                .transfer-dialog-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem 1.5rem;
                    border-bottom: 1px solid #e0e0e0;
                }

                .transfer-dialog-header h3 {
                    margin: 0;
                    color: #333;
                }

                .close-button {
                    background: none;
                    border: none;
                    font-size: 1.2rem;
                    color: #666;
                    cursor: pointer;
                    padding: 0.25rem;
                }

                .close-button:hover {
                    color: #000;
                }

                .transfer-dialog-content {
                    padding: 1.5rem;
                }

                .animal-info {
                    background: #f8f9fa;
                    padding: 1rem;
                    border-radius: 6px;
                    margin-bottom: 1.5rem;
                }

                .animal-info h4 {
                    margin: 0 0 0.5rem 0;
                    color: #495057;
                }

                .animal-info p {
                    margin: 0.25rem 0;
                }

                .form-group {
                    margin-bottom: 1rem;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 500;
                    color: #333;
                }

                .form-group select,
                .form-group textarea {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 0.9rem;
                    box-sizing: border-box;
                }

                .form-group select:focus,
                .form-group textarea:focus {
                    outline: none;
                    border-color: #007bff;
                    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
                }

                .transfer-dialog-actions {
                    display: flex;
                    gap: 1rem;
                    justify-content: flex-end;
                    margin-top: 1.5rem;
                }

                .transfer-dialog-actions button {
                    padding: 0.75rem 1.5rem;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.9rem;
                }

                .transfer-dialog-actions button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .btn-primary {
                    background: #007bff !important;
                    color: white !important;
                    border-color: #007bff !important;
                }

                .btn-primary:hover:not(:disabled) {
                    background: #0056b3 !important;
                }

                .error-message {
                    color: #dc3545;
                    background: #f8d7da;
                    padding: 0.75rem;
                    border-radius: 4px;
                    margin: 1rem 0;
                    border: 1px solid #f5c6cb;
                }
            `}</style>
        </div>
    );
};

export default TransferRequestDialog;