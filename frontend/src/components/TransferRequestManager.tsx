import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';

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

            const response = await fetch(`${API_BASE_URL}api/transfer-requests`, {
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

            const response = await fetch(`${API_BASE_URL}api/transfer-requests/${requestId}`, {
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
                return <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-900">{status}</span>;
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
        return <div className="text-center p-4 sm:p-8 text-gray-700">Chargement des demandes de transfert...</div>;
    }

    if (error) {
        return (
            <div className="text-center p-4 sm:p-8 text-gray-700">
                <p className="text-sm sm:text-base">Erreur: {error}</p>
                <button className="btn-primary mt-4 w-full sm:w-auto" onClick={loadTransferRequests}>Réessayer</button>
            </div>
        );
    }

    const pendingRequests = requests.filter(r => r.status === 'pending');
    const processedRequests = requests.filter(r => r.status !== 'pending');

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
            <div className="mb-6 sm:mb-8">
                <h2 className="text-gray-900 text-lg sm:text-xl lg:text-2xl font-semibold mb-2">🔄 Gestion des demandes de transfert</h2>
                <p className="text-gray-700 text-sm sm:text-base">Gérez les demandes de transfert d'animaux entre élevages.</p>
            </div>

            {pendingRequests.length > 0 && (
                <div className="mb-6 sm:mb-8">
                    <h3 className="text-gray-700 text-base sm:text-lg font-medium mb-3 sm:mb-4 pb-2 border-b-2 border-gray-200">📥 Demandes en attente ({pendingRequests.length})</h3>
                    <div className="flex flex-col gap-4 sm:gap-6">
                        {pendingRequests.map(request => (
                            <div key={request.id} className="bg-white border border-gray-200 border-l-4 border-l-yellow-500 rounded-lg p-4 sm:p-6 shadow-md">
                                <div className="mb-4 sm:mb-6">
                                    <div className="text-base sm:text-lg mb-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <strong className="text-gray-900">{request.identifiant_officiel}</strong>
                                        {request.animal_nom && <span className="text-gray-700 text-sm sm:text-base">({request.animal_nom})</span>}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-3 text-xs sm:text-sm text-gray-600">
                                        <div className="bg-gray-100 p-2 sm:p-3 rounded">
                                            <strong className="text-gray-700 block">De:</strong>
                                            <span className="break-words">{request.from_elevage_nom || 'Aucun élevage'}</span>
                                        </div>
                                        <div className="bg-gray-100 p-2 sm:p-3 rounded">
                                            <strong className="text-gray-700 block">Vers:</strong>
                                            <span className="break-words">{request.to_elevage_nom}</span>
                                        </div>
                                        <div className="bg-gray-100 p-2 sm:p-3 rounded">
                                            <strong className="text-gray-700 block">Demandé par:</strong>
                                            <span className="break-words">{request.requested_by_name}</span>
                                        </div>
                                        <div className="bg-gray-100 p-2 sm:p-3 rounded">
                                            <strong className="text-gray-700 block">Date:</strong>
                                            <span className="break-words">{formatDate(request.created_at)}</span>
                                        </div>
                                    </div>
                                    {request.message && (
                                        <div className="bg-gray-100 p-3 sm:p-4 rounded text-xs sm:text-sm text-gray-700 mt-3">
                                            <strong className="block mb-1">Message:</strong>
                                            <span className="break-words">{request.message}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-3 sm:gap-4">
                                    <div>
                                        <textarea
                                            className="form-textarea w-full px-3 py-2.5 border border-gray-200 rounded-md bg-gray-50 text-gray-900 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y placeholder-gray-500"
                                            placeholder="Message de réponse (optionnel)"
                                            value={processing === request.id ? responseMessage : ''}
                                            onChange={(e) => setResponseMessage(e.target.value)}
                                            rows={2}
                                        />
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                                        <button
                                            onClick={() => handleProcessRequest(request.id, 'approved')}
                                            disabled={processing === request.id}
                                            className="bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 sm:px-6 rounded-md transition-colors duration-200 text-sm sm:text-base w-full sm:w-auto"
                                        >
                                            {processing === request.id ? '⏳ Traitement...' : '✅ Approuver'}
                                        </button>
                                        <button
                                            onClick={() => handleProcessRequest(request.id, 'rejected')}
                                            disabled={processing === request.id}
                                            className="bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 sm:px-6 rounded-md transition-colors duration-200 text-sm sm:text-base w-full sm:w-auto"
                                        >
                                            {processing === request.id ? '⏳ Traitement...' : '❌ Rejeter'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {processedRequests.length > 0 && (
                <div className="mb-6 sm:mb-8">
                    <h3 className="text-gray-700 text-base sm:text-lg font-medium mb-3 sm:mb-4 pb-2 border-b-2 border-gray-200">📋 Demandes traitées ({processedRequests.length})</h3>
                    <div className="flex flex-col gap-4 sm:gap-6">
                        {processedRequests.map(request => (
                            <div key={request.id} className={`bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-md ${
                                request.status === 'approved' ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'
                            }`}>
                                <div>
                                    <div className="text-base sm:text-lg mb-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <strong className="text-gray-900">{request.identifiant_officiel}</strong>
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                            {request.animal_nom && <span className="text-gray-700 text-sm sm:text-base">({request.animal_nom})</span>}
                                            {getStatusBadge(request.status)}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 mb-3 text-xs sm:text-sm text-gray-600">
                                        <div className="bg-gray-100 p-2 sm:p-3 rounded">
                                            <strong className="text-gray-700 block">De:</strong>
                                            <span className="break-words">{request.from_elevage_nom || 'Aucun élevage'}</span>
                                        </div>
                                        <div className="bg-gray-100 p-2 sm:p-3 rounded">
                                            <strong className="text-gray-700 block">Vers:</strong>
                                            <span className="break-words">{request.to_elevage_nom}</span>
                                        </div>
                                        <div className="bg-gray-100 p-2 sm:p-3 rounded">
                                            <strong className="text-gray-700 block">Demandé par:</strong>
                                            <span className="break-words">{request.requested_by_name}</span>
                                        </div>
                                        <div className="bg-gray-100 p-2 sm:p-3 rounded">
                                            <strong className="text-gray-700 block">Traité par:</strong>
                                            <span className="break-words">{request.processed_by_name || 'Système'}</span>
                                        </div>
                                        <div className="bg-gray-100 p-2 sm:p-3 rounded">
                                            <strong className="text-gray-700 block">Date de traitement:</strong>
                                            <span className="break-words">{formatDate(request.updated_at)}</span>
                                        </div>
                                    </div>
                                    {request.response_message && (
                                        <div className="bg-gray-100 p-3 sm:p-4 rounded text-xs sm:text-sm text-gray-700 mt-3">
                                            <strong className="block mb-1">Réponse:</strong>
                                            <span className="break-words">{request.response_message}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {requests.length === 0 && (
                <div className="text-center p-6 sm:p-8 text-gray-700">
                    <p className="text-sm sm:text-base">Aucune demande de transfert trouvée.</p>
                </div>
            )}

        </div>
    );
};

export default TransferRequestManager;