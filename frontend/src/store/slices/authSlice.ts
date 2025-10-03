import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { extractErrorCode, createCodedError } from '../../utils/errorHandler';
import { CodedError, ERROR_CODES } from '../../utils/errorCodes';
import { API_BASE_URL } from '../../config/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: number;
  role_name: string;
  status: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: CodedError | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Utilitaire pour vérifier l'expiration du token
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

// Async thunks pour les actions asynchrones
export const loginUser = createAsyncThunk<
  { user: User; token: string },
  { email: string; password: string },
  { rejectValue: CodedError }
>(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorCode = extractErrorCode(errorData) || ERROR_CODES.AUTH_001;
        return rejectWithValue(createCodedError({
          ...errorData,
          code: errorCode
        }));
      }

      const data = await response.json();

      // Sauvegarder dans sessionStorage
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user', JSON.stringify(data.user));

      return data;
    } catch (error) {
      return rejectWithValue(createCodedError({
        code: ERROR_CODES.SYS_001,
        message: 'Network error during login'
      }));
    }
  }
);

export const registerUser = createAsyncThunk<
  { user: User; token: string },
  { name: string; email: string; password: string },
  { rejectValue: CodedError }
>(
  'auth/register',
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorCode = extractErrorCode(errorData) || ERROR_CODES.AUTH_003;
        return rejectWithValue(createCodedError({
          ...errorData,
          code: errorCode
        }));
      }

      const data = await response.json();

      // Sauvegarder dans sessionStorage
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user', JSON.stringify(data.user));

      return data;
    } catch (error) {
      return rejectWithValue(createCodedError({
        code: ERROR_CODES.SYS_001,
        message: 'Network error during registration'
      }));
    }
  }
);

export const initializeAuth = createAsyncThunk<
  { user: User; token: string },
  void,
  { rejectValue: CodedError }
>(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    const savedToken = sessionStorage.getItem('token');
    const savedUser = sessionStorage.getItem('user');

    if (savedToken && savedUser) {
      if (!isTokenExpired(savedToken)) {
        try {
          const user = JSON.parse(savedUser);
          return { token: savedToken, user };
        } catch {
          // JSON invalide, nettoyer le storage
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          return rejectWithValue(createCodedError({
            code: ERROR_CODES.AUTH_004,
            message: 'Corrupted user data'
          }));
        }
      } else {
        // Token expiré, nettoyer le storage
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        return rejectWithValue(createCodedError({
          code: ERROR_CODES.AUTH_005,
          message: 'Token expired'
        }));
      }
    }

    return rejectWithValue(createCodedError({
      code: ERROR_CODES.AUTH_006,
      message: 'No session found'
    }));
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;

      // Nettoyer le storage
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? {
          code: ERROR_CODES.SYS_010,
          message: 'Unknown login error'
        };
      })

      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? {
          code: ERROR_CODES.SYS_010,
          message: 'Unknown registration error'
        };
      })

      // Initialize
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload ?? {
          code: ERROR_CODES.AUTH_006,
          message: 'Authentication initialization failed'
        };
      });
  },
});

export const { logout, clearError } = authSlice.actions;

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;

// Helper selectors pour les rôles
export const selectIsAdmin = (state: { auth: AuthState }) => state.auth.user?.role === 1;
export const selectIsModerator = (state: { auth: AuthState }) => state.auth.user?.role === 2;
export const selectCanModerate = (state: { auth: AuthState }) => {
  const role = state.auth.user?.role;
  return role === 1 || role === 2; // Admin ou Modérateur
};

export default authSlice.reducer;