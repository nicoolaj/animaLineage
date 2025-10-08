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

      {/* Educational Content - Breeding Fundamentals */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Les Fondamentaux de l'Élevage : Guide Complet
            </h2>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              Découvrez les principes essentiels pour un élevage réussi, de la sélection génétique aux bonnes pratiques sanitaires.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Génétique et Hérédité
              </h3>
              <p className="text-gray-700 mb-4">
                Comprendre les lois de Mendel, les caractères dominants et récessifs, et l'impact des croisements sur la descendance.
              </p>
              <div className="text-sm text-gray-600">
                <strong>Point clé :</strong> Un coefficient de consanguinité supérieur à 12,5% nécessite une attention particulière.
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-4xl mb-4">🏥</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Santé et Prévention
              </h3>
              <p className="text-gray-700 mb-4">
                La prévention sanitaire est la clé d'un élevage prospère : vaccinations, vermifugations, et surveillance quotidienne.
              </p>
              <div className="text-sm text-gray-600">
                <strong>Conseil :</strong> Un carnet de santé par animal permet un suivi optimal des traitements et interventions.
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-4xl mb-4">🌱</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Nutrition et Alimentation
              </h3>
              <p className="text-gray-700 mb-4">
                Une alimentation équilibrée adaptée à chaque stade de vie : gestation, lactation, croissance et entretien.
              </p>
              <div className="text-sm text-gray-600">
                <strong>Astuce :</strong> L'herbe de qualité représente souvent 70% des besoins nutritionnels des ruminants.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Practical Guides Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-12 text-center">
            Guides Pratiques pour Éleveurs
          </h2>

          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                🔬 Calcul du Coefficient de Consanguinité
              </h3>
              <p className="text-gray-700 mb-6">
                Le coefficient de consanguinité (COI) mesure la probabilité qu'un animal hérite du même allèle par ses deux parents.
                Plus ce coefficient est élevé, plus les risques génétiques augmentent.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h4 className="font-semibold text-blue-900 mb-3">Formule de Wright :</h4>
                <p className="text-blue-800 mb-2 font-mono">COI = Σ [(1/2)^(n1+n2+1) × (1+FA)]</p>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• n1, n2 : nombre de générations séparant les parents de l'ancêtre commun</li>
                  <li>• FA : coefficient de consanguinité de l'ancêtre commun</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Interprétation des résultats :</h4>
                <ul className="text-yellow-700 space-y-1">
                  <li>• 0-6% : Consanguinité faible, généralement acceptable</li>
                  <li>• 6-12% : Consanguinité modérée, surveillance recommandée</li>
                  <li>• 12%+ : Consanguinité élevée, prudence nécessaire</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                📋 Planning de Reproduction Optimal
              </h3>
              <p className="text-gray-700 mb-6">
                La planification des accouplements nécessite une approche méthodique pour optimiser les résultats génétiques et économiques.
              </p>

              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">Période de saillie optimale :</h4>
                  <p className="text-green-800 text-sm">
                    Planifier les naissances 2-3 mois avant la période d'herbe optimale pour favoriser la lactation naturelle.
                  </p>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-2">Critères de sélection :</h4>
                  <ul className="text-purple-800 text-sm space-y-1">
                    <li>• Conformité au standard de race (50%)</li>
                    <li>• Performances productives (30%)</li>
                    <li>• Santé et longévité (20%)</li>
                  </ul>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-900 mb-2">Rotation des reproducteurs :</h4>
                  <p className="text-orange-800 text-sm">
                    Renouveler 15-20% du cheptel reproducteur chaque année pour maintenir la vigueur génétique.
                  </p>
                </div>
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

      {/* Animal Breeds Knowledge Base */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-12 text-center">
            Guide des Races d'Élevage
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="text-3xl mb-3">🐄</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Bovins Laitiers</h3>
              <p className="text-gray-700 text-sm mb-3">
                Holstein, Montbéliarde, Normande : races optimisées pour la production laitière.
              </p>
              <div className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
                Production moyenne : 6000-9000L/an
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="text-3xl mb-3">🥩</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Bovins Allaitants</h3>
              <p className="text-gray-700 text-sm mb-3">
                Charolaise, Limousine, Aubrac : races spécialisées dans la production de viande.
              </p>
              <div className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded">
                Gain moyen quotidien : 1,2-1,8 kg/jour
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <div className="text-3xl mb-3">🐑</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ovins</h3>
              <p className="text-gray-700 text-sm mb-3">
                Lacaune, Manech, Brebis Rustiques : adaptées aux terroirs et climats variés.
              </p>
              <div className="text-xs text-purple-700 bg-purple-100 px-2 py-1 rounded">
                Prolificité : 1,4-2,2 agneaux/portée
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <div className="text-3xl mb-3">🐷</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Porcins</h3>
              <p className="text-gray-700 text-sm mb-3">
                Large White, Landrace, Duroc : races performantes en production porcine.
              </p>
              <div className="text-xs text-orange-700 bg-orange-100 px-2 py-1 rounded">
                Conversion alimentaire : 2,5-3,2 kg/kg
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-lg p-6">
              <div className="text-3xl mb-3">🐕</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Chiens de Race</h3>
              <p className="text-gray-700 text-sm mb-3">
                Berger Allemand, Golden Retriever, Labrador : sélection sur le tempérament et la morphologie.
              </p>
              <div className="text-xs text-rose-700 bg-rose-100 px-2 py-1 rounded">
                Portée moyenne : 4-8 chiots
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
              <div className="text-3xl mb-3">🐱</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Chats de Race</h3>
              <p className="text-gray-700 text-sm mb-3">
                Maine Coon, Persan, British Shorthair : élevage axé sur la beauté et le caractère.
              </p>
              <div className="text-xs text-indigo-700 bg-indigo-100 px-2 py-1 rounded">
                Portée moyenne : 3-5 chatons
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Companion Animal Breeding Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-12 text-center">
            Élevage d'Animaux de Compagnie : L'Art de la Sélection
          </h2>

          <div className="grid lg:grid-cols-2 gap-12 mb-12">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                🐕 Élevage Canin : Passion et Responsabilité
              </h3>
              <p className="text-gray-700 mb-6">
                L'élevage canin représente un art millénaire qui allie passion, science et responsabilité.
                Contrairement à l'élevage de production, l'objectif est d'améliorer les qualités morphologiques,
                comportementales et sanitaires d'une race, tout en préservant sa diversité génétique.
              </p>

              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-800 mb-2">🏆 Groupes FCI (Fédération Cynologique Internationale)</h4>
                  <div className="grid md:grid-cols-2 gap-2 text-sm text-amber-700">
                    <div>• Groupe 1 : Chiens de berger</div>
                    <div>• Groupe 2 : Chiens de garde</div>
                    <div>• Groupe 3 : Terriers</div>
                    <div>• Groupe 4 : Teckels</div>
                    <div>• Groupe 5 : Spitz et primitifs</div>
                    <div>• Groupe 6 : Chiens courants</div>
                    <div>• Groupe 7 : Chiens d'arrêt</div>
                    <div>• Groupe 8 : Chiens rapporteurs</div>
                    <div>• Groupe 9 : Chiens d'agrément</div>
                    <div>• Groupe 10 : Lévriers</div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">📊 Tests génétiques recommandés</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Dysplasie hanches/coudes (radiographie officielle)</li>
                    <li>• Tests ADN maladies héréditaires (PRA, DM, MDR1...)</li>
                    <li>• Examen cardiaque (échographie + électrocardiogramme)</li>
                    <li>• Tests comportementaux (TAN, TT, tests de caractère)</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                🐱 Élevage Félin : Élégance et Diversité
              </h3>
              <p className="text-gray-700 mb-6">
                L'élevage félin se distingue par une incroyable diversité de races, allant du géant Maine Coon
                au délicat Oriental. Chaque race possède ses spécificités génétiques, morphologiques et
                comportementales qui nécessitent une approche personnalisée.
              </p>

              <div className="space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-800 mb-2">🎨 Catégories de races félines</h4>
                  <div className="text-sm text-purple-700 space-y-1">
                    <div><strong>Poil long :</strong> Persan, Maine Coon, Ragdoll, Norvégien</div>
                    <div><strong>Poil court :</strong> British, American Shorthair, Russian Blue</div>
                    <div><strong>Orientaux :</strong> Siamois, Oriental, Balinais, Cornish Rex</div>
                    <div><strong>Rares/nouvelles :</strong> Bengal, Savannah, Sphynx, Scottish Fold</div>
                  </div>
                </div>

                <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
                  <h4 className="font-semibold text-rose-800 mb-2">🔬 Spécificités génétiques</h4>
                  <ul className="text-sm text-rose-700 space-y-1">
                    <li>• Polykystose rénale (PKD) chez les Persans</li>
                    <li>• Cardiomyopathie hypertrophique (HCM)</li>
                    <li>• Tests couleurs et motifs (solid, tabby, silver...)</li>
                    <li>• Compatibilité groupes sanguins (A, B, AB)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed breed information */}
          <div className="bg-gray-50 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Races Populaires et Leurs Caractéristiques
            </h3>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-3">🐕‍🦺</div>
                  <h4 className="text-lg font-semibold text-gray-900">Berger Allemand</h4>
                </div>
                <div className="space-y-2 text-sm text-gray-700">
                  <div><strong>Taille :</strong> 55-65 cm</div>
                  <div><strong>Poids :</strong> 22-40 kg</div>
                  <div><strong>Espérance de vie :</strong> 9-13 ans</div>
                  <div><strong>Tempérament :</strong> Loyal, courageux, polyvalent</div>
                  <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded mt-2">
                    Vigilance : Dysplasie hanches/coudes
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-3">🦮</div>
                  <h4 className="text-lg font-semibold text-gray-900">Golden Retriever</h4>
                </div>
                <div className="space-y-2 text-sm text-gray-700">
                  <div><strong>Taille :</strong> 51-61 cm</div>
                  <div><strong>Poids :</strong> 25-34 kg</div>
                  <div><strong>Espérance de vie :</strong> 10-12 ans</div>
                  <div><strong>Tempérament :</strong> Doux, intelligent, familial</div>
                  <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded mt-2">
                    Vigilance : Cancer, problèmes cardiaques
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-3">🐕</div>
                  <h4 className="text-lg font-semibold text-gray-900">Bouledogue Français</h4>
                </div>
                <div className="space-y-2 text-sm text-gray-700">
                  <div><strong>Taille :</strong> 24-35 cm</div>
                  <div><strong>Poids :</strong> 8-14 kg</div>
                  <div><strong>Espérance de vie :</strong> 10-14 ans</div>
                  <div><strong>Tempérament :</strong> Affectueux, vif, sociable</div>
                  <div className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded mt-2">
                    Vigilance : Problèmes respiratoires
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-3">🐱</div>
                  <h4 className="text-lg font-semibold text-gray-900">Maine Coon</h4>
                </div>
                <div className="space-y-2 text-sm text-gray-700">
                  <div><strong>Taille :</strong> Grande (jusqu'à 1m)</div>
                  <div><strong>Poids :</strong> 4-10 kg</div>
                  <div><strong>Espérance de vie :</strong> 12-15 ans</div>
                  <div><strong>Tempérament :</strong> Doux géant, sociable</div>
                  <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded mt-2">
                    Vigilance : Cardiomyopathie (HCM)
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-3">😺</div>
                  <h4 className="text-lg font-semibold text-gray-900">Persan</h4>
                </div>
                <div className="space-y-2 text-sm text-gray-700">
                  <div><strong>Taille :</strong> Moyenne</div>
                  <div><strong>Poids :</strong> 3-7 kg</div>
                  <div><strong>Espérance de vie :</strong> 12-17 ans</div>
                  <div><strong>Tempérament :</strong> Calme, affectueux</div>
                  <div className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded mt-2">
                    Vigilance : PKD, problèmes respiratoires
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-3">🐈</div>
                  <h4 className="text-lg font-semibold text-gray-900">British Shorthair</h4>
                </div>
                <div className="space-y-2 text-sm text-gray-700">
                  <div><strong>Taille :</strong> Moyenne à grande</div>
                  <div><strong>Poids :</strong> 3-8 kg</div>
                  <div><strong>Espérance de vie :</strong> 12-20 ans</div>
                  <div><strong>Tempérament :</strong> Indépendant, placide</div>
                  <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded mt-2">
                    Race robuste, peu de problèmes
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Legal and Regulatory Information */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-12 text-center">
            Réglementation et Bonnes Pratiques
          </h2>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Identification Obligatoire
              </h3>
              <p className="text-gray-700 mb-4">
                Depuis 2010, l'identification électronique est obligatoire pour tous les bovins, ovins et caprins.
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-3">
                <h4 className="font-semibold text-blue-800 text-sm mb-1">Délais légaux :</h4>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• Bovins : dans les 7 jours</li>
                  <li>• Ovins/Caprins : avant 6 mois</li>
                  <li>• Porcins : avant le sevrage</li>
                </ul>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-4xl mb-4">🏥</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Suivi Sanitaire
              </h3>
              <p className="text-gray-700 mb-4">
                Le plan de prophylaxie national impose des dépistages réguliers pour certaines maladies.
              </p>
              <div className="bg-green-50 border-l-4 border-green-400 p-3">
                <h4 className="font-semibold text-green-800 text-sm mb-1">Dépistages obligatoires :</h4>
                <ul className="text-green-700 text-sm space-y-1">
                  <li>• Tuberculose : annuel</li>
                  <li>• Brucellose : annuel</li>
                  <li>• IBR : selon statut</li>
                </ul>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Bien-être Animal
              </h3>
              <p className="text-gray-700 mb-4">
                Les réglementations européennes imposent des standards stricts pour le bien-être des animaux d'élevage.
              </p>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
                <h4 className="font-semibold text-yellow-800 text-sm mb-1">5 libertés fondamentales :</h4>
                <ul className="text-yellow-700 text-sm space-y-1">
                  <li>• Absence de faim et soif</li>
                  <li>• Confort physique</li>
                  <li>• Absence de douleur</li>
                  <li>• Expression comportementale</li>
                  <li>• Absence de stress</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology and Innovation */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-12 text-center">
            Innovation Technologique en Élevage
          </h2>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                🤖 L'Intelligence Artificielle au Service de l'Élevage
              </h3>
              <p className="text-gray-700 mb-6">
                Les nouvelles technologies révolutionnent l'élevage moderne : capteurs IoT, intelligence artificielle,
                et analyses prédictives permettent une gestion précise et personnalisée de chaque animal.
              </p>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">📡</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Capteurs Connectés</h4>
                    <p className="text-gray-700 text-sm">
                      Surveillance en temps réel de la température, activité, rumination et cycles reproductifs.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="text-2xl">🎯</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Prédiction Précoce</h4>
                    <p className="text-gray-700 text-sm">
                      Détection précoce des chaleurs, prédiction des vêlages et alertes sanitaires automatiques.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="text-2xl">📊</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Analyses Avancées</h4>
                    <p className="text-gray-700 text-sm">
                      Optimisation de l'alimentation, amélioration génétique et gestion prévisionnelle du troupeau.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl p-8">
              <h4 className="text-xl font-semibold text-gray-800 mb-4 text-center">
                Retour sur Investissement Technologique
              </h4>
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Réduction mortalité</span>
                    <span className="text-green-600 font-bold">-15%</span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Amélioration fertilité</span>
                    <span className="text-green-600 font-bold">+12%</span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Économie aliments</span>
                    <span className="text-green-600 font-bold">-8%</span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Gain temps/jour</span>
                    <span className="text-blue-600 font-bold">2h</span>
                  </div>
                </div>
              </div>
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

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-12 text-center">
            Questions Fréquentes sur l'Élevage
          </h2>

          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                🤔 Comment calculer l'indice de consanguinité de mes animaux ?
              </h3>
              <p className="text-gray-700 mb-3">
                L'indice de consanguinité se calcule en analysant l'arbre généalogique sur 4-5 générations.
                Notre outil automatise ce calcul complexe en utilisant la formule de Wright et vous alerte
                si le coefficient dépasse les seuils recommandés (6% modéré, 12% élevé).
              </p>
              <div className="text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded">
                <strong>Astuce :</strong> Maintenez un coefficient inférieur à 6% pour optimiser la vigueur hybride.
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                🏥 Quelle est la fréquence recommandée pour les contrôles vétérinaires ?
              </h3>
              <p className="text-gray-700 mb-3">
                Les contrôles dépendent de l'espèce et du type d'élevage. En général : visite annuelle minimum
                pour les bovins adultes, contrôle semestriel pour les reproducteurs, et surveillance mensuelle
                pour les jeunes en croissance.
              </p>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="text-sm bg-green-50 border border-green-200 p-3 rounded">
                  <strong className="text-green-800">Préventif :</strong>
                  <ul className="text-green-700 mt-1 space-y-1">
                    <li>• Vaccinations annuelles</li>
                    <li>• Vermifugations saisonnières</li>
                    <li>• Contrôle dentaire</li>
                  </ul>
                </div>
                <div className="text-sm bg-orange-50 border border-orange-200 p-3 rounded">
                  <strong className="text-orange-800">Reproducteur :</strong>
                  <ul className="text-orange-700 mt-1 space-y-1">
                    <li>• Examen de fertilité</li>
                    <li>• Contrôle échographique</li>
                    <li>• Suivi hormonal</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                💰 Quels sont les coûts moyens d'élevage par animal et par an ?
              </h3>
              <p className="text-gray-700 mb-4">
                Les coûts varient selon l'espèce, la région et le mode d'élevage. L'alimentation représente
                généralement 60-70% des coûts, suivie des frais vétérinaires (10-15%) et de l'amortissement
                des équipements (15-20%).
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center bg-blue-50 border border-blue-200 p-4 rounded">
                  <div className="text-2xl font-bold text-blue-600">1200-1800€</div>
                  <div className="text-sm text-blue-800">Vache laitière/an</div>
                </div>
                <div className="text-center bg-green-50 border border-green-200 p-4 rounded">
                  <div className="text-2xl font-bold text-green-600">800-1200€</div>
                  <div className="text-sm text-green-800">Vache allaitante/an</div>
                </div>
                <div className="text-center bg-purple-50 border border-purple-200 p-4 rounded">
                  <div className="text-2xl font-bold text-purple-600">80-150€</div>
                  <div className="text-sm text-purple-800">Brebis/an</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                🌱 Comment optimiser l'alimentation selon les saisons ?
              </h3>
              <p className="text-gray-700 mb-4">
                L'alimentation saisonnière permet de réduire les coûts tout en respectant les besoins nutritionnels.
                L'objectif est de maximiser l'utilisation du pâturage et des fourrages conservés.
              </p>
              <div className="grid md:grid-cols-4 gap-3 text-sm">
                <div className="bg-green-100 border border-green-300 p-3 rounded text-center">
                  <div className="font-semibold text-green-800">🌸 Printemps</div>
                  <div className="text-green-700 mt-1">Pâturage jeunes pousses</div>
                </div>
                <div className="bg-yellow-100 border border-yellow-300 p-3 rounded text-center">
                  <div className="font-semibold text-yellow-800">☀️ Été</div>
                  <div className="text-yellow-700 mt-1">Herbe + compléments</div>
                </div>
                <div className="bg-orange-100 border border-orange-300 p-3 rounded text-center">
                  <div className="font-semibold text-orange-800">🍂 Automne</div>
                  <div className="text-orange-700 mt-1">Regains + concentrés</div>
                </div>
                <div className="bg-blue-100 border border-blue-300 p-3 rounded text-center">
                  <div className="font-semibold text-blue-800">❄️ Hiver</div>
                  <div className="text-blue-700 mt-1">Fourrages conservés</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                📊 Comment interpréter les performances de reproduction ?
              </h3>
              <p className="text-gray-700 mb-4">
                Les indicateurs de reproduction sont cruciaux pour évaluer l'efficacité économique de l'élevage.
                Un suivi rigoureux permet d'identifier rapidement les problèmes et d'ajuster la stratégie.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Bovins - Objectifs cibles :</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Taux de réussite IA : {'>'}65%</li>
                    <li>• Intervalle vêlage-vêlage : 365-380 jours</li>
                    <li>• Taux de mortalité veaux : {'<'}5%</li>
                    <li>• Age au 1er vêlage : 24-30 mois</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Ovins - Objectifs cibles :</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Fertilité : {'>'}90%</li>
                    <li>• Prolificité : 1,5-2,0 agneaux/brebis</li>
                    <li>• Mortalité agneaux : {'<'}10%</li>
                    <li>• Productivité numérique : {'>'}1,3</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                🐕🐱 Quelles sont les spécificités de l'élevage canin et félin ?
              </h3>
              <p className="text-gray-700 mb-4">
                L'élevage d'animaux de compagnie diffère fondamentalement de l'élevage de production.
                L'objectif n'est pas la rentabilité immédiate mais l'amélioration de la race sur le long terme.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">🐕 Élevage canin :</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Tests de santé obligatoires avant reproduction</li>
                    <li>• Confirmation au LOF (Livre des Origines Français)</li>
                    <li>• Respect des standards de race (morphologie, caractère)</li>
                    <li>• Suivi comportemental et socialisation précoce</li>
                    <li>• Limitation des portées (2-3 par an maximum)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">🐱 Élevage félin :</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Tests génétiques spécifiques (PKD, HCM, PRA...)</li>
                    <li>• Enregistrement LOOF (Livre Officiel des Origines Félines)</li>
                    <li>• Gestion des groupes sanguins (incompatibilité A/B)</li>
                    <li>• Cycles de reproduction naturels respectés</li>
                    <li>• Attention particulière à la consanguinité</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800">
                  <strong>Point important :</strong> Contrairement aux animaux de production, la valeur d'un animal de compagnie
                  se mesure sur sa conformité au standard, sa santé génétique et son tempérament, pas sur sa productivité.
                </p>
              </div>
            </div>
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