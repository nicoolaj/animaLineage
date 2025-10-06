import { ErrorCode } from '../utils/errorCodes';

// Interface pour les traductions
export interface Translations {
  // Erreurs
  errors: Record<ErrorCode, string>;

  // Interface utilisateur
  ui: {
    // Navigation
    dashboard: string;
    elevages: string;
    animals: string;
    users: string;
    typesRaces: string;
    logout: string;

    // Actions communes
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    add: string;
    search: string;
    filter: string;
    loading: string;

    // Confirmations
    confirmDelete: string;
    confirmLogout: string;

    // États
    active: string;
    inactive: string;
    pending: string;
    approved: string;

    // Permissions
    admin: string;
    moderator: string;
    reader: string;
    owner: string;
    collaborator: string;
  };

  // Messages
  messages: {
    welcomeUser: string;
    noDataFound: string;
    operationSuccessful: string;
    changesUnsaved: string;
  };
}

// Traductions françaises
export const fr: Translations = {
  errors: {
    // Authentification
    AUTH_001: 'Identifiants invalides',
    AUTH_002: 'Le mot de passe doit contenir au moins 6 caractères',
    AUTH_003: 'Format d\'email invalide',
    AUTH_004: 'Un utilisateur avec cet email existe déjà',
    AUTH_005: 'Votre session a expiré, veuillez vous reconnecter',
    AUTH_006: 'Accès refusé',
    AUTH_007: 'Session expirée',
    AUTH_008: 'Permissions insuffisantes pour cette action',
    AUTH_009: 'Utilisateur non trouvé',
    AUTH_010: 'Votre compte a été désactivé',

    // Élevages
    ELEVAGE_001: 'Élevage non trouvé',
    ELEVAGE_002: 'Le nom de l\'élevage est requis',
    ELEVAGE_003: 'L\'adresse est requise',
    ELEVAGE_004: 'Le propriétaire est requis',
    ELEVAGE_005: 'Impossible de supprimer un élevage contenant des animaux',
    ELEVAGE_006: 'Permissions insuffisantes pour cet élevage',
    ELEVAGE_007: 'Un élevage avec ce nom existe déjà',
    ELEVAGE_008: 'Cet utilisateur est déjà ajouté à l\'élevage',
    ELEVAGE_009: 'Impossible de retirer le propriétaire de l\'élevage',
    ELEVAGE_010: 'Utilisateur non trouvé dans cet élevage',

    // Animaux
    ANIMAL_001: 'Animal non trouvé',
    ANIMAL_002: 'L\'identifiant officiel est requis',
    ANIMAL_003: 'La race est requise',
    ANIMAL_004: 'Le sexe est requis',
    ANIMAL_005: 'Cet identifiant est déjà utilisé',
    ANIMAL_006: 'Date de naissance invalide',
    ANIMAL_007: 'Impossible de supprimer un animal ayant des descendants',
    ANIMAL_008: 'Cet animal est déjà décédé',
    ANIMAL_009: 'Date de décès invalide',
    ANIMAL_010: 'Informations des parents invalides',

    // Utilisateurs
    USER_001: 'Utilisateur non trouvé',
    USER_002: 'Le nom est requis',
    USER_003: 'L\'email est requis',
    USER_004: 'Format d\'email invalide',
    USER_005: 'Le mot de passe est requis',
    USER_006: 'Rôle invalide',
    USER_007: 'Impossible de supprimer le dernier administrateur',
    USER_008: 'Permissions insuffisantes pour gérer les utilisateurs',
    USER_009: 'Utilisateur déjà validé',
    USER_010: 'Cet email est déjà utilisé',

    // Races
    RACE_001: 'Race non trouvée',
    RACE_002: 'Le nom de la race est requis',
    RACE_003: 'Le type d\'animal est requis',
    RACE_004: 'Cette race existe déjà',
    RACE_005: 'Impossible de supprimer une race utilisée par des animaux',
    RACE_006: 'Type d\'animal non trouvé',
    RACE_007: 'Le nom du type est requis',
    RACE_008: 'Ce type existe déjà',
    RACE_009: 'Impossible de supprimer un type utilisé par des races',

    // Système
    SYS_001: 'Erreur de connexion réseau',
    SYS_002: 'Erreur serveur interne',
    SYS_003: 'Service temporairement indisponible',
    SYS_004: 'Données corrompues détectées',
    SYS_005: 'Trop de requêtes, veuillez patienter',
    SYS_006: 'Fichier trop volumineux',
    SYS_007: 'Format de fichier non supporté',
    SYS_008: 'Opération annulée',
    SYS_009: 'Validation échouée',
    SYS_010: 'Une erreur inattendue s\'est produite',

    // Validation
    VAL_001: 'Ce champ est requis',
    VAL_002: 'Format invalide',
    VAL_003: 'Valeur trop courte',
    VAL_004: 'Valeur trop longue',
    VAL_005: 'Valeur numérique invalide',
    VAL_006: 'Date invalide',
    VAL_007: 'Valeur hors limites',
    VAL_008: 'Caractères interdits détectés',
    VAL_009: 'Cette valeur est déjà utilisée',
    VAL_010: 'Format d\'email invalide',
  },

  ui: {
    dashboard: 'Tableau de bord',
    elevages: 'Élevages',
    animals: 'Animaux',
    users: 'Paramétrages',
    typesRaces: 'Types & Races',
    logout: 'Déconnexion',

    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    add: 'Ajouter',
    search: 'Rechercher',
    filter: 'Filtrer',
    loading: 'Chargement...',

    confirmDelete: 'Êtes-vous sûr de vouloir supprimer cet élément ?',
    confirmLogout: 'Êtes-vous sûr de vouloir vous déconnecter ?',

    active: 'Actif',
    inactive: 'Inactif',
    pending: 'En attente',
    approved: 'Approuvé',

    admin: 'Administrateur',
    moderator: 'Modérateur',
    reader: 'Lecteur',
    owner: 'Propriétaire',
    collaborator: 'Collaborateur',
  },

  messages: {
    welcomeUser: 'Bienvenue',
    noDataFound: 'Aucune donnée trouvée',
    operationSuccessful: 'Opération réussie',
    changesUnsaved: 'Vous avez des modifications non sauvegardées',
  },
};

// Traductions anglaises
export const en: Translations = {
  errors: {
    // Authentication
    AUTH_001: 'Invalid credentials',
    AUTH_002: 'Password must be at least 6 characters long',
    AUTH_003: 'Invalid email format',
    AUTH_004: 'A user with this email already exists',
    AUTH_005: 'Your session has expired, please log in again',
    AUTH_006: 'Access denied',
    AUTH_007: 'Session expired',
    AUTH_008: 'Insufficient permissions for this action',
    AUTH_009: 'User not found',
    AUTH_010: 'Your account has been deactivated',

    // Breeding farms
    ELEVAGE_001: 'Breeding farm not found',
    ELEVAGE_002: 'Breeding farm name is required',
    ELEVAGE_003: 'Address is required',
    ELEVAGE_004: 'Owner is required',
    ELEVAGE_005: 'Cannot delete a breeding farm containing animals',
    ELEVAGE_006: 'Insufficient permissions for this breeding farm',
    ELEVAGE_007: 'A breeding farm with this name already exists',
    ELEVAGE_008: 'This user is already added to the breeding farm',
    ELEVAGE_009: 'Cannot remove the owner from the breeding farm',
    ELEVAGE_010: 'User not found in this breeding farm',

    // Animals
    ANIMAL_001: 'Animal not found',
    ANIMAL_002: 'Official identifier is required',
    ANIMAL_003: 'Breed is required',
    ANIMAL_004: 'Sex is required',
    ANIMAL_005: 'This identifier is already in use',
    ANIMAL_006: 'Invalid birth date',
    ANIMAL_007: 'Cannot delete an animal with descendants',
    ANIMAL_008: 'This animal is already deceased',
    ANIMAL_009: 'Invalid death date',
    ANIMAL_010: 'Invalid parent information',

    // Users
    USER_001: 'User not found',
    USER_002: 'Name is required',
    USER_003: 'Email is required',
    USER_004: 'Invalid email format',
    USER_005: 'Password is required',
    USER_006: 'Invalid role',
    USER_007: 'Cannot delete the last administrator',
    USER_008: 'Insufficient permissions to manage users',
    USER_009: 'User already validated',
    USER_010: 'This email is already in use',

    // Breeds
    RACE_001: 'Breed not found',
    RACE_002: 'Breed name is required',
    RACE_003: 'Animal type is required',
    RACE_004: 'This breed already exists',
    RACE_005: 'Cannot delete a breed used by animals',
    RACE_006: 'Animal type not found',
    RACE_007: 'Type name is required',
    RACE_008: 'This type already exists',
    RACE_009: 'Cannot delete a type used by breeds',

    // System
    SYS_001: 'Network connection error',
    SYS_002: 'Internal server error',
    SYS_003: 'Service temporarily unavailable',
    SYS_004: 'Corrupted data detected',
    SYS_005: 'Too many requests, please wait',
    SYS_006: 'File too large',
    SYS_007: 'Unsupported file format',
    SYS_008: 'Operation cancelled',
    SYS_009: 'Validation failed',
    SYS_010: 'An unexpected error occurred',

    // Validation
    VAL_001: 'This field is required',
    VAL_002: 'Invalid format',
    VAL_003: 'Value too short',
    VAL_004: 'Value too long',
    VAL_005: 'Invalid numeric value',
    VAL_006: 'Invalid date',
    VAL_007: 'Value out of range',
    VAL_008: 'Forbidden characters detected',
    VAL_009: 'This value is already in use',
    VAL_010: 'Invalid email format',
  },

  ui: {
    dashboard: 'Dashboard',
    elevages: 'Breeding Farms',
    animals: 'Animals',
    users: 'Users',
    typesRaces: 'Types & Breeds',
    logout: 'Logout',

    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    filter: 'Filter',
    loading: 'Loading...',

    confirmDelete: 'Are you sure you want to delete this item?',
    confirmLogout: 'Are you sure you want to log out?',

    active: 'Active',
    inactive: 'Inactive',
    pending: 'Pending',
    approved: 'Approved',

    admin: 'Administrator',
    moderator: 'Moderator',
    reader: 'Reader',
    owner: 'Owner',
    collaborator: 'Collaborator',
  },

  messages: {
    welcomeUser: 'Welcome',
    noDataFound: 'No data found',
    operationSuccessful: 'Operation successful',
    changesUnsaved: 'You have unsaved changes',
  },
};

// Types pour l'autocomplétion
export type Language = 'fr' | 'en';
export type TranslationKey = keyof Translations['ui'] | keyof Translations['messages'];

// Export des traductions par langue
export const translations = {
  fr,
  en,
} as const;