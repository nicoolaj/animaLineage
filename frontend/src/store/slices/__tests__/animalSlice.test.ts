import animalReducer, {
  fetchAnimals,
  createAnimal,
  updateAnimal,
  deleteAnimal,
  markAnimalDead,
  fetchDescendants,
  clearError,
  clearDescendants,
  selectAnimals,
  selectDescendants,
  selectAnimalLoading,
  selectAnimalError
} from '../animalSlice';
import { ERROR_CODES } from '../../../utils/errorCodes';

// Mock fetch global
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('animalSlice', () => {
  const initialState = {
    animals: [],
    descendants: [],
    isLoading: false,
    error: null,
  };

  const mockAnimal = {
    id: 1,
    identifiant_officiel: 'FR001',
    nom: 'Belle',
    sexe: 'F' as const,
    race_id: 1,
    pere_id: 2,
    mere_id: 3,
    pere_identifiant: 'FR002',
    pere_nom: 'Taureau',
    mere_identifiant: 'FR003',
    mere_nom: 'Vache',
    race_nom: 'Holstein',
    date_naissance: '2023-01-15',
    date_bouclage: '2023-01-20',
    date_deces: null,
    elevage_id: 1,
    elevage_nom: 'Ferme du Test',
    notes: 'Animal en bonne santé',
    statut: 'vivant' as const,
    created_at: '2023-01-15T10:00:00Z'
  };

  const mockAnimals = [
    mockAnimal,
    {
      ...mockAnimal,
      id: 2,
      identifiant_officiel: 'FR002',
      nom: 'Rex',
      sexe: 'M' as const
    }
  ];

  const mockToken = 'mock-token';

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('initial state', () => {
    test('should return the initial state', () => {
      expect(animalReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });
  });

  describe('reducers', () => {
    test('should handle clearError', () => {
      const stateWithError = {
        ...initialState,
        error: {
          code: ERROR_CODES.ANIMAL_001,
          message: 'Some error'
        }
      };

      const actual = animalReducer(stateWithError, clearError());
      expect(actual.error).toBeNull();
    });

    test('should handle clearDescendants', () => {
      const stateWithDescendants = {
        ...initialState,
        descendants: mockAnimals
      };

      const actual = animalReducer(stateWithDescendants, clearDescendants());
      expect(actual.descendants).toEqual([]);
    });
  });

  describe('fetchAnimals async thunk', () => {
    test('should fetch all animals successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAnimals)
      });

      const dispatch = jest.fn();
      const getState = jest.fn();

      const thunk = fetchAnimals({ token: mockToken });
      const result = await thunk(dispatch, getState, {});

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/animaux',
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`
          }
        }
      );

      expect(result.type).toBe('animal/fetchAnimals/fulfilled');
      expect(result.payload).toEqual(mockAnimals);
    });

    test('should fetch animals for specific elevage', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAnimals)
      });

      const dispatch = jest.fn();
      const getState = jest.fn();

      const thunk = fetchAnimals({ elevageId: 1, token: mockToken });
      const result = await thunk(dispatch, getState, {});

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/animaux?elevage_id=1',
        expect.any(Object)
      );

      expect(result.type).toBe('animal/fetchAnimals/fulfilled');
    });

    test('should handle fetch animals error', async () => {
      const errorResponse = {
        message: 'Access denied',
        error_code: ERROR_CODES.ANIMAL_001
      };

      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve(errorResponse)
      });

      const dispatch = jest.fn();
      const getState = jest.fn();

      const thunk = fetchAnimals({ token: mockToken });
      const result = await thunk(dispatch, getState, {});

      expect(result.type).toBe('animal/fetchAnimals/rejected');
      expect(result.payload).toEqual(
        expect.objectContaining({
          code: ERROR_CODES.ANIMAL_001,
          message: 'Access denied'
        })
      );
    });

    test('should handle network error during fetch', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const dispatch = jest.fn();
      const getState = jest.fn();

      const thunk = fetchAnimals({ token: mockToken });
      const result = await thunk(dispatch, getState, {});

      expect(result.type).toBe('animal/fetchAnimals/rejected');
      expect(result.payload).toEqual(
        expect.objectContaining({
          code: ERROR_CODES.SYS_001,
          message: 'Network error while fetching animals'
        })
      );
    });

    test('should handle fetch animals pending state', () => {
      const action = { type: fetchAnimals.pending.type };
      const state = animalReducer(initialState, action);

      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    test('should handle fetch animals fulfilled state', () => {
      const action = {
        type: fetchAnimals.fulfilled.type,
        payload: mockAnimals
      };
      const state = animalReducer(initialState, action);

      expect(state.isLoading).toBe(false);
      expect(state.animals).toEqual(mockAnimals);
      expect(state.error).toBeNull();
    });

    test('should handle fetch animals rejected state', () => {
      const error = {
        code: ERROR_CODES.ANIMAL_001,
        message: 'Error fetching animals'
      };
      const action = {
        type: fetchAnimals.rejected.type,
        payload: error
      };
      const state = animalReducer(initialState, action);

      expect(state.isLoading).toBe(false);
      expect(state.error).toEqual(error);
    });
  });

  describe('createAnimal async thunk', () => {
    test('should create animal successfully', async () => {
      const newAnimalData = {
        identifiant_officiel: 'FR003',
        nom: 'Nouveau',
        race_id: 1
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAnimal)
      });

      const dispatch = jest.fn();
      const getState = jest.fn();

      const thunk = createAnimal({ animalData: newAnimalData, token: mockToken });
      const result = await thunk(dispatch, getState, {});

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/animaux',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`
          },
          body: JSON.stringify(newAnimalData)
        }
      );

      expect(result.type).toBe('animal/createAnimal/fulfilled');
      expect(result.payload).toEqual(mockAnimal);
    });

    test('should handle create animal error', async () => {
      const errorResponse = {
        message: 'Validation error',
        error_code: ERROR_CODES.ANIMAL_002
      };

      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve(errorResponse)
      });

      const dispatch = jest.fn();
      const getState = jest.fn();

      const thunk = createAnimal({ animalData: {}, token: mockToken });
      const result = await thunk(dispatch, getState, {});

      expect(result.type).toBe('animal/createAnimal/rejected');
      expect(result.payload).toEqual(
        expect.objectContaining({
          code: ERROR_CODES.ANIMAL_002
        })
      );
    });

    test('should handle create animal fulfilled state', () => {
      const action = {
        type: createAnimal.fulfilled.type,
        payload: mockAnimal
      };
      const state = animalReducer(initialState, action);

      expect(state.isLoading).toBe(false);
      expect(state.animals).toContain(mockAnimal);
      expect(state.error).toBeNull();
    });
  });

  describe('updateAnimal async thunk', () => {
    test('should update animal successfully', async () => {
      const updatedAnimal = { ...mockAnimal, nom: 'Updated Name' };
      const updateData = { nom: 'Updated Name' };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(updatedAnimal)
      });

      const dispatch = jest.fn();
      const getState = jest.fn();

      const thunk = updateAnimal({ id: 1, animalData: updateData, token: mockToken });
      const result = await thunk(dispatch, getState, {});

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/animaux/1',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`
          },
          body: JSON.stringify(updateData)
        }
      );

      expect(result.type).toBe('animal/updateAnimal/fulfilled');
      expect(result.payload).toEqual(updatedAnimal);
    });

    test('should handle update animal fulfilled state', () => {
      const stateWithAnimals = {
        ...initialState,
        animals: [mockAnimal, { ...mockAnimal, id: 2 }]
      };

      const updatedAnimal = { ...mockAnimal, nom: 'Updated Name' };
      const action = {
        type: updateAnimal.fulfilled.type,
        payload: updatedAnimal
      };

      const state = animalReducer(stateWithAnimals, action);

      expect(state.isLoading).toBe(false);
      expect(state.animals[0]).toEqual(updatedAnimal);
      expect(state.error).toBeNull();
    });

    test('should handle update animal when animal not found in state', () => {
      const updatedAnimal = { ...mockAnimal, id: 999, nom: 'Updated Name' };
      const action = {
        type: updateAnimal.fulfilled.type,
        payload: updatedAnimal
      };

      const state = animalReducer(initialState, action);

      expect(state.isLoading).toBe(false);
      expect(state.animals).toEqual([]);
      expect(state.error).toBeNull();
    });
  });

  describe('deleteAnimal async thunk', () => {
    test('should delete animal successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: 'Animal deleted' })
      });

      const dispatch = jest.fn();
      const getState = jest.fn();

      const thunk = deleteAnimal({ id: 1, token: mockToken });
      const result = await thunk(dispatch, getState, {});

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/animaux/1',
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`
          }
        }
      );

      expect(result.type).toBe('animal/deleteAnimal/fulfilled');
      expect(result.payload).toBe(1);
    });

    test('should handle delete animal fulfilled state', () => {
      const stateWithAnimals = {
        ...initialState,
        animals: [mockAnimal, { ...mockAnimal, id: 2 }]
      };

      const action = {
        type: deleteAnimal.fulfilled.type,
        payload: 1
      };

      const state = animalReducer(stateWithAnimals, action);

      expect(state.isLoading).toBe(false);
      expect(state.animals).toHaveLength(1);
      expect(state.animals[0].id).toBe(2);
      expect(state.error).toBeNull();
    });
  });

  describe('markAnimalDead async thunk', () => {
    test('should mark animal as dead successfully', async () => {
      const deadAnimal = { ...mockAnimal, statut: 'mort' as const, date_deces: '2023-12-25' };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(deadAnimal)
      });

      const dispatch = jest.fn();
      const getState = jest.fn();

      const thunk = markAnimalDead({ id: 1, dateDeces: '2023-12-25', token: mockToken });
      const result = await thunk(dispatch, getState, {});

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/animaux/1/deces',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`
          },
          body: JSON.stringify({ date_deces: '2023-12-25' })
        }
      );

      expect(result.type).toBe('animal/markAnimalDead/fulfilled');
      expect(result.payload).toEqual(deadAnimal);
    });

    test('should handle mark animal dead fulfilled state', () => {
      const stateWithAnimals = {
        ...initialState,
        animals: [mockAnimal]
      };

      const deadAnimal = { ...mockAnimal, statut: 'mort' as const };
      const action = {
        type: markAnimalDead.fulfilled.type,
        payload: deadAnimal
      };

      const state = animalReducer(stateWithAnimals, action);

      expect(state.isLoading).toBe(false);
      expect(state.animals[0]).toEqual(deadAnimal);
      expect(state.error).toBeNull();
    });
  });

  describe('fetchDescendants async thunk', () => {
    test('should fetch descendants successfully', async () => {
      const descendants = [
        { ...mockAnimal, id: 10, pere_id: 1 },
        { ...mockAnimal, id: 11, mere_id: 1 }
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(descendants)
      });

      const dispatch = jest.fn();
      const getState = jest.fn();

      const thunk = fetchDescendants({ animalId: 1, token: mockToken });
      const result = await thunk(dispatch, getState, {});

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/animaux/1/descendants',
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`
          }
        }
      );

      expect(result.type).toBe('animal/fetchDescendants/fulfilled');
      expect(result.payload).toEqual(descendants);
    });

    test('should handle fetch descendants error', async () => {
      const errorResponse = {
        message: 'Animal not found',
        error_code: ERROR_CODES.ANIMAL_006
      };

      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve(errorResponse)
      });

      const dispatch = jest.fn();
      const getState = jest.fn();

      const thunk = fetchDescendants({ animalId: 999, token: mockToken });
      const result = await thunk(dispatch, getState, {});

      expect(result.type).toBe('animal/fetchDescendants/rejected');
      expect(result.payload).toEqual(
        expect.objectContaining({
          code: ERROR_CODES.ANIMAL_006
        })
      );
    });

    test('should handle fetch descendants fulfilled state', () => {
      const descendants = [{ ...mockAnimal, id: 10 }];
      const action = {
        type: fetchDescendants.fulfilled.type,
        payload: descendants
      };

      const state = animalReducer(initialState, action);

      expect(state.isLoading).toBe(false);
      expect(state.descendants).toEqual(descendants);
      expect(state.error).toBeNull();
    });
  });

  describe('selectors', () => {
    const mockState = {
      animal: {
        animals: mockAnimals,
        descendants: [mockAnimal],
        isLoading: false,
        error: null
      }
    };

    test('selectAnimals should return animals array', () => {
      expect(selectAnimals(mockState)).toEqual(mockAnimals);
    });

    test('selectDescendants should return descendants array', () => {
      expect(selectDescendants(mockState)).toEqual([mockAnimal]);
    });

    test('selectAnimalLoading should return loading status', () => {
      expect(selectAnimalLoading(mockState)).toBe(false);
    });

    test('selectAnimalError should return error', () => {
      expect(selectAnimalError(mockState)).toBeNull();
    });

    test('selectAnimalError should return error when present', () => {
      const stateWithError = {
        animal: {
          ...mockState.animal,
          error: {
            code: ERROR_CODES.ANIMAL_001,
            message: 'Some error'
          }
        }
      };

      expect(selectAnimalError(stateWithError)).toEqual({
        code: ERROR_CODES.ANIMAL_001,
        message: 'Some error'
      });
    });
  });

  describe('extraReducers edge cases', () => {
    test('should handle fetchAnimals rejected without payload', () => {
      const action = {
        type: fetchAnimals.rejected.type,
        payload: undefined
      };
      const state = animalReducer(initialState, action);

      expect(state.isLoading).toBe(false);
      expect(state.error).toEqual({
        code: ERROR_CODES.SYS_010,
        message: 'Unknown error while fetching animals'
      });
    });

    test('should handle createAnimal rejected without payload', () => {
      const action = {
        type: createAnimal.rejected.type,
        payload: undefined
      };
      const state = animalReducer(initialState, action);

      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    test('should handle updateAnimal rejected without payload', () => {
      const action = {
        type: updateAnimal.rejected.type,
        payload: undefined
      };
      const state = animalReducer(initialState, action);

      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    test('should handle deleteAnimal rejected without payload', () => {
      const action = {
        type: deleteAnimal.rejected.type,
        payload: undefined
      };
      const state = animalReducer(initialState, action);

      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    test('should handle markAnimalDead rejected without payload', () => {
      const action = {
        type: markAnimalDead.rejected.type,
        payload: undefined
      };
      const state = animalReducer(initialState, action);

      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    test('should handle fetchDescendants rejected without payload', () => {
      const action = {
        type: fetchDescendants.rejected.type,
        payload: undefined
      };
      const state = animalReducer(initialState, action);

      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('pending state handling', () => {
    test('should handle createAnimal pending state', () => {
      const action = { type: createAnimal.pending.type };
      const state = animalReducer(initialState, action);

      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    test('should handle updateAnimal pending state', () => {
      const action = { type: updateAnimal.pending.type };
      const state = animalReducer(initialState, action);

      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    test('should handle deleteAnimal pending state', () => {
      const action = { type: deleteAnimal.pending.type };
      const state = animalReducer(initialState, action);

      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    test('should handle markAnimalDead pending state', () => {
      const action = { type: markAnimalDead.pending.type };
      const state = animalReducer(initialState, action);

      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    test('should handle fetchDescendants pending state', () => {
      const action = { type: fetchDescendants.pending.type };
      const state = animalReducer(initialState, action);

      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });
  });
});