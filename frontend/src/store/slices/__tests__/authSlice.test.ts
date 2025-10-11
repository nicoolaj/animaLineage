import authReducer, {
  loginUser,
  registerUser,
  initializeAuth,
  logout,
  clearError,
  selectAuth,
  selectUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
  selectIsAdmin,
  selectIsModerator,
  selectCanModerate
} from '../authSlice';
import { ERROR_CODES } from '../../../utils/errorCodes';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
});

describe('authSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });
  const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  };

  const mockUser = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 1,
    role_name: 'Admin',
    status: 1,
  };

  const mockToken = 'mock-jwt-token';

  const mockLoginResponse = {
    user: mockUser,
    token: mockToken,
  };

  describe('initial state', () => {
    it('should return the initial state', () => {
      expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });
  });

  describe('reducers', () => {
    describe('logout', () => {
      it('should clear all auth state', () => {
        const stateWithAuth = {
          ...initialState,
          user: mockUser,
          token: mockToken,
          isAuthenticated: true,
          error: { code: ERROR_CODES.AUTH_001, message: 'Some error' },
        };

        const result = authReducer(stateWithAuth, logout());

        expect(result.user).toBeNull();
        expect(result.token).toBeNull();
        expect(result.isAuthenticated).toBe(false);
        expect(result.error).toBeNull();
      });
    });

    describe('clearError', () => {
      it('should clear the error state', () => {
        const stateWithError = {
          ...initialState,
          error: { code: ERROR_CODES.AUTH_001, message: 'Some error' },
        };

        const result = authReducer(stateWithError, clearError());

        expect(result.error).toBeNull();
      });
    });
  });

  describe('extraReducers', () => {
    describe('loginUser', () => {
      it('should handle loginUser.pending', () => {
        const action = { type: loginUser.pending.type };
        const state = authReducer(initialState, action);

        expect(state.isLoading).toBe(true);
        expect(state.error).toBeNull();
      });

      it('should handle loginUser.fulfilled', () => {
        const action = { type: loginUser.fulfilled.type, payload: mockLoginResponse };
        const state = authReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.user).toEqual(mockUser);
        expect(state.token).toBe(mockToken);
        expect(state.isAuthenticated).toBe(true);
        expect(state.error).toBeNull();
      });

      it('should handle loginUser.rejected', () => {
        const error = { code: ERROR_CODES.AUTH_001, message: 'Invalid credentials' };
        const action = { type: loginUser.rejected.type, payload: error };
        const state = authReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.error).toEqual(error);
        expect(state.isAuthenticated).toBe(false);
        expect(state.user).toBeNull();
        expect(state.token).toBeNull();
      });

      it('should handle loginUser.rejected with null payload', () => {
        const action = { type: loginUser.rejected.type, payload: null };
        const state = authReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.error).toEqual({
          code: ERROR_CODES.SYS_010,
          message: 'Unknown login error'
        });
      });
    });

    describe('registerUser', () => {
      it('should handle registerUser.pending', () => {
        const action = { type: registerUser.pending.type };
        const state = authReducer(initialState, action);

        expect(state.isLoading).toBe(true);
        expect(state.error).toBeNull();
      });

      it('should handle registerUser.fulfilled', () => {
        const action = { type: registerUser.fulfilled.type, payload: mockLoginResponse };
        const state = authReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.user).toEqual(mockUser);
        expect(state.token).toBe(mockToken);
        expect(state.isAuthenticated).toBe(true);
        expect(state.error).toBeNull();
      });

      it('should handle registerUser.rejected', () => {
        const error = { code: ERROR_CODES.AUTH_003, message: 'Email already exists' };
        const action = { type: registerUser.rejected.type, payload: error };
        const state = authReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.error).toEqual(error);
        expect(state.isAuthenticated).toBe(false);
        expect(state.user).toBeNull();
        expect(state.token).toBeNull();
      });

      it('should handle registerUser.rejected with null payload', () => {
        const action = { type: registerUser.rejected.type, payload: null };
        const state = authReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.error).toEqual({
          code: ERROR_CODES.SYS_010,
          message: 'Unknown registration error'
        });
      });
    });

    describe('initializeAuth', () => {
      it('should handle initializeAuth.pending', () => {
        const action = { type: initializeAuth.pending.type };
        const state = authReducer(initialState, action);

        expect(state.isLoading).toBe(true);
      });

      it('should handle initializeAuth.fulfilled', () => {
        const action = { type: initializeAuth.fulfilled.type, payload: mockLoginResponse };
        const state = authReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.user).toEqual(mockUser);
        expect(state.token).toBe(mockToken);
        expect(state.isAuthenticated).toBe(true);
      });

      it('should handle initializeAuth.rejected', () => {
        const error = { code: ERROR_CODES.AUTH_006, message: 'No session found' };
        const action = { type: initializeAuth.rejected.type, payload: error };
        const state = authReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.isAuthenticated).toBe(false);
        expect(state.error).toEqual(error);
      });

      it('should handle initializeAuth.rejected with null payload', () => {
        const action = { type: initializeAuth.rejected.type, payload: null };
        const state = authReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.isAuthenticated).toBe(false);
        expect(state.error).toEqual({
          code: ERROR_CODES.AUTH_006,
          message: 'Authentication initialization failed'
        });
      });
    });
  });

  describe('selectors', () => {
    const mockState = {
      auth: {
        user: mockUser,
        token: mockToken,
        isAuthenticated: true,
        isLoading: false,
        error: { code: ERROR_CODES.AUTH_001, message: 'Test error' },
      },
    };

    const mockStateWithModeratorUser = {
      auth: {
        ...mockState.auth,
        user: { ...mockUser, role: 2, role_name: 'Moderator' },
      },
    };

    const mockStateWithRegularUser = {
      auth: {
        ...mockState.auth,
        user: { ...mockUser, role: 3, role_name: 'User' },
      },
    };

    const mockStateWithoutUser = {
      auth: {
        ...mockState.auth,
        user: null,
        isAuthenticated: false,
      },
    };

    it('should select auth state', () => {
      expect(selectAuth(mockState)).toEqual(mockState.auth);
    });

    it('should select user', () => {
      expect(selectUser(mockState)).toEqual(mockUser);
    });

    it('should select isAuthenticated', () => {
      expect(selectIsAuthenticated(mockState)).toBe(true);
    });

    it('should select loading state', () => {
      expect(selectAuthLoading(mockState)).toBe(false);
    });

    it('should select error state', () => {
      expect(selectAuthError(mockState)).toEqual({
        code: ERROR_CODES.AUTH_001,
        message: 'Test error',
      });
    });

    it('should select isAdmin for admin user', () => {
      expect(selectIsAdmin(mockState)).toBe(true);
    });

    it('should select isAdmin as false for moderator user', () => {
      expect(selectIsAdmin(mockStateWithModeratorUser)).toBe(false);
    });

    it('should select isAdmin as false for regular user', () => {
      expect(selectIsAdmin(mockStateWithRegularUser)).toBe(false);
    });

    it('should select isAdmin as false when no user', () => {
      expect(selectIsAdmin(mockStateWithoutUser)).toBe(false);
    });

    it('should select isModerator for moderator user', () => {
      expect(selectIsModerator(mockStateWithModeratorUser)).toBe(true);
    });

    it('should select isModerator as false for admin user', () => {
      expect(selectIsModerator(mockState)).toBe(false);
    });

    it('should select isModerator as false for regular user', () => {
      expect(selectIsModerator(mockStateWithRegularUser)).toBe(false);
    });

    it('should select isModerator as false when no user', () => {
      expect(selectIsModerator(mockStateWithoutUser)).toBe(false);
    });

    it('should select canModerate for admin user', () => {
      expect(selectCanModerate(mockState)).toBe(true);
    });

    it('should select canModerate for moderator user', () => {
      expect(selectCanModerate(mockStateWithModeratorUser)).toBe(true);
    });

    it('should select canModerate as false for regular user', () => {
      expect(selectCanModerate(mockStateWithRegularUser)).toBe(false);
    });

    it('should select canModerate as false when no user', () => {
      expect(selectCanModerate(mockStateWithoutUser)).toBe(false);
    });
  });

  describe('state transitions', () => {
    it('should handle multiple state updates correctly', () => {
      let state = authReducer(initialState, { type: loginUser.pending.type });
      expect(state.isLoading).toBe(true);

      state = authReducer(state, {
        type: loginUser.fulfilled.type,
        payload: mockLoginResponse,
      });
      expect(state.isLoading).toBe(false);
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe(mockToken);
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBeNull();

      state = authReducer(state, logout());
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should preserve other state when clearing error', () => {
      const stateWithData = {
        ...initialState,
        user: mockUser,
        token: mockToken,
        isAuthenticated: true,
        error: { code: ERROR_CODES.AUTH_001, message: 'Test error' },
      };

      const result = authReducer(stateWithData, clearError());
      expect(result.error).toBeNull();
      expect(result.user).toEqual(mockUser);
      expect(result.token).toBe(mockToken);
      expect(result.isAuthenticated).toBe(true);
    });

    it('should handle error states correctly', () => {
      const authenticatedState = {
        ...initialState,
        user: mockUser,
        token: mockToken,
        isAuthenticated: true,
        isLoading: true,
      };

      const error = { code: ERROR_CODES.AUTH_001, message: 'API Error' };
      const result = authReducer(authenticatedState, {
        type: loginUser.rejected.type,
        payload: error,
      });

      expect(result.isLoading).toBe(false);
      expect(result.error).toEqual(error);
      // Authentication state should be preserved on login errors
      expect(result.user).toEqual(mockUser);
      expect(result.token).toBe(mockToken);
      expect(result.isAuthenticated).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle unknown action types gracefully', () => {
      const result = authReducer(initialState, { type: 'unknown/action' });
      expect(result).toEqual(initialState);
    });

    it('should handle undefined state gracefully', () => {
      const result = authReducer(undefined, { type: 'unknown/action' });
      expect(result).toEqual(initialState);
    });

    it('should handle empty payloads gracefully', () => {
      const result = authReducer(initialState, {
        type: loginUser.fulfilled.type,
        payload: { user: null, token: null },
      });
      expect(result.user).toBeNull();
      expect(result.token).toBeNull();
      expect(result.isAuthenticated).toBe(true); // Still marked as authenticated
      expect(result.isLoading).toBe(false);
      expect(result.error).toBeNull();
    });
  });
});