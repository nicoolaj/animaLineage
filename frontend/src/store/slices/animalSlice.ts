import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { extractErrorCode, createCodedError } from '../../utils/errorHandler';
import { CodedError, ERROR_CODES } from '../../utils/errorCodes';

interface Animal {
  id: number;
  identifiant_officiel: string;
  nom?: string;
  sexe: 'M' | 'F';
  pere_id?: number;
  mere_id?: number;
  race_id: number;
  pere_identifiant?: string;
  pere_nom?: string;
  mere_identifiant?: string;
  mere_nom?: string;
  race_nom: string;
  date_naissance?: string;
  date_bouclage?: string;
  date_deces?: string;
  elevage_id?: number;
  elevage_nom?: string;
  notes?: string;
  statut: 'vivant' | 'mort';
  created_at: string;
}

interface AnimalState {
  animals: Animal[];
  descendants: Animal[];
  isLoading: boolean;
  error: CodedError | null;
}

const initialState: AnimalState = {
  animals: [],
  descendants: [],
  isLoading: false,
  error: null,
};

// Helper pour obtenir les headers d'authentification
const getAuthHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
});

// Async thunks
export const fetchAnimals = createAsyncThunk<
  Animal[],
  { elevageId?: number; token: string },
  { rejectValue: CodedError }
>(
  'animal/fetchAnimals',
  async ({ elevageId, token }, { rejectWithValue }) => {
    try {
      const url = elevageId
        ? `http://localhost:3001/api/animaux?elevage_id=${elevageId}`
        : 'http://localhost:3001/api/animaux';

      const response = await fetch(url, {
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorCode = extractErrorCode(errorData) || ERROR_CODES.ANIMAL_001;
        return rejectWithValue(createCodedError({
          ...errorData,
          code: errorCode
        }));
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(createCodedError({
        code: ERROR_CODES.SYS_001,
        message: 'Network error while fetching animals'
      }));
    }
  }
);

export const createAnimal = createAsyncThunk<
  any,
  { animalData: any; token: string },
  { rejectValue: CodedError }
>(
  'animal/createAnimal',
  async ({ animalData, token }, { rejectWithValue }) => {
    try {
      const response = await fetch('http://localhost:3001/api/animaux', {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(animalData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorCode = extractErrorCode(errorData) || ERROR_CODES.ANIMAL_002;
        return rejectWithValue(createCodedError({
          ...errorData,
          code: errorCode
        }));
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(createCodedError({
        code: ERROR_CODES.SYS_001,
        message: 'Network error while creating animal'
      }));
    }
  }
);

export const updateAnimal = createAsyncThunk<
  any,
  { id: number; animalData: any; token: string },
  { rejectValue: CodedError }
>(
  'animal/updateAnimal',
  async ({ id, animalData, token }, { rejectWithValue }) => {
    try {
      const response = await fetch(`http://localhost:3001/api/animaux/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(token),
        body: JSON.stringify(animalData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorCode = extractErrorCode(errorData) || ERROR_CODES.ANIMAL_003;
        return rejectWithValue(createCodedError({
          ...errorData,
          code: errorCode
        }));
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(createCodedError({
        code: ERROR_CODES.SYS_001,
        message: 'Network error while updating animal'
      }));
    }
  }
);

export const deleteAnimal = createAsyncThunk<
  number,
  { id: number; token: string },
  { rejectValue: CodedError }
>(
  'animal/deleteAnimal',
  async ({ id, token }, { rejectWithValue }) => {
    try {
      const response = await fetch(`http://localhost:3001/api/animaux/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorCode = extractErrorCode(errorData) || ERROR_CODES.ANIMAL_004;
        return rejectWithValue(createCodedError({
          ...errorData,
          code: errorCode
        }));
      }

      return id;
    } catch (error) {
      return rejectWithValue(createCodedError({
        code: ERROR_CODES.SYS_001,
        message: 'Network error while deleting animal'
      }));
    }
  }
);

export const markAnimalDead = createAsyncThunk<
  any,
  { id: number; dateDeces: string; token: string },
  { rejectValue: CodedError }
>(
  'animal/markAnimalDead',
  async ({ id, dateDeces, token }, { rejectWithValue }) => {
    try {
      const response = await fetch(`http://localhost:3001/api/animaux/${id}/deces`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({ date_deces: dateDeces }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorCode = extractErrorCode(errorData) || ERROR_CODES.ANIMAL_005;
        return rejectWithValue(createCodedError({
          ...errorData,
          code: errorCode
        }));
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(createCodedError({
        code: ERROR_CODES.SYS_001,
        message: 'Network error while marking animal as dead'
      }));
    }
  }
);

export const fetchDescendants = createAsyncThunk<
  any[],
  { animalId: number; token: string },
  { rejectValue: CodedError }
>(
  'animal/fetchDescendants',
  async ({ animalId, token }, { rejectWithValue }) => {
    try {
      const response = await fetch(`http://localhost:3001/api/animaux/${animalId}/descendants`, {
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorCode = extractErrorCode(errorData) || ERROR_CODES.ANIMAL_006;
        return rejectWithValue(createCodedError({
          ...errorData,
          code: errorCode
        }));
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(createCodedError({
        code: ERROR_CODES.SYS_001,
        message: 'Network error while fetching descendants'
      }));
    }
  }
);

const animalSlice = createSlice({
  name: 'animal',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearDescendants: (state) => {
      state.descendants = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch animaux
      .addCase(fetchAnimals.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAnimals.fulfilled, (state, action) => {
        state.isLoading = false;
        state.animals = action.payload;
        state.error = null;
      })
      .addCase(fetchAnimals.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? {
          code: ERROR_CODES.SYS_010,
          message: 'Unknown error while fetching animals'
        };
      })

      // Créer animal
      .addCase(createAnimal.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createAnimal.fulfilled, (state, action) => {
        state.isLoading = false;
        state.animals.push(action.payload);
        state.error = null;
      })
      .addCase(createAnimal.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? {
          code: ERROR_CODES.SYS_010,
          message: 'Unknown error while creating animal'
        };
      })

      // Modifier animal
      .addCase(updateAnimal.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateAnimal.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.animals.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.animals[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateAnimal.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? {
          code: ERROR_CODES.SYS_010,
          message: 'Unknown error while updating animal'
        };
      })

      // Supprimer animal
      .addCase(deleteAnimal.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteAnimal.fulfilled, (state, action) => {
        state.isLoading = false;
        state.animals = state.animals.filter(a => a.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteAnimal.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? {
          code: ERROR_CODES.SYS_010,
          message: 'Unknown error while deleting animal'
        };
      })

      // Marquer décédé
      .addCase(markAnimalDead.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(markAnimalDead.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.animals.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.animals[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(markAnimalDead.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? {
          code: ERROR_CODES.SYS_010,
          message: 'Unknown error while marking animal as dead'
        };
      })

      // Descendants
      .addCase(fetchDescendants.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDescendants.fulfilled, (state, action) => {
        state.isLoading = false;
        state.descendants = action.payload;
        state.error = null;
      })
      .addCase(fetchDescendants.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? {
          code: ERROR_CODES.SYS_010,
          message: 'Unknown error while fetching descendants'
        };
      });
  },
});

export const { clearError, clearDescendants } = animalSlice.actions;

// Selectors
export const selectAnimals = (state: { animal: AnimalState }) => state.animal.animals;
export const selectDescendants = (state: { animal: AnimalState }) => state.animal.descendants;
export const selectAnimalLoading = (state: { animal: AnimalState }) => state.animal.isLoading;
export const selectAnimalError = (state: { animal: AnimalState }) => state.animal.error;

export default animalSlice.reducer;