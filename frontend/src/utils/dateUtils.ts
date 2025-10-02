/**
 * Utilitaires pour le calcul des dates et âges des animaux
 */

export interface Animal {
  date_naissance?: string;
  date_bouclage?: string;
  statut?: string;
  date_deces?: string;
}

/**
 * Calcule l'âge d'un animal en utilisant la date de naissance en priorité,
 * sinon la date de bouclage si disponible
 */
export const calculateAge = (animal: Animal): { age: string; source: 'naissance' | 'bouclage' | 'inconnu' } => {
  const now = new Date();
  let referenceDate: Date | null = null;
  let source: 'naissance' | 'bouclage' | 'inconnu' = 'inconnu';

  // Priorité 1: Date de naissance
  if (animal.date_naissance) {
    referenceDate = new Date(animal.date_naissance);
    source = 'naissance';
  }
  // Priorité 2: Date de bouclage (si pas de date de naissance)
  else if (animal.date_bouclage) {
    referenceDate = new Date(animal.date_bouclage);
    source = 'bouclage';
  }

  if (!referenceDate || isNaN(referenceDate.getTime())) {
    return { age: 'Inconnu', source: 'inconnu' };
  }

  // Pour les animaux décédés, calculer l'âge au moment du décès
  const endDate = animal.statut === 'mort' && animal.date_deces
    ? new Date(animal.date_deces)
    : now;

  // Si la date de référence est dans le futur, retourner "Inconnu"
  if (referenceDate > endDate) {
    return { age: 'Inconnu', source };
  }

  const diffTime = endDate.getTime() - referenceDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { age: 'Inconnu', source };
  }

  // Calcul précis en années, mois et jours
  let years = endDate.getFullYear() - referenceDate.getFullYear();
  let months = endDate.getMonth() - referenceDate.getMonth();
  let days = endDate.getDate() - referenceDate.getDate();

  if (days < 0) {
    months--;
    const lastMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
    days += lastMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  // Formatage de l'âge selon la durée
  if (years > 0) {
    if (months > 0) {
      return { age: `${years}a ${months}m`, source };
    } else {
      return { age: `${years} an${years > 1 ? 's' : ''}`, source };
    }
  } else if (months > 0) {
    if (days > 0) {
      return { age: `${months}m ${days}j`, source };
    } else {
      return { age: `${months} mois`, source };
    }
  } else if (diffDays >= 1) {
    return { age: `${diffDays} jour${diffDays > 1 ? 's' : ''}`, source };
  } else {
    return { age: 'Nouveau-né', source };
  }
};

/**
 * Formate une date en français
 */
export const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';

  try {
    return new Date(dateString).toLocaleDateString('fr-FR');
  } catch {
    return '-';
  }
};

/**
 * Formate l'affichage de l'âge avec indication de la source
 */
export const formatAgeDisplay = (animal: Animal): string => {
  const { age, source } = calculateAge(animal);

  if (source === 'inconnu') {
    return age;
  }

  const sourceText = source === 'naissance' ? '📅' : '🏷️';
  return `${age} ${sourceText}`;
};

/**
 * Retourne une info-bulle expliquant la source du calcul d'âge
 */
export const getAgeTooltip = (animal: Animal): string => {
  const { source } = calculateAge(animal);

  switch (source) {
    case 'naissance':
      return 'Âge calculé à partir de la date de naissance';
    case 'bouclage':
      return 'Âge estimé à partir de la date de bouclage (date de naissance non renseignée)';
    case 'inconnu':
      return 'Âge inconnu - aucune date de référence disponible';
    default:
      return '';
  }
};