import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { extractErrorCode, createCodedError } from '../../utils/errorHandler';
import { CodedError, ERROR_CODES } from '../../utils/errorCodes';

interface User {
  id: number;
  name: string;
  email: string;
  role: number;
  role_name: string;
  status: number;
}

interface Race {
  id: number;
  nom: string;
  type_animal_id: number;
  type_animal_nom: string;
  description: string;
}

interface UserState {
  users: User[];
  availableUsers: User[];
  races: Race[];
  isLoading: boolean;
  error: CodedError | null;
}

const initialState: UserState = {
  users: [],
  availableUsers: [],
  races: [],
  isLoading: false,
  error: null,
};

// Helper pour obtenir les headers d'authentification
const getAuthHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
});

// Async thunks
export const fetchUsers = createAsyncThunk<
  User[],
  { token: string },
  { rejectValue: CodedError }
>(
  'user/fetchUsers',
  async ({ token }, { rejectWithValue }) => {
    try {
      const response = await fetch('http://localhost:3001/api/users', {
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorCode = extractErrorCode(errorData) || ERROR_CODES.USER_001;
        return rejectWithValue(createCodedError({
          ...errorData,
          code: errorCode
        }));
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      return rejectWithValue(createCodedError({
        code: ERROR_CODES.SYS_001,
        message: 'Network error while fetching users'
      }));
    }
  }
);

export const fetchAvailableUsers = createAsyncThunk<
  User[],
  { token: string; excludeUserIds?: number[] },
  { rejectValue: CodedError }
>(
  'user/fetchAvailableUsers',
  async ({ token, excludeUserIds }, { rejectWithValue }) => {
    try {
      const response = await fetch('http://localhost:3001/api/users', {
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorCode = extractErrorCode(errorData) || ERROR_CODES.USER_002;
        return rejectWithValue(createCodedError({
          ...errorData,
          code: errorCode
        }));
      }

      const responseData = await response.json();
      const users = responseData.data || responseData;

      // Filtrer les utilisateurs exclus si spécifié
      if (excludeUserIds && excludeUserIds.length > 0) {
        return users.filter((user: User) => !excludeUserIds.includes(user.id));
      }

      return users;
    } catch (error) {
      return rejectWithValue(createCodedError({
        code: ERROR_CODES.SYS_001,
        message: 'Network error while fetching available users'
      }));
    }
  }
);

export const fetchRaces = createAsyncThunk<
  Race[],
  { token: string },
  { rejectValue: CodedError }
>(
  'user/fetchRaces',
  async ({ token }, { rejectWithValue }) => {
    try {
      const response = await fetch('http://localhost:3001/api/races', {
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorCode = extractErrorCode(errorData) || ERROR_CODES.RACE_001;
        return rejectWithValue(createCodedError({
          ...errorData,
          code: errorCode
        }));
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      return rejectWithValue(createCodedError({
        code: ERROR_CODES.SYS_001,
        message: 'Network error while fetching races'
      }));
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearAvailableUsers: (state) => {
      state.availableUsers = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch utilisateurs
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload;
        state.error = null;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? {
          code: ERROR_CODES.SYS_010,
          message: 'Unknown error while fetching users'
        };
      })

      // Fetch utilisateurs disponibles
      .addCase(fetchAvailableUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAvailableUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.availableUsers = action.payload;
        state.error = null;
      })
      .addCase(fetchAvailableUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? {
          code: ERROR_CODES.SYS_010,
          message: 'Unknown error while fetching available users'
        };
      })

      // Fetch races
      .addCase(fetchRaces.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRaces.fulfilled, (state, action) => {
        state.isLoading = false;
        state.races = action.payload;
        state.error = null;
      })
      .addCase(fetchRaces.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? {
          code: ERROR_CODES.SYS_010,
          message: 'Unknown error while fetching races'
        };
      });
  },
});

export const { clearError, clearAvailableUsers } = userSlice.actions;

// Selectors
export const selectUsers = (state: { user: UserState }) => state.user.users;
export const selectAvailableUsers = (state: { user: UserState }) => state.user.availableUsers;
export const selectRaces = (state: { user: UserState }) => state.user.races;
export const selectUserLoading = (state: { user: UserState }) => state.user.isLoading;
export const selectUserError = (state: { user: UserState }) => state.user.error;

export default userSlice.reducer;