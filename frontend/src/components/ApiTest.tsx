import React, { useState } from 'react';
import { API_BASE_URL } from '../config/api';

const ApiTest: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testPing = async () => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch(`${API_BASE_URL}api/ping`);

      if (response.ok) {
        const data = await response.json();
        setResult(`✅ API fonctionne!\n${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`❌ Erreur ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      setResult(`❌ Erreur de connexion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch(`${API_BASE_URL}api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'test',
          password: 'test'
        })
      });

      const data = await response.text();
      setResult(`Response (${response.status}): ${data}`);
    } catch (error) {
      setResult(`❌ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      padding: '20px',
      border: '2px solid #ccc',
      margin: '20px',
      backgroundColor: '#f9f9f9',
      borderRadius: '8px'
    }}>
      <h3>🔧 Test API</h3>
      <p><strong>URL de base:</strong> {API_BASE_URL}</p>

      <div style={{ marginBottom: '10px' }}>
        <button
          onClick={testPing}
          disabled={loading}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Test en cours...' : 'Test Ping'}
        </button>

        <button
          onClick={testLogin}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Test en cours...' : 'Test Login (invalide)'}
        </button>
      </div>

      {result && (
        <pre style={{
          backgroundColor: '#fff',
          padding: '10px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          whiteSpace: 'pre-wrap',
          fontSize: '12px'
        }}>
          {result}
        </pre>
      )}
    </div>
  );
};

export default ApiTest;