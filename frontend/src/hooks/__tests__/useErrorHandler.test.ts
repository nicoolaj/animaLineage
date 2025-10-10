import { renderHook, act } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import useErrorHandler from '../useErrorHandler';

// Mock console.error to avoid cluttering test output
const originalConsoleError = console.error;

describe('useErrorHandler', () => {
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  test('initializes with no error', () => {
    const { result } = renderHook(() => useErrorHandler());

    expect(result.current.error).toBe('');
    expect(result.current.hasError).toBe(false);
  });

  test('handles string error', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.handleError('Test error message');
    });

    expect(result.current.error).toBe('Test error message');
    expect(result.current.hasError).toBe(true);
  });

  test('handles Error object', () => {
    const { result } = renderHook(() => useErrorHandler());

    const errorObject = new Error('Test error object');

    act(() => {
      result.current.handleError(errorObject);
    });

    expect(result.current.error).toBe('Test error object');
    expect(result.current.hasError).toBe(true);
  });

  test('handles unknown error type', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.handleError({ someProperty: 'value' });
    });

    expect(result.current.error).toBe('Une erreur inconnue s\'est produite');
    expect(result.current.hasError).toBe(true);
  });

  test('handles null/undefined error', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.handleError(null);
    });

    expect(result.current.error).toBe('Une erreur inconnue s\'est produite');
    expect(result.current.hasError).toBe(true);

    act(() => {
      result.current.handleError(undefined);
    });

    expect(result.current.error).toBe('Une erreur inconnue s\'est produite');
    expect(result.current.hasError).toBe(true);
  });

  test('clears error', () => {
    const { result } = renderHook(() => useErrorHandler());

    // Set an error first
    act(() => {
      result.current.handleError('Test error');
    });

    expect(result.current.hasError).toBe(true);

    // Clear the error
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBe('');
    expect(result.current.hasError).toBe(false);
  });

  test('logs errors to console', () => {
    const { result } = renderHook(() => useErrorHandler());

    const testError = new Error('Test console logging');

    act(() => {
      result.current.handleError(testError);
    });

    expect(console.error).toHaveBeenCalledWith('Error handled by useErrorHandler:', testError);
  });

  test('handles multiple consecutive errors', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.handleError('First error');
    });

    expect(result.current.error).toBe('First error');

    act(() => {
      result.current.handleError('Second error');
    });

    expect(result.current.error).toBe('Second error');
    expect(result.current.hasError).toBe(true);
  });

  test('handles empty string error', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.handleError('');
    });

    expect(result.current.error).toBe('Une erreur inconnue s\'est produite');
    expect(result.current.hasError).toBe(true);
  });

  test('handles Error object with empty message', () => {
    const { result } = renderHook(() => useErrorHandler());

    const emptyError = new Error('');

    act(() => {
      result.current.handleError(emptyError);
    });

    expect(result.current.error).toBe('Une erreur inconnue s\'est produite');
    expect(result.current.hasError).toBe(true);
  });

  test('preserves error state across re-renders', () => {
    const { result, rerender } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.handleError('Persistent error');
    });

    expect(result.current.error).toBe('Persistent error');

    rerender();

    expect(result.current.error).toBe('Persistent error');
    expect(result.current.hasError).toBe(true);
  });
});