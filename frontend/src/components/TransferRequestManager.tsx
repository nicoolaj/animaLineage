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
                return <span className="status-badge pending">⏳ En attente</span>;
            case 'approved':
                return <span className="status-badge approved">✅ Approuvée</span>;
            case 'rejected':
                return <span className="status-badge rejected">❌ Rejetée</span>;
            default:
                return <span className="status-badge">{status}</span>;
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
        return <div className="transfer-requests-loading">Chargement des demandes de transfert...</div>;
    }

    if (error) {
        return (
            <div className="transfer-requests-error">
                <p>Erreur: {error}</p>
                <button onClick={loadTransferRequests}>Réessayer</button>
            </div>
        );
    }

    const pendingRequests = requests.filter(r => r.status === 'pending');
    const processedRequests = requests.filter(r => r.status !== 'pending');

    return (
        <div className="transfer-requests-container">
            <div className="transfer-requests-header">
                <h2>🔄 Gestion des demandes de transfert</h2>
                <p>Gérez les demandes de transfert d'animaux entre élevages.</p>
            </div>

            {pendingRequests.length > 0 && (
                <div className="transfer-requests-section">
                    <h3>📥 Demandes en attente ({pendingRequests.length})</h3>
                    <div className="transfer-requests-list">
                        {pendingRequests.map(request => (
                            <div key={request.id} className="transfer-request-card pending">
                                <div className="transfer-request-info">
                                    <div className="animal-info">
                                        <strong>{request.identifiant_officiel}</strong>
                                        {request.animal_nom && ` (${request.animal_nom})`}
                                    </div>
                                    <div className="transfer-details">
                                        <div>
                                            <strong>De:</strong> {request.from_elevage_nom || 'Aucun élevage'}
                                        </div>
                                        <div>
                                            <strong>Vers:</strong> {request.to_elevage_nom}
                                        </div>
                                        <div>
                                            <strong>Demandé par:</strong> {request.requested_by_name}
                                        </div>
                                        <div>
                                            <strong>Date:</strong> {formatDate(request.created_at)}
                                        </div>
                                    </div>
                                    {request.message && (
                                        <div className="request-message">
                                            <strong>Message:</strong> {request.message}
                                        </div>
                                    )}
                                </div>

                                <div className="transfer-request-actions">
                                    <div className="response-input">
                                        <textarea
                                            placeholder="Message de réponse (optionnel)"
                                            value={processing === request.id ? responseMessage : ''}
                                            onChange={(e) => setResponseMessage(e.target.value)}
                                            rows={2}
                                        />
                                    </div>
                                    <div className="action-buttons">
                                        <button
                                            onClick={() => handleProcessRequest(request.id, 'approved')}
                                            disabled={processing === request.id}
                                            className="btn-approve"
                                        >
                                            ✅ Approuver
                                        </button>
                                        <button
                                            onClick={() => handleProcessRequest(request.id, 'rejected')}
                                            disabled={processing === request.id}
                                            className="btn-reject"
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
                <div className="transfer-requests-section">
                    <h3>📋 Demandes traitées ({processedRequests.length})</h3>
                    <div className="transfer-requests-list">
                        {processedRequests.map(request => (
                            <div key={request.id} className={`transfer-request-card ${request.status}`}>
                                <div className="transfer-request-info">
                                    <div className="animal-info">
                                        <strong>{request.identifiant_officiel}</strong>
                                        {request.animal_nom && ` (${request.animal_nom})`}
                                        {getStatusBadge(request.status)}
                                    </div>
                                    <div className="transfer-details">
                                        <div>
                                            <strong>De:</strong> {request.from_elevage_nom || 'Aucun élevage'}
                                        </div>
                                        <div>
                                            <strong>Vers:</strong> {request.to_elevage_nom}
                                        </div>
                                        <div>
                                            <strong>Demandé par:</strong> {request.requested_by_name}
                                        </div>
                                        <div>
                                            <strong>Traité par:</strong> {request.processed_by_name || 'Système'}
                                        </div>
                                        <div>
                                            <strong>Date de traitement:</strong> {formatDate(request.updated_at)}
                                        </div>
                                    </div>
                                    {request.response_message && (
                                        <div className="response-message">
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
                <div className="no-requests">
                    <p>Aucune demande de transfert trouvée.</p>
                </div>
            )}

            <style>{`
                .transfer-requests-container {
                    padding: 2rem;
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .transfer-requests-header {
                    margin-bottom: 2rem;
                }

                .transfer-requests-header h2 {
                    color: #333;
                    margin-bottom: 0.5rem;
                }

                .transfer-requests-section {
                    margin-bottom: 2rem;
                }

                .transfer-requests-section h3 {
                    color: #495057;
                    margin-bottom: 1rem;
                    padding-bottom: 0.5rem;
                    border-bottom: 2px solid #e9ecef;
                }

                .transfer-requests-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .transfer-request-card {
                    background: white;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    padding: 1.5rem;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }

                .transfer-request-card.pending {
                    border-left: 4px solid #ffc107;
                }

                .transfer-request-card.approved {
                    border-left: 4px solid #28a745;
                }

                .transfer-request-card.rejected {
                    border-left: 4px solid #dc3545;
                }

                .transfer-request-info {
                    margin-bottom: 1rem;
                }

                .animal-info {
                    font-size: 1.1rem;
                    margin-bottom: 0.75rem;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .transfer-details {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 0.5rem;
                    margin-bottom: 0.75rem;
                    font-size: 0.9rem;
                    color: #6c757d;
                }

                .request-message,
                .response-message {
                    background: #f8f9fa;
                    padding: 0.75rem;
                    border-radius: 4px;
                    margin-top: 0.75rem;
                    font-size: 0.9rem;
                }

                .transfer-request-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .response-input textarea {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #ced4da;
                    border-radius: 4px;
                    resize: vertical;
                    font-family: inherit;
                }

                .action-buttons {
                    display: flex;
                    gap: 1rem;
                }

                .action-buttons button {
                    padding: 0.75rem 1.5rem;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: background-color 0.2s;
                }

                .btn-approve {
                    background: #28a745;
                    color: white;
                }

                .btn-approve:hover:not(:disabled) {
                    background: #218838;
                }

                .btn-reject {
                    background: #dc3545;
                    color: white;
                }

                .btn-reject:hover:not(:disabled) {
                    background: #c82333;
                }

                .action-buttons button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .status-badge {
                    padding: 0.25rem 0.75rem;
                    border-radius: 12px;
                    font-size: 0.8rem;
                    font-weight: 500;
                }

                .status-badge.pending {
                    background: #fff3cd;
                    color: #856404;
                }

                .status-badge.approved {
                    background: #d4edda;
                    color: #155724;
                }

                .status-badge.rejected {
                    background: #f8d7da;
                    color: #721c24;
                }

                .transfer-requests-loading,
                .transfer-requests-error,
                .no-requests {
                    text-align: center;
                    padding: 2rem;
                    color: #6c757d;
                }

                .transfer-requests-error button {
                    margin-top: 1rem;
                    padding: 0.5rem 1rem;
                    background: #007bff;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }

                @media (max-width: 768px) {
                    .transfer-requests-container {
                        padding: 1rem;
                    }

                    .transfer-details {
                        grid-template-columns: 1fr;
                    }

                    .action-buttons {
                        flex-direction: column;
                    }
                }
            `}</style>
        </div>
    );
};

export default TransferRequestManager;