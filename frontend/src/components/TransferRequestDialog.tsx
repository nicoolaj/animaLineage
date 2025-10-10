import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';

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

    const loadElevages = useCallback(async () => {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}api/elevages`, {
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
    }, [animal.elevage_id]);

    useEffect(() => {
        loadElevages();
    }, [loadElevages]);

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
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-md max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800">🔄 Demande de transfert</h3>
                    <button onClick={onClose} className="text-gray-700 hover:text-gray-900 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded-sm">✕</button>
                </div>

                <div className="p-4 sm:p-6">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                        <h4 className="text-gray-700 font-medium mb-3">Animal à transférer</h4>
                        <p className="text-gray-900 font-semibold mb-2">
                            <strong>{animal.identifiant_officiel}</strong>
                            {animal.nom && <span className="text-gray-700"> ({animal.nom})</span>}
                        </p>
                        <p className="text-sm text-gray-700">
                            Élevage actuel: {animal.elevage_nom || 'Aucun'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label htmlFor="elevage-destination" className="block text-sm font-medium text-gray-700 mb-2">
                                Élevage de destination <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="elevage-destination"
                                value={selectedElevageId}
                                onChange={(e) => setSelectedElevageId(Number(e.target.value))}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
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
                            <label htmlFor="transfer-message" className="block text-sm font-medium text-gray-700 mb-2">
                                Message (optionnel)
                            </label>
                            <textarea
                                id="transfer-message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Expliquez pourquoi vous souhaitez transférer cet animal 🦕..."
                                rows={4}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors resize-vertical"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded-lg mb-4">
                                {error}
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-1"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !selectedElevageId}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
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