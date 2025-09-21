import { ErrorCode, ERROR_CODES, CodedError } from './errorCodes';

// Classe d'erreur personnalisée avec code
export class ApplicationError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: any;

  constructor(code: ErrorCode, message?: string, details?: any) {
    super(message || code);
    this.name = 'ApplicationError';
    this.code = code;
    this.details = details;
  }
}

// Fonction pour créer une erreur avec code
export const createError = (code: ErrorCode, message?: string, details?: any): ApplicationError => {
  return new ApplicationError(code, message, details);
};

// Fonction pour extraire le code d'erreur depuis une réponse API
export const extractErrorCode = (error: any): ErrorCode => {
  // Si c'est déjà une ApplicationError
  if (error instanceof ApplicationError) {
    return error.code;
  }

  // Si l'erreur contient un code directement
  if (error?.code && Object.values(ERROR_CODES).includes(error.code)) {
    return error.code;
  }

  // Si l'erreur vient d'une réponse API avec code
  if (error?.response?.data?.code && Object.values(ERROR_CODES).includes(error.response.data.code)) {
    return error.response.data.code;
  }

  // Analyser le message d'erreur pour détecter des patterns
  const message = error?.message || error?.response?.data?.message || '';

  // Mappage des messages d'erreur courants vers des codes
  if (message.includes('Invalid credentials') || message.includes('Identifiants invalides')) {
    return ERROR_CODES.AUTH_001;
  }
  if (message.includes('Access denied') || message.includes('Accès refusé')) {
    return ERROR_CODES.AUTH_006;
  }
  if (message.includes('Token expired') || message.includes('Session') || message.includes('expiré')) {
    return ERROR_CODES.AUTH_005;
  }
  if (message.includes('Permission') || message.includes('permission')) {
    return ERROR_CODES.AUTH_008;
  }
  if (message.includes('Network') || message.includes('réseau') || error?.code === 'NETWORK_ERROR') {
    return ERROR_CODES.SYS_001;
  }
  if (message.includes('Server') || message.includes('serveur') || error?.status >= 500) {
    return ERROR_CODES.SYS_002;
  }
  if (message.includes('Not found') || message.includes('non trouvé') || error?.status === 404) {
    // Déterminer le type d'entité manquante
    if (message.includes('User') || message.includes('utilisateur')) {
      return ERROR_CODES.USER_001;
    }
    if (message.includes('Animal') || message.includes('animal')) {
      return ERROR_CODES.ANIMAL_001;
    }
    if (message.includes('Elevage') || message.includes('élevage')) {
      return ERROR_CODES.ELEVAGE_001;
    }
    if (message.includes('Race') || message.includes('race')) {
      return ERROR_CODES.RACE_001;
    }
  }
  if (message.includes('already exists') || message.includes('déjà') || error?.status === 409) {
    return ERROR_CODES.VAL_009;
  }
  if (message.includes('required') || message.includes('requis')) {
    return ERROR_CODES.VAL_001;
  }

  // Code d'erreur par défaut pour les erreurs inconnues
  return ERROR_CODES.SYS_010;
};

// Fonction pour créer une erreur formatée pour Redux
export const createCodedError = (error: any): CodedError => {
  const code = extractErrorCode(error);
  const message = error?.message || error?.response?.data?.message;
  const details = error?.response?.data || error?.details;

  return {
    code,
    message,
    details,
  };
};

// Helper pour gérer les erreurs dans les async thunks
export const handleAsyncError = (error: any, rejectWithValue: any) => {
  const codedError = createCodedError(error);
  return rejectWithValue(codedError);
};

// Validation des données d'entrée avec codes d'erreur
export const validateRequired = (value: any, fieldName?: string): ErrorCode | null => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return ERROR_CODES.VAL_001;
  }
  return null;
};

export const validateEmail = (email: string): ErrorCode | null => {
  if (!email) {
    return ERROR_CODES.VAL_001;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return ERROR_CODES.VAL_010;
  }
  return null;
};

export const validatePassword = (password: string): ErrorCode | null => {
  if (!password) {
    return ERROR_CODES.VAL_001;
  }
  if (password.length < 6) {
    return ERROR_CODES.AUTH_002;
  }
  return null;
};