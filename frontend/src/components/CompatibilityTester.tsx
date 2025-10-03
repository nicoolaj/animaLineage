import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { API_BASE_URL } from '../config/api';

interface Animal {
  id: number;
  nom: string;
  identifiant_officiel: string;
  sexe: 'M' | 'F';
  race_id: number;
  race_nom: string;
  type_animal_nom: string;
  pere_nom?: string;
  mere_nom?: string;
  pere_id?: number;
  mere_id?: number;
  date_naissance: string;
  date_deces?: string;
  elevage_nom: string;
}

interface CompatibilityResult {
  compatible: boolean;
  reasons: string[];
  geneticDiversity: {
    score: number;
    analysis: string;
    recommendations: string[];
  };
  offspring: {
    possibleTraits: string[];
    riskFactors: string[];
  };
}

const CompatibilityTester: React.FC = () => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [selectedAnimal1, setSelectedAnimal1] = useState<Animal | null>(null);
  const [selectedAnimal2, setSelectedAnimal2] = useState<Animal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [searchTerm1, setSearchTerm1] = useState('');
  const [searchTerm2, setSearchTerm2] = useState('');

  const { getAuthHeaders } = useAuth();
  const { t } = useLanguage();

  const fetchAnimals = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_BASE_URL}api/animaux`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        // Filtrer seulement les animaux vivants
        const livingAnimals = data.filter((animal: Animal) => !animal.date_deces);
        setAnimals(livingAnimals);
      } else {
        setError(t('error.loading'));
      }
    } catch (error) {
      console.error('Error fetching animals:', error);
      setError(t('error.connection'));
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, t]);

  useEffect(() => {
    fetchAnimals();
  }, [fetchAnimals]);

  const filteredAnimals1 = animals.filter(animal =>
    (animal.nom?.toLowerCase() || '').includes(searchTerm1.toLowerCase()) ||
    (animal.identifiant_officiel?.toLowerCase() || '').includes(searchTerm1.toLowerCase())
  );

  const filteredAnimals2 = animals.filter(animal =>
    (animal.nom?.toLowerCase() || '').includes(searchTerm2.toLowerCase()) ||
    (animal.identifiant_officiel?.toLowerCase() || '').includes(searchTerm2.toLowerCase())
  );

  const calculateCompatibility = (): CompatibilityResult => {
    if (!selectedAnimal1 || !selectedAnimal2) {
      return {
        compatible: false,
        reasons: [t('result.select.both')],
        geneticDiversity: { score: 0, analysis: '', recommendations: [] },
        offspring: { possibleTraits: [], riskFactors: [] }
      };
    }

    const reasons: string[] = [];
    let compatible = true;

    // Vérification de l'espèce (même type d'animal)
    const type1 = selectedAnimal1.type_animal_nom || t('animal.type.undefined');
    const type2 = selectedAnimal2.type_animal_nom || t('animal.type.undefined');

    if (type1 !== type2) {
      compatible = false;
      reasons.push(`❌ ${t('check.species.different')}: ${type1} ≠ ${type2}`);
    } else if (type1 === t('animal.type.undefined')) {
      reasons.push(`⚠️ ${t('check.species.undefined')}`);
    } else {
      reasons.push(`✅ ${t('check.species.same')}: ${type1}`);
    }

    // Vérification du sexe
    if (selectedAnimal1.sexe === selectedAnimal2.sexe) {
      compatible = false;
      const sexText = selectedAnimal1.sexe === 'M' ? t('check.sex.same.male') : t('check.sex.same.female');
      reasons.push(`❌ ${sexText}`);
    } else {
      const male = selectedAnimal1.sexe === 'M' ? t('animal.male') : selectedAnimal2.sexe === 'M' ? t('animal.male') : '';
      const female = selectedAnimal1.sexe === 'F' ? t('animal.female') : selectedAnimal2.sexe === 'F' ? t('animal.female') : '';
      reasons.push(`✅ ${t('check.sex.compatible')}: ${male} × ${female}`);
    }

    // Vérification de la consanguinité
    const isRelated = checkRelationship(selectedAnimal1, selectedAnimal2);
    if (isRelated.related) {
      compatible = false;
      reasons.push(`❌ ${t('check.relationship.detected')}: ${isRelated.relationship}`);
    } else {
      reasons.push(`✅ ${t('check.relationship.none')}`);
    }

    // Analyse du brassage génétique
    const geneticAnalysis = analyzeGeneticDiversity(selectedAnimal1, selectedAnimal2, isRelated.related);

    return {
      compatible,
      reasons,
      geneticDiversity: geneticAnalysis,
      offspring: {
        possibleTraits: generatePossibleTraits(selectedAnimal1, selectedAnimal2),
        riskFactors: generateRiskFactors(selectedAnimal1, selectedAnimal2, isRelated.related)
      }
    };
  };

  const checkRelationship = (animal1: Animal, animal2: Animal) => {
    // Vérifier si c'est le même animal
    if (animal1.id === animal2.id) {
      return { related: true, relationship: t('relationship.same') };
    }

    // Vérifier relation parent-enfant
    if (animal1.pere_id === animal2.id || animal1.mere_id === animal2.id) {
      return { related: true, relationship: t('relationship.parent') };
    }
    if (animal2.pere_id === animal1.id || animal2.mere_id === animal1.id) {
      return { related: true, relationship: t('relationship.parent') };
    }

    // Vérifier fratrie (mêmes parents)
    if ((animal1.pere_id && animal1.pere_id === animal2.pere_id) ||
        (animal1.mere_id && animal1.mere_id === animal2.mere_id)) {
      return { related: true, relationship: t('relationship.sibling') };
    }

    return { related: false, relationship: '' };
  };

  const analyzeGeneticDiversity = (animal1: Animal, animal2: Animal, isConsanguineous: boolean = false) => {
    let score = 100;
    const analysis: string[] = [];
    const recommendations: string[] = [];

    // Si consanguinité détectée, score automatiquement très bas
    if (isConsanguineous) {
      score = 20;
      analysis.push(`🔴 ${t('genetic.consanguinity')}`);
      recommendations.push(t('recommendations.avoid'));
      recommendations.push(t('recommendations.unrelated'));
    } else {
      // Analyse par race (seulement si pas de consanguinité)
      if (animal1.race_nom === animal2.race_nom) {
        score = 80; // Score réduit mais toujours bon pour même race
        analysis.push(`🟡 ${t('genetic.same.race')}`);
        recommendations.push(t('recommendations.crossbreed'));
      } else {
        analysis.push(`🟢 ${t('genetic.different.race')}`);
        recommendations.push(t('recommendations.optimal'));
      }
    }

    // Score final
    let scoreText = '';
    if (score >= 90) scoreText = `🟢 ${t('genetic.excellent')}`;
    else if (score >= 70) scoreText = `🟡 ${t('genetic.moderate')}`;
    else scoreText = `🔴 ${t('genetic.low')}`;

    return {
      score,
      analysis: `${scoreText} (${t('genetic.score')}: ${score}/100)\n\n${analysis.join('\n')}`,
      recommendations
    };
  };

  const generatePossibleTraits = (animal1: Animal, animal2: Animal): string[] => {
    const traits = [];

    if (animal1.race_nom === animal2.race_nom) {
      traits.push(`${t('offspring.traits.typical')} ${animal1.race_nom}`);
      traits.push(t('offspring.traits.homogeneous'));
    } else {
      traits.push(`${t('offspring.traits.mix')} ${animal1.race_nom} × ${animal2.race_nom}`);
      traits.push(t('offspring.traits.hybrid'));
      traits.push(t('offspring.traits.new'));
    }

    return traits;
  };

  const generateRiskFactors = (animal1: Animal, animal2: Animal, isConsanguineous: boolean = false): string[] => {
    const risks = [];

    if (isConsanguineous) {
      risks.push(t('offspring.risks.malformations'));
      risks.push(t('offspring.risks.genetic'));
      risks.push(t('offspring.risks.vitality'));
      risks.push(t('offspring.risks.fertility'));
    } else if (animal1.race_nom === animal2.race_nom) {
      risks.push(t('offspring.risks.breed'));
      risks.push(t('offspring.risks.vigor'));
    }

    if (risks.length === 0) {
      risks.push(t('offspring.risks.minimal'));
    }

    return risks;
  };

  const handleTestCompatibility = () => {
    const compatibility = calculateCompatibility();
    setResult(compatibility);
  };

  const resetTest = () => {
    setSelectedAnimal1(null);
    setSelectedAnimal2(null);
    setResult(null);
    setSearchTerm1('');
    setSearchTerm2('');
  };

  if (loading) {
    return <div className="loading">{t('loading.animals')}</div>;
  }

  return (
    <div className="p-5 max-w-7xl mx-auto bg-gray-700 min-h-screen text-white">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">{t('compatibility.title')}</h2>
        <p className="text-gray-300">
          {t('compatibility.description')}
        </p>
      </div>

      {error && (
        <div className="error-message mb-6">
          ⚠️ {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Sélection Animal 1 */}
        <div className="bg-gray-700 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">{t('animal.select1')}</h3>
          <input
            type="text"
            placeholder={t('animal.search.placeholder')}
            value={searchTerm1}
            onChange={(e) => setSearchTerm1(e.target.value)}
            className="form-input mb-4"
          />
          <div className="max-h-40 overflow-y-auto border border-gray-600 rounded">
            {filteredAnimals1.map((animal) => (
              <div
                key={animal.id}
                onClick={() => setSelectedAnimal1(animal)}
                className={`p-3 cursor-pointer border-b border-gray-600 hover:bg-gray-600 ${
                  selectedAnimal1?.id === animal.id ? 'bg-blue-600' : ''
                }`}
              >
                <div className="font-medium">{animal.identifiant_officiel}</div>
                <div className="text-sm text-gray-300">
                  {animal.nom || t('animal.noname')} • {animal.sexe === 'M' ? '♂️' : '♀️'} • {animal.race_nom}
                </div>
                <div className="text-xs text-gray-400">
                  {animal.elevage_nom} • {animal.type_animal_nom || t('animal.type.undefined')}
                </div>
              </div>
            ))}
          </div>
          {selectedAnimal1 && (
            <div className="mt-4 p-4 bg-gray-600 rounded">
              <strong>{t('animal.selected')}</strong> {selectedAnimal1.identifiant_officiel}
              <br />
              <span className="text-sm text-gray-300">
                {selectedAnimal1.nom} • {selectedAnimal1.sexe === 'M' ? t('animal.male') : t('animal.female')} • {selectedAnimal1.race_nom} • {selectedAnimal1.type_animal_nom || t('animal.type.undefined')}
              </span>
            </div>
          )}
        </div>

        {/* Sélection Animal 2 */}
        <div className="bg-gray-700 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">{t('animal.select2')}</h3>
          <input
            type="text"
            placeholder="Rechercher par nom ou identifiant..."
            value={searchTerm2}
            onChange={(e) => setSearchTerm2(e.target.value)}
            className="form-input mb-4"
          />
          <div className="max-h-40 overflow-y-auto border border-gray-600 rounded">
            {filteredAnimals2.map((animal) => (
              <div
                key={animal.id}
                onClick={() => setSelectedAnimal2(animal)}
                className={`p-3 cursor-pointer border-b border-gray-600 hover:bg-gray-600 ${
                  selectedAnimal2?.id === animal.id ? 'bg-blue-600' : ''
                }`}
              >
                <div className="font-medium">{animal.identifiant_officiel}</div>
                <div className="text-sm text-gray-300">
                  {animal.nom || t('animal.noname')} • {animal.sexe === 'M' ? '♂️' : '♀️'} • {animal.race_nom}
                </div>
                <div className="text-xs text-gray-400">
                  {animal.elevage_nom} • {animal.type_animal_nom || t('animal.type.undefined')}
                </div>
              </div>
            ))}
          </div>
          {selectedAnimal2 && (
            <div className="mt-4 p-4 bg-gray-600 rounded">
              <strong>{t('animal.selected')}</strong> {selectedAnimal2.identifiant_officiel}
              <br />
              <span className="text-sm text-gray-300">
                {selectedAnimal2.nom} • {selectedAnimal2.sexe === 'M' ? t('animal.male') : t('animal.female')} • {selectedAnimal2.race_nom} • {selectedAnimal2.type_animal_nom || t('animal.type.undefined')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={handleTestCompatibility}
          disabled={!selectedAnimal1 || !selectedAnimal2}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('button.analyze')}
        </button>
        <button
          onClick={resetTest}
          className="btn-secondary"
        >
          {t('button.reset')}
        </button>
      </div>

      {/* Résultats */}
      {result && (
        <div className="space-y-6">
          {/* Status de compatibilité */}
          <div className={`p-6 rounded-lg ${result.compatible ? 'bg-green-800' : 'bg-red-800'}`}>
            <h3 className="text-xl font-bold mb-4">
              {result.compatible ? t('result.compatible') : t('result.incompatible')}
            </h3>
            <div className="space-y-2">
              {result.reasons.map((reason, index) => (
                <div key={index} className="text-sm">{reason}</div>
              ))}
            </div>
          </div>

          {/* Analyse génétique */}
          <div className="bg-gray-700 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">{t('genetic.title')}</h3>
            <div className="space-y-4">
              <div className="whitespace-pre-line">{result.geneticDiversity.analysis}</div>
              {result.geneticDiversity.recommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">{t('recommendations.title')}</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {result.geneticDiversity.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-gray-300">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Traits possibles de la descendance */}
          <div className="bg-gray-700 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">{t('offspring.title')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2 text-green-400">{t('offspring.traits')}</h4>
                <ul className="list-disc list-inside space-y-1">
                  {result.offspring.possibleTraits.map((trait, index) => (
                    <li key={index} className="text-sm text-gray-300">{trait}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-orange-400">{t('offspring.risks')}</h4>
                <ul className="list-disc list-inside space-y-1">
                  {result.offspring.riskFactors.map((risk, index) => (
                    <li key={index} className="text-sm text-gray-300">{risk}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompatibilityTester;