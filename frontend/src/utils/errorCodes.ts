// Système de codes d'erreur uniques pour la traduction
export const ERROR_CODES = {
  // Erreurs d'authentification (AUTH_001 - AUTH_999)
  AUTH_001: 'AUTH_001', // Identifiants invalides
  AUTH_002: 'AUTH_002', // Mot de passe trop court
  AUTH_003: 'AUTH_003', // Email invalide
  AUTH_004: 'AUTH_004', // Utilisateur déjà existant
  AUTH_005: 'AUTH_005', // Token expiré
  AUTH_006: 'AUTH_006', // Accès refusé
  AUTH_007: 'AUTH_007', // Session expirée
  AUTH_008: 'AUTH_008', // Permissions insuffisantes
  AUTH_009: 'AUTH_009', // Utilisateur non trouvé
  AUTH_010: 'AUTH_010', // Compte désactivé

  // Erreurs d'élevage (ELEVAGE_001 - ELEVAGE_999)
  ELEVAGE_001: 'ELEVAGE_001', // Élevage non trouvé
  ELEVAGE_002: 'ELEVAGE_002', // Nom d'élevage requis
  ELEVAGE_003: 'ELEVAGE_003', // Adresse requise
  ELEVAGE_004: 'ELEVAGE_004', // Propriétaire requis
  ELEVAGE_005: 'ELEVAGE_005', // Impossible de supprimer élevage avec animaux
  ELEVAGE_006: 'ELEVAGE_006', // Permissions insuffisantes pour cet élevage
  ELEVAGE_007: 'ELEVAGE_007', // Élevage déjà existant
  ELEVAGE_008: 'ELEVAGE_008', // Utilisateur déjà ajouté à l'élevage
  ELEVAGE_009: 'ELEVAGE_009', // Impossible de retirer le propriétaire
  ELEVAGE_010: 'ELEVAGE_010', // Utilisateur non trouvé dans l'élevage

  // Erreurs d'animaux (ANIMAL_001 - ANIMAL_999)
  ANIMAL_001: 'ANIMAL_001', // Animal non trouvé
  ANIMAL_002: 'ANIMAL_002', // Identifiant officiel requis
  ANIMAL_003: 'ANIMAL_003', // Race requise
  ANIMAL_004: 'ANIMAL_004', // Sexe requis
  ANIMAL_005: 'ANIMAL_005', // Identifiant déjà utilisé
  ANIMAL_006: 'ANIMAL_006', // Date de naissance invalide
  ANIMAL_007: 'ANIMAL_007', // Impossible de supprimer animal avec descendants
  ANIMAL_008: 'ANIMAL_008', // Animal déjà décédé
  ANIMAL_009: 'ANIMAL_009', // Date de décès invalide
  ANIMAL_010: 'ANIMAL_010', // Parents invalides (même sexe, etc.)

  // Erreurs d'utilisateurs (USER_001 - USER_999)
  USER_001: 'USER_001', // Utilisateur non trouvé
  USER_002: 'USER_002', // Nom requis
  USER_003: 'USER_003', // Email requis
  USER_004: 'USER_004', // Email invalide
  USER_005: 'USER_005', // Mot de passe requis
  USER_006: 'USER_006', // Rôle invalide
  USER_007: 'USER_007', // Impossible de supprimer dernier admin
  USER_008: 'USER_008', // Permissions insuffisantes pour gérer les utilisateurs
  USER_009: 'USER_009', // Utilisateur déjà validé
  USER_010: 'USER_010', // Email déjà utilisé

  // Erreurs de races/types (RACE_001 - RACE_999)
  RACE_001: 'RACE_001', // Race non trouvée
  RACE_002: 'RACE_002', // Nom de race requis
  RACE_003: 'RACE_003', // Type d'animal requis
  RACE_004: 'RACE_004', // Race déjà existante
  RACE_005: 'RACE_005', // Impossible de supprimer race utilisée
  RACE_006: 'RACE_006', // Type d'animal non trouvé
  RACE_007: 'RACE_007', // Nom de type requis
  RACE_008: 'RACE_008', // Type déjà existant
  RACE_009: 'RACE_009', // Impossible de supprimer type utilisé

  // Erreurs système (SYS_001 - SYS_999)
  SYS_001: 'SYS_001', // Erreur de connexion réseau
  SYS_002: 'SYS_002', // Erreur serveur interne
  SYS_003: 'SYS_003', // Service temporairement indisponible
  SYS_004: 'SYS_004', // Données corrompues
  SYS_005: 'SYS_005', // Limite de taux dépassée
  SYS_006: 'SYS_006', // Taille de fichier trop grande
  SYS_007: 'SYS_007', // Format de fichier non supporté
  SYS_008: 'SYS_008', // Opération annulée par l'utilisateur
  SYS_009: 'SYS_009', // Validation échouée
  SYS_010: 'SYS_010', // Erreur inconnue

  // Erreurs de validation (VAL_001 - VAL_999)
  VAL_001: 'VAL_001', // Champ requis
  VAL_002: 'VAL_002', // Format invalide
  VAL_003: 'VAL_003', // Valeur trop courte
  VAL_004: 'VAL_004', // Valeur trop longue
  VAL_005: 'VAL_005', // Valeur numérique invalide
  VAL_006: 'VAL_006', // Date invalide
  VAL_007: 'VAL_007', // Plage de valeurs invalide
  VAL_008: 'VAL_008', // Caractères interdits
  VAL_009: 'VAL_009', // Valeur déjà utilisée
  VAL_010: 'VAL_010', // Format d'email invalide
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

// Interface pour les erreurs avec codes
export interface CodedError {
  code: ErrorCode;
  message?: string;
  details?: any;
}