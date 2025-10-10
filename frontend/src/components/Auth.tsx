import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ApiTest from './ApiTest';
import AdSenseScript from './AdSenseScript';
import Footer from './Footer';
import MentionsLegales from './MentionsLegales';
import PolitiqueConfidentialite from './PolitiqueConfidentialite';

interface AuthProps {
  onBackToLanding?: () => void;
}

const Auth: React.FC<AuthProps> = ({ onBackToLanding }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMentionsLegales, setShowMentionsLegales] = useState(false);
  const [showPolitiqueConfidentialite, setShowPolitiqueConfidentialite] = useState(false);

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

  if (showMentionsLegales) {
    return <MentionsLegales onRetour={() => setShowMentionsLegales(false)} />;
  }

  if (showPolitiqueConfidentialite) {
    return <PolitiqueConfidentialite onRetour={() => setShowPolitiqueConfidentialite(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AdSenseScript />
      {process.env.NODE_ENV === 'development' && <ApiTest />}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6 w-full max-w-sm sm:max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          {onBackToLanding && (
            <button
              onClick={onBackToLanding}
              className="mb-4 text-gray-600 hover:text-gray-800 transition-colors text-sm flex items-center mx-auto focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded-sm"
            >
              ← Retour à l'accueil
            </button>
          )}
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">🦕 AnimaLineage</h1>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">{isLogin ? 'Connexion' : 'Créer un compte'}</h2>
          <div className="bg-blue-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              <strong className="text-blue-400">🏠 Gestion d'élevages</strong> • <strong className="text-green-400">📊 Suivi des lignées</strong>
            </p>
            <p className="text-xs sm:text-sm text-gray-600 mt-2">
              Organisez vos animaux par élevages, suivez leur généalogie et calculez les statistiques de reproduction et d'espérance de vie
            </p>
          </div>
        </div>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded-lg mb-4 sm:mb-6 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {!isLogin && (
            <input
              type="text"
              name="name"
              placeholder="Nom complet"
              value={formData.name}
              onChange={handleInputChange}
              required={!isLogin}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            />
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          />

          <input
            type="password"
            name="password"
            placeholder="Mot de passe (min. 6 caractères)"
            value={formData.password}
            onChange={handleInputChange}
            required
            minLength={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm sm:text-base mt-6"
          >
            {loading ? '⏳ Chargement...' : (isLogin ? '🔓 Se connecter' : '🚀 S\'enregistrer')}
          </button>
        </form>

        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-sm sm:text-base text-gray-700 mb-3">
            {isLogin ? 'Pas encore de compte ?' : 'Déjà un compte ?'}
          </p>
          <button
            type="button"
            onClick={toggleMode}
            className="text-blue-400 hover:text-blue-300 font-medium text-sm sm:text-base underline transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-sm"
            disabled={loading}
          >
            {isLogin ? '📝 Créer un compte' : '🔐 Se connecter'}
          </button>
        </div>
        </div>
      </div>

      <Footer
        onMentionsLegalesClick={() => setShowMentionsLegales(true)}
        onPolitiqueConfidentialiteClick={() => setShowPolitiqueConfidentialite(true)}
      />
    </div>
  );
};

export default Auth;