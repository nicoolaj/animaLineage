import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ApiTest from './ApiTest';
import AdSenseScript from './AdSenseScript';

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
    <div id="auth-container" className="auth-container min-h-screen bg-gray-800 flex items-center justify-center p-4 sm:p-6">
      <AdSenseScript />
      {process.env.NODE_ENV === 'development' && <ApiTest />}
      <div id="auth-card" className="auth-card bg-gray-700 rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-sm sm:max-w-md border border-gray-600">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 sm:mb-3">🦕 AnimaLineage</h1>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-200">{isLogin ? 'Connexion' : 'Créer un compte'}</h2>
        </div>

        {error && <div id="auth-error-message" className="error-message bg-red-600 text-white px-3 py-2.5 rounded-md mb-4 sm:mb-6 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form space-y-4 sm:space-y-5">
          {!isLogin && (
            <input
              type="text"
              name="name"
              placeholder="Nom complet"
              value={formData.name}
              onChange={handleInputChange}
              required={!isLogin}
              className="form-input w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-800 text-white text-sm sm:text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            />
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="form-input w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-800 text-white text-sm sm:text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
          />

          <input
            type="password"
            name="password"
            placeholder="Mot de passe (min. 6 caractères)"
            value={formData.password}
            onChange={handleInputChange}
            required
            minLength={6}
            className="form-input w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-800 text-white text-sm sm:text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
          />

          <button
            type="submit"
            disabled={loading}
            className="auth-button w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 text-sm sm:text-base mt-6"
          >
            {loading ? '⏳ Chargement...' : (isLogin ? '🔓 Se connecter' : '🚀 S\'enregistrer')}
          </button>
        </form>

        <div id="auth-toggle" className="auth-toggle mt-6 sm:mt-8 text-center">
          <p className="text-sm sm:text-base text-gray-300 mb-3">
            {isLogin ? 'Pas encore de compte ?' : 'Déjà un compte ?'}
          </p>
          <button
            type="button"
            onClick={toggleMode}
            className="toggle-button text-blue-400 hover:text-blue-300 font-medium text-sm sm:text-base underline transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {isLogin ? '📝 Créer un compte' : '🔐 Se connecter'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;