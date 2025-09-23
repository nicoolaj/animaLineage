import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface TransferRequest {
    id: number;
    animal_id: number;
    from_elevage_id?: number;
    to_elevage_id: number;
    requested_by: number;
    status: 'pending' | 'approved' | 'rejected';
    message?: string;
    response_message?: string;
    created_at: string;
    updated_at: string;
    identifiant_officiel: string;
    animal_nom?: string;
    from_elevage_nom?: string;
    to_elevage_nom: string;
    requested_by_name: string;
    processed_by_name?: string;
}

const TransferRequestManager: React.FC = () => {
    // Using useAuth hook for potential future authentication needs
    useAuth();
    const [requests, setRequests] = useState<TransferRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [processing, setProcessing] = useState<number | null>(null);
    const [responseMessage, setResponseMessage] = useState('');

    useEffect(() => {
        loadTransferRequests();
    }, []);

    const loadTransferRequests = async () => {
        try {
            setLoading(true);
            const token = sessionStorage.getItem('token');
            if (!token) return;

            const response = await fetch('http://localhost:3001/api/transfer-requests', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setRequests(data);
            } else {
                setError('Erreur lors du chargement des demandes');
            }
        } catch (error) {
            setError('Erreur de connexion');
        } finally {
            setLoading(false);
        }
    };

    const handleProcessRequest = async (requestId: number, status: 'approved' | 'rejected') => {
        try {
            setProcessing(requestId);
            const token = sessionStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`http://localhost:3001/api/transfer-requests/${requestId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    status,
                    response_message: responseMessage
                })
            });

            if (response.ok) {
                // Recharger les demandes
                await loadTransferRequests();
                setResponseMessage('');
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Erreur lors du traitement de la demande');
            }
        } catch (error) {
            setError('Erreur de connexion');
        } finally {
            setProcessing(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-600 text-white">⏳ En attente</span>;
            case 'approved':
                return <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-600 text-white">✅ Approuvée</span>;
            case 'rejected':
                return <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-600 text-white">❌ Rejetée</span>;
            default:
                return <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-600 text-white">{status}</span>;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return <div className="text-center p-8 text-gray-300">Chargement des demandes de transfert...</div>;
    }

    if (error) {
        return (
            <div className="text-center p-8 text-gray-300">
                <p>Erreur: {error}</p>
                <button className="btn-primary mt-4" onClick={loadTransferRequests}>Réessayer</button>
            </div>
        );
    }

    const pendingRequests = requests.filter(r => r.status === 'pending');
    const processedRequests = requests.filter(r => r.status !== 'pending');

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="mb-8">
                <h2 className="text-white text-2xl font-semibold mb-2">🔄 Gestion des demandes de transfert</h2>
                <p className="text-gray-300">Gérez les demandes de transfert d'animaux entre élevages.</p>
            </div>

            {pendingRequests.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-gray-300 text-lg font-medium mb-4 pb-2 border-b-2 border-gray-600">📥 Demandes en attente ({pendingRequests.length})</h3>
                    <div className="flex flex-col gap-4">
                        {pendingRequests.map(request => (
                            <div key={request.id} className="bg-gray-700 border border-gray-600 border-l-4 border-l-yellow-500 rounded-lg p-6 shadow-md">
                                <div className="mb-4">
                                    <div className="text-lg mb-3 flex items-center gap-4">
                                        <strong className="text-white">{request.identifiant_officiel}</strong>
                                        {request.animal_nom && <span className="text-gray-300">({request.animal_nom})</span>}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-3 text-sm text-gray-400">
                                        <div>
                                            <strong className="text-gray-300">De:</strong> {request.from_elevage_nom || 'Aucun élevage'}
                                        </div>
                                        <div>
                                            <strong className="text-gray-300">Vers:</strong> {request.to_elevage_nom}
                                        </div>
                                        <div>
                                            <strong className="text-gray-300">Demandé par:</strong> {request.requested_by_name}
                                        </div>
                                        <div>
                                            <strong className="text-gray-300">Date:</strong> {formatDate(request.created_at)}
                                        </div>
                                    </div>
                                    {request.message && (
                                        <div className="bg-gray-700 p-3 rounded text-sm text-gray-300 mt-3">
                                            <strong>Message:</strong> {request.message}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-4">
                                    <div>
                                        <textarea
                                            className="form-textarea"
                                            placeholder="Message de réponse (optionnel)"
                                            value={processing === request.id ? responseMessage : ''}
                                            onChange={(e) => setResponseMessage(e.target.value)}
                                            rows={2}
                                        />
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <button
                                            onClick={() => handleProcessRequest(request.id, 'approved')}
                                            disabled={processing === request.id}
                                            className="bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 px-6 rounded-md transition-colors duration-200"
                                        >
                                            ✅ Approuver
                                        </button>
                                        <button
                                            onClick={() => handleProcessRequest(request.id, 'rejected')}
                                            disabled={processing === request.id}
                                            className="bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 px-6 rounded-md transition-colors duration-200"
                                        >
                                            ❌ Rejeter
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {processedRequests.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-gray-300 text-lg font-medium mb-4 pb-2 border-b-2 border-gray-600">📋 Demandes traitées ({processedRequests.length})</h3>
                    <div className="flex flex-col gap-4">
                        {processedRequests.map(request => (
                            <div key={request.id} className={`bg-gray-700 border border-gray-600 rounded-lg p-6 shadow-md ${
                                request.status === 'approved' ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'
                            }`}>
                                <div>
                                    <div className="text-lg mb-3 flex items-center gap-4">
                                        <strong className="text-white">{request.identifiant_officiel}</strong>
                                        {request.animal_nom && <span className="text-gray-300">({request.animal_nom})</span>}
                                        {getStatusBadge(request.status)}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 mb-3 text-sm text-gray-400">
                                        <div>
                                            <strong className="text-gray-300">De:</strong> {request.from_elevage_nom || 'Aucun élevage'}
                                        </div>
                                        <div>
                                            <strong className="text-gray-300">Vers:</strong> {request.to_elevage_nom}
                                        </div>
                                        <div>
                                            <strong className="text-gray-300">Demandé par:</strong> {request.requested_by_name}
                                        </div>
                                        <div>
                                            <strong className="text-gray-300">Traité par:</strong> {request.processed_by_name || 'Système'}
                                        </div>
                                        <div>
                                            <strong className="text-gray-300">Date de traitement:</strong> {formatDate(request.updated_at)}
                                        </div>
                                    </div>
                                    {request.response_message && (
                                        <div className="bg-gray-700 p-3 rounded text-sm text-gray-300 mt-3">
                                            <strong>Réponse:</strong> {request.response_message}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {requests.length === 0 && (
                <div className="text-center p-8 text-gray-300">
                    <p>Aucune demande de transfert trouvée.</p>
                </div>
            )}

        </div>
    );
};

export default TransferRequestManager;