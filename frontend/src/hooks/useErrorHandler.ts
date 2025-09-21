import { useTranslation } from './useTranslation';
import { ERROR_CODES, type ErrorCode, type CodedError } from '../utils/errorCodes';

export const useErrorHandler = () => {
  const { translateError: translate } = useTranslation();

  /**
   * Traduit un code d'erreur en message localisé
   */
  const translateError = (errorCode: ErrorCode, fallbackMessage?: string): string => {
    // Utiliser la méthode de traduction du hook useTranslation
    return translate(errorCode);
  };

  /**
   * Traite une erreur et retourne le message approprié
   */
  const handleError = (error: any): string => {
    // Si c'est une erreur avec code
    if (error && typeof error === 'object' && error.code) {
      const codedError = error as CodedError;
      return translateError(codedError.code, codedError.message);
    }

    // Si c'est une réponse d'API avec code d'erreur
    if (error && typeof error === 'object' && error.error_code) {
      return translateError(error.error_code as ErrorCode, error.message);
    }

    // Si c'est une erreur réseau
    if (error && typeof error === 'object' && error.name === 'NetworkError') {
      return translate(ERROR_CODES.SYS_001);
    }

    // Si c'est juste un message string
    if (typeof error === 'string') {
      // Vérifier si c'est un code d'erreur connu
      if (Object.values(ERROR_CODES).includes(error as ErrorCode)) {
        return translateError(error as ErrorCode);
      }
      // Sinon retourner le message tel quel
      return error;
    }

    // Si c'est un objet Error standard
    if (error instanceof Error) {
      return error.message || translate(ERROR_CODES.SYS_010);
    }

    // Fallback pour tout autre type d'erreur
    return translate(ERROR_CODES.SYS_010);
  };

  /**
   * Crée une erreur avec code pour l'API
   */
  const createCodedError = (code: ErrorCode, message?: string, details?: any): CodedError => {
    return {
      code,
      message: message || translateError(code),
      details
    };
  };

  /**
   * Valide si une chaîne est un code d'erreur valide
   */
  const isValidErrorCode = (code: string): code is ErrorCode => {
    return Object.values(ERROR_CODES).includes(code as ErrorCode);
  };

  /**
   * Extrait le code d'erreur d'une réponse d'API
   */
  const extractErrorCode = (apiResponse: any): ErrorCode | null => {
    if (apiResponse?.error_code && isValidErrorCode(apiResponse.error_code)) {
      return apiResponse.error_code;
    }

    if (apiResponse?.code && isValidErrorCode(apiResponse.code)) {
      return apiResponse.code;
    }

    return null;
  };

  return {
    translateError,
    handleError,
    createCodedError,
    isValidErrorCode,
    extractErrorCode,
    ERROR_CODES
  };
};