import userReducer, {
  fetchUsers,
  fetchAvailableUsers,
  fetchRaces,
  clearError,
  clearAvailableUsers,
  selectUsers,
  selectAvailableUsers,
  selectRaces,
  selectUserLoading,
  selectUserError
} from '../userSlice';
import { ERROR_CODES } from '../../../utils/errorCodes';

describe('userSlice', () => {
  const initialState = {
    users: [],
    availableUsers: [],
    races: [],
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

  const mockUsers = [
    mockUser,
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 2,
      role_name: 'User',
      status: 1,
    },
  ];

  const mockRace = {
    id: 1,
    nom: 'Labrador',
    type_animal_id: 1,
    type_animal_nom: 'Chien',
    description: 'Race de chien très populaire',
  };

  const mockRaces = [
    mockRace,
    {
      id: 2,
      nom: 'Siamois',
      type_animal_id: 2,
      type_animal_nom: 'Chat',
      description: 'Race de chat élégante',
    },
  ];

  describe('initial state', () => {
    it('should return the initial state', () => {
      expect(userReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });
  });

  describe('reducers', () => {
    describe('clearError', () => {
      it('should clear the error state', () => {
        const stateWithError = {
          ...initialState,
          error: { code: ERROR_CODES.USER_001, message: 'Some error' },
        };

        const result = userReducer(stateWithError, clearError());

        expect(result.error).toBeNull();
      });
    });

    describe('clearAvailableUsers', () => {
      it('should clear the available users list', () => {
        const stateWithUsers = {
          ...initialState,
          availableUsers: mockUsers,
        };

        const result = userReducer(stateWithUsers, clearAvailableUsers());

        expect(result.availableUsers).toEqual([]);
      });
    });
  });

  describe('extraReducers', () => {
    describe('fetchUsers', () => {
      it('should handle fetchUsers.pending', () => {
        const action = { type: fetchUsers.pending.type };
        const state = userReducer(initialState, action);

        expect(state.isLoading).toBe(true);
        expect(state.error).toBeNull();
      });

      it('should handle fetchUsers.fulfilled', () => {
        const action = { type: fetchUsers.fulfilled.type, payload: mockUsers };
        const state = userReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.users).toEqual(mockUsers);
        expect(state.error).toBeNull();
      });

      it('should handle fetchUsers.rejected', () => {
        const error = { code: ERROR_CODES.USER_001, message: 'Fetch users failed' };
        const action = { type: fetchUsers.rejected.type, payload: error };
        const state = userReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.error).toEqual(error);
      });

      it('should handle fetchUsers.rejected with null payload', () => {
        const action = { type: fetchUsers.rejected.type, payload: null };
        const state = userReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.error).toEqual({
          code: ERROR_CODES.SYS_010,
          message: 'Unknown error while fetching users'
        });
      });
    });

    describe('fetchAvailableUsers', () => {
      it('should handle fetchAvailableUsers.pending', () => {
        const action = { type: fetchAvailableUsers.pending.type };
        const state = userReducer(initialState, action);

        expect(state.isLoading).toBe(true);
        expect(state.error).toBeNull();
      });

      it('should handle fetchAvailableUsers.fulfilled', () => {
        const action = { type: fetchAvailableUsers.fulfilled.type, payload: mockUsers };
        const state = userReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.availableUsers).toEqual(mockUsers);
        expect(state.error).toBeNull();
      });

      it('should handle fetchAvailableUsers.rejected', () => {
        const error = { code: ERROR_CODES.USER_002, message: 'Fetch available users failed' };
        const action = { type: fetchAvailableUsers.rejected.type, payload: error };
        const state = userReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.error).toEqual(error);
      });
    });

    describe('fetchRaces', () => {
      it('should handle fetchRaces.pending', () => {
        const action = { type: fetchRaces.pending.type };
        const state = userReducer(initialState, action);

        expect(state.isLoading).toBe(true);
        expect(state.error).toBeNull();
      });

      it('should handle fetchRaces.fulfilled', () => {
        const action = { type: fetchRaces.fulfilled.type, payload: mockRaces };
        const state = userReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.races).toEqual(mockRaces);
        expect(state.error).toBeNull();
      });

      it('should handle fetchRaces.rejected', () => {
        const error = { code: ERROR_CODES.RACE_001, message: 'Fetch races failed' };
        const action = { type: fetchRaces.rejected.type, payload: error };
        const state = userReducer(initialState, action);

        expect(state.isLoading).toBe(false);
        expect(state.error).toEqual(error);
      });
    });
  });

  describe('selectors', () => {
    const mockState = {
      user: {
        users: mockUsers,
        availableUsers: [mockUsers[0]],
        races: mockRaces,
        isLoading: true,
        error: { code: ERROR_CODES.USER_001, message: 'Test error' },
      },
    };

    it('should select users', () => {
      expect(selectUsers(mockState)).toEqual(mockUsers);
    });

    it('should select available users', () => {
      expect(selectAvailableUsers(mockState)).toEqual([mockUsers[0]]);
    });

    it('should select races', () => {
      expect(selectRaces(mockState)).toEqual(mockRaces);
    });

    it('should select loading state', () => {
      expect(selectUserLoading(mockState)).toBe(true);
    });

    it('should select error state', () => {
      expect(selectUserError(mockState)).toEqual({
        code: ERROR_CODES.USER_001,
        message: 'Test error',
      });
    });
  });

  describe('state transitions', () => {
    it('should handle multiple state updates correctly', () => {
      let state = userReducer(initialState, { type: fetchUsers.pending.type });
      expect(state.isLoading).toBe(true);

      state = userReducer(state, {
        type: fetchUsers.fulfilled.type,
        payload: mockUsers,
      });
      expect(state.isLoading).toBe(false);
      expect(state.users).toEqual(mockUsers);
      expect(state.error).toBeNull();

      state = userReducer(state, { type: fetchAvailableUsers.pending.type });
      expect(state.isLoading).toBe(true);

      state = userReducer(state, {
        type: fetchAvailableUsers.fulfilled.type,
        payload: [mockUsers[0]],
      });
      expect(state.isLoading).toBe(false);
      expect(state.availableUsers).toEqual([mockUsers[0]]);
      expect(state.users).toEqual(mockUsers); // Should not affect users array
    });

    it('should preserve other state when clearing specific properties', () => {
      const stateWithData = {
        ...initialState,
        users: mockUsers,
        availableUsers: [mockUsers[0]],
        races: mockRaces,
        error: { code: ERROR_CODES.USER_001, message: 'Test error' },
      };

      const afterClearError = userReducer(stateWithData, clearError());
      expect(afterClearError.error).toBeNull();
      expect(afterClearError.users).toEqual(mockUsers);
      expect(afterClearError.availableUsers).toEqual([mockUsers[0]]);
      expect(afterClearError.races).toEqual(mockRaces);

      const afterClearAvailable = userReducer(afterClearError, clearAvailableUsers());
      expect(afterClearAvailable.availableUsers).toEqual([]);
      expect(afterClearAvailable.users).toEqual(mockUsers);
      expect(afterClearAvailable.races).toEqual(mockRaces);
      expect(afterClearAvailable.error).toBeNull();
    });

    it('should handle error states correctly', () => {
      const errorState = {
        ...initialState,
        users: mockUsers,
        isLoading: true,
      };

      const error = { code: ERROR_CODES.USER_001, message: 'API Error' };
      const result = userReducer(errorState, {
        type: fetchUsers.rejected.type,
        payload: error,
      });

      expect(result.isLoading).toBe(false);
      expect(result.error).toEqual(error);
      expect(result.users).toEqual(mockUsers); // Should preserve existing data
    });
  });

  describe('edge cases', () => {
    it('should handle unknown action types gracefully', () => {
      const result = userReducer(initialState, { type: 'unknown/action' });
      expect(result).toEqual(initialState);
    });

    it('should handle undefined state gracefully', () => {
      const result = userReducer(undefined, { type: 'unknown/action' });
      expect(result).toEqual(initialState);
    });

    it('should handle empty payloads gracefully', () => {
      const result = userReducer(initialState, {
        type: fetchUsers.fulfilled.type,
        payload: [],
      });
      expect(result.users).toEqual([]);
      expect(result.isLoading).toBe(false);
      expect(result.error).toBeNull();
    });
  });
});