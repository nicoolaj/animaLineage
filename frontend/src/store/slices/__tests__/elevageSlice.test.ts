import elevageReducer, {
  fetchElevages,
  fetchElevageById,
  createElevage,
  updateElevage,
  deleteElevage,
  fetchElevageUsers,
  addUserToElevage,
  removeUserFromElevage,
  clearError,
  setShowMyOnly,
  clearCurrentElevage,
  selectElevages,
  selectCurrentElevage,
  selectElevageUsers,
  selectElevageLoading,
  selectElevageError,
  selectShowMyOnly
} from '../elevageSlice';
import { ERROR_CODES } from '../../../utils/errorCodes';

// Mock fetch global
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('elevageSlice', () => {
  const initialState = {
    elevages: [],
    currentElevage: null,
    elevageUsers: [],
    isLoading: false,
    error: null,
    showMyOnly: false,
  };

  const mockRace = {
    id: 1,
    nom: 'Holstein',
    type_animal_nom: 'Bovin',
    description: 'Race laitière'
  };

  const mockElevage = {
    id: 1,
    nom: 'Ferme du Test',
    adresse: '123 Rue de la Ferme',
    user_id: 1,
    proprietaire_nom: 'Jean Dupont',
    description: 'Élevage de test',
    created_at: '2023-01-15T10:00:00Z',
    races: [mockRace]
  };

  const mockElevages = [
    mockElevage,
    {
      ...mockElevage,
      id: 2,
      nom: 'Élevage Bio',
      proprietaire_nom: 'Marie Martin'
    }
  ];

  const mockElevageUser = {
    user_id: 2,
    user_name: 'Marie Martin',
    user_email: 'marie@example.com',
    role_in_elevage: 'collaborator' as const,
    added_at: '2023-01-20T10:00:00Z'
  };

  const mockElevageUsers = [
    {
      user_id: 1,
      user_name: 'Jean Dupont',
      user_email: 'jean@example.com',
      role_in_elevage: 'owner' as const,
      added_at: '2023-01-15T10:00:00Z'
    },
    mockElevageUser
  ];

  const mockToken = 'mock-token';

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('initial state', () => {
    test('should return the initial state', () => {
      expect(elevageReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });
  });

  describe('reducers', () => {
    test('should handle clearError', () => {
      const stateWithError = {
        ...initialState,
        error: {
          code: ERROR_CODES.ELEVAGE_001,
          message: 'Some error'
        }
      };

      const actual = elevageReducer(stateWithError, clearError());
      expect(actual.error).toBeNull();
    });

    test('should handle setShowMyOnly', () => {
      const actual = elevageReducer(initialState, setShowMyOnly(true));
      expect(actual.showMyOnly).toBe(true);

      const actualFalse = elevageReducer(actual, setShowMyOnly(false));
      expect(actualFalse.showMyOnly).toBe(false);
    });

    test('should handle clearCurrentElevage', () => {
      const stateWithCurrentElevage = {
        ...initialState,
        currentElevage: mockElevage
      };

      const actual = elevageReducer(stateWithCurrentElevage, clearCurrentElevage());
      expect(actual.currentElevage).toBeNull();
    });
  });

  describe('fetchElevages async thunk', () => {
    test('should fetch all elevages successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockElevages)
      });

      const dispatch = jest.fn();
      const getState = jest.fn();

      const thunk = fetchElevages({ token: mockToken });
      const result = await thunk(dispatch, getState, {});

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/elevages',
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`
          }
        }
      );

      expect(result.type).toBe('elevage/fetchElevages/fulfilled');
      expect(result.payload).toEqual(mockElevages);
    });

    test('should fetch user\'s elevages only', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([mockElevage])
      });

      const dispatch = jest.fn();
      const getState = jest.fn();

      const thunk = fetchElevages({ token: mockToken, showMyOnly: true });
      const result = await thunk(dispatch, getState, {});

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/elevages?my=true',
        expect.any(Object)
      );

      expect(result.type).toBe('elevage/fetchElevages/fulfilled');
    });

    test('should handle fetch elevages error', async () => {
      const errorResponse = {
        message: 'Access denied',
        error_code: ERROR_CODES.ELEVAGE_001
      };

      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve(errorResponse)
      });

      const dispatch = jest.fn();
      const getState = jest.fn();

      const thunk = fetchElevages({ token: mockToken });
      const result = await thunk(dispatch, getState, {});

      expect(result.type).toBe('elevage/fetchElevages/rejected');
      expect(result.payload).toEqual(
        expect.objectContaining({
          code: ERROR_CODES.ELEVAGE_001,
          message: 'Access denied'
        })
      );
    });

    test('should handle network error during fetch', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const dispatch = jest.fn();
      const getState = jest.fn();

      const thunk = fetchElevages({ token: mockToken });
      const result = await thunk(dispatch, getState, {});

      expect(result.type).toBe('elevage/fetchElevages/rejected');
      expect(result.payload).toEqual(
        expect.objectContaining({
          code: ERROR_CODES.SYS_001,
          message: 'Network error while fetching breeding farms'
        })
      );
    });

    test('should handle fetchElevages fulfilled state', () => {
      const action = {
        type: fetchElevages.fulfilled.type,
        payload: mockElevages
      };
      const state = elevageReducer(initialState, action);

      expect(state.isLoading).toBe(false);
      expect(state.elevages).toEqual(mockElevages);
      expect(state.error).toBeNull();
    });
  });

  describe('fetchElevageById async thunk', () => {
    test('should fetch elevage by id successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockElevage)
      });

      const dispatch = jest.fn();
      const getState = jest.fn();

      const thunk = fetchElevageById({ id: 1, token: mockToken });
      const result = await thunk(dispatch, getState, {});

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/elevages/1',
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`
          }
        }
      );

      expect(result.type).toBe('elevage/fetchElevageById/fulfilled');
      expect(result.payload).toEqual(mockElevage);
    });

    test('should handle fetchElevageById fulfilled state', () => {
      const action = {
        type: fetchElevageById.fulfilled.type,
        payload: mockElevage
      };
      const state = elevageReducer(initialState, action);

      expect(state.isLoading).toBe(false);
      expect(state.currentElevage).toEqual(mockElevage);
      expect(state.error).toBeNull();
    });
  });

  describe('createElevage async thunk', () => {
    test('should create elevage successfully', async () => {
      const newElevageData = {
        nom: 'Nouveau Élevage',
        adresse: '456 Avenue Test',
        user_id: 1,
        description: 'Description test'
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockElevage)
      });

      const dispatch = jest.fn();
      const getState = jest.fn();

      const thunk = createElevage({ elevageData: newElevageData, token: mockToken });
      const result = await thunk(dispatch, getState, {});

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/elevages',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`
          },
          body: JSON.stringify(newElevageData)
        }
      );

      expect(result.type).toBe('elevage/createElevage/fulfilled');
      expect(result.payload).toEqual(mockElevage);
    });

    test('should handle createElevage fulfilled state', () => {
      const action = {
        type: createElevage.fulfilled.type,
        payload: mockElevage
      };
      const state = elevageReducer(initialState, action);

      expect(state.isLoading).toBe(false);
      expect(state.elevages).toContain(mockElevage);
      expect(state.error).toBeNull();
    });
  });

  describe('updateElevage async thunk', () => {
    test('should update elevage successfully', async () => {
      const updatedElevage = { ...mockElevage, nom: 'Updated Name' };
      const updateData = { nom: 'Updated Name' };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(updatedElevage)
      });

      const dispatch = jest.fn();
      const getState = jest.fn();

      const thunk = updateElevage({ id: 1, elevageData: updateData, token: mockToken });
      const result = await thunk(dispatch, getState, {});

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/elevages/1',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`
          },
          body: JSON.stringify(updateData)
        }
      );

      expect(result.type).toBe('elevage/updateElevage/fulfilled');
      expect(result.payload).toEqual(updatedElevage);
    });

    test('should handle updateElevage fulfilled state', () => {
      const stateWithElevages = {
        ...initialState,
        elevages: [mockElevage, { ...mockElevage, id: 2 }],
        currentElevage: mockElevage
      };

      const updatedElevage = { ...mockElevage, nom: 'Updated Name' };
      const action = {
        type: updateElevage.fulfilled.type,
        payload: updatedElevage
      };

      const state = elevageReducer(stateWithElevages, action);

      expect(state.isLoading).toBe(false);
      expect(state.elevages[0]).toEqual(updatedElevage);
      expect(state.currentElevage).toEqual(updatedElevage);
      expect(state.error).toBeNull();
    });

    test('should handle updateElevage when elevage not found in state', () => {
      const updatedElevage = { ...mockElevage, id: 999, nom: 'Updated Name' };
      const action = {
        type: updateElevage.fulfilled.type,
        payload: updatedElevage
      };

      const state = elevageReducer(initialState, action);

      expect(state.isLoading).toBe(false);
      expect(state.elevages).toEqual([]);
      expect(state.currentElevage).toBeNull();
      expect(state.error).toBeNull();
    });
  });

  describe('deleteElevage async thunk', () => {
    test('should delete elevage successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: 'Elevage deleted' })
      });

      const dispatch = jest.fn();
      const getState = jest.fn();

      const thunk = deleteElevage({ id: 1, token: mockToken });
      const result = await thunk(dispatch, getState, {});

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/elevages/1',
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`
          }
        }
      );

      expect(result.type).toBe('elevage/deleteElevage/fulfilled');
      expect(result.payload).toBe(1);
    });

    test('should handle deleteElevage fulfilled state', () => {
      const stateWithElevages = {
        ...initialState,
        elevages: [mockElevage, { ...mockElevage, id: 2 }],
        currentElevage: mockElevage
      };

      const action = {
        type: deleteElevage.fulfilled.type,
        payload: 1
      };

      const state = elevageReducer(stateWithElevages, action);

      expect(state.isLoading).toBe(false);
      expect(state.elevages).toHaveLength(1);
      expect(state.elevages[0].id).toBe(2);
      expect(state.currentElevage).toBeNull();
      expect(state.error).toBeNull();
    });

    test('should handle deleteElevage when deleting non-current elevage', () => {
      const stateWithElevages = {
        ...initialState,
        elevages: [mockElevage, { ...mockElevage, id: 2 }],
        currentElevage: { ...mockElevage, id: 2 }
      };

      const action = {
        type: deleteElevage.fulfilled.type,
        payload: 1
      };

      const state = elevageReducer(stateWithElevages, action);

      expect(state.currentElevage?.id).toBe(2);
    });
  });

  describe('fetchElevageUsers async thunk', () => {
    test('should fetch elevage users successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockElevageUsers)
      });

      const dispatch = jest.fn();
      const getState = jest.fn();

      const thunk = fetchElevageUsers({ elevageId: 1, token: mockToken });
      const result = await thunk(dispatch, getState, {});

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/elevages/1/users',
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`
          }
        }
      );

      expect(result.type).toBe('elevage/fetchElevageUsers/fulfilled');
      expect(result.payload).toEqual(mockElevageUsers);
    });

    test('should handle fetchElevageUsers fulfilled state', () => {
      const action = {
        type: fetchElevageUsers.fulfilled.type,
        payload: mockElevageUsers
      };
      const state = elevageReducer(initialState, action);

      expect(state.isLoading).toBe(false);
      expect(state.elevageUsers).toEqual(mockElevageUsers);
      expect(state.error).toBeNull();
    });
  });

  describe('addUserToElevage async thunk', () => {
    test('should add user to elevage successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockElevageUser)
      });

      const dispatch = jest.fn();
      const getState = jest.fn();

      const thunk = addUserToElevage({ elevageId: 1, userId: 2, token: mockToken });
      const result = await thunk(dispatch, getState, {});

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/elevages/1/users',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`
          },
          body: JSON.stringify({
            user_id: 2,
            role_in_elevage: 'collaborator'
          })
        }
      );

      expect(result.type).toBe('elevage/addUserToElevage/fulfilled');
      expect(result.payload).toEqual(mockElevageUser);
    });

    test('should handle addUserToElevage fulfilled state', () => {
      const action = {
        type: addUserToElevage.fulfilled.type,
        payload: mockElevageUser
      };
      const state = elevageReducer(initialState, action);

      expect(state.error).toBeNull();
    });
  });

  describe('removeUserFromElevage async thunk', () => {
    test('should remove user from elevage successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: 'User removed' })
      });

      const dispatch = jest.fn();
      const getState = jest.fn();

      const thunk = removeUserFromElevage({ elevageId: 1, userId: 2, token: mockToken });
      const result = await thunk(dispatch, getState, {});

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/elevages/1/users/2',
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`
          }
        }
      );

      expect(result.type).toBe('elevage/removeUserFromElevage/fulfilled');
      expect(result.payload).toBe(2);
    });

    test('should handle removeUserFromElevage fulfilled state', () => {
      const stateWithUsers = {
        ...initialState,
        elevageUsers: mockElevageUsers
      };

      const action = {
        type: removeUserFromElevage.fulfilled.type,
        payload: 2
      };

      const state = elevageReducer(stateWithUsers, action);

      expect(state.elevageUsers).toHaveLength(1);
      expect(state.elevageUsers[0].user_id).toBe(1);
      expect(state.error).toBeNull();
    });
  });

  describe('selectors', () => {
    const mockState = {
      elevage: {
        elevages: mockElevages,
        currentElevage: mockElevage,
        elevageUsers: mockElevageUsers,
        isLoading: false,
        error: null,
        showMyOnly: true
      }
    };

    test('selectElevages should return elevages array', () => {
      expect(selectElevages(mockState)).toEqual(mockElevages);
    });

    test('selectCurrentElevage should return current elevage', () => {
      expect(selectCurrentElevage(mockState)).toEqual(mockElevage);
    });

    test('selectElevageUsers should return elevage users', () => {
      expect(selectElevageUsers(mockState)).toEqual(mockElevageUsers);
    });

    test('selectElevageLoading should return loading status', () => {
      expect(selectElevageLoading(mockState)).toBe(false);
    });

    test('selectElevageError should return error', () => {
      expect(selectElevageError(mockState)).toBeNull();
    });

    test('selectShowMyOnly should return showMyOnly flag', () => {
      expect(selectShowMyOnly(mockState)).toBe(true);
    });
  });

  describe('pending states', () => {
    test('should handle fetchElevages pending state', () => {
      const action = { type: fetchElevages.pending.type };
      const state = elevageReducer(initialState, action);

      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    test('should handle fetchElevageById pending state', () => {
      const action = { type: fetchElevageById.pending.type };
      const state = elevageReducer(initialState, action);

      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    test('should handle createElevage pending state', () => {
      const action = { type: createElevage.pending.type };
      const state = elevageReducer(initialState, action);

      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    test('should handle updateElevage pending state', () => {
      const action = { type: updateElevage.pending.type };
      const state = elevageReducer(initialState, action);

      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    test('should handle deleteElevage pending state', () => {
      const action = { type: deleteElevage.pending.type };
      const state = elevageReducer(initialState, action);

      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    test('should handle fetchElevageUsers pending state', () => {
      const action = { type: fetchElevageUsers.pending.type };
      const state = elevageReducer(initialState, action);

      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });
  });

  describe('rejected states', () => {
    const error = {
      code: ERROR_CODES.ELEVAGE_001,
      message: 'Some error'
    };

    test('should handle fetchElevages rejected state', () => {
      const action = {
        type: fetchElevages.rejected.type,
        payload: error
      };
      const state = elevageReducer(initialState, action);

      expect(state.isLoading).toBe(false);
      expect(state.error).toEqual(error);
    });

    test('should handle fetchElevageById rejected state', () => {
      const action = {
        type: fetchElevageById.rejected.type,
        payload: error
      };
      const state = elevageReducer(initialState, action);

      expect(state.isLoading).toBe(false);
      expect(state.error).toEqual(error);
    });

    test('should handle createElevage rejected state', () => {
      const action = {
        type: createElevage.rejected.type,
        payload: error
      };
      const state = elevageReducer(initialState, action);

      expect(state.isLoading).toBe(false);
      expect(state.error).toEqual(error);
    });

    test('should handle updateElevage rejected state', () => {
      const action = {
        type: updateElevage.rejected.type,
        payload: error
      };
      const state = elevageReducer(initialState, action);

      expect(state.isLoading).toBe(false);
      expect(state.error).toEqual(error);
    });

    test('should handle deleteElevage rejected state', () => {
      const action = {
        type: deleteElevage.rejected.type,
        payload: error
      };
      const state = elevageReducer(initialState, action);

      expect(state.isLoading).toBe(false);
      expect(state.error).toEqual(error);
    });

    test('should handle fetchElevageUsers rejected state', () => {
      const action = {
        type: fetchElevageUsers.rejected.type,
        payload: error
      };
      const state = elevageReducer(initialState, action);

      expect(state.isLoading).toBe(false);
      expect(state.error).toEqual(error);
    });

    test('should handle addUserToElevage rejected state', () => {
      const action = {
        type: addUserToElevage.rejected.type,
        payload: error
      };
      const state = elevageReducer(initialState, action);

      expect(state.error).toEqual(error);
    });

    test('should handle removeUserFromElevage rejected state', () => {
      const action = {
        type: removeUserFromElevage.rejected.type,
        payload: error
      };
      const state = elevageReducer(initialState, action);

      expect(state.error).toEqual(error);
    });
  });

  describe('rejected states without payload', () => {
    test('should handle rejected states with null payload', () => {
      const action = {
        type: fetchElevages.rejected.type,
        payload: null
      };
      const state = elevageReducer(initialState, action);

      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });
});