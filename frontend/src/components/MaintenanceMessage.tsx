import React from 'react';

interface MaintenanceMessageProps {
  error: string;
  onRetry: () => void;
  isRetrying: boolean;
}

const MaintenanceMessage: React.FC<MaintenanceMessageProps> = ({
  error,
  onRetry,
  isRetrying
}) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        padding: '40px',
        borderRadius: '12px',
        textAlign: 'center',
        maxWidth: '500px',
        margin: '20px',
        border: '2px solid #ff6b6b'
      }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '20px'
        }}>
          🚧
        </div>

        <h2 style={{
          color: '#ff6b6b',
          marginBottom: '20px',
          fontSize: '24px'
        }}>
          Service temporairement indisponible
        </h2>

        <p style={{
          color: '#cccccc',
          marginBottom: '30px',
          lineHeight: '1.6',
          fontSize: '16px'
        }}>
          Nous rencontrons actuellement des difficultés techniques.
          <br />
          <strong>Détail :</strong> {error}
        </p>

        <div style={{
          marginBottom: '20px'
        }}>
          <button
            onClick={onRetry}
            disabled={isRetrying}
            style={{
              backgroundColor: isRetrying ? '#666666' : '#4CAF50',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: isRetrying ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.3s'
            }}
          >
            {isRetrying ? (
              <>
                <span style={{ marginRight: '8px' }}>🔄</span>
                Nouvelle tentative...
              </>
            ) : (
              <>
                <span style={{ marginRight: '8px' }}>🔄</span>
                Réessayer
              </>
            )}
          </button>
        </div>

        <p style={{
          color: '#888888',
          fontSize: '14px',
          margin: 0
        }}>
          Le système retente automatiquement la connexion toutes les 5 minutes.
          <br />
          Nous nous excusons pour ce désagrément.
        </p>
      </div>
    </div>
  );
};

export default MaintenanceMessage;