import { describe, test, expect, vi } from 'vitest';
import {
  formatDate,
  formatAgeDisplay,
  getAgeTooltip,
  calculateAge
} from '../dateUtils';

describe('dateUtils', () => {
  // Mock current date for consistent testing
  const mockCurrentDate = new Date('2023-06-15');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockCurrentDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('formatDate', () => {
    test('formats date string correctly', () => {
      expect(formatDate('2023-01-15')).toBe('15/01/2023');
    });

    test('formats Date object correctly', () => {
      const date = new Date('2023-01-15');
      expect(formatDate(date)).toBe('15/01/2023');
    });

    test('handles null input', () => {
      expect(formatDate(null)).toBe('');
    });

    test('handles undefined input', () => {
      expect(formatDate(undefined)).toBe('');
    });

    test('handles invalid date string', () => {
      expect(formatDate('invalid-date')).toBe('Date invalide');
    });
  });

  describe('calculateAge', () => {
    test('calculates age correctly for living animal', () => {
      const birthDate = '2020-06-15'; // 3 years old exactly
      const result = calculateAge(birthDate);

      expect(result.years).toBe(3);
      expect(result.months).toBe(0);
      expect(result.totalMonths).toBe(36);
    });

    test('calculates age correctly for deceased animal', () => {
      const birthDate = '2020-01-01';
      const deathDate = '2022-06-01';
      const result = calculateAge(birthDate, deathDate);

      expect(result.years).toBe(2);
      expect(result.months).toBe(5);
      expect(result.totalMonths).toBe(29);
    });

    test('handles same birth and death date', () => {
      const birthDate = '2023-06-15';
      const deathDate = '2023-06-15';
      const result = calculateAge(birthDate, deathDate);

      expect(result.years).toBe(0);
      expect(result.months).toBe(0);
      expect(result.totalMonths).toBe(0);
    });

    test('calculates months correctly when birth day > current day', () => {
      const birthDate = '2023-01-20'; // Born on 20th
      // Current date is 15th, so should be 4 months, not 5
      const result = calculateAge(birthDate);

      expect(result.years).toBe(0);
      expect(result.months).toBe(4);
    });

    test('handles leap year correctly', () => {
      vi.setSystemTime(new Date('2024-03-01')); // Leap year
      const birthDate = '2023-02-28';
      const result = calculateAge(birthDate);

      expect(result.years).toBe(1);
      expect(result.months).toBe(0);
    });

    test('handles future birth date', () => {
      const birthDate = '2024-01-01'; // Future date
      const result = calculateAge(birthDate);

      expect(result.years).toBe(0);
      expect(result.months).toBe(0);
      expect(result.totalMonths).toBe(0);
    });
  });

  describe('formatAgeDisplay', () => {
    test('formats age with years and months', () => {
      const birthDate = '2020-01-15'; // 3 years, 5 months
      const result = formatAgeDisplay(birthDate);

      expect(result).toBe('3 ans 5 mois');
    });

    test('formats age with only years', () => {
      const birthDate = '2020-06-15'; // Exactly 3 years
      const result = formatAgeDisplay(birthDate);

      expect(result).toBe('3 ans');
    });

    test('formats age with only months', () => {
      const birthDate = '2023-01-15'; // 5 months
      const result = formatAgeDisplay(birthDate);

      expect(result).toBe('5 mois');
    });

    test('formats newborn age', () => {
      const birthDate = '2023-06-15'; // Born today
      const result = formatAgeDisplay(birthDate);

      expect(result).toBe('Nouveau-né');
    });

    test('formats age for deceased animal', () => {
      const birthDate = '2020-01-01';
      const deathDate = '2022-06-01';
      const result = formatAgeDisplay(birthDate, deathDate);

      expect(result).toBe('2 ans 5 mois');
    });

    test('handles singular year', () => {
      const birthDate = '2022-06-15'; // 1 year
      const result = formatAgeDisplay(birthDate);

      expect(result).toBe('1 an');
    });

    test('handles singular month', () => {
      const birthDate = '2023-05-15'; // 1 month
      const result = formatAgeDisplay(birthDate);

      expect(result).toBe('1 mois');
    });
  });

  describe('getAgeTooltip', () => {
    test('returns tooltip for living animal', () => {
      const birthDate = '2020-06-15';
      const result = getAgeTooltip(birthDate);

      expect(result).toContain('Âge actuel');
      expect(result).toContain('3 ans');
    });

    test('returns tooltip for deceased animal', () => {
      const birthDate = '2020-01-01';
      const deathDate = '2022-06-01';
      const result = getAgeTooltip(birthDate, deathDate);

      expect(result).toContain('Âge au décès');
      expect(result).toContain('2 ans 5 mois');
    });

    test('includes exact date information', () => {
      const birthDate = '2020-06-15';
      const result = getAgeTooltip(birthDate);

      expect(result).toContain('Né(e) le 15/06/2020');
    });

    test('includes death date for deceased animal', () => {
      const birthDate = '2020-01-01';
      const deathDate = '2022-06-01';
      const result = getAgeTooltip(birthDate, deathDate);

      expect(result).toContain('Décédé(e) le 01/06/2022');
    });

    test('handles newborn animal', () => {
      const birthDate = '2023-06-15'; // Born today
      const result = getAgeTooltip(birthDate);

      expect(result).toContain('Nouveau-né');
    });
  });

  describe('edge cases', () => {
    test('handles invalid date inputs', () => {
      expect(formatAgeDisplay('invalid-date')).toBe('');
      expect(getAgeTooltip('invalid-date')).toBe('');
    });

    test('handles null inputs', () => {
      expect(formatAgeDisplay(null as any)).toBe('');
      expect(getAgeTooltip(null as any)).toBe('');
    });

    test('handles death date before birth date', () => {
      const birthDate = '2022-01-01';
      const deathDate = '2021-01-01'; // Death before birth
      const result = calculateAge(birthDate, deathDate);

      expect(result.years).toBe(0);
      expect(result.months).toBe(0);
      expect(result.totalMonths).toBe(0);
    });
  });
});