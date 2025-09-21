import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { extractErrorCode, createCodedError } from '../../utils/errorHandler';
import { CodedError, ERROR_CODES } from '../../utils/errorCodes';

interface Race {
  id: number;
  nom: string;
  type_animal_nom: string;
  description: string;
}

interface Elevage {
  id: number;
  nom: string;
  adresse: string;
  user_id: number;
  proprietaire_nom: string;
  description: string;
  created_at: string;
  races: Race[];
}

interface ElevageUser {
  user_id: number;
  user_name: string;
  user_email: string;
  role_in_elevage: 'owner' | 'collaborator';
  added_at: string;
}

interface ElevageState {
  elevages: Elevage[];
  currentElevage: Elevage | null;
  elevageUsers: ElevageUser[];
  isLoading: boolean;
  error: CodedError | null;
  showMyOnly: boolean;
}

const initialState: ElevageState = {
  elevages: [],
  currentElevage: null,
  elevageUsers: [],
  isLoading: false,
  error: null,
  showMyOnly: false,
};

// Helper pour obtenir les headers d'authentification
const getAuthHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
});

// Async thunks
export const fetchElevages = createAsyncThunk<
  Elevage[],
  { token: string; showMyOnly?: boolean },
  { rejectValue: CodedError }
>(
  'elevage/fetchElevages',
  async ({ token, showMyOnly = false }, { rejectWithValue }) => {
    try {
      const url = showMyOnly
        ? 'http://localhost:3001/api/elevages?my=true'
        : 'http://localhost:3001/api/elevages';

      const response = await fetch(url, {
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorCode = extractErrorCode(errorData) || ERROR_CODES.ELEVAGE_001;
        return rejectWithValue(createCodedError({
          ...errorData,
          code: errorCode
        }));
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(createCodedError({
        code: ERROR_CODES.SYS_001,
        message: 'Network error while fetching breeding farms'
      }));
    }
  }
);

export const fetchElevageById = createAsyncThunk<
  Elevage,
  { id: number; token: string },
  { rejectValue: CodedError }
>(
  'elevage/fetchElevageById',
  async ({ id, token }, { rejectWithValue }) => {
    try {
      const response = await fetch(`http://localhost:3001/api/elevages/${id}`, {
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorCode = extractErrorCode(errorData) || ERROR_CODES.ELEVAGE_001;
        return rejectWithValue(createCodedError({
          ...errorData,
          code: errorCode
        }));
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(createCodedError({
        code: ERROR_CODES.SYS_001,
        message: 'Network error while fetching breeding farm'
      }));
    }
  }
);

export const createElevage = createAsyncThunk<
  Elevage,
  { elevageData: any; token: string },
  { rejectValue: CodedError }
>(
  'elevage/createElevage',
  async ({ elevageData, token }, { rejectWithValue }) => {
    try {
      const response = await fetch('http://localhost:3001/api/elevages', {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(elevageData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorCode = extractErrorCode(errorData) || ERROR_CODES.ELEVAGE_002;
        return rejectWithValue(createCodedError({
          ...errorData,
          code: errorCode
        }));
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(createCodedError({
        code: ERROR_CODES.SYS_001,
        message: 'Network error while creating breeding farm'
      }));
    }
  }
);

export const updateElevage = createAsyncThunk<
  Elevage,
  { id: number; elevageData: any; token: string },
  { rejectValue: CodedError }
>(
  'elevage/updateElevage',
  async ({ id, elevageData, token }, { rejectWithValue }) => {
    try {
      const response = await fetch(`http://localhost:3001/api/elevages/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(token),
        body: JSON.stringify(elevageData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorCode = extractErrorCode(errorData) || ERROR_CODES.ELEVAGE_003;
        return rejectWithValue(createCodedError({
          ...errorData,
          code: errorCode
        }));
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(createCodedError({
        code: ERROR_CODES.SYS_001,
        message: 'Network error while updating breeding farm'
      }));
    }
  }
);

export const deleteElevage = createAsyncThunk<
  number,
  { id: number; token: string },
  { rejectValue: CodedError }
>(
  'elevage/deleteElevage',
  async ({ id, token }, { rejectWithValue }) => {
    try {
      const response = await fetch(`http://localhost:3001/api/elevages/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorCode = extractErrorCode(errorData) || ERROR_CODES.ELEVAGE_004;
        return rejectWithValue(createCodedError({
          ...errorData,
          code: errorCode
        }));
      }

      return id;
    } catch (error) {
      return rejectWithValue(createCodedError({
        code: ERROR_CODES.SYS_001,
        message: 'Network error while deleting breeding farm'
      }));
    }
  }
);

export const fetchElevageUsers = createAsyncThunk<
  ElevageUser[],
  { elevageId: number; token: string },
  { rejectValue: CodedError }
>(
  'elevage/fetchElevageUsers',
  async ({ elevageId, token }, { rejectWithValue }) => {
    try {
      const response = await fetch(`http://localhost:3001/api/elevages/${elevageId}/users`, {
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorCode = extractErrorCode(errorData) || ERROR_CODES.ELEVAGE_005;
        return rejectWithValue(createCodedError({
          ...errorData,
          code: errorCode
        }));
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(createCodedError({
        code: ERROR_CODES.SYS_001,
        message: 'Network error while fetching breeding farm users'
      }));
    }
  }
);

export const addUserToElevage = createAsyncThunk<
  ElevageUser,
  {
    elevageId: number;
    userId: number;
    token: string
  },
  { rejectValue: CodedError }
>(
  'elevage/addUserToElevage',
  async ({
    elevageId,
    userId,
    token
  }, { rejectWithValue }) => {
    try {
      const response = await fetch(`http://localhost:3001/api/elevages/${elevageId}/users`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          user_id: userId,
          role_in_elevage: 'collaborator'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorCode = extractErrorCode(errorData) || ERROR_CODES.ELEVAGE_006;
        return rejectWithValue(createCodedError({
          ...errorData,
          code: errorCode
        }));
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(createCodedError({
        code: ERROR_CODES.SYS_001,
        message: 'Network error while adding user to breeding farm'
      }));
    }
  }
);

export const removeUserFromElevage = createAsyncThunk<
  number,
  {
    elevageId: number;
    userId: number;
    token: string
  },
  { rejectValue: CodedError }
>(
  'elevage/removeUserFromElevage',
  async ({
    elevageId,
    userId,
    token
  }, { rejectWithValue }) => {
    try {
      const response = await fetch(`http://localhost:3001/api/elevages/${elevageId}/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorCode = extractErrorCode(errorData) || ERROR_CODES.ELEVAGE_007;
        return rejectWithValue(createCodedError({
          ...errorData,
          code: errorCode
        }));
      }

      return userId;
    } catch (error) {
      return rejectWithValue(createCodedError({
        code: ERROR_CODES.SYS_001,
        message: 'Network error while removing user from breeding farm'
      }));
    }
  }
);

const elevageSlice = createSlice({
  name: 'elevage',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setShowMyOnly: (state, action: PayloadAction<boolean>) => {
      state.showMyOnly = action.payload;
    },
    clearCurrentElevage: (state) => {
      state.currentElevage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch élevages
      .addCase(fetchElevages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchElevages.fulfilled, (state, action) => {
        state.isLoading = false;
        state.elevages = action.payload;
        state.error = null;
      })
      .addCase(fetchElevages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || null;
      })

      // Fetch élevage par ID
      .addCase(fetchElevageById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchElevageById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentElevage = action.payload;
        state.error = null;
      })
      .addCase(fetchElevageById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || null;
      })

      // Créer élevage
      .addCase(createElevage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createElevage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.elevages.push(action.payload);
        state.error = null;
      })
      .addCase(createElevage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || null;
      })

      // Modifier élevage
      .addCase(updateElevage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateElevage.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.elevages.findIndex(e => e.id === action.payload.id);
        if (index !== -1) {
          state.elevages[index] = action.payload;
        }
        if (state.currentElevage?.id === action.payload.id) {
          state.currentElevage = action.payload;
        }
        state.error = null;
      })
      .addCase(updateElevage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || null;
      })

      // Supprimer élevage
      .addCase(deleteElevage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteElevage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.elevages = state.elevages.filter(e => e.id !== action.payload);
        if (state.currentElevage?.id === action.payload) {
          state.currentElevage = null;
        }
        state.error = null;
      })
      .addCase(deleteElevage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || null;
      })

      // Utilisateurs d'élevage
      .addCase(fetchElevageUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchElevageUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.elevageUsers = action.payload;
        state.error = null;
      })
      .addCase(fetchElevageUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || null;
      })

      // Ajouter utilisateur à l'élevage
      .addCase(addUserToElevage.fulfilled, (state) => {
        // Rechargera automatiquement via fetchElevageUsers
        state.error = null;
      })
      .addCase(addUserToElevage.rejected, (state, action) => {
        state.error = action.payload || null;
      })

      // Retirer utilisateur de l'élevage
      .addCase(removeUserFromElevage.fulfilled, (state, action) => {
        state.elevageUsers = state.elevageUsers.filter(eu => eu.user_id !== action.payload);
        state.error = null;
      })
      .addCase(removeUserFromElevage.rejected, (state, action) => {
        state.error = action.payload || null;
      });
  },
});

export const { clearError, setShowMyOnly, clearCurrentElevage } = elevageSlice.actions;

// Selectors
export const selectElevages = (state: { elevage: ElevageState }) => state.elevage.elevages;
export const selectCurrentElevage = (state: { elevage: ElevageState }) => state.elevage.currentElevage;
export const selectElevageUsers = (state: { elevage: ElevageState }) => state.elevage.elevageUsers;
export const selectElevageLoading = (state: { elevage: ElevageState }) => state.elevage.isLoading;
export const selectElevageError = (state: { elevage: ElevageState }) => state.elevage.error;
export const selectShowMyOnly = (state: { elevage: ElevageState }) => state.elevage.showMyOnly;

export default elevageSlice.reducer;