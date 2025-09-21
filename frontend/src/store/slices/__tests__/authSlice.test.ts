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

// Mock fetch global
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage });

// Mock atob for JWT decoding
global.atob = jest.fn();

// Mock Date.now for token expiration tests
const mockDateNow = jest.spyOn(Date, 'now');

// Helper to create mock JWT payload
const createMockJWTPayload = (exp: number) => {
  return JSON.stringify({ exp });
};

describe('authSlice', () => {
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
    email: 'john.doe@example.com',
    role: 1,
    role_name: 'Admin',
    status: 1,
  };

  const mockToken = 'mock.jwt.token';

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    mockSessionStorage.getItem.mockClear();
    mockSessionStorage.setItem.mockClear();
    mockSessionStorage.removeItem.mockClear();
    mockDateNow.mockReturnValue(1000000); // Default current time
  });

  afterAll(() => {
    mockDateNow.mockRestore();
  });

  describe('initial state', () => {
    test('should return the initial state', () => {
      expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });
  });

  describe('reducers', () => {
    test('should handle logout', () => {
      const previousState = {
        user: mockUser,
        token: mockToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

      const actual = authReducer(previousState, logout());

      expect(actual).toEqual(initialState);
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('user');
    });

    test('should handle clearError', () => {
      const previousState = {
        ...initialState,
        error: {
          code: ERROR_CODES.AUTH_001,
          message: 'Invalid credentials'
        }
      };

      const actual = authReducer(previousState, clearError());

      expect(actual.error).toBeNull();
    });
  });

  describe('loginUser async thunk', () => {
    test('should handle successful login', async () => {
      const mockResponse = {
        user: mockUser,
        token: mockToken
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const dispatch = jest.fn();
      const getState = jest.fn();

      const thunk = loginUser({ email: 'test@example.com', password: 'password123' });
      const result = await thunk(dispatch, getState, {});

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
        }
      );

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('token', mockToken);
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));

      expect(result.type).toBe('auth/login/fulfilled');
      expect(result.payload).toEqual(mockResponse);
    });

    test('should handle login failure with error code', async () => {
      const errorResponse = {
        message: 'Invalid credentials',
        error_code: ERROR_CODES.AUTH_001
      };

      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve(errorResponse)
      });

      const dispatch = jest.fn();
      const getState = jest.fn();

      const thunk = loginUser({ email: 'test@example.com', password: 'wrongpassword' });
      const result = await thunk(dispatch, getState, {});

      expect(result.type).toBe('auth/login/rejected');
      expect(result.payload).toEqual(
        expect.objectContaining({
          code: ERROR_CODES.AUTH_001,
          message: 'Invalid credentials'
        })
      );
    });

    test('should handle network error during login', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const dispatch = jest.fn();
      const getState = jest.fn();

      const thunk = loginUser({ email: 'test@example.com', password: 'password123' });
      const result = await thunk(dispatch, getState, {});

      expect(result.type).toBe('auth/login/rejected');
      expect(result.payload).toEqual(
        expect.objectContaining({
          code: ERROR_CODES.SYS_001,
          message: 'Network error during login'
        })
      );
    });

    test('should handle login pending state', () => {
      const action = { type: loginUser.pending.type };
      const state = authReducer(initialState, action);

      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    test('should handle login fulfilled state', () => {
      const action = {
        type: loginUser.fulfilled.type,
        payload: { user: mockUser, token: mockToken }
      };
      const state = authReducer(initialState, action);

      expect(state.isLoading).toBe(false);
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe(mockToken);
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBeNull();
    });

    test('should handle login rejected state', () => {
      const error = {
        code: ERROR_CODES.AUTH_001,
        message: 'Invalid credentials'
      };
      const action = {
        type: loginUser.rejected.type,
        payload: error
      };
      const state = authReducer(initialState, action);

      expect(state.isLoading).toBe(false);
      expect(state.error).toEqual(error);
    });
  });

  describe('registerUser async thunk', () => {
    test('should handle successful registration', async () => {
      const mockResponse = {
        user: mockUser,
        token: mockToken
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const dispatch = jest.fn();
      const getState = jest.fn();

      const thunk = registerUser({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });
      const result = await thunk(dispatch, getState, {});

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/auth/register',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'John Doe',
            email: 'john@example.com',
            password: 'password123'
          })
        }
      );

      expect(result.type).toBe('auth/register/fulfilled');
      expect(result.payload).toEqual(mockResponse);
    });

    test('should handle registration failure', async () => {
      const errorResponse = {
        message: 'Email already exists',
        error_code: ERROR_CODES.AUTH_003
      };

      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve(errorResponse)
      });

      const dispatch = jest.fn();
      const getState = jest.fn();

      const thunk = registerUser({
        name: 'John Doe',
        email: 'existing@example.com',
        password: 'password123'
      });
      const result = await thunk(dispatch, getState, {});

      expect(result.type).toBe('auth/register/rejected');
      expect(result.payload).toEqual(
        expect.objectContaining({
          code: ERROR_CODES.AUTH_003,
          message: 'Email already exists'
        })
      );
    });

    test('should handle network error during registration', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const dispatch = jest.fn();
      const getState = jest.fn();

      const thunk = registerUser({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });
      const result = await thunk(dispatch, getState, {});

      expect(result.type).toBe('auth/register/rejected');
      expect(result.payload).toEqual(
        expect.objectContaining({
          code: ERROR_CODES.SYS_001,
          message: 'Network error during registration'
        })
      );
    });
  });

  describe('initializeAuth async thunk', () => {
    test('should restore valid session from storage', async () => {
      const futureTimestamp = Date.now() / 1000 + 3600; // 1 hour in the future

      mockSessionStorage.getItem
        .mockReturnValueOnce(mockToken)
        .mockReturnValueOnce(JSON.stringify(mockUser));

      // Mock atob to return valid JWT payload
      (global.atob as jest.Mock).mockReturnValue(createMockJWTPayload(futureTimestamp));

      const dispatch = jest.fn();
      const getState = jest.fn();

      const thunk = initializeAuth();
      const result = await thunk(dispatch, getState, {});

      expect(result.type).toBe('auth/initialize/fulfilled');
      expect(result.payload).toEqual({
        token: mockToken,
        user: mockUser
      });
    });

    test('should reject with expired token', async () => {
      const pastTimestamp = Date.now() / 1000 - 3600; // 1 hour in the past

      mockSessionStorage.getItem
        .mockReturnValueOnce(mockToken)
        .mockReturnValueOnce(JSON.stringify(mockUser));

      // Mock atob to return expired JWT payload
      (global.atob as jest.Mock).mockReturnValue(createMockJWTPayload(pastTimestamp));

      const dispatch = jest.fn();
      const getState = jest.fn();

      const thunk = initializeAuth();
      const result = await thunk(dispatch, getState, {});

      expect(result.type).toBe('auth/initialize/rejected');
      expect(result.payload).toEqual(
        expect.objectContaining({
          code: ERROR_CODES.AUTH_005,
          message: 'Token expired'
        })
      );

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('user');
    });

    test('should reject with corrupted user data', async () => {
      const futureTimestamp = Date.now() / 1000 + 3600;

      mockSessionStorage.getItem
        .mockReturnValueOnce(mockToken)
        .mockReturnValueOnce('invalid-json');

      (global.atob as jest.Mock).mockReturnValue(createMockJWTPayload(futureTimestamp));

      const dispatch = jest.fn();
      const getState = jest.fn();

      const thunk = initializeAuth();
      const result = await thunk(dispatch, getState, {});

      expect(result.type).toBe('auth/initialize/rejected');
      expect(result.payload).toEqual(
        expect.objectContaining({
          code: ERROR_CODES.AUTH_004,
          message: 'Corrupted user data'
        })
      );

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('user');
    });

    test('should reject when no session found', async () => {
      mockSessionStorage.getItem.mockReturnValue(null);

      const dispatch = jest.fn();
      const getState = jest.fn();

      const thunk = initializeAuth();
      const result = await thunk(dispatch, getState, {});

      expect(result.type).toBe('auth/initialize/rejected');
      expect(result.payload).toEqual(
        expect.objectContaining({
          code: ERROR_CODES.AUTH_006,
          message: 'No session found'
        })
      );
    });

    test('should handle invalid JWT token format', async () => {
      mockSessionStorage.getItem
        .mockReturnValueOnce('invalid.token')
        .mockReturnValueOnce(JSON.stringify(mockUser));

      // Mock atob to throw error for invalid token
      (global.atob as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token format');
      });

      const dispatch = jest.fn();
      const getState = jest.fn();

      const thunk = initializeAuth();
      const result = await thunk(dispatch, getState, {});

      expect(result.type).toBe('auth/initialize/rejected');
      expect(result.payload).toEqual(
        expect.objectContaining({
          code: ERROR_CODES.AUTH_005,
          message: 'Token expired'
        })
      );
    });
  });

  describe('selectors', () => {
    const mockState = {
      auth: {
        user: mockUser,
        token: mockToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }
    };

    test('selectAuth should return auth state', () => {
      expect(selectAuth(mockState)).toEqual(mockState.auth);
    });

    test('selectUser should return user', () => {
      expect(selectUser(mockState)).toEqual(mockUser);
    });

    test('selectIsAuthenticated should return authentication status', () => {
      expect(selectIsAuthenticated(mockState)).toBe(true);
    });

    test('selectAuthLoading should return loading status', () => {
      expect(selectAuthLoading(mockState)).toBe(false);
    });

    test('selectAuthError should return error', () => {
      expect(selectAuthError(mockState)).toBeNull();
    });

    test('selectIsAdmin should return true for admin user', () => {
      expect(selectIsAdmin(mockState)).toBe(true);
    });

    test('selectIsAdmin should return false for non-admin user', () => {
      const stateWithModerator = {
        auth: {
          ...mockState.auth,
          user: { ...mockUser, role: 2 }
        }
      };
      expect(selectIsAdmin(stateWithModerator)).toBe(false);
    });

    test('selectIsModerator should return true for moderator user', () => {
      const stateWithModerator = {
        auth: {
          ...mockState.auth,
          user: { ...mockUser, role: 2 }
        }
      };
      expect(selectIsModerator(stateWithModerator)).toBe(true);
    });

    test('selectIsModerator should return false for admin user', () => {
      expect(selectIsModerator(mockState)).toBe(false);
    });

    test('selectCanModerate should return true for admin', () => {
      expect(selectCanModerate(mockState)).toBe(true);
    });

    test('selectCanModerate should return true for moderator', () => {
      const stateWithModerator = {
        auth: {
          ...mockState.auth,
          user: { ...mockUser, role: 2 }
        }
      };
      expect(selectCanModerate(stateWithModerator)).toBe(true);
    });

    test('selectCanModerate should return false for regular user', () => {
      const stateWithRegularUser = {
        auth: {
          ...mockState.auth,
          user: { ...mockUser, role: 3 }
        }
      };
      expect(selectCanModerate(stateWithRegularUser)).toBe(false);
    });

    test('selectors should handle null user', () => {
      const stateWithoutUser = {
        auth: {
          ...mockState.auth,
          user: null
        }
      };

      expect(selectUser(stateWithoutUser)).toBeNull();
      expect(selectIsAdmin(stateWithoutUser)).toBe(false);
      expect(selectIsModerator(stateWithoutUser)).toBe(false);
      expect(selectCanModerate(stateWithoutUser)).toBe(false);
    });
  });

  describe('extraReducers edge cases', () => {
    test('should handle login rejected without payload', () => {
      const action = {
        type: loginUser.rejected.type,
        payload: undefined
      };
      const state = authReducer(initialState, action);

      expect(state.isLoading).toBe(false);
      expect(state.error).toEqual({
        code: ERROR_CODES.SYS_010,
        message: 'Unknown login error'
      });
    });

    test('should handle register rejected without payload', () => {
      const action = {
        type: registerUser.rejected.type,
        payload: undefined
      };
      const state = authReducer(initialState, action);

      expect(state.isLoading).toBe(false);
      expect(state.error).toEqual({
        code: ERROR_CODES.SYS_010,
        message: 'Unknown registration error'
      });
    });

    test('should handle initialize rejected without payload', () => {
      const action = {
        type: initializeAuth.rejected.type,
        payload: undefined
      };
      const state = authReducer(initialState, action);

      expect(state.isLoading).toBe(false);
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toEqual({
        code: ERROR_CODES.AUTH_006,
        message: 'Authentication initialization failed'
      });
    });
  });

  describe('token expiration utility', () => {
    test('should handle various token expiration scenarios', async () => {
      // Test scenarios are covered in initializeAuth tests above
      // This ensures the isTokenExpired utility works correctly

      // Valid token
      const futureTimestamp = Date.now() / 1000 + 3600;
      mockSessionStorage.getItem
        .mockReturnValueOnce('valid.token')
        .mockReturnValueOnce(JSON.stringify(mockUser));
      (global.atob as jest.Mock).mockReturnValue(createMockJWTPayload(futureTimestamp));

      const dispatch = jest.fn();
      const getState = jest.fn();

      const thunk = initializeAuth();
      const result = await thunk(dispatch, getState, {});

      expect(result.type).toBe('auth/initialize/fulfilled');
    });
  });
});