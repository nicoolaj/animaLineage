import React, { createContext, useContext, useState, useEffect } from 'react';

interface LanguageConfig {
  defaultLang: string;
  selectorEnabled: boolean;
}

interface LanguageContextType {
  currentLang: string;
  setLanguage: (lang: string) => void;
  config: LanguageConfig;
  t: (key: string) => string;
}

interface LanguageProviderProps {
  children: React.ReactNode;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Traductions pour le composant CompatibilityTester
const translations = {
  fr: {
    // Titre et description
    'compatibility.title': '🧬 Test de Compatibilité de Reproduction',
    'compatibility.description': 'Analysez la compatibilité reproductive entre deux animaux 🦕 et évaluez le brassage génétique potentiel',

    // Sélection des animaux
    'animal.select1': '🦕 Animal 1',
    'animal.select2': '🦕 Animal 2',
    'animal.search.placeholder': 'Rechercher par nom ou identifiant...',
    'animal.selected': 'Sélectionné:',
    'animal.noname': 'Sans nom',
    'animal.male': '♂️ Mâle',
    'animal.female': '♀️ Femelle',
    'animal.type.undefined': 'Type non défini',

    // Boutons
    'button.analyze': '🧬 Analyser la Compatibilité',
    'button.reset': '🔄 Recommencer',

    // Messages d'erreur
    'error.loading': 'Erreur lors du chargement des animaux.',
    'error.connection': 'Erreur de connexion lors du chargement.',
    'loading.animals': 'Chargement des animaux 🦕...',

    // Résultats de compatibilité
    'result.compatible': '✅ Reproduction Compatible',
    'result.incompatible': '❌ Reproduction Non Recommandée',
    'result.select.both': 'Veuillez sélectionner deux animaux',

    // Vérifications
    'check.species.different': 'Espèces différentes',
    'check.species.undefined': 'Type d\'animal non défini pour les deux animaux',
    'check.species.same': 'Même espèce',
    'check.sex.same.male': 'Même sexe: Mâles',
    'check.sex.same.female': 'Même sexe: Femelles',
    'check.sex.compatible': 'Sexes complémentaires',
    'check.relationship.detected': 'Consanguinité détectée',
    'check.relationship.none': 'Pas de consanguinité directe détectée',

    // Relations familiales
    'relationship.same': 'Même individu',
    'relationship.parent': 'Parent-enfant',
    'relationship.sibling': 'Frère/Sœur',

    // Analyse génétique
    'genetic.title': '🧬 Analyse du Brassage Génétique',
    'genetic.consanguinity': 'Consanguinité directe - diversité génétique très faible',
    'genetic.same.race': 'Même race - diversité modérée',
    'genetic.different.race': 'Races différentes - excellente diversité',
    'genetic.excellent': 'Excellente diversité génétique',
    'genetic.moderate': 'Diversité modérée',
    'genetic.low': 'Diversité faible - risque génétique élevé',
    'genetic.score': 'Score',

    // Recommandations
    'recommendations.title': '💡 Recommandations:',
    'recommendations.avoid': 'Éviter absolument ce croisement',
    'recommendations.unrelated': 'Rechercher des reproducteurs non apparentés',
    'recommendations.crossbreed': 'Considérer un croisement avec une race différente pour diversité maximale',
    'recommendations.optimal': 'Croisement inter-races favorisant la diversité génétique optimale',

    // Descendance
    'offspring.title': '🧬 Descendance Potentielle',
    'offspring.traits': 'Traits Attendus:',
    'offspring.risks': 'Facteurs de Risque:',
    'offspring.traits.typical': 'Traits typiques de la race',
    'offspring.traits.homogeneous': 'Expression homogène des caractéristiques raciales',
    'offspring.traits.mix': 'Mélange des traits',
    'offspring.traits.hybrid': 'Possible vigueur hybride (hétérosis)',
    'offspring.traits.new': 'Combinaisons nouvelles de caractères',
    'offspring.risks.malformations': '🚨 Risque majeur de malformations congénitales',
    'offspring.risks.genetic': '🚨 Forte probabilité de maladies génétiques récessives',
    'offspring.risks.vitality': '🚨 Réduction significative de la vitalité',
    'offspring.risks.fertility': '🚨 Problèmes de fertilité chez la descendance',
    'offspring.risks.breed': 'Risque accru de maladies génétiques liées à la race',
    'offspring.risks.vigor': 'Possible réduction de la vigueur hybride',
    'offspring.risks.minimal': 'Risques génétiques minimaux'
  },
  en: {
    // Titre et description
    'compatibility.title': '🧬 Breeding Compatibility Test',
    'compatibility.description': 'Analyze reproductive compatibility between two animals 🦕 and evaluate genetic diversity potential',

    // Sélection des animaux
    'animal.select1': '🦕 Animal 1',
    'animal.select2': '🦕 Animal 2',
    'animal.search.placeholder': 'Search by name or identifier...',
    'animal.selected': 'Selected:',
    'animal.noname': 'No name',
    'animal.male': '♂️ Male',
    'animal.female': '♀️ Female',
    'animal.type.undefined': 'Undefined type',

    // Boutons
    'button.analyze': '🧬 Analyze Compatibility',
    'button.reset': '🔄 Reset',

    // Messages d'erreur
    'error.loading': 'Error loading animals.',
    'error.connection': 'Connection error during loading.',
    'loading.animals': 'Loading animals 🦕...',

    // Résultats de compatibilité
    'result.compatible': '✅ Compatible Breeding',
    'result.incompatible': '❌ Breeding Not Recommended',
    'result.select.both': 'Please select two animals',

    // Vérifications
    'check.species.different': 'Different species',
    'check.species.undefined': 'Animal type undefined for both animals',
    'check.species.same': 'Same species',
    'check.sex.same.male': 'Same sex: Males',
    'check.sex.same.female': 'Same sex: Females',
    'check.sex.compatible': 'Compatible sexes',
    'check.relationship.detected': 'Inbreeding detected',
    'check.relationship.none': 'No direct inbreeding detected',

    // Relations familiales
    'relationship.same': 'Same individual',
    'relationship.parent': 'Parent-offspring',
    'relationship.sibling': 'Sibling',

    // Analyse génétique
    'genetic.title': '🧬 Genetic Diversity Analysis',
    'genetic.consanguinity': 'Direct inbreeding - very low genetic diversity',
    'genetic.same.race': 'Same breed - moderate diversity',
    'genetic.different.race': 'Different breeds - excellent diversity',
    'genetic.excellent': 'Excellent genetic diversity',
    'genetic.moderate': 'Moderate diversity',
    'genetic.low': 'Low diversity - high genetic risk',
    'genetic.score': 'Score',

    // Recommandations
    'recommendations.title': '💡 Recommendations:',
    'recommendations.avoid': 'Absolutely avoid this breeding',
    'recommendations.unrelated': 'Search for unrelated breeding animals',
    'recommendations.crossbreed': 'Consider crossbreeding with different breed for maximum diversity',
    'recommendations.optimal': 'Inter-breed crossing promoting optimal genetic diversity',

    // Descendance
    'offspring.title': '🧬 Potential Offspring',
    'offspring.traits': 'Expected Traits:',
    'offspring.risks': 'Risk Factors:',
    'offspring.traits.typical': 'Typical breed traits',
    'offspring.traits.homogeneous': 'Homogeneous expression of breed characteristics',
    'offspring.traits.mix': 'Mix of traits',
    'offspring.traits.hybrid': 'Possible hybrid vigor (heterosis)',
    'offspring.traits.new': 'New character combinations',
    'offspring.risks.malformations': '🚨 Major risk of congenital malformations',
    'offspring.risks.genetic': '🚨 High probability of recessive genetic diseases',
    'offspring.risks.vitality': '🚨 Significant reduction in vitality',
    'offspring.risks.fertility': '🚨 Fertility problems in offspring',
    'offspring.risks.breed': 'Increased risk of breed-related genetic diseases',
    'offspring.risks.vigor': 'Possible reduction in hybrid vigor',
    'offspring.risks.minimal': 'Minimal genetic risks'
  }
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // Configuration par défaut (peut être récupérée depuis l'API ou les variables d'environnement)
  const [config] = useState<LanguageConfig>({
    defaultLang: 'fr', // LANG_DEFAULT=fr
    selectorEnabled: false // LANG_SELECTOR=false
  });

  const [currentLang, setCurrentLang] = useState<string>(config.defaultLang);

  useEffect(() => {
    if (config.selectorEnabled) {
      // Si le sélecteur est activé, récupérer la langue sauvegardée ou utiliser la langue par défaut
      const savedLang = localStorage.getItem('selectedLanguage');
      if (savedLang && translations[savedLang as keyof typeof translations]) {
        setCurrentLang(savedLang);
      } else {
        setCurrentLang(config.defaultLang);
      }
    } else {
      // Si le sélecteur est désactivé, utiliser uniquement la langue par défaut
      setCurrentLang(config.defaultLang);
    }
  }, [config.defaultLang, config.selectorEnabled]);

  const setLanguage = (lang: string) => {
    // Ne permettre le changement de langue que si le sélecteur est activé
    if (config.selectorEnabled && translations[lang as keyof typeof translations]) {
      setCurrentLang(lang);
      localStorage.setItem('selectedLanguage', lang);
    }
  };

  const t = (key: string): string => {
    const langTranslations = translations[currentLang as keyof typeof translations];
    return langTranslations?.[key as keyof typeof langTranslations] || key;
  };

  return (
    <LanguageContext.Provider value={{ currentLang, setLanguage, config, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};