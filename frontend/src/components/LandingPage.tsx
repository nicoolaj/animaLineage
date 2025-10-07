import React, { useState } from 'react';
import Auth from './Auth';
import Footer from './Footer';
import MentionsLegales from './MentionsLegales';
import PolitiqueConfidentialite from './PolitiqueConfidentialite';
import LanguageSelector from './LanguageSelector';
import { useTranslation } from '../hooks/useTranslation';

type PageType = 'landing' | 'auth' | 'mentions-legales' | 'politique-confidentialite';

const LandingPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageType>('landing');
  const { ui } = useTranslation();

  const handleShowAuth = () => setCurrentPage('auth');
  const handleBackToLanding = () => setCurrentPage('landing');

  if (currentPage === 'auth') {
    return <Auth onBackToLanding={handleBackToLanding} />;
  }

  if (currentPage === 'mentions-legales') {
    return <MentionsLegales onRetour={handleBackToLanding} />;
  }

  if (currentPage === 'politique-confidentialite') {
    return <PolitiqueConfidentialite onRetour={handleBackToLanding} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img
                src="/logo_full.svg"
                alt="AnimaLineage"
                className="h-8 w-auto"
              />
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSelector />
              <button
                onClick={handleShowAuth}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Se connecter
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              Optimisez Votre Élevage avec la
              <span className="text-blue-600 block mt-2">
                Gestion Intelligente de Troupeau et de Lignée
              </span>
              <span className="text-2xl sm:text-3xl lg:text-4xl">🧬</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
              L'élevage, qu'il soit professionnel ou passionné, repose sur une gestion rigoureuse pour assurer
              la santé, la productivité et la pérennité de vos animaux.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleShowAuth}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Commencer maintenant
              </button>
              <button
                onClick={handleShowAuth}
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold text-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Créer un compte
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Le Défi de la Race Pure : Maîtriser le Brassage Génétique
              </h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Maintenir une race animale dans sa pureté est un engagement noble, mais complexe.
                Il ne suffit pas de s'assurer que les parents sont de la même race. Le véritable défi
                réside dans la prévention de la consanguinité excessive et la maximisation de la
                diversité génétique au sein d'un cheptel parfois limité.
              </p>
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                <h3 className="font-semibold text-red-800 mb-2">Un brassage génétique mal maîtrisé peut entraîner :</h3>
                <ul className="text-red-700 space-y-1">
                  <li>• Une baisse de fertilité et de la vigueur</li>
                  <li>• Une sensibilité accrue aux maladies</li>
                  <li>• L'apparition de tarres génétiques indésirables</li>
                </ul>
              </div>
              <p className="text-gray-700">
                Pour éviter ces écueils, chaque décision de reproduction doit être prise en pleine
                connaissance des liens de parenté et des caractéristiques génétiques des individus.
              </p>
            </div>
            <div className="lg:order-first">
              <div className="bg-gradient-to-br from-blue-100 to-green-100 rounded-2xl p-8 text-center">
                <div className="text-6xl mb-4">🐄</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Gestion de Troupeau</h3>
                <p className="text-gray-700">
                  Suivez la santé, les performances et la généalogie de chaque animal
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Un Outil Essentiel pour une Sélection Éclairée
            </h2>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              Notre plateforme de gestion est conçue spécifiquement pour répondre à ces exigences pointues.
              Elle transforme la complexité des données généalogiques en informations claires et exploitables.
            </p>
          </div>

          <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-lg mb-3 sm:mb-0 w-fit">
                  <span className="text-2xl">🌳</span>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 sm:ml-4">
                  Généalogie Détaillée et Intuitive
                </h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Enregistrez et visualisez l'arbre généalogique de chaque animal sur plusieurs générations.
                Identifiez instantanément les degrés de parenté (cousinage, demi-frères/sœurs, etc.).
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center mb-4">
                <div className="bg-green-100 p-3 rounded-lg mb-3 sm:mb-0 w-fit">
                  <span className="text-2xl">🧮</span>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 sm:ml-4">
                  Calcul Automatique du Coefficient de Consanguinité
                </h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Fini les calculs complexes ! L'outil évalue le coefficient de consanguinité (COI) potentiel
                avant tout accouplement pour optimiser le brassage génétique.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center mb-4">
                <div className="bg-purple-100 p-3 rounded-lg mb-3 sm:mb-0 w-fit">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 sm:ml-4">
                  Gestion Complète du Troupeau
                </h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Suivez la santé, les performances, les traitements vétérinaires et les mouvements
                de chaque animal. Centralisez toute l'information pour un suivi irréprochable.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center mb-4">
                <div className="bg-orange-100 p-3 rounded-lg mb-3 sm:mb-0 w-fit">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 sm:ml-4">
                  Aide à la Décision de Reproduction
                </h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Le système suggère des accouplements idéaux basés sur des critères génétiques que vous définissez,
                garantissant la pérennité et l'amélioration des lignées.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Un investissement stratégique pour l'excellence
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Un logiciel de gestion n'est plus un luxe, c'est l'investissement le plus stratégique
            pour quiconque souhaite exceller dans l'élevage de race pure, garantissant la qualité
            et la diversité génétique de son cheptel pour les années à venir.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleShowAuth}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
            >
              Découvrir la solution
            </button>
            <button
              onClick={handleShowAuth}
              className="bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold text-lg border-2 border-blue-400 hover:bg-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
            >
              Créer mon compte gratuit
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer
        onMentionsLegalesClick={() => setCurrentPage('mentions-legales')}
        onPolitiqueConfidentialiteClick={() => setCurrentPage('politique-confidentialite')}
      />
    </div>
  );
};

export default LandingPage;