import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let success = false;

      if (isLogin) {
        success = await login(formData.email, formData.password);
        if (!success) {
          setError('Email ou mot de passe incorrect');
        }
      } else {
        if (!formData.name.trim()) {
          setError('Le nom est requis');
          setLoading(false);
          return;
        }
        success = await register(formData.name, formData.email, formData.password);
        if (!success) {
          setError('Erreur lors de l\'enregistrement. Email déjà utilisé?');
        }
      }
    } catch (err) {
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(''); // Clear error when user types
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({ name: '', email: '', password: '' });
    setError('');
  };

  return (
    <div id="auth-container" className="auth-container">
      <div id="auth-card" className="auth-card">
        <h1>React + PHP Web App</h1>
        <h2>{isLogin ? 'Connexion' : 'Créer un compte'}</h2>

        {error && <div id="auth-error-message" className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <input
              type="text"
              name="name"
              placeholder="Nom complet"
              value={formData.name}
              onChange={handleInputChange}
              required={!isLogin}
            />
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Mot de passe"
            value={formData.password}
            onChange={handleInputChange}
            required
            minLength={6}
          />

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : 'S\'enregistrer')}
          </button>
        </form>

        <div id="auth-toggle" className="auth-toggle">
          <p>
            {isLogin ? 'Pas encore de compte ?' : 'Déjà un compte ?'}
            <button
              type="button"
              onClick={toggleMode}
              className="toggle-button"
              disabled={loading}
            >
              {isLogin ? 'Créer un compte' : 'Se connecter'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;